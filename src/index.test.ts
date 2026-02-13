import { comments, highlights } from '$lib/converter/remark-extras'
import { micromark } from 'micromark'
import { describe, it, expect } from 'vitest'

describe('remark-extras', () => {
	describe('highlights', () => {
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

		// it('should parse highlighted with one escape', () => {
		// 	const text = '==Highlights\\==escape artist=='
		// 	expect(micromark(text, { extensions: [highlights] })).toBe('<p></p>')
		// })

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

	describe('comments', () => {
		it('should parse basic comment syntax', () => {
			const text = '%%Comment%%'
			expect(micromark(text, { extensions: [comments] })).toBe('<p></p>')
		})

		it('should parse comment with inner space', () => {
			const text = '%%Comment % just fine%%'
			expect(micromark(text, { extensions: [comments] })).toBe('<p></p>')
		})

		// FIXME: Currently broken with a weird looping issue
		// it('should parse multi-line comment', () => {
		// 	const text = '%%Comment\nacross\nlines%%'
		// 	expect(micromark(text, { extensions: [comments] })).toBe('<p></p>')
		// })

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
})
