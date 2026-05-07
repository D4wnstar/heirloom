import { markdownLineEnding, markdownSpace } from 'micromark-util-character'
import { codes } from 'micromark-util-symbol'
import type { Code, Construct, Extension, Tokenizer } from 'micromark-util-types'
import { makeDoubleCharConstruct } from './utils'
import type { Blockquote, Html, Image, Link, Literal, Parent, Root, RootContent } from 'mdast'
import type { Extension as FromMarkdownExtension } from 'mdast-util-from-markdown'
import { visit } from 'unist-util-visit'
import type { Plugin, Processor } from 'unified'
import { fromHtml } from 'hast-util-from-html'
import type { Element } from 'hast'
import { toHtml } from 'hast-util-to-html'

// A wikilink has the following general syntax:
//
// [[Target#Section|Alias]] or [[#Section|Alias]]
//
// Both #Section and |Alias are optional. Target is optional if #Section is present.
// An embed link looks like this:
//
// ![[Target#Section]] or ![[#Section]]
//
// #Section is optional. Target is optional if #Section is present.
// There is no canonical use for the alias syntax in an embed, but it is used
// sometimes, for example in Obsidian to pass options such as image dimensions
// to embeds, so it should be supported too.

declare module 'micromark-util-types' {
	interface TokenTypeMap {
		wikilink: 'wikilink'
		wikilinkMarker: 'wikilinkMarker'
		wikilinkTarget: 'wikilinkTarget'
		wikilinkSection: 'wikilinkSection'
		wikilinkSectionMarker: 'wikilinkSectionMarker'
		wikilinkAlias: 'wikilinkAlias'
		wikilinkAliasMarker: 'wikilinkAliasMarker'
		embed: 'embed'
		embedMarker: 'embedMarker'
	}
}

declare module 'mdast' {
	interface PhrasingContentMap {
		wikilink: Wikilink
	}

	interface BlockContentMap {
		embed: Embed
	}

	interface RootContentMap {
		wikilink: Wikilink
		embed: Embed
		wikilinkTarget: WikilinkTarget
		wikilinkSection: WikilinkSection
		wikilinkAlias: WikilinkAlias
	}
}

interface Wikilink extends Parent {
	type: 'wikilink'
	children: WikilinkComponent[]
}

interface Embed extends Parent {
	type: 'embed'
	children: Wikilink[]
}

interface WikilinkTarget extends Literal {
	type: 'wikilinkTarget'
}

interface WikilinkSection extends Literal {
	type: 'wikilinkSection'
}

interface WikilinkAlias extends Literal {
	type: 'wikilinkAlias'
}

type WikilinkComponent = WikilinkTarget | WikilinkSection | WikilinkAlias

