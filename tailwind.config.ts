import type { Config } from 'tailwindcss'

export default {
	content: ['./src/**/*.{html,js,svelte,ts}']

	// safelist: [
	// 	{
	// 		pattern: /h[1-6]/
	// 	},
	// 	{
	// 		pattern: /preset-filled-\w+-\d+-\d+/
	// 	},
	// 	'code-highlight',
	// 	'code-line',
	// 	'inserted',
	// 	'deleted',
	// 	'highlight-line',
	// 	'line-number',
	// 	'callout',
	// 	'callout-title',
	// 	'callout-title-inner',
	// 	'callout-icon',
	// 	'callout-collapsible',
	// 	'wrap-break-word',
	// 	'blockquote',
	// 	'table-cell',
	// 	'code',
	// 	// For lists
	// 	'list-outside',
	// 	'list-disc',
	// 	'list-decimal',
	// 	'pl-4',
	// 	'space-y-1',
	// 	'text-surface-600-400',
	// 	'checkbox'
	// ]
} satisfies Config
