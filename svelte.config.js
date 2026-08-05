import adapter from '@sveltejs/adapter-static'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
    extensions: ['.svelte'],
    // Consult https://kit.svelte.dev/docs/integrations#preprocessors
    // for more information about preprocessors
    preprocess: [vitePreprocess()],

    // Workaround to avoid enforcing runes mode even in node modules
    vitePlugin: {
        inspector: true,
        dynamicCompileOptions({ filename }) {
            if (filename.includes('node_modules')) {
                return { runes: undefined }
            }
        },
    },
    compilerOptions: {
        runes: true,
    },

    kit: {
        adapter: adapter(),
        prerender: {
            handleHttpError: 'warn',
            handleMissingId: 'warn',
        },
    },
}
export default config
