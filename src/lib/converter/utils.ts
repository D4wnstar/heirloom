import type { Parent } from 'mdast'
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

export function dumpLiteralValues(parent: Parent): string {
	let out = ''
	for (const child of parent.children) {
		if ('value' in child) {
			out += child.value
		} else if ('children' in child) {
			out += dumpLiteralValues(child as Parent)
		}
	}
	return out
}
