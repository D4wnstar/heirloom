import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
	plugins: [sveltekit()],
	resolve: {
		alias: {
			// Workaround to get KaTeX fonts to load correctly in both dev and production
			$katexfonts: mode === 'production' ? './static/fonts/katex' : '/fonts/katex'
		}
	}
}))
