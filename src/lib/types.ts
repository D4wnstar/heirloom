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
	/* All Heirloom properties should start with 'hl-' */
	/**
	 * Determines whether the file should be published or not.
	 * Any file with `hl-publish` set to false will be ignored and
	 * won't appear on the website.
	 * @default false
	 */
	'hl-publish'?: boolean
	/**
	 * Alternate title for the page that will be displayed on the website.
	 * Useful when the file name needs to differ from the published title.
	 * @default undefined
	 */
	'hl-title'?: string
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

/**
 * Settings about the project and website as a whole.
 */
export type ProjectSettings = {
	/**
	 * The display title of the project.
	 */
	title: string
	/**
	 * Information about the front page of the website.
	 */
	frontPage: {
		/**
		 * The file path to the front page's markdown file.
		 */
		path: string
	}
	/**
	 * Whether [mermaid.ink](https://mermaid.ink) is allowed or not.
	 * See the `hl-allow-mermaid-ink` frontmatter property for more.
	 */
	allowMermaidInk: boolean
}

/**
 * The Heirloom build manifest generated during asset preprocessing.
 * Contains information needed by the website during static generation.
 */
export interface Manifest {
	/**
	 * The project settings.
	 */
	projectSettings: ProjectSettings
	/**
	 * The data structure used to render the navigation menu made
	 * to explore the website.
	 */
	navTree: Tree
	/**
	 * A map between page slugs and their associated markdown file path on disk.
	 * These are used to identify which file to fetch when loading a page.
	 */
	slugsToPaths: Record<string, string>
	/**
	 * A map between markdown file paths on disk and their associated website route.
	 * These are used to resolve wikilinks to asset files to actual HTML anchors.
	 */
	pathsToRoutes: Record<string, string>
	/**
	 * A list of all media file paths. These are used to resolve media file paths
	 * (such as in embeds) to their content.
	 */
	mediaPaths: string[]
}

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
