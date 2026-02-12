<script lang="ts">
	import type { Project } from '$lib/projects';
	import { onDestroy, onMount, tick } from 'svelte';

	export let projects: Project[] = [];
	export let initialId: string | null = null;

	let activeId: string | null = initialId ?? projects[0]?.id ?? null;
	let listboxEl: HTMLDivElement | null = null;
	let scrollbarEl: HTMLDivElement | null = null;
	let scrollRaf = 0;
	let resizeObs: ResizeObserver | null = null;
	let intersectObs: IntersectionObserver | null = null;
	let wheelAccum = 0;
	let wheelResetTimer: ReturnType<typeof setTimeout> | null = null;
	let isDraggingScrollbar = false;
	let dragStartY = 0;
	let dragStartScrollTop = 0;

	let scrollbarThumbTop = 0;
	let scrollbarThumbHeight = 16;

	function getOptionEls(): HTMLButtonElement[] {
		if (!listboxEl) return [];
		return Array.from(listboxEl.querySelectorAll<HTMLButtonElement>('button.opt[data-id]'));
	}

	function getOptionElById(id: string): HTMLButtonElement | undefined {
		return getOptionEls().find((el) => el.dataset.id === id);
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
			updateScrollbarThumb();
		});
	}

	function updateScrollbarThumb() {
		if (!listboxEl) return;

		const { scrollTop, scrollHeight, clientHeight } = listboxEl;
		if (scrollHeight <= clientHeight) {
			scrollbarThumbHeight = 0;
			scrollbarThumbTop = 0;
			return;
		}

		// Track spans the visual overlay scrollbar height with a small inset to match CSS.
		// (Don't use listbox clientHeight here; borders/positioning can make it slightly different,
		// which shows up as uneven top vs bottom padding.)
		const inset = 5;
		const visualTrackHeight = scrollbarEl?.clientHeight ?? clientHeight;
		const trackHeight = Math.max(0, visualTrackHeight - inset * 2);
		const minThumb = 18;
		const h = Math.max(minThumb, (clientHeight / scrollHeight) * trackHeight);
		const maxTop = trackHeight - h;
		const t = (scrollTop / (scrollHeight - clientHeight)) * maxTop;

		scrollbarThumbHeight = h;
		scrollbarThumbTop = inset + (Number.isFinite(t) ? t : 0);
	}

	function onScrollbarPointerDown(e: PointerEvent) {
		if (!listboxEl) return;
		if (scrollbarThumbHeight <= 0) return;

		e.preventDefault();
		e.stopPropagation();

		const inset = 5;
		const track = e.currentTarget as HTMLElement;
		const rect = track.getBoundingClientRect();
		const y = e.clientY - rect.top;

		// Jump so thumb centers on click, then start drag.
		const desiredTop = y - scrollbarThumbHeight / 2;
		const maxTop = rect.height - inset * 2 - scrollbarThumbHeight;
		const clampedTop = Math.max(inset, Math.min(inset + maxTop, desiredTop));

		const ratio = maxTop > 0 ? (clampedTop - inset) / maxTop : 0;
		listboxEl.scrollTop = ratio * (listboxEl.scrollHeight - listboxEl.clientHeight);

		isDraggingScrollbar = true;
		dragStartY = e.clientY;
		dragStartScrollTop = listboxEl.scrollTop;
		track.setPointerCapture(e.pointerId);
		requestUpdateActiveFromCenter();
	}

	function onScrollbarPointerMove(e: PointerEvent) {
		if (!isDraggingScrollbar) return;
		if (!listboxEl) return;
		if (scrollbarThumbHeight <= 0) return;

		e.preventDefault();

		const inset = 5;
		const track = e.currentTarget as HTMLElement;
		const rect = track.getBoundingClientRect();
		const trackHeight = rect.height - inset * 2;
		const maxTop = trackHeight - scrollbarThumbHeight;
		if (maxTop <= 0) return;

		const dy = e.clientY - dragStartY;
		const scrollRange = listboxEl.scrollHeight - listboxEl.clientHeight;
		const scrollDelta = (dy / maxTop) * scrollRange;

		listboxEl.scrollTop = dragStartScrollTop + scrollDelta;
		requestUpdateActiveFromCenter();
	}

	function onScrollbarPointerUp(e: PointerEvent) {
		if (!isDraggingScrollbar) return;
		isDraggingScrollbar = false;
		try {
			(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
		} catch {
			// ignore
		}
	}

	function getSlotStepPx(): number {
		if (!listboxEl) return 56;
		const raw = getComputedStyle(listboxEl).getPropertyValue('--slot-h').trim();
		const n = Number.parseFloat(raw);
		return Number.isFinite(n) && n > 0 ? n : 56;
	}

	function onReelWheel(e: WheelEvent) {
		// Make the reel feel like a slot machine: one "tick" per wheel gesture.
		// Also: always consume the wheel event while hovering the reel so the page
		// doesn't sideways-scroll on trackpads (deltaX) or scroll-chain away.
		if (!listboxEl) return;
		if (projects.length <= 1) return;

		e.preventDefault();
		e.stopPropagation();

		// Trackpads often send diagonal gestures (deltaX + deltaY). Use the dominant axis.
		const dominantDelta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
		wheelAccum += dominantDelta;

		const threshold = 24; // small enough to work on trackpads, big enough to ignore noise
		if (Math.abs(wheelAccum) < threshold) return;

		const dir = wheelAccum > 0 ? 1 : -1;
		wheelAccum = 0;

		const step = getSlotStepPx();
		listboxEl.scrollBy({ top: dir * step, behavior: 'smooth' });
		requestUpdateActiveFromCenter();

		if (wheelResetTimer) clearTimeout(wheelResetTimer);
		wheelResetTimer = setTimeout(() => {
			wheelAccum = 0;
		}, 120);
	}

	async function scrollIdToCenter(id: string, behavior: ScrollBehavior = 'smooth') {
		// Wait for DOM to exist/layout to settle.
		await tick();
		const el = getOptionElById(id);
		el?.scrollIntoView({ block: 'center', behavior });
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
		// Slot-machine behavior:
		// - spin the reel (scroll) and always select the option in the center window.
		// - on mount, center initialId (if provided) without animation.
		void tick().then(async () => {
			if (initialId && projects.some((p) => p.id === initialId)) {
				await scrollIdToCenter(initialId, 'auto');
			}
			requestUpdateActiveFromCenter();
		});

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
		if (wheelResetTimer) clearTimeout(wheelResetTimer);
		wheelResetTimer = null;
	});
