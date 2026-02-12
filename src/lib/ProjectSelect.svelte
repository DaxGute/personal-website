<script lang="ts">
	import type { Project } from '$lib/projects';
	import { onDestroy, onMount, tick } from 'svelte';

	export let projects: Project[] = [];
	export let initialId: string | null = null;

	let activeId: string | null = initialId ?? projects[0]?.id ?? null;
	let listboxEl: HTMLDivElement | null = null;
	let scrollRaf = 0;
	let resizeObs: ResizeObserver | null = null;
	let intersectObs: IntersectionObserver | null = null;

	function getOptionEls(): HTMLButtonElement[] {
		if (!listboxEl) return [];
		return Array.from(listboxEl.querySelectorAll<HTMLButtonElement>('button.opt[data-id]'));
	}

	function updateActiveFromCenter() {
		if (!listboxEl) return;
		const opts = getOptionEls();
		if (opts.length === 0) return;

		const listRect = listboxEl.getBoundingClientRect();
		const centerY = listRect.top + listRect.height / 2;

		let bestId: string | null = null;
		let bestDist = Number.POSITIVE_INFINITY;

		for (const el of opts) {
			const r = el.getBoundingClientRect();
			const cy = r.top + r.height / 2;
			const d = Math.abs(cy - centerY);
			if (d < bestDist) {
				bestDist = d;
				bestId = el.dataset.id ?? null;
			}
		}

		if (bestId && bestId !== activeId) activeId = bestId;
	}

	function requestUpdateActiveFromCenter() {
		if (scrollRaf) cancelAnimationFrame(scrollRaf);
		scrollRaf = requestAnimationFrame(() => {
			scrollRaf = 0;
			updateActiveFromCenter();
		});
	}

	async function scrollIdToCenter(id: string) {
		// Wait for DOM to exist.
		await tick();
		const el = listboxEl?.querySelector<HTMLButtonElement>(`button.opt[data-id="${CSS.escape(id)}"]`);
		el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
	}

	$: {
		// Keep selection valid if the list changes.
		if (projects.length === 0) activeId = null;
		else if (!activeId || !projects.some((p) => p.id === activeId)) activeId = projects[0]?.id ?? null;
	}

	$: active = projects.find((p) => p.id === activeId) ?? null;

	function selectByIndex(idx: number) {
		if (projects.length === 0) return;
		const i = Math.max(0, Math.min(projects.length - 1, idx));
		const id = projects[i]?.id;
		if (id) void scrollIdToCenter(id);
	}

	function onListKeyDown(e: KeyboardEvent) {
		if (projects.length === 0) return;
		const idx = Math.max(
			0,
			projects.findIndex((p) => p.id === activeId)
		);

		if (e.key === 'ArrowDown') {
			e.preventDefault();
			selectByIndex(idx + 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selectByIndex(idx - 1);
		} else if (e.key === 'Home') {
			e.preventDefault();
			selectByIndex(0);
		} else if (e.key === 'End') {
			e.preventDefault();
			selectByIndex(projects.length - 1);
		}
	}

	onMount(() => {
		// Set initial selection based on what's visually centered (after first paint).
		void tick().then(requestUpdateActiveFromCenter);

		if (typeof ResizeObserver !== 'undefined') {
			resizeObs = new ResizeObserver(() => requestUpdateActiveFromCenter());
			if (listboxEl) resizeObs.observe(listboxEl);
		}

		if (typeof IntersectionObserver !== 'undefined') {
			intersectObs = new IntersectionObserver(
				(entries) => {
					if (entries.some((e) => e.isIntersecting)) requestUpdateActiveFromCenter();
				},
				{ threshold: 0.15 }
			);
			if (listboxEl) intersectObs.observe(listboxEl);
		}

		const onWinResize = () => requestUpdateActiveFromCenter();
		window.addEventListener('resize', onWinResize, { passive: true });

		return () => {
			window.removeEventListener('resize', onWinResize);
		};
	});

	onDestroy(() => {
		if (scrollRaf) cancelAnimationFrame(scrollRaf);
		resizeObs?.disconnect();
		resizeObs = null;
		intersectObs?.disconnect();
		intersectObs = null;
	});
</script>

<div class="wrap" aria-label="Project selector">
	<div class="list">
		<div
			class="listbox"
			bind:this={listboxEl}
			role="listbox"
			aria-label="Project list"
			tabindex="0"
			onkeydown={onListKeyDown}
			onscroll={requestUpdateActiveFromCenter}
		>
			{#each projects as p (p.id)}
				<button
					type="button"
					class="opt"
					data-id={p.id}
					role="option"
					aria-selected={p.id === activeId ? 'true' : 'false'}
					onclick={() => {
						void scrollIdToCenter(p.id);
						requestUpdateActiveFromCenter();
					}}
				>
					<span class="opt-title">{p.name}</span>
					<span class="opt-sub">{p.blurb}</span>
				</button>
			{/each}
		</div>
	</div>

	<div class="desc" aria-live="polite">
		{#if active}
			<h2 class="desc-title">{active.name}</h2>
			<p class="desc-blurb">{active.blurb}</p>

			<p class="desc-body">{active.description}</p>

			{#if active.highlights?.length}
				<ul class="desc-list" aria-label="Project highlights">
					{#each active.highlights as h (h)}
						<li>{h}</li>
					{/each}
				</ul>
			{/if}

			{#if active.tech?.length}
				<div class="chips" aria-label="Tech stack">
					{#each active.tech as t (t)}
						<span class="chip">{t}</span>
					{/each}
				</div>
			{/if}

			{#if active.links?.length}
				<div class="links" aria-label="Project links">
					{#each active.links as link (link.href)}
						<a class="link" href={link.href} target="_blank" rel="noreferrer">
							{link.label}
						</a>
					{/each}
				</div>
			{/if}
		{:else}
			<p class="desc-empty">Add some projects to see details here.</p>
		{/if}
	</div>
</div>

<style>
	.wrap {
		display: grid;
		grid-template-columns: 280px 1fr;
		gap: 16px;
		align-items: stretch;
		--selector-h: 240px;
	}

	.desc {
		border-radius: 16px;
		border: 1px solid rgba(11, 18, 32, 0.14);
		background:
			linear-gradient(135deg, rgba(124, 58, 237, 0.12), rgba(34, 211, 238, 0.08)),
			rgba(255, 255, 255, 0.28);
		backdrop-filter: blur(var(--glass-blur)) saturate(1.25);
		-webkit-backdrop-filter: blur(var(--glass-blur)) saturate(1.25);
		box-shadow: 0 18px 50px rgba(11, 18, 32, 0.12);
		padding: 14px 14px;
		height: var(--selector-h);
		overflow: auto;
	}

	.desc-title {
		margin: 0 0 6px;
		font-size: 18px;
		letter-spacing: -0.02em;
	}

	.desc-blurb {
		margin: 0 0 10px;
		color: rgba(11, 18, 32, 0.78);
		font-weight: 650;
		line-height: 1.35;
	}

	.desc-body {
		margin: 0 0 10px;
		color: var(--muted);
		line-height: 1.6;
	}

	.desc-list {
		margin: 0 0 10px;
		padding-left: 18px;
		color: rgba(11, 18, 32, 0.78);
		line-height: 1.5;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin: 0 0 10px;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		height: 26px;
		padding: 0 10px;
		border-radius: 999px;
		border: 1px solid rgba(11, 18, 32, 0.12);
		background: rgba(255, 255, 255, 0.34);
		color: rgba(11, 18, 32, 0.78);
		font-size: 12px;
		font-weight: 650;
	}

	.links {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
	}

	.link {
		display: inline-flex;
		align-items: center;
		height: 28px;
		padding: 0 10px;
		border-radius: 10px;
		border: 1px solid rgba(11, 18, 32, 0.14);
		background: rgba(255, 255, 255, 0.32);
		text-decoration: none;
		font-weight: 700;
		color: rgba(11, 18, 32, 0.86);
		transition:
			transform 140ms ease,
			background 140ms ease,
			border-color 140ms ease;
	}

	.link:hover {
		transform: translateY(-1px);
		background: rgba(255, 255, 255, 0.42);
		border-color: rgba(11, 18, 32, 0.18);
	}

	.link:focus-visible {
		outline: 3px solid rgba(124, 58, 237, 0.25);
		outline-offset: 2px;
	}

	.listbox {
		border-radius: 16px;
		border: 1px solid var(--card-border);
		background: rgba(255, 255, 255, 0.22);
		backdrop-filter: blur(var(--glass-blur)) saturate(1.2);
		-webkit-backdrop-filter: blur(var(--glass-blur)) saturate(1.2);
		box-shadow: 0 18px 50px rgba(11, 18, 32, 0.10);
		padding: 8px;
		height: var(--selector-h);
		overflow-y: auto;
		scroll-snap-type: y proximity;
	}

	/* keep scrollbars subtle */
	.listbox {
		scrollbar-width: thin;
		scrollbar-color: rgba(11, 18, 32, 0.22) transparent;
	}
	.listbox::-webkit-scrollbar {
		width: 10px;
	}
	.listbox::-webkit-scrollbar-thumb {
		background: rgba(11, 18, 32, 0.18);
		border-radius: 999px;
		border: 3px solid transparent;
		background-clip: padding-box;
	}

	.listbox:focus-visible {
		outline: 3px solid rgba(124, 58, 237, 0.25);
		outline-offset: 2px;
	}

	.opt {
		width: 100%;
		text-align: left;
		appearance: none;
		border: 1px solid transparent;
		background: transparent;
		border-radius: 12px;
		padding: 10px 10px;
		cursor: pointer;
		display: grid;
		gap: 4px;
		scroll-snap-align: center;
		transition:
			background 140ms ease,
			border-color 140ms ease,
			transform 140ms ease;
	}

	.opt:hover {
		background: rgba(255, 255, 255, 0.24);
		border-color: rgba(11, 18, 32, 0.10);
	}

	.opt[aria-selected='true'] {
		background: rgba(124, 58, 237, 0.12);
		border-color: rgba(124, 58, 237, 0.18);
	}

	.opt-title {
		font-weight: 800;
		color: rgba(11, 18, 32, 0.92);
		font-size: 13px;
	}

	.opt-sub {
		color: rgba(11, 18, 32, 0.62);
		font-size: 12px;
		line-height: 1.3;
	}

	.desc-empty {
		margin: 0;
		color: var(--muted);
	}

	@media (max-width: 760px) {
		.wrap {
			grid-template-columns: 1fr;
		}
	}
</style>

