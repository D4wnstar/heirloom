<script lang="ts">
	import Breadcrumbs from '$lib/components/content/Breadcrumbs.svelte'
	import Extras from '$lib/components/content/Extras.svelte'
	import ImageWithModal from '$lib/components/content/ImageWithModal.svelte'
	import { mount } from 'svelte'

	// This file and the front page one should always be synced

	let { data } = $props()

	let headTitle = $derived(`${data.title} - ${data.settings.title}`)

	// Get breadcrumbs while respecting alt titles
	let breadcrumbs = $derived.by(() => {
		const crumbs = data.path.split('/')
		crumbs[crumbs.length - 1] = data.title
		return crumbs
	})

	// Store references to event listeners for cleanup
	let eventListeners: Array<{ element: HTMLElement; handler: EventListener }> = []

	function initializeCollapsibleCallouts() {
		// Add event listeners to all collapsible callouts
		document.querySelectorAll('.callout.is-collapsible').forEach((callout) => {
			const title = callout.querySelector('.callout-title') as HTMLElement | null
			const content = callout.querySelector('.callout-content') as HTMLElement | null
			const fold = callout.querySelector('.callout-fold') as HTMLElement | null
			const svg = fold?.querySelector('svg') as SVGElement | null

			if (title && content) {
				content.style.display = callout.classList.contains('is-collapsed') ? 'none' : 'block'

				const clickHandler: EventListener = () => {
					callout.classList.toggle('is-collapsed')

					const isNowCollapsed = callout.classList.contains('is-collapsed')
					content.style.display = isNowCollapsed ? 'none' : 'block'

					// Rotate SVG icon if it exists
					if (svg) {
						svg.style.transform = isNowCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)'
					}
				}

				// Store event listener reference for cleanup
				eventListeners.push({ element: title, handler: clickHandler })
				title.addEventListener('click', clickHandler)
			}
		})
	}

	function initializeImageModals() {
		document.querySelectorAll('#content img').forEach((el) => {
			const img = el as HTMLImageElement
			const url = img.src
			const caption = img.getAttribute('data-caption') ?? ''
			const classes = img.className ?? undefined
			const width = img.getAttribute('width') ?? undefined

			// Check if image already has a modal wrapper to avoid duplication
			const parent = img.parentNode as Element | null
			if (parent?.classList?.contains('image-with-modal-wrapper')) {
				return
			}

			// Create a temporary element and mount the component
			const tempContainer = document.createElement('div')
			mount(ImageWithModal, {
				target: tempContainer,
				props: {
					url,
					caption,
					baseClasses: classes,
					width
				}
			})

			// Replace the image with the component
			const fragment = document.createDocumentFragment()
			while (tempContainer.firstChild) {
				fragment.appendChild(tempContainer.firstChild)
			}
			img.parentNode?.replaceChild(fragment, img)
		})
	}

	// Update page content every time it changes
	$effect(() => {
		data.content
		initializeCollapsibleCallouts()
		initializeImageModals()
		//@ts-expect-error provided by the global mermaid script
		mermaid.run()

		// Clean up event listeners each effect and when component unmounts
		return () => {
			eventListeners.forEach(({ element, handler }) =>
				element.removeEventListener('click', handler)
			)
			eventListeners = []
		}
	})
</script>

<svelte:head>
	<title>{headTitle}</title>
</svelte:head>

<main class="mx-auto flex max-w-3xl flex-col space-y-6 lg:grow lg:px-8">
	<div class="hidden w-full overflow-y-hidden overflow-x-scroll lg:block">
		<Breadcrumbs {breadcrumbs} />
	</div>
	<h1 class="h1 text-center">{data.title}</h1>
	<hr class="hr" />
	<article id="content" class="pre-html space-y-4">
		{#key data.content}
			{@html data.content}
		{/key}
	</article>
	<hr class="hr" />
</main>

<!-- <aside class="hidden w-[360px] [@media(min-width:1400px)]:block">
	{#if data.sidebarImages.length > 0 || data.details.length > 0}
		<Extras sidebarImages={data.sidebarImages} details={data.details} />
	{/if}
</aside> -->