</script>

<div class="wrap" aria-label="Project selector">
	<div class="reel" aria-label="Project slot reel">
		<div class="reel-window" aria-hidden="true"></div>
		<div class="reel-shade reel-shade--top" aria-hidden="true"></div>
		<div class="reel-shade reel-shade--bottom" aria-hidden="true"></div>

		<div
			class="listbox"
			bind:this={listboxEl}
			role="listbox"
			aria-label="Project list"
			tabindex="0"
			onkeydown={onListKeyDown}
			onscroll={requestUpdateActiveFromCenter}
			onwheel={onReelWheel}
		>
			{#each projects as p (p.id)}
				<button
					type="button"
					class="opt"
					data-id={p.id}
					role="option"
					aria-selected={p.id === activeId ? 'true' : 'false'}
					onclick={() => void scrollIdToCenter(p.id)}
				>
					<span class="opt-title">{p.name}</span>
				</button>
			{/each}
		</div>

		<!-- Always-visible overlay scrollbar (native scrollbars can be auto-hidden on macOS) -->
		<div
			class="scrollbar"
			aria-hidden="true"
			bind:this={scrollbarEl}
			onpointerdown={onScrollbarPointerDown}
			onpointermove={onScrollbarPointerMove}
			onpointerup={onScrollbarPointerUp}
			onpointercancel={onScrollbarPointerUp}
		>
			<div
				class="scrollbar-thumb"
				style={`height:${scrollbarThumbHeight}px; transform: translateY(${scrollbarThumbTop}px);`}
			></div>
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
		--slot-h: 56px;
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
		/* Fixed height, and never scrollable: clip overflow instead */
		height: var(--selector-h);
		overflow: hidden; /* fallback */
		overflow: clip;
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
		position: relative;
		border-radius: 16px;
		border: 1px solid var(--card-border);
		background: rgba(255, 255, 255, 0.22);
		backdrop-filter: blur(var(--glass-blur)) saturate(1.2);
		-webkit-backdrop-filter: blur(var(--glass-blur)) saturate(1.2);
		box-shadow: 0 18px 50px rgba(11, 18, 32, 0.10);
		padding: calc(var(--selector-h) / 2 - var(--slot-h) / 2) 22px  calc(var(--selector-h) / 2 - var(--slot-h) / 2) 10px;
		height: var(--selector-h);
		overflow-y: scroll;
		scroll-snap-type: y mandatory;
		scroll-snap-stop: always;
		overscroll-behavior: contain;
		overscroll-behavior-x: contain;
		scrollbar-gutter: stable;
		touch-action: pan-y;
		-webkit-overflow-scrolling: touch;
	}

	/* always-visible, stylized scrollbars */
	/* Keep the old look, but render it as an overlay so it's always visible on macOS */
	.listbox {
		scrollbar-width: none;
	}
	.listbox::-webkit-scrollbar {
		width: 0px;
		height: 0px;
	}

	.scrollbar {
		position: absolute;
		right: 10px;
		top: 5px;
		bottom: 5px;
		width: 10px;
		border-radius: 14px;
		border: none;
		background: transparent;
		box-shadow: none;
		z-index: 3;
	}

	.scrollbar-thumb {
		width: 10px;
		border-radius: 14px;
		border: 1px solid rgba(124, 58, 237, 0.30);
		background: rgba(255, 255, 255, 0.14);
		box-shadow:
			inset 0 0 0 1px rgba(255, 255, 255, 0.18),
			0 10px 24px rgba(11, 18, 32, 0.12);
	}

	.scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.22);
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
		padding: 0 10px;
		height: var(--slot-h);
		cursor: pointer;
		display: flex;
		align-items: center;
		scroll-snap-align: center;
		transition:
			background 140ms ease,
			border-color 140ms ease,
			transform 140ms ease,
			filter 140ms ease;
		filter: saturate(0.95);
	}

	.opt:hover {
		background: rgba(255, 255, 255, 0.24);
		border-color: rgba(11, 18, 32, 0.10);
	}

	.opt[aria-selected='true'] {
		background: rgba(124, 58, 237, 0.12);
		border-color: rgba(124, 58, 237, 0.18);
		transform: scale(1.02);
		filter: saturate(1.1);
	}

	.opt-title {
		font-weight: 800;
		color: rgba(11, 18, 32, 0.92);
		font-size: 14px;
		letter-spacing: -0.01em;
	}

	.reel {
		position: relative;
		height: var(--selector-h);
	}

	.reel-window {
		position: absolute;
		left: 8px;
		right: 20px;
		top: 50%;
		transform: translateY(-50%);
		height: var(--slot-h);
		border-radius: 10px;
		border: 1px solid rgba(124, 58, 237, 0.30);
		background: rgba(255, 255, 255, 0.14);
		box-shadow:
			inset 0 0 0 1px rgba(255, 255, 255, 0.18),
			0 10px 24px rgba(11, 18, 32, 0.12);
		pointer-events: none;
	}

	.reel-shade {
		position: absolute;
		left: 0;
		right: 0;
		height: 54px;
		pointer-events: none;
		z-index: 2;
	}

	.reel-shade--top {
		top: 0;
		background: linear-gradient(to bottom, rgba(11, 18, 32, 0.14), rgba(11, 18, 32, 0));
	}

	.reel-shade--bottom {
		bottom: 0;
		background: linear-gradient(to top, rgba(11, 18, 32, 0.14), rgba(11, 18, 32, 0));
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

