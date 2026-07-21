<script lang="ts">
	import '../app.css'
	import '../prism-laserwave.css'
	import '../katex.css'
	import { AppBar, Dialog, Portal } from '@skeletonlabs/skeleton-svelte'
	import { MenuIcon, XIcon } from 'lucide-svelte'
	import Lightswitch from '$lib/components/utils/Lightswitch.svelte'
	import Navigation from '$lib/components/navigation/Navigation.svelte'

	let { children, data } = $props()
</script>

<AppBar class="bg-surface-100-900">
	<AppBar.Toolbar class="grid-cols-[auto_1fr_auto]">
		<AppBar.Lead>
			<!-- Drawer -->
			<Dialog>
				<Dialog.Trigger class="btn-icon btn-icon-lg hover:preset-tonal [@media(min-width:1200px)]:hidden">
					<MenuIcon />
				</Dialog.Trigger>
				<Portal>
					<Dialog.Backdrop class="bg-surface-50-950/50 fixed inset-0 z-50"></Dialog.Backdrop>
					<Dialog.Positioner class="fixed inset-0 z-50 flex justify-start">
						<Dialog.Content class="card rounded-none bg-surface-100-900 h-screen w-sm space-y-4 p-4 shadow-xl">
							<header class="flex items-center justify-between">
								<Dialog.Title class="text-2xl font-bold">Navigation</Dialog.Title>
								<Dialog.CloseTrigger class="btn-icon btn-icon-lg hover:preset-tonal">
									<XIcon />
								</Dialog.CloseTrigger>
							</header>
							<Navigation tree={data.navTree} />
						</Dialog.Content>
					</Dialog.Positioner>
				</Portal>
			</Dialog>
		</AppBar.Lead>

		<!-- Title -->
		<AppBar.Headline>
			<a href="/" class="text-2xl font-bold">
				{data.projectSettings.title}
			</a>
		</AppBar.Headline>

		<!-- Lightswitch -->
		<AppBar.Trail>
			<Lightswitch />
		</AppBar.Trail>
	</AppBar.Toolbar>
</AppBar>

<div class="p-8 lg:flex">
	<nav
		class="sticky top-4 hidden max-h-[85vh] w-90 space-y-3 self-start [@media(min-width:1200px)]:flex [@media(min-width:1200px)]:flex-col [@media(min-width:1200px)]:gap-1"
	>
		<Navigation tree={data.navTree} />
	</nav>

	{@render children()}
</div>
