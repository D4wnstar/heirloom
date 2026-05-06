import { fetchPage } from '$lib/loading'
import type { Manifest } from '$lib/types'
import { MANIFEST_PATH } from '$lib/loading'
import { error } from '@sveltejs/kit'
import type { EntryGenerator, PageServerLoad } from './$types'
import { readFileSync } from 'fs'

export const load = (async ({ params: { slug }, parent }) => {
	const manifest = await parent()
	const path = manifest.slugsToPaths[slug] as string | undefined
	if (!path) error(404, `No path found for slug '${slug}'`)
	return await fetchPage(path, manifest)
}) satisfies PageServerLoad

export const entries: EntryGenerator = async () => {
	const manifestJson = readFileSync(MANIFEST_PATH, { encoding: 'utf-8' })
	const manifest: Manifest = JSON.parse(manifestJson)
	return Object.keys(manifest.slugsToPaths).map((slug) => ({
		slug
	}))
}
