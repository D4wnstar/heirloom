import type { Code, Construct, Extension, Tokenizer } from 'micromark-util-types'
import {
	markdownLineEnding,
	markdownSpace,
	markdownLineEndingOrSpace
} from 'micromark-util-character'
import { codes } from 'micromark-util-symbol'
import { makeDoubleCharConstruct } from './utils'
import type { Parent, PhrasingContent, Root } from 'mdast'
import type { Extension as FromMarkdownExtension, Handle } from 'mdast-util-from-markdown'
import type { Processor } from 'unified'

declare module 'micromark-util-types' {
	interface TokenTypeMap {
		highlight: 'highlight'
		highlightMarker: 'highlightMarker'
		highlightString: 'highlightString'
		comment: 'comment'
	}
}

declare module 'mdast' {
	interface PhrasingContentMap {
		highlight: Highlight
	}
	interface RootContentMap {
		highlight: Highlight
	}
}

interface Highlight extends Parent {
	type: 'highlight'
	children: PhrasingContent[]
}

/* ==HIGHLIGHTS== */

const highlightTokenize: Tokenizer = function (effects, ok, nok) {
	let previousWasSpace = false

	return start

	function start(code: Code) {
		effects.enter('highlight')
		effects.enter('highlightMarker')
		effects.consume(code)
		return startConfirm
	}

	function startConfirm(code: Code) {
		// Guarantee a double opening equals
		if (code === codes.equalsTo) {
			effects.consume(code)
			effects.exit('highlightMarker')
			effects.enter('highlightString')
			return gatekeep
		}
		return nok(code)
	}

	function gatekeep(code: Code) {
		// Leading whitespace is disallowed (== not highlighted==)
		return markdownLineEndingOrSpace(code) ? nok(code) : inside(code)
	}

	function inside(code: Code) {
		// Cancel if EOF
		if (code === null) return nok(code)

		// Newlines are disallowed (==not\nhighlighted==)
		if (markdownLineEnding(code)) return nok(code)

		// Escaped equals characters are ignored
		if (code === codes.backslash) {
			const attempt = effects.attempt(escapeEqualsConstruct, inside, (code) => {
				// Invalid escape, consider the backslash as regular text and proceed
				effects.consume(code)
				return inside
			})
			return attempt(code)
		}

		// Possible closing equals
		if (code === codes.equalsTo) {
			// Trailing whitespace is disallowed (==not highlighted ==)
			if (previousWasSpace) {
				previousWasSpace = false
				effects.consume(code)
				return inside
			}

			// Guarantee a double closing equals
			const check = effects.check(
				doubleEqualsConstruct,
				(code) => {
					// If it's double, exit string token and close
					effects.exit('highlightString')
					effects.enter('highlightMarker')
					effects.consume(code)
					return close
				},
				(code) => {
					// If it's single, ignore it and proceed
					effects.consume(code)
					return inside
				}
			)
			return check(code)
		}

		// Regular character
		previousWasSpace = markdownSpace(code)
		effects.consume(code)
		return inside
	}

	function close(code: Code) {
		effects.consume(code)
		effects.exit('highlightMarker')
		effects.exit('highlight')
		return ok
	}
}

const escapeEqualsConstruct = makeDoubleCharConstruct(
	'highlightEscape',
	codes.backslash,
	codes.equalsTo
)
const doubleEqualsConstruct = makeDoubleCharConstruct(
	'highlightClose',
	codes.equalsTo,
	codes.equalsTo
)

const enterHighlight: Handle = function (token) {
	this.enter(
		{
			type: 'highlight',
			data: { hName: 'mark' },
			children: []
		},
		token
	)
}

const enterHighlightString: Handle = function (token) {
	this.enter(
		{
			type: 'text',
			value: this.sliceSerialize(token)
		},
		token
	)
}

const highlightConstruct: Construct = { name: 'highlight', tokenize: highlightTokenize }
export const highlights: Extension = { text: { [codes.equalsTo]: highlightConstruct } }
export const highlightsFromMarkdown: FromMarkdownExtension = {
	enter: {
		highlight: enterHighlight,
		highlightString: enterHighlightString
	},
	exit: {
		highlight: function (token) {
			this.exit(token)
		},
		highlightString: function (token) {
			this.exit(token)
		}
	}
}

/* %%COMMENTS%% */

const commentTokenize: Tokenizer = function (effects, ok, nok) {
	return start

	function start(code: Code) {
		effects.enter('comment')
		effects.consume(code)
		return startConfirm
	}

	function startConfirm(code: Code) {
		// Guarantee a double opening equals
		if (code === codes.percentSign) {
			effects.consume(code)
			return inside
		}
		return nok(code)
	}

	function inside(code: Code) {
		// Cancel if EOF
		if (code === null) return nok(code)

		// Escaped percent characters are ignored
		if (code === codes.backslash) {
			const attempt = effects.attempt(escapePercentConstruct, inside, (code) => {
				// Invalid escape, consider the backslash as regular text and proceed
				effects.consume(code)
				return inside
			})
			return attempt(code)
		}

		// Possible closing percent
		if (code === codes.percentSign) {
			// Guarantee a double closing percent
			const attempt = effects.attempt(
				doublePercentConstruct,
				(code) => {
					// If it's double, close
					effects.consume(code)
					return close
				},
				(code) => {
					// If it's single, ignore it and proceed
					effects.consume(code)
					return inside
				}
			)
			return attempt(code)
		}

		// Regular character
		effects.consume(code)
		return inside
	}

	function close(code: Code) {
		effects.consume(code)
		effects.exit('comment')
		return ok
	}
}

const escapePercentConstruct = makeDoubleCharConstruct(
	'highlightEscape',
	codes.backslash,
	codes.percentSign
)
const doublePercentConstruct = makeDoubleCharConstruct(
	'highlightClose',
	codes.percentSign,
	codes.percentSign
)

const commentConstruct: Construct = { name: 'comment', tokenize: commentTokenize }
export const comments: Extension = { text: { [codes.percentSign]: commentConstruct } }
// Comments don't have a fromMarkdown extension because they only need to vanish

/* REMARK PLUGIN */
export default function remarkExtras() {
	//@ts-expect-error TS doesn't understand `this`
	const self = this as Processor<Root>
	const data = self.data()

	// Register extensions
	const micromarkExts = data.micromarkExtensions || (data.micromarkExtensions = [])
	const fromMarkdownExts = data.fromMarkdownExtensions || (data.fromMarkdownExtensions = [])
	micromarkExts.push(highlights, comments)
	fromMarkdownExts.push(highlightsFromMarkdown)
}
