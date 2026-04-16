import { markdownLineEnding, markdownSpace } from 'micromark-util-character'
import { codes } from 'micromark-util-symbol'
import type { Code, Construct, Extension, Tokenizer } from 'micromark-util-types'
import { makeDoubleCharConstruct } from './utils'
import type { Link, Literal, Paragraph, Parent, Root } from 'mdast'
import type { Extension as FromMarkdownExtension } from 'mdast-util-from-markdown'
import { visit } from 'unist-util-visit'

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
	children: WikilinkComponent[]
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

export interface WikilinkOptions {
	pathsToRoutes: Record<string, string>
}

/**
 * Remark plugin to support markdown `[[wikilinks]]`.
 */
export default function remarkWikilinks(options: Partial<WikilinkOptions> = {}) {
	//@ts-expect-error TS doesn't understand `this`
	const self = this as Processor<Root>
	const data = self.data()

	// Register extensions
	const micromarkExts = data.micromarkExtensions || (data.micromarkExtensions = [])
	const fromMarkdownExts = data.fromMarkdownExtensions || (data.fromMarkdownExtensions = [])
	micromarkExts.push(wikilinks)
	fromMarkdownExts.push(wikilinksFromMarkdown)

	const pathsToRoutes = options.pathsToRoutes
	if (!pathsToRoutes) return

	return function (tree: Root) {
		visit(tree, 'embed', (node, index, parent) => {
			if (parent === undefined || index === undefined) return

			const placeholder: Paragraph = {
				type: 'paragraph',
				children: [{ type: 'text', value: '[Pretend this is an embed.]' }]
			}

			parent.children[index] = placeholder
		})

		visit(tree, 'wikilink', (node, index, parent) => {
			// We'll be replacing the entire wikilink node so we need it to have
			// a parent and an index
			if (parent === undefined || index === undefined) return

			// Each wikilink node needs to parsed into a proper <a> tag
			const targetNode = node.children.find((n) => n.type === 'wikilinkTarget')
			const sectionNode = node.children.find((n) => n.type === 'wikilinkSection')
			const aliasNode = node.children.find((n) => n.type === 'wikilinkAlias')

			const target = targetNode?.value
			const section = sectionNode?.value
			const alias = aliasNode?.value

			let linkText: string
			if (alias) {
				linkText = alias
			} else if (section) {
				linkText = target ? `${target} > ${section}` : `> ${section}`
			} else {
				linkText = target ?? 'Link'
			}

			const brokenLink: Link = {
				type: 'link',
				url: '/broken', // TODO: Determine where broken links should go
				children: [{ type: 'text', value: linkText }],
				data: { hProperties: { class: 'broken-link' } }
			}

			const setLink = (link: Link) => (parent.children[index] = link)

			let url: string
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
					setLink(brokenLink) // Probably unintended
					return
				}

				const route = pathsToRoutes[path]
				if (!route) {
					setLink(brokenLink) // Possibly intended (e.g., link to a future page)
					return
				}

				url = section ? `${route}#${section}` : route
			} else if (section) {
				// This is an internal #Section link
				url = '#' + section
			} else {
				const textDump = node.children.reduce((acc, n) => acc + ' ' + n.value, '')
				console.warn(
					`Detected wikilink '${textDump}' with neither target nor section. At least one must be present. Ignoring link`
				)
				setLink(brokenLink)
				return
			}

			const goodLink: Link = {
				type: 'link',
				url,
				children: [{ type: 'text', value: linkText }]
			}
			setLink(goodLink)
		})
	}
}
