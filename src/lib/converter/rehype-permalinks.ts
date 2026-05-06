import type { Element, Root } from 'hast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

/**
 * Rehype plugin to add additional `<a>` elements inside of `<hX>` headers
 * to be used for permalinks. Headers without an id will be ignored.
 */
const rehypePermalinks: Plugin<[], Root> = function () {
	return async function (tree: Root) {
		visit(tree, 'element', (node) => {
			if (!['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(node.tagName)) return

			const id = node.properties.id as string | undefined
			if (!id) return

			const permalink: Element = {
				type: 'element',
				tagName: 'a',
				children: [{ type: 'text', value: '#' }],
				properties: { className: 'permalink', href: '#' + id }
			}

			node.children.push(permalink)
		})
	}
}

export default rehypePermalinks