const tokenizeWikilink: Tokenizer = function (effects, ok, nok) {
	// Empty links like [[]] and [[   ]] are invalid so we keep track of whether
	// the only things we find are spaces (or nothing)
	let foundNonSpace = false
	return start

	function start(code: Code) {
		if (code !== codes.leftSquareBracket) return nok(code)
		effects.enter('wikilink')
		effects.enter('wikilinkMarker')
		effects.consume(code)
		return startConfirm
	}

	function startConfirm(code: Code) {
		// Guarantee a double opening square bracket
		if (code !== codes.leftSquareBracket) return nok(code)
		effects.consume(code)
		effects.exit('wikilinkMarker')
		return gatekeep
	}

	function gatekeep(code: Code) {
		if (code === codes.numberSign) {
			// [[#Section]] is valid
			effects.enter('wikilinkSectionMarker')
			effects.consume(code)
			effects.exit('wikilinkSectionMarker')
			effects.enter('wikilinkSection')
			return section
		} else if (code === codes.verticalBar) {
			// [[|Alias]] is NOT valid
			return nok(code)
		} else {
			// [[Target]] is valid
			effects.enter('wikilinkTarget')
			return target
		}
	}

	function target(code: Code) {
		// End on EOF ( [[Targe{EOF} ) or newline ( [[Target\nPage]] )
		if (code === null || markdownLineEnding(code)) return nok(code)

		// [[Target#Section]] is valid
		if (code === codes.numberSign) {
			effects.exit('wikilinkTarget')
			effects.enter('wikilinkSectionMarker')
			effects.consume(code)
			effects.exit('wikilinkSectionMarker')
			effects.enter('wikilinkSection')
			return section
		}

		// [[Target|Alias]] is valid
		if (code === codes.verticalBar) {
			effects.exit('wikilinkTarget')
			effects.enter('wikilinkAliasMarker')
			effects.consume(code)
			effects.exit('wikilinkAliasMarker')
			effects.enter('wikilinkAlias')
			return alias
		}

		// Possible closing brackets ( [[Target]] )
		if (code === codes.rightSquareBracket) {
			const check = effects.check(
				doubleSquareBracketConstruct,
				(code) => {
					// If it's a double closing square bracket, wikilink is closed
					effects.exit('wikilinkTarget')
					effects.enter('wikilinkMarker')
					effects.consume(code)
					return close
				},
				(code) => {
					// If it's single, ignore it and proceed
					effects.consume(code)
					return target
				}
			)
			return check(code)
		}

		// Continue on a regular character
		if (!foundNonSpace && !markdownSpace(code)) foundNonSpace = true
		effects.consume(code)
		return target
	}

	function section(code: Code) {
		// End on EOF ( [[Target#Sec{EOF} ) or newline ( [[Target Page#Sec\ntion]] )
		if (code === null || markdownLineEnding(code)) return nok(code)

		// [[Target#Section|Alias]] is valid
		if (code === codes.verticalBar) {
			effects.exit('wikilinkSection')
			effects.enter('wikilinkAliasMarker')
			effects.consume(code)
			effects.exit('wikilinkAliasMarker')
			return alias
		}

		// Possible closing brackets ( [[Target#Section]] )
		if (code === codes.rightSquareBracket) {
			const check = effects.check(
				doubleSquareBracketConstruct,
				(code) => {
					// If it's a double closing square bracket, wikilink is closed
					effects.exit('wikilinkSection')
					effects.enter('wikilinkMarker')
					effects.consume(code)
					return close
				},
				(code) => {
					// If it's single, ignore it and proceed
					effects.consume(code)
					return target
				}
			)
			return check(code)
		}

		// Continue on a regular character
		if (!foundNonSpace && !markdownSpace(code)) foundNonSpace = true
		effects.consume(code)
		return target
	}

	function alias(code: Code) {
		// All of these examples could also be preceded by a #Section,
		// as [[Target|Alias]] and [[Target#Section|Alias]] are both valid in this state

		// End on EOF ( [[Target|Ali{EOF} ) or newline ( [[Target Page|Ali\nas]] )
		if (code === null || markdownLineEnding(code)) return nok(code)

		// Possible closing brackets ( [[Target|Alias]] )
		if (code === codes.rightSquareBracket) {
			const check = effects.check(
				doubleSquareBracketConstruct,
				(code) => {
					// If it's a double closing square bracket, wikilink is closed
					effects.exit('wikilinkAlias')
					effects.enter('wikilinkMarker')
					effects.consume(code)
					return close
				},
				(code) => {
					// If it's single, ignore it and proceed
					effects.consume(code)
					return target
				}
			)
			return check(code)
		}

		// Continue on a regular character
		if (!foundNonSpace && !markdownSpace(code)) foundNonSpace = true
		effects.consume(code)
		return target
	}

	function close(code: Code) {
		effects.consume(code)
		effects.exit('wikilinkMarker')
		effects.exit('wikilink')
		return foundNonSpace ? ok : nok(code)
	}
}

// Embeds are the same as regular wikilinks with a ! at the start, so we
// reuse the wikilink tokenizer
const tokenizeEmbed: Tokenizer = function (effects, ok, nok) {
	return start

	function start(code: Code) {
		if (code !== codes.exclamationMark) return nok(code)
		effects.enter('embed')
		effects.enter('embedMarker')
		effects.consume(code)
		effects.exit('embedMarker')
		return effects.attempt(
			wikilinkConstruct,
			() => {
				effects.exit('embed')
				return ok
			},
			(code) => nok(code)
		)
	}
}

const doubleSquareBracketConstruct = makeDoubleCharConstruct(
	'wikilinkClose',
	codes.rightSquareBracket,
	codes.rightSquareBracket
)

const wikilinkConstruct: Construct = { name: 'wikilink', tokenize: tokenizeWikilink }
const embedConstruct: Construct = { name: 'embed', tokenize: tokenizeEmbed }
export const wikilinks: Extension = {
	text: {
		[codes.leftSquareBracket]: wikilinkConstruct,
		[codes.exclamationMark]: embedConstruct
	}
}

