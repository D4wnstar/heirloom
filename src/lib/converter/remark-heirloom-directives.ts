import type { PhrasingContent, Root } from 'mdast'
import type { Plugin } from 'unified'
import { SKIP, visit } from 'unist-util-visit'

declare module 'vfile' {
	interface DataMap {
		sidebarImages?: SidebarImage[]
		details?: Record<string, string>
	}
}

export interface SidebarImage {
	url: string
	caption: string | null
}

/**
 * Remark plugin to support custom Heirloom directives.
 * See the markdown directives proposal at
 * https://talk.commonmark.org/t/generic-directives-plugins-syntax/444.
 */
const remarkHeirloomDirectives: Plugin<[], Root> = function () {
	return function (tree, file) {
		if (!file.data.sidebarImages) {
			file.data.sidebarImages = []
		}

		visit(tree, (node, index, parent) => {
			if (
				node.type !== 'textDirective' &&
				node.type !== 'leafDirective' &&
				node.type !== 'containerDirective'
			) {
				return
			}

			if (node.name === 'hidden') {
				// Remove :::hidden completely
				// TODO: This is redundant with %%comments%%
				if (parent && index) {
					parent.children.splice(index, 1)
					return [SKIP, index]
				}
			} else if (node.name === 'image') {
				// Replace :::image with captioned image
				// Export :::image{sidebar} to VFile.data for later use
				if (node.children.length === 0) return
				const para = node.children[0]
				if (para.type !== 'paragraph' || para.children.length === 0) return
				const embed = para.children[0]
				if (embed.type !== 'image') return

				// TODO: The caption needs to be a rendered HTML string
				const captionNodes = para.children.slice(1)
				let caption: string | null = ''
				for (let node of captionNodes) {
					if (Object.hasOwn(node, 'value')) {
						node = node as Extract<PhrasingContent, { value: string }>
						caption += node.value
					}
				}
				caption = caption ?? null

				if (node.attributes && 'sidebar' in node.attributes && file.data.sidebarImages) {
					// Save and remove block from the main content
					file.data.sidebarImages.push({ url: embed.url, caption })
					if (parent && index) {
						parent.children.splice(index, 1)
						return [SKIP, index]
					}
				} else {
					// TODO: Put captioned image node here
				}
			} else if (node.name === 'details') {
				// TODO
			}
		})

		console.log('VFILE DATA:', file.data)
	}
}

export default remarkHeirloomDirectives
