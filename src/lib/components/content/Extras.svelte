<script lang="ts">
    import type { Detail, ImageData } from '$lib/converter/remark-heirloom-directives'
    import Details from './Details.svelte'
    import ImageWithModal from './ImageWithModal.svelte'

    interface Props {
        sidebarImages: ImageData[]
        details: Detail[]
    }

    let { sidebarImages, details }: Props = $props()
</script>

{#if sidebarImages.length > 0}
    <div id="sidebar-images" class="space-y-6">
        {#each sidebarImages as img}
            <ImageWithModal url={img.url} caption={img.caption} />
        {/each}
    </div>

    <hr class="border-surface-700-300 mt-6 mb-4" />
{/if}
{#if details.length > 0}
    <Details {details} />
    <hr class="border-surface-700-300 mt-4" />
{/if}
