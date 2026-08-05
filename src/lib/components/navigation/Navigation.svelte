<script lang="ts">
	import TreeFile from './TreeFile.svelte'
	import TreeFolder from './TreeFolder.svelte'
	import { goto } from '$app/navigation'
	import { onMount } from 'svelte'
	import { browser } from '$app/environment'
	import type { Tree, File } from '$lib/types'
	import { LSVAR_NAVMENU_STATE } from '$lib/utils'

	let { tree }: { tree: Tree } = $props()

	let searchQuery = $state('')
	let results: { title: string; slug: string }[] = $state([])
	let open = $state(false)
    /** Tracks which suggestion to visually highlight for keyboard use */
	let highlighted = $state(-1)
	let inputEl: HTMLInputElement | undefined
	let optionEls: (HTMLAnchorElement | undefined)[] = []

	// Open/closed folder state lives here, keyed by folder path
    // Persisted to localStorage on change for persisten navbar state
    // across full reloads/navigations
	let expanded = $state<Record<string, boolean>>({})

	function isExpanded(path: string) {
		return expanded[path] ?? false
	}

	function toggle(path: string) {
		expanded[path] = !isExpanded(path)
		saveExpandedStates()
	}

	function saveExpandedStates() {
		if (!browser) return
		localStorage.setItem(LSVAR_NAVMENU_STATE, JSON.stringify(expanded))
	}

	onMount(() => {
		if (!browser) return
		const saved = localStorage.getItem(LSVAR_NAVMENU_STATE)
		if (!saved) return
		try {
			expanded = JSON.parse(saved)
		} catch {
			// malformed saved state, ignore
			console.warn('Navigation open/closed state was malformed, resetting...')
		}
	})

	/* SEARCH LOGIC */
	/**
     * Score a search token against some text. Returns -1 if there is
     * no match, otherwise a score that rewards matches at the start of the text or
     * at word boundaries, and rewards near-exact matches above all.
     * Scores are somewhat arbitrary and there's no real theory behind them besides
     * "they work well". This function does not do any preprocessing and is
     * therefore case-sensitive.
    */
	function tokenScore(text: string, token: string): number {
		const idx = text.indexOf(token)
		if (idx === -1) return -1
		if (text === token) return 60 // exact match
		if (idx === 0) return 45 // text starts with the term
		const prev = text[idx - 1]
		// Match at the start of a word or after separators ranks higher
        // because it's kind of like an exact match of a part of the term
        // Searching "eng" should prioritize "Diesel engine" over "Penguin"
        // since the user was probably trying to type about "engine"
		if (prev === ' ' || prev === '-' || prev === '_' || prev === '(' || prev === '/' || prev === '.') {
			return 30
		}
		return 15
	}


    /**
     * Score a `File` against all search tokens. Title matches are weighted more
     * heavily than alias matches because they are considered to be the "main" search
     * term. For the search to succeed, all tokens must match somewhere (title or an
     * alias). The search is case-insensitive.
     */
	function scoreFile(file: File, tokens: string[]): number {
		const texts: { text: string; weight: number }[] = [
			{ text: file.title.toLocaleLowerCase(), weight: 3 },
			...file.aliases.map((alias) => ({ text: alias.toLocaleLowerCase(), weight: 1 }))
		]

        // Score each token against all texts and count only the highest score
		let total = 0
		for (const token of tokens) {
			let best = -1
			for (const { text, weight } of texts) {
				const score = tokenScore(text, token)
				if (score > -1) {
					const weighted = score * weight
					if (weighted > best) best = weighted
				}
			}
            
            // If any token fails to match, short circuit and fail
			if (best === -1) return -1

			total += best
		}

		return total
	}

    /**
     * Recursively run a search with `searchTerm` in `tree`. The term is
     * split into tokens at whitespace so that individual words can be
     * matched separately. Returns at most `maxReturned` suggestions
     * (default 8).
     */
	function searchInTree(searchTerm: string, tree: Tree, maxReturned: number = 8): { title: string; slug: string }[] {
		const tokens = searchTerm
			.trim()
			.split(/\s+/)
			.filter(Boolean)
		if (tokens.length === 0) return []

		const scored: { title: string; slug: string; score: number }[] = []

        // For each element, score it if it's a File or recurse if it's a Folder
		const visit = (nodes: Tree) => {
			for (const node of nodes) {
				if (node.type === 'folder') {
					visit(node.children)
				} else {
					const score = scoreFile(node, tokens)
					if (score > -1) {
                        scored.push({ title: node.title, slug: node.slug, score })
                    }
				}
			}
		}
        
		visit(tree)

        // Sort lexicographically by score first, alphabetically second
		scored.sort(
			(a, b) =>
                b.score - a.score || a.title.toLocaleLowerCase().localeCompare(b.title.toLocaleLowerCase())
		)

		return scored.slice(0, maxReturned)
	}

    /** UI INTERACTION */
	function setQueryAndSearch(value: string) {
		searchQuery = value
		highlighted = -1
		runSearch()
	}

	function runSearch() {
		const query = searchQuery.trim()

        // Reset search state when the query is emptied
		if (query.length === 0) {
			resetSearch()
			return
		}
		
        results = searchInTree(query.toLocaleLowerCase(), tree)
		open = true
	}

	function openIfResults() {
		// Clicking/focusing the bar with an existing query reopens the suggestions
		if (searchQuery.trim().length > 0 && results.length > 0) open = true
	}

	function resetSearch() {
		searchQuery = ''
		results = []
		open = false
		highlighted = -1
	}

	function selectSuggestion(index: number) {
		const link = results[index]
		if (!link) return
		resetSearch()
		goto(`/pages/${link.slug}`)
	}

    /** Handle keyboard controls. */
	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			open = false
			highlighted = -1
			inputEl?.blur()
			return
		}

		if (!open || results.length === 0) return
        
		if (event.key === 'ArrowDown') {
			event.preventDefault()
			highlighted = (highlighted + 1) % results.length // Modulo to wrap-around
		} else if (event.key === 'ArrowUp') {
			event.preventDefault()
			highlighted = highlighted <= 0 ? results.length - 1 : highlighted - 1
		} else if (event.key === 'Enter') {
			event.preventDefault()
			const index = highlighted >= 0 ? highlighted : 0
			if (results[index]) selectSuggestion(index)
		}
	}

	// Keeps a reference to each suggestion <a> so it can be scrolled into view.
	function rememberOption(node: HTMLAnchorElement, index: number) {
		optionEls[index] = node
	}

	/** Close the dropdown when interacting outside the search box. */
	function clickOutside(node: HTMLElement, onOutside: () => void) {
		function onPointerDown(event: PointerEvent) {
			if (!node.contains(event.target as Node)) onOutside()
		}

		document.addEventListener('pointerdown', onPointerDown, true)

		return {
			destroy() {
				document.removeEventListener('pointerdown', onPointerDown, true)
			}
		}
	}

    // Keep the highlighted option visible when navigating with the keyboard.
	$effect(() => {
		if (highlighted >= 0 && optionEls[highlighted]) {
			optionEls[highlighted]?.scrollIntoView({ block: 'nearest' })
		}
	})
