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
import remarkWikilinks, { type HrefResolver } from './remark-wikilinks'
import remarkHeadingIds from './remark-heading-ids'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMath from 'remark-math'
import rehypePrism from 'rehype-prism-plus'
import rehypeKatex from 'rehype-katex'
import rehypeExternalLinks from 'rehype-external-links'
// import rehypeMermaid from 'rehype-mermaid'
import { matter } from 'vfile-matter'
import type { Frontmatter } from '$lib/types'

export function markdownToHtml(markdown: string, pathsToRoutes: Record<string, string>) {
	const hrefResolver: HrefResolver = (target, section) => {
		if (target) {
			// The target is either a file name or a file path
			// If it's a path, we just get the corresponding slug
			// If it's a name (stem, without ext), we can't be sure if it's unique or not
			// In this case, we get the first path whose name is equal to the
			// given name. This check also needs to be case-insensitive
			// TODO: Check that / is always the correct path separator
			let path: string | undefined
			if (target.includes('/')) {
				path = target
			} else {
				path = Object.keys(pathsToRoutes).find((path) => {
					const fileStem = path.split('/').at(-1)?.replace(/\.md$/, '')
					return fileStem?.toLowerCase() === target.toLowerCase()
				})
			}
			if (!path) {
				return null // Probably unintended
			}

			const route = pathsToRoutes[path]
			if (!route) {
				return null // Possibly intended (e.g., link to a future page)
			}

			return section ? `${route}#${section}` : route
		} else if (section) {
			// This is an internal #Section link
			return '#' + section
		} else {
			console.warn(
				`Detected wikilink with neither target nor section. At least one must be present. Ignoring link`
			)
			return null
		}
	}

	const processor = unified()
		.use(remarkParse)
		.use(remarkFrontmatter, { type: 'yaml', marker: '-' })
		.use(() => (_, file) => matter(file)) // Export frontmatter to the VFile
		.use(remarkGfm)
		.use(remarkHighlights)
		.use(remarkComments)
		.use(remarkCallouts)
		.use(remarkWikilinks, { hrefResolver })
		.use(remarkHeadingIds)
		.use(remarkMath)
		.use(remarkRehype, { allowDangerousHtml: true })
		.use(rehypeKatex)
		// .use(rehypeMermaid)
		.use(rehypePrism, { defaultLanguage: 'markdown' })
		.use(rehypeExternalLinks)
		.use(rehypeStringify, { allowDangerousHtml: true })

	// remarkMath has nonstandard syntax for block math, so we fix it here
	markdown = markdown.replaceAll(/^\$\$/gm, '$$$$\n')
	markdown = markdown.replaceAll(/\$\$$/gm, '\n$$$$')

	const vfile = processor.processSync(markdown)
	const frontmatter = vfile.data.frontmatter as Frontmatter
	const title = undefined // TODO: Add a frontmatter property later

	return {
		html: String(vfile),
		title,
		frontmatter
	}
}
