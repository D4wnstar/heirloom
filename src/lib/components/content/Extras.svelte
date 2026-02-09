<script lang="ts">
	import type { DetailsData, SidebarImageData } from '$lib/types'
	import Details from './Details.svelte'
	import ImageWithModal from './ImageWithModal.svelte'

	interface Props {
		sidebarImages: SidebarImageData[]
		details: DetailsData[]
	}

	let { sidebarImages, details }: Props = $props()
</script>

{#if sidebarImages.length > 0}
	<div id="sidebar-images" class="space-y-6">
		{#each sidebarImages as img}
			<ImageWithModal url="/api/image/{encodeURIComponent(img.path)}" caption={img.caption} />
		{/each}
	</div>

	<hr class="mb-4 mt-6 border-surface-700-300" />
{/if}
{#if details.length > 0}
	<Details {details} />
	<hr class="mt-4 border-surface-700-300" />
{/if}
