/**
 * Custom markdown to HTML converter to support all of the syntax we need.
 * It supports:
 * - All of CommonMark
 * - GitHub-flavored markdown
 * - Obsidian-flavored markdown, including
 *   - Callouts, normal and foldable
 *   - Footnotes
 *   - Wikilinks
 *   - Embeds, both text and media
 * - YAML frontmatter
 * - Math code (rendered with KaTeX)
 * - Mermaid code
 * - Custom Block syntax
 */

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkHighlights from './remark-highlights'
import remarkComments from './remark-comments'
import remarkCallouts from './remark-callouts'
import remarkWikilinks, {
	type HrefResolver,
	type ImageEmbedResolver,
	type PageEmbedResolver
} from './remark-wikilinks'
import remarkHeadingIds from './remark-heading-ids'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMath from 'remark-math'
import remarkDirective from 'remark-directive'
import remarkHeirloomDirectives from './remark-heirloom-directives'
import rehypePrism from 'rehype-prism-plus'
import rehypeKatex from 'rehype-katex'
import rehypeExternalLinks from 'rehype-external-links'
import { matter } from 'vfile-matter'
import type { Frontmatter, Manifest } from '$lib/types'
import { join } from 'path'
import { ASSETS_FOLDER } from '$lib/loading'
import { readFileSync } from 'fs'
import type { Root } from 'mdast'
import rehypeMermaidInk from './reype-mermaid-ink'

declare module 'vfile' {
	interface DataMap {
		frontmatter?: Frontmatter
	}
}

function preprocessMarkdown(md: string) {
	return md.replaceAll(/^\$\$/gm, '$$$$\n').replaceAll(/\$\$$/gm, '\n$$$$')
}

