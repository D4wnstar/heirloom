<script lang="ts">
	import { Dialog } from '@skeletonlabs/skeleton-svelte'

	interface Props {
		url: string
		caption: string | null
		baseClasses?: string
		width?: string
	}

	let { url, caption, baseClasses, width }: Props = $props()
	let modalState = $state(false)
</script>

<figure class={['py-4 text-center', url && baseClasses]}>
	<Dialog bind:open={modalState}>
		{#snippet trigger()}
			<img src={url} alt={caption} {width} class="max-h-[500px]" />
		{/snippet}
		{#snippet content()}
			<figure
				class="flex max-h-[90vh] max-w-[80vw] flex-col items-center justify-center rounded p-4 bg-surface-100-900"
			>
				<img src={url} alt={caption} class="max-h-[80vh] max-w-[80vw] object-contain" />
				{#if caption}
					<hr class="hr my-4 border-surface-500" />
					<figcaption class="text-center type-scale-3">
						{@html caption}
					</figcaption>
				{/if}
			</figure>
		{/snippet}
	</Dialog>
	{#if caption}
		<figcaption
			class="pre-html mx-auto self-center border-b-2 border-l-0 border-b-surface-500 pb-1"
			style="width: {width}px;"
		>
			{@html caption}
		</figcaption>
	{/if}
</figure>
