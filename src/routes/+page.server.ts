import type { PageServerLoad } from './$types'
import { handlePageSlug } from '$lib/loading'

export const load = (async () => {
	return await handlePageSlug(db, user)
}) satisfies PageServerLoad
