import type { LayoutServerLoad } from './$types'
import { readFileSync } from 'fs'
import { MANIFEST_PATH } from '$lib/loading'
import type { Manifest } from '$lib/types'

// The entire site is prerendered. The rest of the site relies on this (e.g., for
// access to the file system at build time) so make sure to never change this unless
// strictly necessary
export const prerender = true

export const load = (async () => {
    const manifestJson = readFileSync(MANIFEST_PATH, { encoding: 'utf-8' })
    return JSON.parse(manifestJson) as Manifest
}) satisfies LayoutServerLoad
