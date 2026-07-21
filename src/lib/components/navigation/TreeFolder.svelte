<script lang="ts">
	import type { Tree } from '$lib/types'
	import { ChevronDown } from 'lucide-svelte'
	import TreeFile from './TreeFile.svelte'
	import TreeFolder from './TreeFolder.svelte'
	import { slide } from 'svelte/transition'

	interface Props {
		title: string
		path: string
		expanded: boolean
		children: Tree
		saveExpandedStates: () => void
	}
	let { title, path, expanded = $bindable(), children, saveExpandedStates }: Props = $props()

	function toggle() {
		expanded = !expanded
		saveExpandedStates()
	}
</script>

<button
	class="group hover:bg-opacity-80! hover:text-primary-800-200 hover:bg-surface-50-950 flex w-full flex-row items-center gap-2 rounded-none py-1 duration-200 hover:pl-2"
	onclick={toggle}
	aria-expanded={expanded}
	aria-controls={`folder-${path}`}
>
	<ChevronDown
		class="min-w-8 duration-200 group-hover:opacity-100 {expanded
			? 'rotate-0'
			: '-rotate-90 opacity-50'}"
	/>
	<span class="grow text-left">{title}</span>
</button>

{#if expanded}
	<ul transition:slide={{ duration: 300 }} class="pl-1" id={`folder-${path}`}>
		{#each children as child (child.path)}
			<li class="pl-1">
				{#if child.type === 'folder'}
					<TreeFolder {...child} {saveExpandedStates} />
				{:else}
					<TreeFile {...child} />
				{/if}
			</li>
		{/each}
	</ul>
{/if}
