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
        <Dialog.Backdrop class="bg-surface-50-950/50 fixed inset-0 z-50" />
        <Dialog.Positioner class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Dialog.Content
                class="card bg-surface-100-900 max-h-[80vh] w-full max-w-[80vh] p-4 shadow-xl"
            >
                <figure>
                    <img src={url} alt={caption} class="object-contain" />
                    {#if caption}
                        <hr class="hr border-surface-500 my-4" />
                        <figcaption class="type-scale-3 text-center">
                            {@html caption}
                        </figcaption>
                    {/if}
                </figure>
            </Dialog.Content>
        </Dialog.Positioner>
    </Dialog>
    {#if caption}
        <figcaption
            class="pre-html border-b-surface-500 mx-auto self-center border-b-2 border-l-0 pb-1"
            style="width: {width}px;"
        >
            {@html caption}
        </figcaption>
    {/if}
</figure>
