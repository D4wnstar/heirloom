/**
Go through the cloned assets to create a manifest containing useful
information needed for the static generation.
*/

import { Dirent, existsSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import { assetsDir } from './utils.ts'
import path, { join, relative } from 'path'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkFrontmatter from 'remark-frontmatter'
import remarkStringify from 'remark-stringify'
import { matter } from 'vfile-matter'
import type {
	Folder,
	File,
	Tree,
	ProjectSettings,
	Frontmatter,
	Manifest
} from '../src/lib/types.ts'

if (!existsSync(assetsDir)) {
	console.error('Error: No assets directory when making manifest')
	process.exit(1)
}

// Instantiate all directories to ensure parents exist before children
const { root, folders, entries } = collectFileTree(assetsDir)

// Read all files to get their frontmatter, plus other metadata
const fileMetadata = collectFileMetadata(entries, assetsDir)

// Map slugs to paths for page generation
// and paths to routes for wikilink generation
const slugsToPaths = resolveSlugs(fileMetadata)
const pathsToRoutes = Object.fromEntries(
	Object.entries(slugsToPaths).map(([slug, path]) => [path, '/pages/' + slug])
)
const mediaPaths = entries
	.filter((e) => e.isFile() && !e.name.endsWith('.md'))
	.map((e) => `${relative(assetsDir, e.parentPath)}${path.sep}${e.name}`)

// Set settings and the navigation tree
const projectSettings: ProjectSettings = {
	title: 'My Heirloom Project',
	frontPage: { path: '' },
	allowMermaidInk: false
}

for (const { file, frontmatter, relPathParent } of fileMetadata) {
	if (frontmatter['hl-frontpage'] === true) {
		// The front page contains the project settings
		// All settings have defaults so this just updates them if needed
		if (frontmatter['hl-project-title']) projectSettings.title = frontmatter['hl-project-title']
		if (frontmatter['hl-allow-mermaid-ink'])
			projectSettings.allowMermaidInk = frontmatter['hl-allow-mermaid-ink']

		// Store the front page separately
		projectSettings.frontPage = { path: file.path }
	} else {
		// Normal pages are added to the nav tree
		const parent = folders.get(relPathParent) ?? root
		parent.children.push(file)
	}
}

sortTree(root.children)

if (projectSettings.frontPage.path === '') {
	console.error('Error: No front page is set. Cannot build the website without a front page')
	process.exit(1)
}

// Aggregate everything and save
const manifest: Manifest = {
	projectSettings,
	slugsToPaths,
	pathsToRoutes,
	mediaPaths,
	navTree: root.children
}

writeFileSync(join(assetsDir, 'manifest.json'), JSON.stringify(manifest))
console.log('Successfully created manifest at assets/manifest.json')

/* FUNCTIONS */
function collectFileTree(rootPath: string) {
	const root: Folder = {
		type: 'folder',
		title: 'Root',
		path: '',
		children: [],
		expanded: true
	}
	const folders = new Map<string, Folder>([['', root]])

	const entries = readdirSync(rootPath, { recursive: true, withFileTypes: true })
	for (const entry of entries) {
		if (!entry.isDirectory()) continue

		// Paths should be relative to the assets folder
		const absPath = join(entry.parentPath, entry.name)
		const relPath = relative(rootPath, absPath)
		const relPathParent = relative(rootPath, entry.parentPath)

		const folder: Folder = {
			type: 'folder',
			title: entry.name,
			path: relPath,
			children: [],
			expanded: false
		}
		folders.set(relPath, folder)

		const parent = folders.get(relPathParent) ?? root
		parent.children.push(folder)
	}

	return { root, folders, entries }
}

function collectFileMetadata(entries: Dirent<string>[], rootPath: string) {
	const processor = unified()
		.use(remarkParse)
		.use(remarkFrontmatter, { type: 'yaml', marker: '-' })
		.use(() => (_, file) => matter(file))
		.use(remarkStringify)

	const workingFiles: FileMeta[] = []
	for (const entry of entries) {
		// Skip hidden files and folders and anything that's not a markdown file
		if (
			entry.name.startsWith('.') ||
			entry.parentPath.split(path.sep).some((p) => p.startsWith('.')) ||
			!entry.isFile() ||
			!entry.name.endsWith('.md')
		) {
			continue
		}

		const absPath = join(entry.parentPath, entry.name)
		const relPath = relative(rootPath, absPath)
		const relPathParent = relative(rootPath, entry.parentPath)

		const content = readFileSync(absPath, { encoding: 'utf-8' })
		const vfile = processor.processSync(content)
		const frontmatter = vfile.data.matter as Frontmatter

		const file: File = {
			type: 'file',
			title: entry.name.replace(/\.md$/, ''),
			path: relPath,
			slug: '', // Made in resolveSlugs
			aliases: frontmatter.aliases ?? []
		}

		workingFiles.push({ file, frontmatter, relPathParent })
	}
	return workingFiles
}

/**
 * Creates slugs for each item from the file path, handling disambiguation.
 * Each slug is the filename without the file extension, spaces to underscores.
 * Disambiguation is handled by adding an extra label in parenthesis.
 * ## Examples
 *  - `Docs/Blocks/Block syntax.md` -> `Block_syntax`
 *  - With automatic disambiguation:
 *    - `Statistics/Concepts/Model.md` -> `Model_(Statistics_Concepts)`
 *    - `AI/Concepts/Model.md`         -> `Model_(AI_Concepts)`
 *  - With manual disambiguation in frontmatter:
 *    - `Statistics/Concepts/Model.md` -> `Model_(Statistics)`
 *    - `AI/Concepts/Model.md`         -> `Model_(Artificial_Intelligence)`
 * @returns A map of slugs to their file path. Also modifies File items in place.
 */
function resolveSlugs(items: FileMeta[]): Record<string, string> {
	const slugsToPath: Record<string, string> = {}
	const usedSlugs = new Set<string>()

	// Group by slug to notice duplicates
	const groups = items
		.filter((item) => item.frontmatter['hl-frontpage'] !== true)
		.reduce((groups, item) => {
			const slug = slugTransform(item.file.title)
			if (!groups.has(slug)) groups.set(slug, [])
			groups.get(slug)!.push(item)
			return groups
		}, new Map<string, FileMeta[]>())

	for (const [slug, group] of groups) {
		if (group.length === 1) {
			// If unique slug, just use it
			group[0].file.slug = slug
		} else {
			// If duplicate filenames, disambiguate
			for (const item of group) {
				let disambiguation: string

				if (item.frontmatter['hl-disambiguation']) {
					disambiguation = slugTransform(item.frontmatter['hl-disambiguation'])
				} else {
					// Generate disambiguation from file path, e.g. "Docs/Nesting" -> "Docs_Nesting"
					const parts = item.relPathParent
						.split(path.sep)
						.filter((p) => p.length > 0)
						.map((part) => slugTransform(part))
					disambiguation = parts.length > 0 ? parts.join('_') : 'Root'
				}

				const candidateSlug = `${slug}_(${disambiguation})`

				// Handle name collisions (e.g. manual disambiguations conflicts)
				let suffix = 1
				let finalSlug = candidateSlug
				while (usedSlugs.has(finalSlug)) {
					finalSlug = `${candidateSlug}_${suffix}`
					suffix += 1
				}

				item.file.slug = finalSlug
			}
		}

		// Save slugs
		for (const item of group) {
			if (usedSlugs.has(item.file.slug)) {
				console.error(
					`Error: Duplicate slug '${item.file.slug}' generated for ${item.file.path}. Skipping...`
				)
				continue
			}
			slugsToPath[item.file.slug] = item.file.path
			usedSlugs.add(item.file.slug)
		}
	}

	return slugsToPath
}

/**
 * Run string transformations to meet slug formatting.
 */
function slugTransform(title: string) {
	return encodeURIComponent(title.replaceAll(/\s/g, '_'))
}

/**
 * Order a tree folders first, then alphabetical.
 */
function sortTree(tree: Tree) {
	tree.sort((a, b) => {
		if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
		return a.title.localeCompare(b.title)
	})
	for (const item of tree) {
		if (item.type === 'folder') sortTree(item.children)
	}
}

interface FileMeta {
	file: File
	frontmatter: Frontmatter
	relPathParent: string
}
