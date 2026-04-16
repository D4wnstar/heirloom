import { markdownLineEnding, markdownSpace } from 'micromark-util-character'
import { codes } from 'micromark-util-symbol'
import type { Code, Construct, Extension, Token, Tokenizer } from 'micromark-util-types'
import { makeDoubleCharConstruct } from './utils'
import type { Literal, Parent } from 'mdast'
import type {
	CompileContext,
	Extension as FromMarkdownExtension,
	Handle
} from 'mdast-util-from-markdown'

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
		wikilinkEmbedMarker: 'wikilinkEmbedMarker'
		wikilinkTarget: 'wikilinkTarget'
		wikilinkSection: 'wikilinkSection'
		wikilinkSectionMarker: 'wikilinkSectionMarker'
		wikilinkAlias: 'wikilinkAlias'
		wikilinkAliasMarker: 'wikilinkAliasMarker'
	}
}

declare module 'mdast' {
	interface PhrasingContentMap {
		wikilink: Wikilink
	}

	interface RootContentMap {
		wikilink: Wikilink
		wikilinkTarget: WikilinkTarget
		wikilinkSection: WikilinkSection
		wikilinkAlias: WikilinkAlias
	}
}

type HrefResolver = (target: string | undefined, section: string | undefined) => string

export interface WikilinkOptions {
	/**
	 * Function to resolve a wikilink (target, section) pair (both optional) to an href.
	 */
	hrefResolver?: HrefResolver
}

interface Wikilink extends Parent {
	type: 'wikilink'
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

const tokenizeEmbed: Tokenizer = function (effects, ok, nok) {
	return start

	function start(code: Code) {
		if (code !== codes.exclamationMark) return nok(code)
		effects.enter('wikilinkEmbedMarker')
		effects.consume(code)
		effects.exit('wikilinkEmbedMarker')
		return effects.attempt(
			wikilinkConstruct,
			() => ok,
			(code) => nok(code)
		)
	}
}

const doubleSquareBracketConstruct = makeDoubleCharConstruct(
	'wikilinkClose',
	codes.rightSquareBracket,
	codes.rightSquareBracket
)

const enterWikilink: Handle = function (token) {
	this.enter(
		{
			type: 'wikilink',
			data: { hName: 'a' },
			children: []
		},
		token
	)
}

const enterWikilinkTarget: Handle = function (token) {
	this.enter(
		{
			type: 'wikilinkTarget',
			value: this.sliceSerialize(token)
		},
		token
	)
}

const enterWikilinkSection: Handle = function (token) {
	this.enter(
		{
			type: 'wikilinkSection',
			value: ' > ' + this.sliceSerialize(token)
		},
		token
	)
}

const enterWikilinkAlias: Handle = function (token) {
	this.enter(
		{
			type: 'wikilinkAlias',
			value: this.sliceSerialize(token)
		},
		token
	)
}

const exitWikilinkWithResolver = function (
	context: CompileContext,
	token: Token,
	resolver: HrefResolver
) {
	const wikilink = context.stack.at(-1) as Wikilink
	const target = wikilink.children.find((c) => c.type == 'wikilinkTarget')
	const section = wikilink.children.find((c) => c.type == 'wikilinkSection')
	const alias = wikilink.children.find((c) => c.type == 'wikilinkAlias')

	// If an alias is defined, override all children with just the alias
	if (alias) wikilink.children = [alias]

	// Determine the href with the user-given function
	wikilink.data = wikilink.data ?? {}
	wikilink.data.hProperties = { href: resolver(target?.value, section?.value) }

	context.exit(token)
}

const wikilinkConstruct: Construct = { name: 'wikilink', tokenize: tokenizeWikilink }
const embedConstruct: Construct = { name: 'wikilinkEmbed', tokenize: tokenizeEmbed }
export const wikilinks: Extension = {
	text: {
		[codes.leftSquareBracket]: wikilinkConstruct,
		[codes.exclamationMark]: embedConstruct
	}
}

const wikilinksFromMarkdown: FromMarkdownExtension = {
	enter: {
		wikilink: enterWikilink,
		wikilinkTarget: enterWikilinkTarget,
		wikilinkSection: enterWikilinkSection,
		wikilinkAlias: enterWikilinkAlias
	},
	exit: {
		// wikilink exit is defined in plugin definition because it requires user options
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

/**
 * Remark plugin to support markdown `[[wikilinks]]`.
 */
export default function remarkWikilinks(options?: WikilinkOptions) {
	//@ts-expect-error TS doesn't understand `this`
	const self = this as Processor<Root>
	const data = self.data()

	// Add wikilink token exit handler using the user's href resolver
	const defaultResolver: HrefResolver = (t, s) => {
		if (t && s) {
			return `/${t}#${s}`
		} else if (!t && s) {
			return `#${s}`
		} else if (t && !s) {
			return `/${t}`
		} else {
			throw Error('At least one of target and section must be defined in a wikilink')
		}
	}
	const resolver = options?.hrefResolver ?? defaultResolver
	const exitWikilink: Handle = function (token) {
		exitWikilinkWithResolver(this, token, resolver)
	}
	wikilinksFromMarkdown.exit!['wikilink'] = exitWikilink

	// Register extensions
	const micromarkExts = data.micromarkExtensions || (data.micromarkExtensions = [])
	const fromMarkdownExts = data.fromMarkdownExtensions || (data.fromMarkdownExtensions = [])
	micromarkExts.push(wikilinks)
	fromMarkdownExts.push(wikilinksFromMarkdown)
}
