export interface DetailsData {
	key: string
	value: string
}

export interface SidebarImageData {
	path: string
	caption: string
}

export type WikiSettings = {
	title: string
	frontPage: {
		path: string
	}
	allowMermaidInk: boolean
}

export type Frontmatter = {
	aliases?: string[]
	'wiki-publish'?: boolean
	'wiki-frontpage'?: boolean
	'wiki-disambiguation'?: string
	'wiki-project-title'?: string
	'wiki-allow-mermaid-ink'?: boolean
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
	wikiSettings: WikiSettings
	navTree: Tree
	slugsToPaths: Record<string, string>
	pathsToRoutes: Record<string, string>
	mediaPaths: string[]
}
