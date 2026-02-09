export interface DetailsData {
	key: string
	value: string
}

export interface SidebarImageData {
	path: string
	caption: string
}

type WikiSettings = {
	title: string
	frontPage: {
		slug: string
		path: string
	}
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

export interface Manifest {
	wikiSettings: WikiSettings
	navTree: Tree
	slugsToPath: Record<string, string>
}
