import { error } from '@sveltejs/kit'
import { readdirSync, readFileSync } from 'fs'
import { ASSETS_FOLDER } from './utils'

/**
 * Handle page slug by reading markdown file from the content directory
 * @param filename The filename of the markdown file (somewhere in the content directory)
 * @returns The processed page object with HTML content
 */
export function handlePageSlug(filename: string) {
	// Get the path by finding the first file with the given name
	// TODO: Disambiguation should probably be handled elsewhere
	const files = readdirSync(ASSETS_FOLDER, { recursive: true, encoding: 'utf-8' }).filter((entry) =>
		entry.endsWith('.md')
	)
	const filepath = files.find(
		(entry) => entry.split('/').at(-1)!.replace('.md', '').replaceAll(' ', '_') == filename
	)
	if (!filepath) error(404, `No file called ${filename}. Skipping`)

	const fullPath = `${ASSETS_FOLDER}/${filepath}`
	console.log('PROCESSING:', fullPath)
	const markdownContent = readFileSync(fullPath, 'utf-8')
	const htmlContent = markdownToHtml(markdownContent)

	return {
		content: htmlContent,
		title: filename.split('/').at(-1)?.replace('.md', '').replaceAll('_', ' ') ?? 'Placeholder',
		path: filepath
	}
}

/**
 * Mock markdown to HTML converter. To be changed by the proper unified implementation.
 */
function markdownToHtml(markdown: string): string {
	return markdown
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/\n/g, '<br>')
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
