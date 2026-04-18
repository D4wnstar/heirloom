import type { Paragraph, Root } from 'mdast'
import { visit } from 'unist-util-visit'

/**
 * Remark plugin to preprocess mermaidjs code blocks into `<pre class="mermaid">`
 * elements to later be rendered in the browser.
 */
export default function remarkMermaidLite() {
	return function (tree: Root) {
		visit(tree, 'code', (node, index, parent) => {
			// We'll be replacing the entire wikilink node so we need it to have
			// a parent and an index. Also grab only mermaid code blocks
			if (parent === undefined || index === undefined || node.lang !== 'mermaid') return

			const pre: Paragraph = {
				type: 'paragraph',
				data: { hName: 'pre', hProperties: { class: 'mermaid' } },
				children: [{ type: 'text', value: node.value }]
			}

			parent.children[index] = pre
		})
	}
}
