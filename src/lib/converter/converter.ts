/**
 * Custom markdown to HTML converter to support all of the syntax we need.
 * It supports:
 * - All of CommonMark
 * - GitHub-flavored markdown
 * - Obsidian-flavored markdown, including
 *   - Callouts, normal and foldable
 *   - Wikilinks
 *   - Embeds, both text and media
 * - YAML frontmatter
 * - Math code (rendered with KaTeX)
 * - Mermaid code (currently only through mermaid.ink)
 * - Custom Heirloom directives
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
	type PageEmbedResolver,
	type SvgEmbedResolver
} from './remark-wikilinks'
import remarkHeadingIds from './remark-heading-ids'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMath from 'remark-math'
import remarkDirective from 'remark-directive'
import remarkHeirloomDirectives from './remark-heirloom-directives'
import rehypePrism from 'rehype-prism-plus'
import rehypeKatex from 'rehype-katex'
import rehypeExternalLinks from 'rehype-external-links'
import rehypeMermaidInk from './rehype-mermaid-ink'
import rehypePermalinks from './rehype-permalinks'
import { matter } from 'vfile-matter'
import type { Frontmatter, Manifest } from '$lib/types'
import { dirname, join } from 'path'
import { ASSETS_FOLDER } from '$lib/loading'
import { existsSync, readFileSync } from 'fs'
import type { Root } from 'mdast'

declare module 'vfile' {
	interface DataMap {
		frontmatter?: Frontmatter
	}
}

/**
 * Text transformations for the input markdown.
 * @returns The transformed markdown.
 */
function preprocessMarkdown(md: string) {
	// remark-math has nonstandard syntax for block math, so we fix it here
	// It wants double newlines both at the start and end of display block so
	//
	// Text
	// $$equation$$
	// Text
	//
	// must become
	//
	// Text
	// $$
	// equation
	// $$
	// Text

	// TODO: We should probably fork remark-math to support $$display$$ instead
	const newMd = md
		.replaceAll(/^\$\$(.*?)\$\$$/gms, '$$$$\n$1\n$$$$') // Normal display
		.replaceAll(/^> \$\$(.*?)\$\$$/gms, '> $$$$\n> $1\n> $$$$') // Display in blockquotes
	return newMd
}

/**
 * Finds the path associated with the target string by finding the first matching
 * last path segment (case insensitive). If the target is already a path, returns
 * itself instead.
 * @param target The target string, likely from a wikilink or embed.
 * @param paths The set of paths to search from.
 * @returns The matched path, if any.
 */
function findPath(target: string, paths: string[]) {
	// If target is a path, no need to do anything
	// TODO: Check if / is always the correct path separator (it probably isn't!)
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

/**
 * Converts a markdown string into an HTML one following global manifest settings.
 * This function is the core of Heirloom. This is where written markdown gets turned
 * into the form that is shown on the website.
 * @param markdown A markdown string.
 * @param manifest The Heirloom build manifest created during preprocessing.
 * @returns The HTML string alongside additional content about the page.
 */
export async function markdownToHtml(markdown: string, manifest: Manifest) {
	// Href resolver for remark-wikilinks
	const hrefResolver: HrefResolver = (target, section) => {
		const pathsToRoutes = manifest.pathsToRoutes
		if (target && section) {
			const path = findPath(target, Object.keys(pathsToRoutes))
			return path ? `${pathsToRoutes[path]}#${section}` : null
		} else if (target && !section) {
			const path = findPath(target, Object.keys(pathsToRoutes))
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

	// Image embed resolver for remark-wikilinks and remark-heirloom-directives
	const imageEmbedResolver: ImageEmbedResolver = (target, extension) => {
		const path = findPath(target, manifest.mediaPaths)
		if (!path) return null // TODO: Make a broken embed placeholder
		return `/media/${path}`
	}

	const svgEmbedResolver: SvgEmbedResolver = (target) => {
		const path = findPath(target, manifest.mediaPaths)
		if (!path) return null
		const media = join('static', 'media', path)
		return readFileSync(media, 'utf-8') // Inline the SVG
	}

	// Prevent infinite recursion by disallowing embedding a page within itself
	const embedsInProgress = new Set<string>()

	// Page embed resolver for remark-wikilinks
	const pageEmbedResolver: PageEmbedResolver = (processor, target, section) => {
		const path = findPath(target, Object.keys(manifest.pathsToRoutes))
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

	/**
	 * Processor used to handle partial processing of an embedded page
	 * by remark-wikilinks. This processor only does markdown parsing and
	 * transformation without HTML conversion/stringification, as the
	 * transformed AST is embedded directly into the parent page's AST.
	 */
	const pageEmbedProcessor = unified()
		.use(remarkParse)
		.use(remarkFrontmatter, { type: 'yaml', marker: '-' })
		.use(remarkGfm)
		.use(remarkHighlights)
		.use(remarkComments)
		.use(remarkCallouts)
		.use(remarkWikilinks, { hrefResolver, pageEmbedResolver, imageEmbedResolver, svgEmbedResolver })
		.use(remarkHeadingIds)
		.use(remarkMath)
		.use(remarkDirective)
		.use(remarkHeirloomDirectives, { inlineTextProcessor, imageEmbedResolver })

	/**
	 * The main Heirloom markdown processor. This handles everything about conversion.
	 */
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
			svgEmbedResolver,
			pageEmbedProcessor
		})
		.use(remarkHeadingIds)
		.use(remarkMath)
		.use(remarkDirective)
		.use(remarkHeirloomDirectives, { inlineTextProcessor, imageEmbedResolver })
		.use(remarkRehype, { allowDangerousHtml: true })
		.use(rehypeKatex)

	// Must be before rehypePrism!
	if (manifest.projectSettings.allowMermaidInk) processor.use(rehypeMermaidInk)

	processor
		.use(rehypePrism, { defaultLanguage: 'markdown' })
		.use(rehypeExternalLinks)
		.use(rehypePermalinks)
		.use(rehypeStringify, { allowDangerousHtml: true })

	markdown = preprocessMarkdown(markdown)
	const vfile = await processor.process(markdown)

	const sidebarImages = vfile.data.sidebarImages ?? []
	const details = vfile.data.details ?? []
	const title = undefined // TODO: Hook up hl-title frontmatter property

	return {
		html: String(vfile),
		title,
		sidebarImages,
		details
	}
}
