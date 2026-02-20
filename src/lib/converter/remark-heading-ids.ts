import type { Literal, Parent, Root, RootContent } from 'mdast'
import { visit } from 'unist-util-visit'

export default function remarkHeadingIds() {
	return function (tree: Root) {
		visit(tree, 'heading', (node) => {
			const value = recurseForValue(node.children)
			if (!node.data) {
				node.data = { hProperties: { id: value } }
			} else if (!node.data.hProperties) {
				node.data.hProperties = { id: value }
			} else {
				node.data.hProperties.id = value
			}
		})
	}
}

// TODO: This needs better behavior on formatted headers. Also,
// remark-wikilinks #Section links need to abide by whatever id
// formatting we decide here
function recurseForValue(nodes: RootContent[]) {
	let value = ''
	for (const node of nodes) {
		if (Object.hasOwn(node, 'value')) {
			value += (node as Literal).value
		}
		if (Object.hasOwn(node, 'children')) {
			return recurseForValue((node as Parent).children)
		}
	}

	return value
}
