import { dirname, join } from 'path/posix'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
export const assetsDir = join(__dirname, '..', 'assets')
export const devAssetsDir = join(__dirname, '..', 'dev-assets')
