import type { Code, Construct, Extension, Tokenizer } from 'micromark-util-types'
import { codes } from 'micromark-util-symbol'
import { makeDoubleCharConstruct } from './utils'
import type { Root } from 'mdast'

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

/**
 * Remark extension to support markdown `%%comments%%`. This will remove all text
 * wrapped in double `%` characters.
 */
export default function remarkComments() {
	//@ts-expect-error TS doesn't understand `this`
	const self = this as Processor<Root>
	const data = self.data()

	// Register extension
	const micromarkExts = data.micromarkExtensions || (data.micromarkExtensions = [])
	micromarkExts.push(comments)
}
