<script lang="ts">
	import { Minus } from 'lucide-svelte'

	let { title, slug }: { title: string; slug: string } = $props()
</script>

<a href={`/pages/${slug}`}>
	<button
		class="group flex w-full flex-row items-center gap-2 py-1 duration-200 hover:!bg-opacity-80 hover:pl-2 hover:text-primary-800-200 hover:bg-surface-50-950 active:scale-95"
	>
		<Minus size="18" class="min-w-8 opacity-50 duration-200 group-hover:opacity-100" />
		<span class="grow text-left">{title}</span>
	</button>
</a>
