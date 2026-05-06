<script lang="ts">
	import { Popover } from '@skeletonlabs/skeleton-svelte'
	import TreeFile from './TreeFile.svelte'
	import TreeFolder from './TreeFolder.svelte'
	import { onMount } from 'svelte'
	import { browser } from '$app/environment'
	import type { Tree } from '$lib/types'
	import { LSVAR_NAVMENU_STATE } from '$lib/utils'

	let { tree: treeProp }: { tree: Tree } = $props()

	// Tree needs to marked as state since props are by design non-reactive
	let tree = $state(treeProp)
	let searchQuery = $state('')
	let popoverState = $state(false)
	let autocompleteLinks: { title: string; slug: string }[] = $state([])

	onMount(async () => loadExpandedStates(tree))

	function saveExpandedStates() {
		if (!browser) return

		const states: Record<string, boolean> = {}
		const collectStates = (items: Tree) => {
			for (const item of items) {
				// Save only open folders, everything else is default closed anyway
				if (item.type === 'folder' && item.expanded) {
					states[item.path] = item.expanded
					collectStates(item.children)
				}
			}
		}
		collectStates(tree)
		localStorage.setItem(LSVAR_NAVMENU_STATE, JSON.stringify(states))
	}

	function loadExpandedStates(content: Tree) {
		if (!browser) return

		const saved = localStorage.getItem(LSVAR_NAVMENU_STATE)
		if (!saved) return

		const states: Record<string, boolean> = JSON.parse(saved)
		const applyStates = (items: Tree) => {
			for (const item of items) {
				if (item.type === 'folder') {
					if (states[item.path] !== undefined) {
						item.expanded = states[item.path]
					}
					applyStates(item.children)
				}
			}
		}
		applyStates(content)
	}

	function searchInTree(searchTerm: string, tree: Tree) {
		let namePathPairs: { title: string; slug: string }[] = []
		searchTerm = searchTerm.toLocaleLowerCase()
		for (const obj of tree) {
			if (
				obj.type === 'file' &&
				obj.aliases.some((term) => term.toLocaleLowerCase().includes(searchTerm))
			) {
				namePathPairs.push({ title: obj.title, slug: obj.slug })
				continue
			}

			if (obj.type === 'folder') {
				const nestedPairs = searchInTree(searchTerm, [obj])
				namePathPairs.push(...nestedPairs)
			}
		}

		return namePathPairs
	}

	function autocomplete() {
		if (searchQuery.length < 2) return
		autocompleteLinks = searchInTree(searchQuery, tree)
		popoverState = true
	}
</script>

<header class="text-center type-scale-5"><b>Navigation</b></header>
<hr class="border-surface-700-300" />

<Popover
	bind:open={popoverState}
	positioning={{ placement: 'bottom' }}
	contentBase="card bg-surface-200-800 p-4 space-y-4 max-w-[320px] z-10"
	triggerClasses="w-full"
	autoFocus={false}
	portalled={false}
>
	{#snippet trigger()}
		<input
			type="text"
			name="search"
			id="search"
			class="input"
			placeholder="Search..."
			bind:value={searchQuery}
			oninput={autocomplete}
		/>
	{/snippet}
	{#snippet content()}
		<div class="flex w-full flex-col items-start space-y-2">
			{#each autocompleteLinks as link}
				<a
					class="btn block w-full text-left hover:bg-surface-200-800"
					href={`/pages/${link.slug}`}
					onclick={() => (searchQuery = '')}>{link.title}</a
				>
			{/each}
		</div>
	{/snippet}
</Popover>

<hr class="border-surface-700-300" />
<div class="overflow-auto">
	{#each tree as entry, idx (entry.path)}
		<div>
			{#if tree[idx].type === 'folder'}
				<TreeFolder bind:folder={tree[idx]} {saveExpandedStates} />
			{:else}
				<TreeFile title={tree[idx].title} slug={tree[idx].slug} />
			{/if}
		</div>
	{/each}
</div>
<hr class="border-surface-700-300" />
