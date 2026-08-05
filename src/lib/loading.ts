import { readFileSync } from 'fs'
import path, { join } from 'path'
import { markdownToHtml } from './converter/converter'
import type { Manifest } from './types'

export const ASSETS_FOLDER = 'assets'
export const MANIFEST_PATH = join(ASSETS_FOLDER, 'manifest.json')

/**
 * Fetch a page by reading markdown file from the content directory and converting it.
 * @param filepath The path to the markdown file (relative to the assets directory)
 * @returns The processed page object with HTML content
 */
export async function fetchPage(filepath: string, manifest: Manifest) {
    const assetPath = join(ASSETS_FOLDER, filepath)
    console.debug('PROCESSING:', assetPath)

    const markdownContent = readFileSync(assetPath, 'utf-8')
    const { html, title, sidebarImages, details } = await markdownToHtml(markdownContent, manifest)

    const titleFromPath = filepath.split(path.sep).at(-1)?.replace(/\.md$/, '') ?? 'Placeholder'

    return {
        html,
        title: title ?? titleFromPath,
        path: filepath,
        sidebarImages,
        details,
    }
}
