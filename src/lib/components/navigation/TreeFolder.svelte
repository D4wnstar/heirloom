<script lang="ts">
	import { type Folder } from '$lib/notes'
	import { ChevronDown } from 'lucide-svelte'
	import TreeFile from './TreeFile.svelte'
	import TreeFolder from './TreeFolder.svelte'
	import { slide } from 'svelte/transition'

	interface Props {
		folder: Folder
		saveExpandedStates: () => void
	}
	let { folder = $bindable(), saveExpandedStates }: Props = $props()

	function toggle() {
		folder.expanded = !folder.expanded
		saveExpandedStates()
	}
</script>

<button
	class="group flex w-full flex-row items-center gap-2 rounded-none py-1 duration-200 hover:!bg-opacity-80 hover:pl-2 hover:text-primary-800-200 hover:bg-surface-50-950"
	onclick={toggle}
	aria-expanded={folder.expanded}
	aria-controls={`folder-${folder.path}`}
>
	<ChevronDown
		class="min-w-8 duration-200 group-hover:opacity-100 {folder.expanded
			? 'rotate-0'
			: '-rotate-90 opacity-50'}"
	/>
	<span class="grow text-left">{folder.title}</span>
</button>

{#if folder.expanded}
	<ul transition:slide={{ duration: 300 }} class="pl-1" id={`folder-${folder.path}`}>
		{#each folder.children as child}
			<li class="pl-1">
				{#if child.type === 'folder'}
					<TreeFolder folder={child} {saveExpandedStates} />
				{:else}
					<TreeFile title={child.title} route={child.route} />
				{/if}
			</li>
		{/each}
	</ul>
{/if}
