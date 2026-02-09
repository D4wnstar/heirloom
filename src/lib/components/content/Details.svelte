<script lang="ts">
	import type { DetailsData } from '$lib/types'
	import { Library } from 'lucide-svelte'

	interface Props {
		details: DetailsData[]
	}

	let { details }: Props = $props()
</script>

<div id="details" class="space-y-2">
	<h3 class="h3"><Library class="inline" /> Details</h3>
	<table class="w-full">
		<tbody class="pre-html">
			{#each details as detail}
				<tr>
					{#if detail.value}
						<td class="px-1 align-text-top lg:min-w-[6em]">{@html detail.key}</td>
						<td class="px-1">{@html detail.value}</td>
					{:else if detail.key}
						<td colspan="2" class="pt-2 text-center">
							<header class="text-lg">{@html detail.key}</header>
							<hr class="mt-1 pb-2 border-surface-700-300" />
						</td>
					{:else}
						<td colspan="2" class="py-2 text-center"><hr class="hr" /></td>
					{/if}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
