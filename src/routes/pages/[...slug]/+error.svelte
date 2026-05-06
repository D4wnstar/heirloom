<script lang="ts">
	import { page } from '$app/state'
</script>

<main class="flex h-full w-full flex-col items-center space-y-2">
	<h1 class="h1">Missing page</h1>
	<p>This page has not been written yet!</p>
	{#if page.error?.message}
		<small class="block pt-2 opacity-50">Status: {page.status}. {page.error.message}</small>
	{/if}
</main>
