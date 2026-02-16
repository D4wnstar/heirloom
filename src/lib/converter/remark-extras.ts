import type { Code, Construct, Extension, Tokenizer } from 'micromark-util-types'
import {
	markdownLineEnding,
	markdownSpace,
	markdownLineEndingOrSpace
} from 'micromark-util-character'
import { codes } from 'micromark-util-symbol'
import { makeDoubleCharConstruct } from './utils'
import type { BlockContent, Parent, PhrasingContent, Root, Text } from 'mdast'
import type { Extension as FromMarkdownExtension, Handle } from 'mdast-util-from-markdown'
import type { Processor } from 'unified'
import { visit } from 'unist-util-visit'

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
const calloutOpener = /^\[!(\w+)\](-)?/
export default function remarkExtras() {
	//@ts-expect-error TS doesn't understand `this`
	const self = this as Processor<Root>
	const data = self.data()

	// Register extensions
	const micromarkExts = data.micromarkExtensions || (data.micromarkExtensions = [])
	const fromMarkdownExts = data.fromMarkdownExtensions || (data.fromMarkdownExtensions = [])
	micromarkExts.push(highlights, comments)
	fromMarkdownExts.push(highlightsFromMarkdown)

	return function (tree: Root) {
		visit(tree, 'blockquote', (node) => {
			// Manage Obsidian-style callouts:
			//
			// <blockquote><p>[!type] Title\nContent here</p></blockquote>
			//
			// becomes
			//
			// <aside class="callout" data-callout="type">
			//   <header class="callout-title">Title</header>
			//   <div class="callout-content"><p>Content here</p></div>
			// </aside>
			//
			// Most common syntax:
			// [!type] Title\nContent here
			// Variations (can be mixed):
			// Collapsible (add - after type): [!type]- Title\nContent here
			// Auto-title (remove title): [!type]\nContent here
			// Empty (remove content): [!type] Title

			// Empty blockquotes can't be callouts
			const firstPara = node.children.at(0)
			if (!firstPara || firstPara.type !== 'paragraph' || firstPara.children.length === 0) return

			// Callouts must start with [!type]
			const firstParaEl = firstPara.children.at(0)
			if (!firstParaEl || !hasValue(firstParaEl) || !calloutOpener.test(firstParaEl.value)) return

			const match = firstParaEl.value.match(calloutOpener)!
			const calloutType = match[1]
			const collapsible = Boolean(match.at(2))

			// Remove the [!type] part of the string, possibly remove it if left empty
			firstParaEl.value = firstParaEl.value.replace(calloutOpener, '')
			if (firstParaEl.value === '') firstPara.children.shift()

			// The title of the callout, if any, is the entire first line, minus [!type]
			let firstLineEls: PhrasingContent[] = []
			let isMultiline = false
			let splitContentText: Text | undefined
			for (const child of firstPara.children) {
				firstLineEls.push(child)

				if (hasValue(child) && child.value.includes('\n')) {
					isMultiline = true
					// If there is a newline, everything after is content, not title
					const content = child.value.split('\n').slice(1).join('\n')
					child.value = child.value.replace(content, '').trimEnd()
					splitContentText = { type: 'text', value: content }
					// If this leaves the element empty, remove it from the array
					if (!child.value) firstLineEls.pop()
					break
				}
			}

			// If the callout content immediately starts with non-text (e.g., a blockquote)
			// the first paragraph will only include the title and no newline, despite being
			// multiline. We check this by simply saying that any callout with 2+ top-level nodes
			// has to be multiline (the first is always a paragraph, so the next must be on a new line)
			if (node.children.length >= 2) {
				isMultiline = true
			}

			// The title can be omitted, in which case the first line is empty
			// In this case, the title defaults to the type itself
			if (firstLineEls.length === 0) {
				const typeTitleCase = calloutType[0].toUpperCase() + calloutType.slice(1).toLowerCase()
				firstLineEls = [{ type: 'text', value: typeTitleCase }]
			}

			const titleNode: BlockContent = {
				type: 'paragraph',
				children: firstLineEls,
				data: { hName: 'header', hProperties: { class: 'callout-title' } }
			}

			// Content may be omitted, in which case there is only the title line
			if (!isMultiline) {
				// If it's title-only, we are done
				node.children = [titleNode]
			} else {
				// If not, we need to add the content
				// Remove the first line (title line) from the first paragraph and
				// keep the content text if we needed to split before
				firstPara.children = firstPara.children.slice(firstLineEls.length)
				if (splitContentText) firstPara.children.unshift(splitContentText)

				// Move all existing content into a nested node
				const contentNode: BlockContent = {
					type: 'blockquote',
					children: node.children,
					data: { hName: 'div', hProperties: { class: 'callout-content' } }
				}

				// Replace the existing content with the title and nested content
				node.children = [titleNode, contentNode]
			}

			// Finally, set up the callout node itself
			let class_ = 'callout'
			if (collapsible) class_ += ' collapsible'

			node.data = {
				hName: 'aside',
				hProperties: { class: class_, 'data-callout': calloutType }
			}
		})
	}
}

/**
 * Type guard to check if a PhrasingContent node has a 'value' property
 */
function hasValue(node: PhrasingContent): node is Extract<PhrasingContent, { value: string }> {
	return Object.hasOwn(node, 'value')
}
