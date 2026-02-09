import type { RequestHandler } from './$types'
import { json } from '@sveltejs/kit'
import { readFileSync } from 'fs'

export const GET: RequestHandler = async ({ params: { uri } }) => {
	const path = decodeURIComponent(uri)
	const image = readFileSync(path)

	if (!image) return json({ message: 'No image found' }, { status: 404 })

	// Check if it's a raster or an SVG
	// TODO: Implement a more robust check than just extension matching
	if (path.endsWith('.svg')) {
		return new Response(image.toString('utf-8'), {
			headers: {
				'content-type': 'image/svg+xml',
				'cache-control': 'public, max-age=86400'
			}
		})
	} else {
		// TODO: For now, all images are intended to be WebP. This should be generalized
		return new Response(new Uint8Array(image), {
			headers: {
				'content-type': 'image/webp',
				'cache-control': 'public, max-age=864000'
			}
		})
	}
}
