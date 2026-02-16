import { comments } from '$lib/converter/remark-comments'
import { highlights } from '$lib/converter/remark-highlights'
import { wikilinks } from '$lib/converter/remark-wikilinks'
import { micromark } from 'micromark'
import { describe, it, expect } from 'vitest'

describe('remark-highlights', () => {
	// There's no micromark HTML extension, so highlights should just get stripped
	it('should parse basic highlight syntax', () => {
		const text = '==Highlight=='
		expect(micromark(text, { extensions: [highlights] })).toBe('<p></p>')
	})

	it('should parse highlighted with single inner = sign', () => {
		const text = '==Highlights=cool=='
		expect(micromark(text, { extensions: [highlights] })).toBe('<p></p>')
	})

	it('should parse highlighted with two escapes', () => {
		const text = '==Highlights\\=\\=escape artist=='
		expect(micromark(text, { extensions: [highlights] })).toBe('<p></p>')
	})

	// FIXME: Current escaping implementation is broken
	it.skip('should parse highlighted with one escape', () => {
		const text = '==Highlights\\==escape artist=='
		expect(micromark(text, { extensions: [highlights] })).toBe('<p></p>')
	})

	it('should NOT highlight with single = signs', () => {
		const text = '=Not highlighted='
		expect(micromark(text, { extensions: [highlights] })).toBe('<p>=Not highlighted=</p>')
	})

	it('should NOT highlight with unclosed ==', () => {
		const text = '==Not highlighted='
		expect(micromark(text, { extensions: [highlights] })).toBe('<p>==Not highlighted=</p>')
	})

	it('should NOT highlight with unopened ==', () => {
		const text = '=Not highlighted=='
		expect(micromark(text, { extensions: [highlights] })).toBe('<p>=Not highlighted==</p>')
	})

	it('should NOT highlight with spaces around', () => {
		const text = '== Not highlighted =='
		expect(micromark(text, { extensions: [highlights] })).toBe('<p>== Not highlighted ==</p>')
	})

	it('should NOT highlight with trailing space', () => {
		const text = '==Not highlighted =='
		expect(micromark(text, { extensions: [highlights] })).toBe('<p>==Not highlighted ==</p>')
	})

	it('should NOT highlight with leading space', () => {
		const text = '== Not highlighted=='
		expect(micromark(text, { extensions: [highlights] })).toBe('<p>== Not highlighted==</p>')
	})

	it('should NOT highlight with newline inside', () => {
		const text = '==Not\nhighlighted=='
		expect(micromark(text, { extensions: [highlights] })).toBe('<p>==Not\nhighlighted==</p>')
	})
})

describe('remark-comments', () => {
	it('should parse basic comment syntax', () => {
		const text = '%%Comment%%'
		expect(micromark(text, { extensions: [comments] })).toBe('<p></p>')
	})

	it('should parse comment with inner space', () => {
		const text = '%%Comment % just fine%%'
		expect(micromark(text, { extensions: [comments] })).toBe('<p></p>')
	})

	// FIXME: Currently broken with a weird looping issue
	it.skip('should parse multi-line comment', () => {
		const text = '%%Comment\nacross\nlines%%'
		expect(micromark(text, { extensions: [comments] })).toBe('<p></p>')
	})

	it('should NOT parse unclosed comment', () => {
		const text = '%%Not comment%'
		expect(micromark(text, { extensions: [comments] })).toBe('<p>%%Not comment%</p>')
	})

	it('should NOT parse unopened comment', () => {
		const text = '%Not comment%%'
		expect(micromark(text, { extensions: [comments] })).toBe('<p>%Not comment%%</p>')
	})

	it('should NOT parse single % signs', () => {
		const text = '%Not comment%'
		expect(micromark(text, { extensions: [comments] })).toBe('<p>%Not comment%</p>')
	})
})