export async function markdownToHtml(markdown: string, manifest: Manifest) {
	const getPath = (target: string, paths: string[]) => {
		// The target can be a file name or a file path
		// TODO: Check that / is always the correct path separator
		if (target.includes('/')) return target

		// If it's a name (stem, without ext), we can't be sure if it's unique or not
		// In this case, we get the first path whose name is equal to the
		// given name. This check also needs to be case-insensitive
		const path = paths.find((path) => {
			const fileStem = path.split('/').at(-1)?.replace(/\.md$/, '')
			return fileStem?.toLowerCase() === target.toLowerCase()
		})
		return path
	}

	const hrefResolver: HrefResolver = (target, section) => {
		const pathsToRoutes = manifest.pathsToRoutes
		if (target && section) {
			const path = getPath(target, Object.keys(pathsToRoutes))
			return path ? `${pathsToRoutes[path]}#${section}` : null
		} else if (target && !section) {
			const path = getPath(target, Object.keys(pathsToRoutes))
			return path ? pathsToRoutes[path] : null
		} else if (!target && section) {
			// This is an internal #Section link
			return `#${section}`
		} else {
			console.warn(
				`Detected wikilink with neither target nor section. At least one must be present. Ignoring link`
			)
			return null
		}
	}

	const imageEmbedResolver: ImageEmbedResolver = (target, extension) => {
		const path = getPath(target, manifest.mediaPaths)
		if (!path) return null // TODO: Make a broken embed placeholder
		const filepath = join(ASSETS_FOLDER, path)
		const base64 = readFileSync(filepath, 'base64')
		return `data:image/${extension};base64,${base64}`
	}

	// Prevent infinite recursion by disallowing embedding a page within itself
	const embedsInProgress = new Set<string>()

	const pageEmbedResolver: PageEmbedResolver = (processor, target, section) => {
		const path = getPath(target, Object.keys(manifest.pathsToRoutes))
		if (!path || embedsInProgress.has(target)) return [] // TODO: Make a broken embed placeholder

		embedsInProgress.add(target)
		const filepath = join(ASSETS_FOLDER, path)
		const markdown = preprocessMarkdown(readFileSync(filepath, 'utf-8'))
		const ast = processor.parse(markdown) as Root
		const tAst = processor.runSync(ast) as Root
		embedsInProgress.delete(target)

		if (section) {
			// Find the start and end index of the section nodes we want to isolate
			const sectionStartIndex = tAst.children.findIndex(
				(n) =>
					n.type === 'heading' &&
					//@ts-expect-error TS LSP doesn't understand hasOwn
					n.children.find((c) => Object.hasOwn(c, 'value') && c.value === section)
			)
			if (sectionStartIndex === -1) return []

			let sectionEndIndex: number | undefined = tAst.children.slice(sectionStartIndex).findIndex(
				(n) =>
					n.type === 'heading' &&
					//@ts-expect-error TS LSP doesn't understand hasOwn
					n.children.find((c) => Object.hasOwn(c, 'value') && c.value !== section)
			)
			if (sectionEndIndex === -1) {
				sectionEndIndex = undefined
			} else {
				sectionEndIndex += sectionStartIndex
			}

			return tAst.children.slice(sectionStartIndex, sectionEndIndex)
		} else {
			return tAst.children
		}
	}

	/**
	 * Processor to handle MD to HTML conversion of inline text only.
	 * This is used whenever brief spans of content need to be handled
	 * separately from the main document, such as sidebar image captions
	 * and sidebar details.
	 */
	const inlineTextProcessor = unified()
		.use(remarkParse)
		.use(remarkGfm) // NOTE: This adds support for a bunch of block content too
		.use(remarkHighlights)
		.use(remarkComments)
		.use(remarkWikilinks, { hrefResolver }) // Don't support embeds in inline
		.use(remarkMath)
		.use(remarkRehype, { allowDangerousHtml: true })
		.use(rehypeKatex)
		.use(rehypeExternalLinks)
		.use(rehypeStringify, { allowDangerousHtml: true })

	const pageEmbedProcessor = unified()
		.use(remarkParse)
		.use(remarkFrontmatter, { type: 'yaml', marker: '-' })
		.use(remarkGfm)
		.use(remarkHighlights)
		.use(remarkComments)
		.use(remarkCallouts)
		.use(remarkWikilinks, { hrefResolver, pageEmbedResolver, imageEmbedResolver })
		.use(remarkHeadingIds)
		.use(remarkMath)
		.use(remarkDirective)
		.use(remarkHeirloomDirectives, { inlineTextProcessor, imageEmbedResolver })

	const processor = unified()
		.use(remarkParse)
		.use(remarkFrontmatter, { type: 'yaml', marker: '-' })
		.use(() => (_, file) => matter(file)) // Export frontmatter to the VFile
		.use(remarkGfm)
		.use(remarkHighlights)
		.use(remarkComments)
		.use(remarkCallouts)
		.use(remarkWikilinks, {
			hrefResolver,
			pageEmbedResolver,
			imageEmbedResolver,
			pageEmbedProcessor
		})
		.use(remarkHeadingIds)
		.use(remarkMath)
		.use(remarkDirective)
		.use(remarkHeirloomDirectives, { inlineTextProcessor, imageEmbedResolver })
		.use(remarkRehype, { allowDangerousHtml: true })
		.use(rehypeKatex)

	// Must be before rehypePrism!
	if (manifest.wikiSettings.allowMermaidInk) processor.use(rehypeMermaidInk)

	processor
		.use(rehypePrism, { defaultLanguage: 'markdown' })
		.use(rehypeExternalLinks)
		.use(rehypeStringify, { allowDangerousHtml: true })

	// remarkMath has nonstandard syntax for block math, so we fix it here
	markdown = preprocessMarkdown(markdown)

	const vfile = await processor.process(markdown)
	const frontmatter = vfile.data.frontmatter
	const sidebarImages = vfile.data.sidebarImages ?? []
	const details = vfile.data.details ?? []
	const title = undefined // TODO: Add a frontmatter property later

	return {
		html: String(vfile),
		title,
		frontmatter,
		sidebarImages,
		details
	}
}
