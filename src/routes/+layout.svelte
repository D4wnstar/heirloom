<script lang="ts">
	import '../app.css'
	import '../prism-laserwave.css'
	import '../katex.css'
	import { AppBar, Modal } from '@skeletonlabs/skeleton-svelte'
	import { Menu, X } from 'lucide-svelte'
	import Lightswitch from '$lib/components/utils/Lightswitch.svelte'
	import Navigation from '$lib/components/navigation/Navigation.svelte'

	let { children, data } = $props()

	let drawerState = $state(false)

	const drawerOpen = () => (drawerState = true)
	const drawerClose = () => (drawerState = false)
</script>

<Modal
	bind:open={drawerState}
	positionerJustify="justify-start"
	positionerAlign=""
	positionerPadding=""
	contentBase="h-screen shadow-xl w-screen bg-surface-100-900 overflow-auto"
	transitionsPositionerIn={{ x: -480, duration: 200 }}
	transitionsPositionerOut={{ x: -480, duration: 200 }}
>
	{#snippet content()}
		<div class="flex flex-col space-y-4 p-4">
			<button class="btn-icon-lg self-start" onclick={drawerClose}>
				<X />
			</button>
			<Navigation tree={data.navTree} />
		</div>
	{/snippet}
</Modal>

<AppBar
	leadClasses="flex items-center"
	trailClasses="flex items-center"
	centerClasses="flex justify-center w-full"
>
	{#snippet lead()}
		<button class="btn-icon [@media(min-width:1200px)]:hidden" onclick={drawerOpen}>
			<Menu />
		</button>
		<a href="/">
			<strong class="text-primary-950-50 type-scale-5">{data.projectSettings.title}</strong>
		</a>
	{/snippet}
	{#snippet trail()}
		<Lightswitch />
	{/snippet}
</AppBar>

<div class="p-8 lg:flex">
	<nav
		class="sticky top-4 hidden max-h-[85vh] w-[360px] space-y-3 self-start [@media(min-width:1200px)]:flex [@media(min-width:1200px)]:flex-col [@media(min-width:1200px)]:gap-1"
	>
		<Navigation tree={data.navTree} />
	</nav>

	{@render children()}
</div>
