import { existsSync, mkdirSync, readFileSync, copyFileSync, rmSync } from 'fs'
import { join, dirname } from 'path'
import type { Manifest } from '../src/lib/types.ts'
import { assetsDir, manifestPath, staticMediaDir } from './utils.ts'

if (!existsSync(manifestPath)) {
    console.error('Error: No manifest found at assets/manifest.json. Run make-manifest.ts first.')
    process.exit(1)
}

// Get the manifest
const manifestJson = readFileSync(manifestPath, { encoding: 'utf-8' })
const manifest: Manifest = JSON.parse(manifestJson)
const { mediaPaths } = manifest

if (mediaPaths.length === 0) {
    console.log('No media files to copy.')
    process.exit(0)
}

// Clean up old media directory to avoid stale files
if (existsSync(staticMediaDir)) {
    console.log('Removing old static/media directory')
    rmSync(staticMediaDir, { recursive: true, force: true })
}

// Copy each media file, preserving directory structure under static/media/
console.log(`Copying media files to static/media/`)
for (const mediaPath of mediaPaths) {
    const sourcePath = join(assetsDir, mediaPath)
    const destPath = join(staticMediaDir, mediaPath)

    if (!existsSync(sourcePath)) {
        console.warn(`Warning: Media file not found: ${sourcePath}`)
        continue
    }

    // Ensure parent directory exists
    mkdirSync(dirname(destPath), { recursive: true })
    copyFileSync(sourcePath, destPath)
}

console.log(`Successfully copied ${mediaPaths.length} media file(s) to static/media/`)
