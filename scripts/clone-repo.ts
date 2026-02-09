import { execSync } from 'child_process'
import { cpSync, existsSync, mkdirSync, rmSync } from 'fs'
import { assetsDir, devAssetsDir } from './utils.ts'

const sourceRepoUrl = process.env.SOURCE_REPO_URL

if (sourceRepoUrl) {
	if (existsSync(assetsDir)) {
		// Skip if the repo has already been cloned (mainly for local dev)
		process.exit(0)
	}

	// If there's a URL to source from, use it
	console.log(`Cloning repository: ${sourceRepoUrl}`)
	console.log(`Destination:        ${assetsDir}`)

	mkdirSync(assetsDir, { recursive: true })
	try {
		execSync(`git clone --depth 1 ${sourceRepoUrl} ${assetsDir}`, { stdio: 'inherit' })
		rmSync(`${assetsDir}/.git`, { recursive: true, force: true })
		console.log('Repository cloned successfully')
	} catch (error) {
		console.error('Error cloning repository:', error)
		process.exit(1)
	}
} else if (existsSync(devAssetsDir)) {
	// If not, fall back to dev assets
	console.log(`No SOURCE_REPO_URL set: using development assets`)
	console.log(`Source:      ${devAssetsDir}`)
	console.log(`Destination: ${assetsDir}`)

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
		`Error: SOURCE_REPO_URL environment variable is not set and no dev assets are available at ${devAssetsDir}`
	)
	process.exit(1)
}
