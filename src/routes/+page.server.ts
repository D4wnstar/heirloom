import type { PageServerLoad } from './$types'
import { fetchPage } from '$lib/loading'

export const load = (async ({ parent }) => {
	const layoutData = await parent()
	return fetchPage(layoutData.wikiSettings.frontPage.path)
}) satisfies PageServerLoad
