<script lang="ts">
    import { Switch } from '@skeletonlabs/skeleton-svelte'
    import { MoonIcon, SunIcon } from 'lucide-svelte'
    import { onMount } from 'svelte'

    let checked = $state(true)

    /** Flip light/dark mode on toggle. */
    function onCheckedChange(newState: boolean) {
        checked = newState
        document.documentElement.classList.toggle('dark', newState)
        localStorage.setItem('darkMode', String(newState))
    }

    onMount(() => {
        // Initialize from localStorage (need browser so in onMount it goes)
        checked = (localStorage.getItem('darkMode') ?? 'true') === 'true'
    })
</script>

<Switch {checked} onCheckedChange={(e) => onCheckedChange(e.checked)}>
    <Switch.Control
        ><Switch.Thumb>
            <Switch.Context>
                {#snippet children(switch_)}
                    {#if switch_().checked}
                        <MoonIcon class="size-3"></MoonIcon>
                    {:else}
                        <SunIcon class="size-3"></SunIcon>
                    {/if}
                {/snippet}
            </Switch.Context>
        </Switch.Thumb></Switch.Control
    >
    <Switch.HiddenInput />
</Switch>
