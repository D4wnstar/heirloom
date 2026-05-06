import type { Parent as ParentMdast } from 'mdast'
import type { Parent as ParentHast } from 'hast'
import type { Code, Construct } from 'micromark-util-types'

/**
 * Factory to make Constructs that match a sequence of two characters.
 * Mostly intended for Attempts.
 */
export function makeDoubleCharConstruct(name: string, char1: Code, char2: Code): Construct {
	return {
		name,
		tokenize: (effects, ok, nok) => {
			return first

			function first(code: Code) {
				if (code === char1) {
					effects.consume(code)
					return second
				}
				return nok(code)
			}

			function second(code: Code) {
				if (code === char2) {
					return ok
				}
				return nok(code)
			}
		}
	}
}

/**
 * Recursively dumps all the text values of the input node and all its
 * children into a string.
 * @param parent An mdast or hast node with children.
 * @returns The string of all concatenated values.
 */
export function dumpLiteralValues(parent: ParentMdast | ParentHast): string {
	let out = ''
	for (const child of parent.children) {
		if ('value' in child) {
			out += child.value
		} else if ('children' in child) {
			out += dumpLiteralValues(child as ParentMdast | ParentHast)
		}
	}
	return out
}
