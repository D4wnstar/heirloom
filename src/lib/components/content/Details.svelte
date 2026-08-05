<script lang="ts">
    import type { Detail } from '$lib/converter/remark-heirloom-directives'
    import { Library } from 'lucide-svelte'

    interface Props {
        details: Detail[]
    }

    let { details }: Props = $props()
</script>

<div id="details" class="space-y-2">
    <h3 class="h3"><Library class="inline" /> Details</h3>
    <table class="w-full">
        <tbody class="pre-html">
            {#each details as detail (detail)}
                <tr>
                    {#if detail.type === 'key-value'}
                        <td class="px-1 align-text-top lg:min-w-[6em]">{@html detail.key}</td>
                        <td class="px-1">{@html detail.value}</td>
                    {:else if detail.type === 'header'}
                        <td colspan="2" class="pt-2 text-center">
                            <header class="border-surface-200-800 border-b-[1px] text-lg">
                                {@html detail.header}
                            </header>
                        </td>
                    {:else if detail.type === 'break'}
                        <td colspan="2" class="py-2 text-center"><hr class="hr" /></td>
                    {/if}
                </tr>
            {/each}
        </tbody>
    </table>
</div>
