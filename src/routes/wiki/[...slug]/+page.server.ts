import { fetchPage } from '$lib/loading'
import type { Manifest } from '$lib/types'
import { MANIFEST_PATH } from '$lib/utils'
import { error } from '@sveltejs/kit'
import type { EntryGenerator, PageServerLoad } from './$types'
import { readFileSync } from 'fs'

export const load = (async ({ params: { slug }, parent }) => {
	const layoutData = await parent()
	if (slug === layoutData.wikiSettings.frontPage.slug) {
		error(400, 'Front page route is rendered separately as the root route "/"')
	}

	const path = layoutData.slugsToPath[slug]
	if (!path) error(404, `No path found for slug ${slug}`)
	return fetchPage(path)
}) satisfies PageServerLoad

export const entries: EntryGenerator = async () => {
	const manifest = readFileSync(MANIFEST_PATH, { encoding: 'utf-8' })
	const manifestJson: Manifest = JSON.parse(manifest)
	const slugs = Object.keys(manifestJson.slugsToPath).map((slug) => ({
		slug
	}))

	console.log('SLUGS:', slugs)

	return slugs
}
