import { execSync } from 'child_process'
import { cpSync, existsSync, mkdirSync, rmSync } from 'fs'
import { assetsDir, devAssetsDir } from './utils.ts'

const sourceRepoUrl = process.env.HEIRLOOM_SOURCE_REPO_URL

if (sourceRepoUrl) {
    // Remote assets are available
    // Make sure to handle existing assets from a previous run, if any
    if (existsSync(assetsDir)) {
        if (process.env.HEIRLOOM_USE_CACHED_ASSETS) {
            console.log('Reusing cached assets')
            process.exit(0)
        }

        try {
            console.log('Removing old assets')
            rmSync(assetsDir, { recursive: true, force: true })
        } catch (error) {
            console.error(`Error removing assets from previous run: ${error}`)
            process.exit(1)
        }
    }

    console.log(`Cloning repository: ${sourceRepoUrl}`)
    console.log(`To destination:     ${assetsDir}`)

    try {
        mkdirSync(assetsDir, { recursive: true })
        execSync(`git clone --depth 1 "${sourceRepoUrl}" "${assetsDir}"`, { stdio: 'inherit' })
        rmSync(`${assetsDir}/.git`, { recursive: true, force: true })
        console.log('Repository cloned successfully')
    } catch (error) {
        console.error('Error cloning repository:', error)
        process.exit(1)
    }
} else if (existsSync(devAssetsDir)) {
    // Use dev assets instead
    console.log(`No HEIRLOOM_SOURCE_REPO_URL set: using development assets`)
    console.log(`Copying source: ${devAssetsDir}`)
    console.log(`To destination: ${assetsDir}`)

    try {
        if (existsSync(assetsDir)) {
            // Always replace existing assets to make it easier to change dev assets during development
            console.log('Removing old assets')
            rmSync(assetsDir, { recursive: true, force: true })
        }
        cpSync(devAssetsDir, assetsDir, { recursive: true })
        console.log('Dev assets cloned successfully')
    } catch (error) {
        console.error(`Error cloning dev assets: ${error}`)
        process.exit(1)
    }
} else {
    console.error(
        `Error: HEIRLOOM_SOURCE_REPO_URL environment variable is not set and no dev assets are available at ${devAssetsDir}`,
    )
    process.exit(1)
}
