export interface DetailsData {
	key: string
	value: string
}

export interface SidebarImageData {
	path: string
	caption: string
}

export type ProjectSettings = {
	title: string
	frontPage: {
		path: string
	}
	allowMermaidInk: boolean
}

/**
 * Markdown frontmatter properties explicitly handled by Heirloom.
 */
export type Frontmatter = {
	/* GENERAL PROPERTIES */
	/**
	 * List of aliases for the page title. Used as additional search
	 * terms to find the page.
	 * @default []
	 */
	aliases?: string[]

	/* CUSTOM HEIRLOOM PROPERTIES */
	/**
	 * Determines whether the file should be published or not.
	 * Any file with `hl-publish` set to false will be ignored and
	 * won't appear on the website.
	 * @default false
	 */
	'hl-publish'?: boolean
	/**
	 * A string that will be used for disambiguation in case of page title conflicts.
	 * It will appear in parentheses after the page title. If this is unset and there
	 * is a title conflict, it will be generated automatically from the conflicting
	 * file's path.
	 * @default undefined
	 */
	'hl-disambiguation'?: string

	/* FRONTMATTER PROPERTIES */
	/**
	 * Marks a file as the front page of the website. This is the page
	 * that will be rendered when navigating to the the base URL of the
	 * website. At least one page in the project must have this property
	 * set to true.
	 *
	 * Must be set on the front page.
	 * @default false
	 */
	'hl-frontpage'?: boolean
	/**
	 * The title of the project, shown in the top bar of the website.
	 *
	 * Must be set on the front page.
	 * @default "My Heirloom Project"
	 */
	'hl-project-title'?: string
	/**
	 * Whether to allow the use of [mermaid.ink](https://mermaid.ink) or not
	 * to render MermaidJS diagrams at build time. This is a third-party
	 * service that Heirloom has no control over. It optionally relies on it
	 * because MermaidJS has no server-side rendering solution that works well
	 * for static generation.
	 *
	 * Must be set on the front page.
	 * @default false
	 */
	'hl-allow-mermaid-ink'?: boolean
} & Record<string, unknown>

export interface Folder {
	type: 'folder'
	title: string
	path: string
	children: Tree
	expanded: boolean
}

export interface File {
	type: 'file'
	title: string
	path: string
	slug: string
	aliases: string[]
}

export type Tree = (File | Folder)[]

export interface Manifest {
	projectSettings: ProjectSettings
	navTree: Tree
	slugsToPaths: Record<string, string>
	pathsToRoutes: Record<string, string>
	mediaPaths: string[]
}
