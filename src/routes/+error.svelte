<script lang="ts">
    import { page } from '$app/state'
</script>

<main class="flex h-full w-full flex-col items-center">
    <h1 class="h1">:(</h1>
    <p>Something unexpected went wrong when loading this page. Sorry!</p>
    {#if page.status !== -1}
        <p>{page.error?.message}</p>
        <p class="text-sm opacity-50">HTTP Error {page.status}</p>
    {/if}
</main>
