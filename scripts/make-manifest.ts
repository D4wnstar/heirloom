/*
Go through the cloned assets to create a manifest containing useful
information needed for the static generation.
*/

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import { assetsDir } from './utils.ts'
import { join, relative } from 'path'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkFrontmatter from 'remark-frontmatter'
import remarkStringify from 'remark-stringify'
import { matter } from 'vfile-matter'

if (!existsSync(assetsDir)) {
	console.error('Error: No assets directory when making manifest')
	process.exit(1)
}

// For the manifest we need to:
// Build the page tree for the navigation menu
// Detect the front page
// Save the wiki settings

interface Folder {
	type: 'folder'
	title: string
	path: string
	children: Tree
	expanded: boolean
}

interface File {
	type: 'file'
	title: string
	path: string
	slug: string
	aliases: string[]
}

type Tree = (File | Folder)[]

type WikiSettings = {
	title: string
}

type Manifest = {
	frontpageAbsolutePath: string
	wikiSettings: WikiSettings
	navTree: Tree
}

// First pass: instantiate all directories to ensure parents exist before children
const root: Folder = {
	type: 'folder',
	title: 'Root',
	path: '',
	children: [],
	expanded: true
}
const folders = new Map<string, Folder>([['', root]])

const entries = readdirSync(assetsDir, { recursive: true, withFileTypes: true })
for (const entry of entries) {
	if (!entry.isDirectory()) continue

	// Paths should be relative to the assets folder
	const absPath = join(entry.parentPath, entry.name)
	const relPath = relative(assetsDir, absPath)
	const relPathParent = relative(assetsDir, entry.parentPath)

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

// Second pass: attach markdown files to their parent folders
const processor = unified()
	.use(remarkParse)
	.use(remarkFrontmatter, { type: 'yaml', marker: '-' })
	.use(() => (_, file) => matter(file))
	.use(remarkStringify)

let frontpageAbsPath: string | null = null

// Initialize default settings
const wikiSettings: WikiSettings = {
	title: 'Awesome Wiki'
}

for (const entry of entries) {
	if (!entry.isFile() || !entry.name.endsWith('.md')) continue

	const absPath = join(entry.parentPath, entry.name)
	const relPath = relative(assetsDir, absPath)
	const relPathParent = relative(assetsDir, entry.parentPath)

	const content = readFileSync(absPath, { encoding: 'utf-8' })
	const vfile = processor.processSync(content)
	const frontmatter = vfile.data.matter as Record<string, any>

	const file: File = {
		type: 'file',
		title: entry.name.replace(/\.md$/, ''),
		path: relPath,
		slug: entry.name.replace(/\.md$/, '').replaceAll(' ', '_'), // TODO: Replace with path-to-slug function
		aliases: frontmatter['aliases'] ?? []
	}

	const parent = folders.get(relPathParent) ?? root
	parent.children.push(file)

	if (frontmatter['wiki-frontpage']) {
		// The front page contains the wiki settings
		// All settings have defaults so this just updates them if needed
		if (frontmatter['wiki-project-title']) wikiSettings.title = frontmatter['wiki-project-title']

		// We also need to store the page's path for later
		frontpageAbsPath = absPath
	}
}

// Order folders first, then alphabetical
function sortTree(tree: Tree) {
	tree.sort((a, b) => {
		if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
		return a.title.localeCompare(b.title)
	})
	for (const item of tree) {
		if (item.type === 'folder') sortTree(item.children)
	}
}
sortTree(root.children)

if (frontpageAbsPath == null) {
	console.error('Error: No front page is set. Cannot build the wiki without a front page')
	process.exit(1)
}

// Aggregate everything and save
const manifest: Manifest = {
	frontpageAbsolutePath: frontpageAbsPath,
	wikiSettings,
	navTree: root.children
}

writeFileSync(join(assetsDir, 'manifest.json'), JSON.stringify(manifest))
console.log('Successfully created manifest at assets/manifest.json')
