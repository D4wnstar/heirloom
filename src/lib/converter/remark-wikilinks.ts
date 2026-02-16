// This micromark extension is based on the MIT-licensed `micromark-extension-wiki-link` NPM
// package by `landakram` at https://www.npmjs.com/package/micromark-extension-wiki-link.
// Updated to modern TypeScript by Samuele Vignoli and adopted for this project's use.
//
// MIT License
//
// Copyright (c) 2020 landakram
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import { codes } from 'micromark-util-symbol'
import type { Code, Construct, Extension, Tokenizer } from 'micromark-util-types'

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

// A wikilink has the following general syntax:
//
// [[Target#Section|Alias]]
//
// Both #Section and |Alias are optional. An embed link looks like this:
//
// ![[Target#Section]]
//
// #Section is optional. There is no canonical use for the alias syntax
// in an embed, but it is used in Obsidian for passing options to embeds,
// such as image dimensions, so it should be supported too.

const tokenize: Tokenizer = function (effects, ok, nok) {
	return start

	function start(code: Code) {
		if (code !== codes.leftSquareBracket) return nok(code)
	}
}

const wikilinkConstruct: Construct = { name: 'wikilink', tokenize }
export const wikilinks: Extension = {
	text: {
		[codes.leftSquareBracket]: wikilinkConstruct,
		[codes.exclamationMark]: wikilinkConstruct
	}
}

/*
const tokenize: Tokenizer = function (effects, ok, nok) {
	var data
	var alias

	var aliasCursor = 0
	var startMarkerCursor = 0
	var endMarkerCursor = 0

	return start

	function start(code) {
		if (code !== startMarker.charCodeAt(startMarkerCursor)) return nok(code)

		effects.enter('wikilink')
		effects.enter('wikilinkMarker')

		return consumeStart(code)
	}

	function consumeStart(code) {
		if (startMarkerCursor === startMarker.length) {
			effects.exit('wikilinkMarker')
			return consumeData(code)
		}

		if (code !== startMarker.charCodeAt(startMarkerCursor)) {
			return nok(code)
		}

		effects.consume(code)
		startMarkerCursor++

		return consumeStart
	}

	function consumeData(code) {
		if (markdownLineEnding(code) || code === codes.eof) {
			return nok(code)
		}

		effects.enter('wikilinkData')
		effects.enter('wikilinkTarget')
		return consumeTarget(code)
	}

	function consumeTarget(code) {
		if (code === aliasMarker.charCodeAt(aliasCursor)) {
			if (!data) return nok(code)
			effects.exit('wikilinkTarget')
			effects.enter('wikilinkAliasMarker')
			return consumeAliasMarker(code)
		}

		if (code === endMarker.charCodeAt(endMarkerCursor)) {
			if (!data) return nok(code)
			effects.exit('wikilinkTarget')
			effects.exit('wikilinkData')
			effects.enter('wikilinkMarker')
			return consumeEnd(code)
		}

		if (markdownLineEnding(code) || code === codes.eof) {
			return nok(code)
		}

		if (!markdownLineEndingOrSpace(code)) {
			data = true
		}

		effects.consume(code)

		return consumeTarget
	}

	function consumeAliasMarker(code) {
		if (aliasCursor === aliasMarker.length) {
			effects.exit('wikilinkAliasMarker')
			effects.enter('wikilinkAlias')
			return consumeAlias(code)
		}

		if (code !== aliasMarker.charCodeAt(aliasCursor)) {
			return nok(code)
		}

		effects.consume(code)
		aliasCursor++

		return consumeAliasMarker
	}

	function consumeAlias(code) {
		if (code === endMarker.charCodeAt(endMarkerCursor)) {
			if (!alias) return nok(code)
			effects.exit('wikilinkAlias')
			effects.exit('wikilinkData')
			effects.enter('wikilinkMarker')
			return consumeEnd(code)
		}

		if (markdownLineEnding(code) || code === codes.eof) {
			return nok(code)
		}

		if (!markdownLineEndingOrSpace(code)) {
			alias = true
		}

		effects.consume(code)

		return consumeAlias
	}

	function consumeEnd(code) {
		if (endMarkerCursor === endMarker.length) {
			effects.exit('wikilinkMarker')
			effects.exit('wikilink')
			return ok(code)
		}

		if (code !== endMarker.charCodeAt(endMarkerCursor)) {
			return nok(code)
		}

		effects.consume(code)
		endMarkerCursor++

		return consumeEnd
	}
}

function wikilinkTokenize(opts = {}) {
	const aliasDivider = opts.aliasDivider || ':'

	const aliasMarker = aliasDivider
	const startMarker = '[['
	const endMarker = ']]'

	var call = { tokenize: tokenize }

	return {
		text: { 91: call } // left square bracket
	}
}
*/