</script>

<div class="relative w-full" use:clickOutside={() => open = false}>
	<input
		bind:this={inputEl}
		type="text"
		name="search"
		id="search"
		class="input"
		placeholder="Search..."
		value={searchQuery}
		oninput={(event) => setQueryAndSearch(event.currentTarget.value)}
		onfocus={openIfResults}
		onkeydown={onKeydown}
		autocomplete="off"
		spellcheck="false"
		role="combobox"
		aria-expanded={open && results.length > 0}
		aria-controls="search-results"
		aria-autocomplete="list"
	/>

	{#if open && results.length > 0}
		<div
			id="search-results"
			role="listbox"
			class="card bg-surface-100-900 absolute inset-x-0 z-50 mt-2 overflow-y-auto p-2 shadow-xl"
		>
			<ul class="flex w-full flex-col">
				{#each results as link, index (link.slug)}
                    <li>
                        <a
                            use:rememberOption={index}
                            href={`/pages/${link.slug}`}
                            class="btn {index === highlighted ? 'preset-tonal' : 'hover:preset-tonal'} block w-full text-left"
                            onclick={(event) => {
                                event.preventDefault()
                                selectSuggestion(index)
                            }}
                            onmouseenter={() => (highlighted = index)}
                            role="option"
                            aria-selected={index === highlighted}
                        >
                            {link.title}
                        </a>
                    </li>
				{/each}
			</ul>
		</div>
	{/if}
</div>

<hr class="border-surface-700-300" />
<div class="overflow-auto">
	{#each tree as node (node.path)}
		<div>
			{#if node.type === 'folder'}
				<TreeFolder
					{...node}
					expanded={isExpanded(node.path)}
					isExpanded={isExpanded}
					toggle={toggle}
				/>
			{:else}
				<TreeFile {...node} />
			{/if}
		</div>
	{/each}
</div>
<hr class="border-surface-700-300" />
