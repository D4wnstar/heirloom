import { readFileSync } from 'fs'
import path, { join } from 'path'
import { markdownToHtml } from './converter/converter'

export const ASSETS_FOLDER = 'assets'
export const MANIFEST_PATH = join(ASSETS_FOLDER, 'manifest.json')

/**
 * Fetch a page by reading markdown file from the content directory and converting it.
 * @param filepath The path to the markdown file (relative to the assets directory)
 * @returns The processed page object with HTML content
 */
export function fetchPage(filepath: string) {
	const fullPath = join(ASSETS_FOLDER, filepath)
	console.log('PROCESSING:', fullPath)
	const markdownContent = readFileSync(fullPath, 'utf-8')
	const { html, title, frontmatter } = markdownToHtml(markdownContent)

	const titleFromPath = filepath.split(path.sep).at(-1)?.replace(/\.md$/, '') ?? 'Placeholder'

	return {
		html,
		title: title ?? titleFromPath,
		path: filepath,
		frontmatter
	}
}

/**
 * Common handling function for both the front page and slug-navigated pages.
 * Meant to be used in the page.server.ts load function.
 * @param db A Drizzle LibSQLDatabase instance
 * @param user The currently logged-in user, if any
 * @param route The route of the page to handle. Leave undefined for the front page
 * @returns The page data and its content
 */
// export async function handlePageSlugDeprecated(
// 	db: LibSQLDatabase,
// 	user: LoggedUser | null,
// 	route: string | undefined = undefined
// ) {
// 	// Find page based on route or the frontpage flag
// 	const pageCondition = route ? eq(notes.route, route) : eq(notes.frontpage, true)
// 	const isUserAllowed = user ? getAllowedUsersFilter(user.username, 'notes') : undefined

// 	const rows = await db
// 		.select()
// 		.from(notes)
// 		.leftJoin(details, eq(notes.path, details.note_path))
// 		.leftJoin(sidebarImages, eq(notes.path, sidebarImages.note_path))
// 		.where(
// 			// The user must either need no permission or be allowed in the page
// 			and(pageCondition, or(isNull(notes.allowed_users), isUserAllowed))
// 		)
// 	if (rows.length === 0) {
// 		error(404, 'Could not find this page. Are you sure you have the right link?')
// 	}

// 	const allowedUsers = rows[0].notes.allowed_users?.toLocaleLowerCase().split('; ')
// 	if (allowedUsers) {
// 		if (!user?.username) {
// 			error(401, 'You are not allowed to see this page. Please log in.')
// 		}
// 		if (!allowedUsers.includes(user.username)) {
// 			error(403, 'You are not allowed to see this page.')
// 		}
// 	}

// 	// Uniqueness of each element is guaranteed with hashmaps
// 	const pageMap = rows.reduce<{
// 		note: NoteRow
// 		details: Map<number, DetailsRow>
// 		sidebarImages: Map<number, SidebarImageRow>
// 	}>(
// 		(acc, row) => {
// 			if (row.details) {
// 				acc.details.set(row.details.order, row.details)
// 			}

// 			if (row.sidebar_images) {
// 				acc.sidebarImages.set(row.sidebar_images.order, row.sidebar_images)
// 			}

// 			return acc
// 		},
// 		{
// 			note: rows[0].notes,
// 			details: new Map<number, DetailsRow>(),
// 			sidebarImages: new Map<number, SidebarImageRow>()
// 		}
// 	)

// 	const page = {
// 		note: pageMap.note,
// 		details: [...pageMap.details.values()],
// 		sidebarImages: [...pageMap.sidebarImages.values()]
// 	}

// 	// Sort details and sidebar images by the given order
// 	page.details.sort((d1, d2) => d1.order - d2.order)
// 	page.sidebarImages.sort((img1, img2) => img1.order - img2.order)

// 	page.note.html_content = hideSecretBlocks(page.note.html_content, user?.username)

// 	return page
// }
