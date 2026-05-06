import type { BlockContent, PhrasingContent, Root, Text } from 'mdast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

const calloutOpener = /^\[!(\w+)\](-)?/

/**
 * Remark plugin to support Obsidian-style callout syntax:
 * ```markdown
 * > ![info] Callout title
 * > Content
 * > More content
 * ```
 * Includes support for all variations, including:
 * - Unspecified titles
 * - Title-only (no content)
 * - Collapsible
 *
 * # Dependency
 * This plugin relies on `remarkGfm`'s detection of `blockquote` nodes.
 * Therefore, this must run *after* `remarkGfm` to work.
 */
const remarkCallouts: Plugin<[], Root> = function () {
	// remark-gfm makes blockquote nodes that look kind of like this (in HTML):
	//
	// <blockquote><p>[!type] Title\nContent here</p></blockquote>
	//
	// They must become:
	//
	// <aside class="callout" data-callout="type">
	//   <header class="callout-title">Title</header>
	//   <div class="callout-content"><p>Content here</p></div>
	// </aside>
	//
	// Most common callout syntax is:
	// [!type] Title\nContent here
	//
	// The variants (can be combined) are:
	// Collapsible (add - after type): [!type]- Title\nContent here
	// Auto-title (remove title): [!type]\nContent here
	// Empty (remove content): [!type] Title
	return function (tree: Root) {
		visit(tree, 'blockquote', (node) => {
			// Empty blockquotes can't be callouts
			const firstPara = node.children.at(0)
			if (!firstPara || firstPara.type !== 'paragraph' || firstPara.children.length === 0) return

			// Callouts must start with [!type]
			const firstParaEl = firstPara.children.at(0)
			if (!firstParaEl || !('value' in firstParaEl) || !calloutOpener.test(firstParaEl.value))
				return

			const match = firstParaEl.value.match(calloutOpener)!
			const calloutType = match[1]
			const collapsible = Boolean(match.at(2))

			// Remove the [!type] part of the string, possibly remove it if left empty
			firstParaEl.value = firstParaEl.value.replace(calloutOpener, '')
			if (firstParaEl.value === '') firstPara.children.shift()

			// The title of the callout, if any, is the entire first line, minus [!type]
			let firstLineEls: PhrasingContent[] = []
			let isMultiline = false
			let splitContentText: Text | undefined
			for (const child of firstPara.children) {
				firstLineEls.push(child)

				if ('value' in child && child.value.includes('\n')) {
					isMultiline = true
					// If there is a newline, everything after is content, not title
					const content = child.value.split('\n').slice(1).join('\n')
					child.value = child.value.replace(content, '').trimEnd()
					splitContentText = { type: 'text', value: content }
					// If this leaves the element empty, remove it from the array
					if (!child.value) firstLineEls.pop()
					break
				}
			}

			// If the callout content immediately starts with non-text (e.g., a blockquote)
			// the first paragraph will only include the title and no newline, despite being
			// multiline. We check this by simply saying that any callout with 2+ top-level nodes
			// has to be multiline (the first is always a paragraph, so the next must be on a new line)
			if (node.children.length >= 2) {
				isMultiline = true
			}

			// The title can be omitted, in which case the first line is empty
			// In this case, the title defaults to the type itself
			if (firstLineEls.length === 0) {
				const typeTitleCase = calloutType[0].toUpperCase() + calloutType.slice(1).toLowerCase()
				firstLineEls = [{ type: 'text', value: typeTitleCase }]
			}

			const titleNode: BlockContent = {
				type: 'paragraph',
				children: firstLineEls,
				data: { hName: 'header', hProperties: { class: 'callout-title' } }
			}

			// Content may be omitted, in which case there is only the title line
			if (!isMultiline) {
				// If it's title-only, we are done
				node.children = [titleNode]
			} else {
				// If not, we need to add the content
				// Remove the first line (title line) from the first paragraph and
				// keep the content text if we needed to split before
				firstPara.children = firstPara.children.slice(firstLineEls.length)
				if (splitContentText) firstPara.children.unshift(splitContentText)

				// Move all existing content into a nested node
				const contentNode: BlockContent = {
					type: 'blockquote',
					children: node.children,
					data: { hName: 'div', hProperties: { class: 'callout-content' } }
				}

				// Replace the existing content with the title and nested content
				node.children = [titleNode, contentNode]
			}

			// Finally, set up the callout node itself
			let class_ = 'callout'
			if (collapsible) class_ += ' collapsible collapsed'

			node.data = {
				hName: 'aside',
				hProperties: { class: class_, 'data-callout': calloutType }
			}
		})
	}
}

export default remarkCallouts
