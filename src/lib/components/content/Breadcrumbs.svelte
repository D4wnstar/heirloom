<script lang="ts">
    interface Props {
        breadcrumbs: string[]
        classes?: string
    }

    let { breadcrumbs, classes = '' }: Props = $props()
</script>

<ol id="breadcrumbs" class="flex items-center gap-4 space-y-0 {classes} overflow-hidden">
    {#each breadcrumbs.slice(0, -1) as crumb}
        <li class="line-clamp-1 opacity-40">{crumb}</li>
        <li class="opacity-30" aria-hidden={true}>&rsaquo;</li>
    {/each}

    <li class="line-clamp-1 opacity-40">{breadcrumbs[breadcrumbs.length - 1]}</li>
</ol>