const wikilinksFromMarkdown: FromMarkdownExtension = {
	enter: {
		wikilink: function (token) {
			this.enter({ type: 'wikilink', children: [] }, token)
		},
		embed: function (token) {
			this.enter({ type: 'embed', children: [] }, token)
		},
		wikilinkTarget: function (token) {
			this.enter({ type: 'wikilinkTarget', value: this.sliceSerialize(token) }, token)
		},
		wikilinkSection: function (token) {
			this.enter({ type: 'wikilinkSection', value: this.sliceSerialize(token) }, token)
		},
		wikilinkAlias: function (token) {
			this.enter({ type: 'wikilinkAlias', value: this.sliceSerialize(token) }, token)
		}
	},
	exit: {
		wikilink: function (token) {
			this.exit(token)
		},
		embed: function (token) {
			this.exit(token)
		},
		wikilinkTarget: function (token) {
			this.exit(token)
		},
		wikilinkSection: function (token) {
			this.exit(token)
		},
		wikilinkAlias: function (token) {
			this.exit(token)
		}
	}
}

export type HrefResolver = (
	target: string | undefined,
	section: string | undefined
) => string | null

export type LinkTextResolver = (
	target: string | undefined,
	section: string | undefined,
	alias: string | undefined
) => string

export type PageEmbedResolver = (
	processor: Processor,
	target: string,
	section: string | undefined
) => RootContent[]

export type ImageEmbedResolver = (target: string, extension: string) => string | null
export type SvgEmbedResolver = (target: string) => string | null

