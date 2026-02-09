import { error } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'
import { readdirSync } from 'fs'
import { ASSETS_FOLDER } from '$lib/utils'
import type { WikiSettings } from '$lib/types'
import type { PageMetadata } from '$lib/notes'

// The entire site is prerendered. The rest of the site relies on this (e.g., for
// access to the file system at build time) so make sure to never change this unless
// strictly necessary
export const prerender = true

export const load = (async () => {
	// TODO: Fetch actual settings and metadata
	const settings: WikiSettings = {
		title: 'TESTING PLEASE CHANGE'
	}
	if (!settings) {
		error(500, 'Failed to fetch wiki settings')
	}

	// Get page metadata for the navbar
	const filenames = readdirSync(ASSETS_FOLDER, { recursive: true, encoding: 'utf-8' })
	const pageMetadata: PageMetadata[] = filenames.map((file) => ({
		title: file.split('/').at(-1)!.replace('.md', ''),
		route: file.split('/').at(-1)!.replace('.md', '').replaceAll(' ', '_'),
		aliases: [],
		path: file
	}))

	return { settings, pageMetadata }
}) satisfies LayoutServerLoad
