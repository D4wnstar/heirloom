import type { Element, Root } from 'hast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'
import { fromHtml } from 'hast-util-from-html'

/**
 * Rehype plugin to render MermaidJS diagrams with [Mermaid Ink](https://mermaid.ink/).
 * Mermaid does not have a server-side rendering (and thus static generation) solution
 * since their renderer relies on the browser API. This can't even be solved by using
 * a virtual DOM like JSDOM or LinkeDOM, so the workaround would be to use Playwright
 * to drive an entire headless browser on the server at build time. However, that's
 * way too resource-intensive and complicated to justify doing for Heirloom, so as an
 * alternative, this plugin provides remote rendering through Mermaid Ink.
 *
 * Since this relies on an external service, it is optional and disabled by default.
 */
const rehypeMermaidInk: Plugin<[], Root> = function () {
	return async function (tree: Root) {
		const promises: { promise: Promise<string>; parent: Root | Element; index: number }[] = []

		visit(tree, 'element', (node, index, parent) => {
			if (!index || !parent) return
			if (node.tagName === 'pre') {
				const code = node.children.find((c) => c.type === 'element' && c.tagName === 'code')

				if (
					!code ||
					!('properties' in code) ||
					//@ts-expect-error className should always be an array by hast definition
					!code.properties?.className?.includes('language-mermaid') ||
					code.children.length === 0 ||
					!('value' in code.children[0])
				) {
					return
				}

				const diagramCode = code.children[0].value
				const param = encodeURIComponent(Buffer.from(diagramCode).toString('base64'))
				const promise = fetch(`https://mermaid.ink/svg/${param}?bgColor=!white`).then((r) =>
					r.text()
				)
				promises.push({ promise, parent, index })
			}
		})

		for (const { promise, parent, index } of promises) {
			const svg = await promise
			const elem = fromHtml(svg, { fragment: true })
			parent.children[index] = elem.children[0]
		}
	}
}

export default rehypeMermaidInk