export interface WikilinkOptions {
	/**
	 * Function to resolve a wikilink `(target, section)` pair to an href.
	 * Both `target` and `section` are optional.
	 * The function may return null to represent a broken link.
	 */
	hrefResolver?: HrefResolver
	/**
	 * Function to resolve a wikilink `(target, section, alias)` tuple to a string.
	 * All three are optional. This string will be used as the display text of the `<a>`
	 * element.
	 */
	linkTextResolver?: LinkTextResolver
	/**
	 * Function to resolve an embed `(target, section)` tuple to an array of MDAST nodes.
	 * Section is optional. These nodes will be injected in the main document's MDAST in
	 * place of the embed, within an appropriate container node. A processor will be
	 * passed as an argument to allow processing the target page. To define the processor,
	 * pass one in these options as `pageEmbedProcessor`.
	 *
	 * There is no built-in protection against infinite embed loops (e.g. a page embedding
	 * itself), so this function needs to handle that.
	 *
	 * The default implementation return an empty array (and therefore removes embeds).
	 */
	pageEmbedResolver?: PageEmbedResolver
	/**
	 * Function to resolve an embed target to an image URL. The target extension is
	 * provided for convenience. The URL will be used as the `<img>` tag's `href`.
	 * The function may return null to represent a broken or nonexistent URL.
	 *
	 * The default implementation returns null (and therefore removes embeds).
	 */
	imageEmbedResolver?: ImageEmbedResolver
	svgEmbedResolver?: SvgEmbedResolver
	/**
	 * The processor passed to `pageEmbedResolver`. You probably want to use this
	 * to `parse` and `run` (but not `stringify`) the target page, then return the
	 * appropriate nodes. Be sure to not use `remark-rehype` as you want MDAST nodes.
	 * If unset, the parent processor will pass itself.
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	pageEmbedProcessor?: Processor<any, any, any, any, any>
}

const defaultHrefResolver: HrefResolver = (target, section) => {
	if (target) {
		return section ? `/${target}#${section}` : `/${target}`
	} else if (section) {
		return '#' + section
	} else {
		console.warn(
			'Detected wikilink with neither target nor section. At least one must be present. Ignoring link'
		)
		return null
	}
}

const defaultLinkTextResolver: LinkTextResolver = (target, section, alias) => {
	if (alias) {
		return alias
	} else if (section) {
		return target ? `${target} > ${section}` : `> ${section}`
	} else {
		return target ?? 'Link'
	}
}

const defaultPageEmbedResolver: PageEmbedResolver = () => []
const defaultImageEmbedResolver: ImageEmbedResolver = () => null
const defaultSvgEmbedResolver: SvgEmbedResolver = () => null

/**
 * Remark plugin to support markdown `[[wikilinks]]`.
 */
const remarkWikilinks: Plugin<[WikilinkOptions?], Root> = function (options = {}) {
	const data = this.data()

	const hrefResolver = options.hrefResolver ?? defaultHrefResolver
	const linkTextResolver = options.linkTextResolver ?? defaultLinkTextResolver
	const pageEmbedResolver = options.pageEmbedResolver ?? defaultPageEmbedResolver
	const imageEmbedResolver = options.imageEmbedResolver ?? defaultImageEmbedResolver
	const svgEmbedResolver = options.svgEmbedResolver ?? defaultSvgEmbedResolver
	const pageEmbedProcessor = options.pageEmbedProcessor ?? this

	// Register extensions
	const micromarkExts = data.micromarkExtensions || (data.micromarkExtensions = [])
	const fromMarkdownExts = data.fromMarkdownExtensions || (data.fromMarkdownExtensions = [])
	micromarkExts.push(wikilinks)
	fromMarkdownExts.push(wikilinksFromMarkdown)

	return function (tree: Root) {
		visit(tree, 'embed', (node, index, parent) => {
			// We'll be replacing the entire wikilink node so we need it to have
			// a parent and an index
			if (parent === undefined || index === undefined) return

			const wikilink = node.children.find((n) => n.type === 'wikilink')
			if (!wikilink) {
				console.warn(`No wikilink found in embed`)
				return
			}
			const target = wikilink.children.find((n) => n.type === 'wikilinkTarget')?.value
			const section = wikilink.children.find((n) => n.type === 'wikilinkSection')?.value

			if (!target) {
				console.warn(`No target found in embed`)
				// Technically this could be supported and Obsidian actually does
				// An embed with no target but with a section, like ![[#Section]],
				// embeds a section from somewhere in the document itself. However,
				// it's more work to implement and it's not a very useful feature
				// so it'll remain unsupported for the time being
				return
			}

			// Check if it's a media embed by seeing if there is a file extension
			const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif']
			const extMatch = target.match(/\.([^.]*?)$/)
			if (!extMatch || extMatch[1].toLowerCase() === 'md') {
				// A text embed is just a blockquote containing the embedded page
				const embedNodes = pageEmbedResolver(pageEmbedProcessor, target, section)
				if (!embedNodes) return
				const pageEmbed: Blockquote = {
					type: 'blockquote',
					//@ts-expect-error TODO: Figure out how to not make TS complain
					children: embedNodes
				}
				parent.children[index] = pageEmbed
			} else {
				// A media embed is more complicated and depends on the file type
				const ext = extMatch[1].toLowerCase()
				if (IMAGE_EXTS.includes(ext)) {
					const url = imageEmbedResolver(target, ext)
					if (!url) return
					const image: Image = { type: 'image', url }
					parent.children[index] = image
				} else if (ext === 'svg') {
					const svg = svgEmbedResolver(target)
					if (!svg) return

					// Override the SVG's dimensions to fit the document
					const elem = fromHtml(svg, { fragment: true })
					const svgNode = elem.children[0] as Element
					const style = 'width: 100%; max-width: 100%; height: auto;'
					if (!svgNode.properties) {
						svgNode.properties = { style }
					} else {
						svgNode.properties.style = style
					}
					svgNode.properties.style = 'width: 100%; max-width: 100%; height: auto;'
					const newSvg = toHtml(svgNode)

					// Pass it as raw HTML
					const html: Html = {
						type: 'html',
						value: newSvg,
						data: { hName: 'div' }
					}
					parent.children[index] = html
				} else {
					return // TODO: Support other file types
				}
			}
		})

		visit(tree, 'wikilink', (node, index, parent) => {
			if (parent === undefined || index === undefined) return

			// Each wikilink node needs to parsed into a proper <a> tag
			const target = node.children.find((n) => n.type === 'wikilinkTarget')?.value
			const section = node.children.find((n) => n.type === 'wikilinkSection')?.value
			const alias = node.children.find((n) => n.type === 'wikilinkAlias')?.value

			const linkText = linkTextResolver(target, section, alias)
			const href = hrefResolver(target, section)

			if (href) {
				const goodLink: Link = {
					type: 'link',
					url: href,
					children: [{ type: 'text', value: linkText }]
				}
				parent.children[index] = goodLink
			} else {
				const theoreticalUrl = target ? target.replaceAll(' ', '_') : '/missing'
				const brokenLink: Link = {
					type: 'link',
					url: theoreticalUrl,
					children: [{ type: 'text', value: linkText }],
					data: { hProperties: { class: 'broken-link' } }
				}
				parent.children[index] = brokenLink
			}
		})
	}
}

export default remarkWikilinks