describe('remark-wikilinks', () => {
	// Correct syntax
	it('should parse target-only wikilink', () => {
		const text = '[[Target page]]'
		expect(micromark(text, { extensions: [wikilinks] })).toBe('<p></p>')
	})

	it('should parse wikilink with section', () => {
		const text = '[[Target page#Section]]'
		expect(micromark(text, { extensions: [wikilinks] })).toBe('<p></p>')
	})

	it('should parse wikilink with alias', () => {
		const text = '[[Target page|Alias]]'
		expect(micromark(text, { extensions: [wikilinks] })).toBe('<p></p>')
	})

	it('should parse wikilink with section and alias', () => {
		const text = '[[Target page#Section|Alias]]'
		expect(micromark(text, { extensions: [wikilinks] })).toBe('<p></p>')
	})

	it('should parse wikilink with section and no target (internal link)', () => {
		const text = '[[#Section only]]'
		expect(micromark(text, { extensions: [wikilinks] })).toBe('<p></p>')
	})

	it('should parse wikilink with section and alias and no target (internal link)', () => {
		const text = '[[#Section only|Alias]]'
		expect(micromark(text, { extensions: [wikilinks] })).toBe('<p></p>')
	})

	it('should parse wikilink with spaces', () => {
		const text = '[[ Target page # Section | Alias ]]'
		expect(micromark(text, { extensions: [wikilinks] })).toBe('<p></p>')
	})

	// These next two are quite debatable. Currently, an empty alias is both valid and leads
	// to an <a> with no content or no <a> at all, as opposed to failing the parse. This is
	// how Obsidian works. It's a weird edge case and it's not unreasonable to want it to fail
	// but it's such a niche scenario that I figure it's best to stick with what Obsidian does
	// just for the sake of consistency. It can always be changed in the future
	it('should parse wikilink with empty alias', () => {
		const text = '[[Target|]]'
		expect(micromark(text, { extensions: [wikilinks] })).toBe('<p></p>')
	})

	it('should parse wikilink with section and empty alias', () => {
		const text = '[[Target#Section|]]'
		expect(micromark(text, { extensions: [wikilinks] })).toBe('<p></p>')
	})

	it('should parse target-only embed', () => {
		const text = '![[Target page]]'
		expect(micromark(text, { extensions: [wikilinks] })).toBe('<p></p>')
	})

	it('should parse embed with section', () => {
		const text = '![[Target page#Section]]'
		expect(micromark(text, { extensions: [wikilinks] })).toBe('<p></p>')
	})

	it('should parse embed with alias', () => {
		const text = '![[Target page|Alias]]'
		expect(micromark(text, { extensions: [wikilinks] })).toBe('<p></p>')
	})

	it('should parse embed with section and alias', () => {
		const text = '![[Target page#Section|Alias]]'
		expect(micromark(text, { extensions: [wikilinks] })).toBe('<p></p>')
	})

	// Incorrect syntax
	it('should NOT parse single left bracket', () => {
		const text = '[Not a wikilink]'
		expect(micromark(text, { extensions: [wikilinks] })).toBe('<p>[Not a wikilink]</p>')
	})

	it('should NOT parse unclosed wikilink', () => {
		const text = '[[Unclosed'
		expect(micromark(text, { extensions: [wikilinks] })).toBe('<p>[[Unclosed</p>')
	})

	it('should NOT parse wikilink with single closing bracket', () => {
		const text = '[[Target]'
		expect(micromark(text, { extensions: [wikilinks] })).toBe('<p>[[Target]</p>')
	})

	it('should NOT parse wikilink with newline inside', () => {
		const text = '[[Target\nPage]]'
		expect(micromark(text, { extensions: [wikilinks] })).toBe('<p>[[Target\nPage]]</p>')
	})

	it('should NOT parse empty wikilink', () => {
		const text = '[[]]'
		expect(micromark(text, { extensions: [wikilinks] })).toBe('<p>[[]]</p>')
	})

	it('should NOT parse wikilink with only spaces', () => {
		const text = '[[   ]]'
		expect(micromark(text, { extensions: [wikilinks] })).toBe('<p>[[   ]]</p>')
	})

	it('should NOT parse embed with single bracket', () => {
		const text = '![Not an embed]'
		expect(micromark(text, { extensions: [wikilinks] })).toBe('<p>![Not an embed]</p>')
	})

	it('should NOT parse unclosed embed', () => {
		const text = '![[Unclosed'
		expect(micromark(text, { extensions: [wikilinks] })).toBe('<p>![[Unclosed</p>')
	})

	it('should NOT parse wikilink with just an alias', () => {
		const text = '[[|Alias]]'
		expect(micromark(text, { extensions: [wikilinks] })).toBe('<p>[[|Alias]]</p>')
	})
})
