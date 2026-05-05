import type { Parent, Root } from 'mdast'
import type { Plugin, Processor } from 'unified'
import { SKIP, visit } from 'unist-util-visit'
import { dumpLiteralValues } from './utils'
import type { ImageEmbedResolver } from './remark-wikilinks'
import type { Image as ImageNode } from 'mdast'

declare module 'vfile' {
	interface DataMap {
		sidebarImages?: ImageData[]
		details?: Detail[]
	}
}

declare module 'mdast' {
	interface Data {
		directiveLabel?: string
	}
}

export interface ImageData {
	url: string
	caption: string | null
}

export type Detail =
	| { type: 'key-value'; key: string; value: string }
	| { type: 'break' }
	| { type: 'header'; header: string }

export interface HeirloomDirectivesOptions {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	inlineTextProcessor: Processor<any, any, any, any, any>
	imageEmbedResolver: ImageEmbedResolver
}

/**
 * Remark plugin to support custom Heirloom directives.
 * See the markdown directives proposal at
 * https://talk.commonmark.org/t/generic-directives-plugins-syntax/444.
 */
const remarkHeirloomDirectives: Plugin<[HeirloomDirectivesOptions], Root> = function (options) {
	return function (tree, file) {
		if (!file.data.sidebarImages) file.data.sidebarImages = []
		if (!file.data.details) file.data.details = []

		visit(tree, (node, index, parent) => {
			if (
				node.type !== 'textDirective' &&
				node.type !== 'leafDirective' &&
				node.type !== 'containerDirective'
			) {
				return
			}

			if (node.name === 'hidden' && node.type === 'containerDirective') {
				// Remove :::hidden completely
				// TODO: This is redundant with %%comments%%
				if (parent && index) {
					parent.children.splice(index, 1)
					return [SKIP, index]
				}
			} else if (node.name === 'figure' && node.type === 'containerDirective') {
				// Replace :::figure[path/to/image.png] with captioned image
				// Export :::figure[path/to/image.png]{sidebar} to VFile.data for later use
				if (node.children.length === 0) return
				const para = node.children[0]
				const hasLabel = para.data?.directiveLabel === true
				const isParent = 'children' in para
				const target = hasLabel && isParent ? dumpLiteralValues(para as Parent) : null
				if (!target) {
					console.warn('Found :::figure with no target, skipping')
					return
				}
				const ext = target.split('.').at(-1)!
				const url = options.imageEmbedResolver(target, ext)
				if (!url) {
					console.warn(`Found :::figure with broken link (${target}), skipping`)
					return
				}

				const captionRoot: Root = { type: 'root', children: node.children.slice(1) }
				const captionTemp: Root = options.inlineTextProcessor.runSync(captionRoot)
				const caption: string | null = options.inlineTextProcessor.stringify(captionTemp) ?? null

				const isSidebar = node.attributes && 'sidebar' in node.attributes

				if (isSidebar) {
					// Save and remove block from the main content
					file.data.sidebarImages?.push({ url, caption })
					if (parent && index) {
						parent.children.splice(index, 1)
						return [SKIP, index]
					}
				} else {
					// Replace directive with image
					if (parent && index) {
						const image: ImageNode = {
							type: 'image',
							url,
							data: { hProperties: { 'data-caption': caption } }
						}
						parent.children[index] = image
					}
				}
			} else if (node.name === 'details' && node.type === 'containerDirective') {
				// :::details is a completely custom block, down to the internal
				// syntax. As such, we ignore the parsed nodes and handle the original
				// text manually
				if (node.children.length === 0) return
				const start = node.children[0].position?.start
				const end = node.children.at(-1)?.position?.end
				if (typeof start?.line !== 'number' || typeof end?.line !== 'number') {
					console.warn("Couldn't find position edges for :::details content")
					return
				}

				const md = String(file.value)
				if (md.trim().length === 0) return
				const lines = md.split('\n').slice(start.line - 1, end.line)

				// Each line is one element
				for (const line of lines) {
					// Empty lines are okay, just skip them
					if (line.trim().length === 0) continue
					// If a line is just hyphens, it's a horizontal rule
					if (/^-+$/.test(line.trim())) {
						file.data.details?.push({ type: 'break' })
						continue
					}
					const split = line.split(':')
					// If there's no colon, it's a header
					// otherwise it's a key-value pair
					// These support arbitrary inline syntax
					if (split.length === 1) {
						const html = String(options.inlineTextProcessor.processSync(split[0]))
						file.data.details?.push({ type: 'header', header: html })
						continue
					} else {
						const key = String(options.inlineTextProcessor.processSync(split[0]))
						const valueTemp = split.slice(1).join(':')
						const value = String(options.inlineTextProcessor.processSync(valueTemp))
						file.data.details?.push({ type: 'key-value', key, value })
						continue
					}
				}

				// Remove the details block from the document
				if (parent && index) {
					parent.children.splice(index, 1)
					return [SKIP, index]
				}
			}
		})
	}
}

export default remarkHeirloomDirectives
