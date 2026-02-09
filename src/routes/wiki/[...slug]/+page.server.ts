import { handlePageSlug } from '$lib/loading'
import { ASSETS_FOLDER } from '$lib/utils'
import type { EntryGenerator, PageServerLoad } from './$types'
import { readdirSync } from 'fs'

export const load = (async ({ params: { slug } }) => {
	return handlePageSlug(slug)
}) satisfies PageServerLoad

export const entries: EntryGenerator = async () => {
	// Each slug is the filename without the file extensions
	// TODO: Handle disambiguation of files with the same name
	const slugs = readdirSync(ASSETS_FOLDER, { recursive: true, encoding: 'utf-8' })
		// Filter out hidden files and folders
		.filter((a) => !a.split('/').some((part) => part.startsWith('.')))
		// Grab the filename/dirname only
		.map((a) => a.split('/').at(-1)!)
		// Filter for .md files only
		.filter((a) => a.endsWith('.md'))
		.map((a) => ({ slug: a.replace('.md', '').replaceAll(' ', '_') }))

	console.log('SLUGS:', slugs)

	return slugs
}
