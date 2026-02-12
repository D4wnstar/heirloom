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
import remarkFrontmatter from 'remark-frontmatter'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
// import rehypeMermaid from 'rehype-mermaid'
import { matter } from 'vfile-matter'
import type { Frontmatter } from '$lib/types'

// The processor is unique, so we define it as a global constant
const processor = unified()
	.use(remarkParse)
	.use(remarkFrontmatter, { type: 'yaml', marker: '-' })
	.use(() => (_, file) => matter(file)) // Export frontmatter to the VFile
	.use(remarkGfm)
	.use(remarkMath)
	.use(remarkRehype, { allowDangerousHtml: true })
	.use(rehypeKatex)
	// .use(rehypeMermaid)
	.use(rehypeStringify, { allowDangerousHtml: true })

export function markdownToHtml(markdown: string) {
	const vfile = processor.processSync(markdown)
	const frontmatter = vfile.data.frontmatter as Frontmatter
	const title = undefined // TODO: Add a frontmatter property later

	return {
		html: String(vfile),
		title,
		frontmatter
	}
}
