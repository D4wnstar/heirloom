<script lang="ts">
	import { Dialog } from '@skeletonlabs/skeleton-svelte'

	interface Props {
		url: string
		caption: string | null
		baseClasses?: string
		width?: string
	}

	let { url, caption, baseClasses, width }: Props = $props()
</script>

<figure class={['py-4 text-center', url && baseClasses]}>
	<Dialog>
		<Dialog.Trigger>
			<img src={url} alt={caption} {width} class="max-h-125 cursor-pointer" />
		</Dialog.Trigger>
		<Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50-950/50" />
		<Dialog.Positioner class="fixed inset-0 z-50 flex justify-center items-center p-4">
			<Dialog.Content class="card bg-surface-100-900 w-full max-w-[80vh] max-h-[80vh] p-4 shadow-xl">
				<figure>
					<img src={url} alt={caption} class="object-contain" />
					{#if caption}
						<hr class="hr my-4 border-surface-500" />
						<figcaption class="text-center type-scale-3">
							{@html caption}  
						</figcaption>
					{/if}
				</figure>
			</Dialog.Content>
		</Dialog.Positioner>
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
