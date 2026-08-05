<script lang="ts">
	import { Popover, Portal } from '@skeletonlabs/skeleton-svelte'
	import TreeFile from './TreeFile.svelte'
	import TreeFolder from './TreeFolder.svelte'
	import { onMount } from 'svelte'
	import { browser } from '$app/environment'
	import type { Tree } from '$lib/types'
	import { LSVAR_NAVMENU_STATE } from '$lib/utils'

	let { tree }: { tree: Tree } = $props()

	let searchQuery = $state('')
	let autocompleteLinks: { title: string; slug: string }[] = $state([])

	// Open/closed folder state lives here, keyed by folder path
    // Persisted to localStorage on change for persisten navbar state
    // across full reloads/navigations
	let expanded = $state<Record<string, boolean>>({})

	function isExpanded(path: string) {
		return expanded[path] ?? false
	}

	function toggle(path: string) {
		expanded[path] = !isExpanded(path)
		saveExpandedStates()
	}

	function saveExpandedStates() {
		if (!browser) return
		localStorage.setItem(LSVAR_NAVMENU_STATE, JSON.stringify(expanded))
	}

	onMount(() => {
		if (!browser) return
		const saved = localStorage.getItem(LSVAR_NAVMENU_STATE)
		if (!saved) return
		try {
			expanded = JSON.parse(saved)
		} catch {
			// malformed saved state, ignore
            console.warn("Navigation open/closed state was malformed, resetting...")
		}
	})

	function searchInTree(searchTerm: string, tree: Tree) {
		let namePathPairs: { title: string; slug: string }[] = []
		for (const node of tree) {
			if (
				node.type === 'file' &&
				node.aliases.some((term) => term.toLocaleLowerCase().includes(searchTerm))
			) {
				namePathPairs.push({ title: node.title, slug: node.slug })
				continue
			}

			if (node.type === 'folder') {
				const nestedPairs = searchInTree(searchTerm, node.children)
				namePathPairs.push(...nestedPairs)
			}
		}

		return namePathPairs
	}

	function autocomplete() {
		if (searchQuery.length < 2) return
		autocompleteLinks = searchInTree(searchQuery.toLocaleLowerCase(), tree)
	}

	function onNavigate() {
		searchQuery = ''
		autocompleteLinks = []
	}
</script>

<Popover>
	<Popover.Trigger class="w-full">
		<input
			type="text"
			name="search"
			id="search"
			class="input"
			placeholder="Search..."
			bind:value={searchQuery}
			oninput={autocomplete}
		/>
	</Popover.Trigger>
	<Portal>
		<Popover.Positioner>
			{#if autocompleteLinks.length > 0}
				<Popover.Content class="card bg-surface-100-900 w-96 p-4 shadow-xl">
					<div class="flex w-full flex-col items-start space-y-2">
						{#each autocompleteLinks as link}
							<Popover.CloseTrigger class="btn hover:preset-tonal block w-full text-left">
								<a href={`/pages/${link.slug}`} onclick={onNavigate}>{link.title}</a>
							</Popover.CloseTrigger>
						{/each}
					</div>
				</Popover.Content>
			{/if}
		</Popover.Positioner>
	</Portal>
</Popover>

<hr class="border-surface-700-300" />
<div class="overflow-auto">
	{#each tree as node (node.path)}
		<div>
			{#if node.type === 'folder'}
				<TreeFolder
					{...node}
					expanded={isExpanded(node.path)}
					isExpanded={isExpanded}
					toggle={toggle}
				/>
			{:else}
				<TreeFile {...node} />
			{/if}
		</div>
	{/each}
</div>
<hr class="border-surface-700-300" />
