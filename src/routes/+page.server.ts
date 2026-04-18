import type { PageServerLoad } from './$types'
import { fetchPage } from '$lib/loading'

export const load = (async ({ parent }) => {
	const manifest = await parent()
	return await fetchPage(manifest.wikiSettings.frontPage.path, manifest)
}) satisfies PageServerLoad
