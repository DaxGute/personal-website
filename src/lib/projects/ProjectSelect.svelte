<script lang="ts">
	import InfoCard from '$lib/InfoCard.svelte';
	import type { Project } from '$lib/projects/projects';
	import { onDestroy, onMount, tick } from 'svelte';
	import { fly } from 'svelte/transition';
	import { cubicOut, cubicIn } from 'svelte/easing';
	import confcapLogo from '$lib/assets/project/confcap_logo.png';
	import kbkLogo from '$lib/assets/project/kbk_logo.png';
	import raqiLogo from '$lib/assets/project/raqi_logo.png';

	export let projects: Project[] = [];
	export let initialId: string | null = null;

	let activeId: string | null = initialId ?? projects[0]?.id ?? null;
	let listboxEl: HTMLDivElement | null = null;
	let scrollbarEl: HTMLDivElement | null = null;
	let scrollRaf = 0;
	let resizeObs: ResizeObserver | null = null;
	let intersectObs: IntersectionObserver | null = null;
	let viewportFadeObs: IntersectionObserver | null = null;
	let wrapEl: HTMLDivElement | null = null;
	let reelEl: HTMLDivElement | null = null;
	let descEl: HTMLDivElement | null = null;
	let reelViewportRevealed = false;
	let descViewportRevealed = false;
	let viewportFadeMode = false;
	let wheelAccum = 0;
	let wheelResetTimer: ReturnType<typeof setTimeout> | null = null;
	let wheelLockUntil = 0;
	let isDraggingScrollbar = false;
	let dragStartY = 0;
	let dragStartScrollTop = 0;
	let descDir: 1 | -1 = 1;
	let lastActiveId: string | null = null;

	let scrollbarThumbTop = 0;
	let scrollbarThumbHeight = 16;

	function prefersReducedMotion() {
		return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	function elIntersectsViewport(el: HTMLElement | null) {
		if (!el) return false;
		const r = el.getBoundingClientRect();
		const vw = window.innerWidth;
		const vh = window.innerHeight;
		return (
			r.width > 0 &&
			r.height > 0 &&
			r.bottom > 0 &&
			r.right > 0 &&
			r.top < vh &&
			r.left < vw
		);
	}

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

	function wheelDominantPx(e: WheelEvent): number {
		// Normalize WheelEvent deltas to "pixel-ish" units across devices.
		// - deltaMode 0: pixels
		// - deltaMode 1: lines (approx. 16px per line)
		// - deltaMode 2: pages (use the element height as the scale)
		const absX = Math.abs(e.deltaX);
		const absY = Math.abs(e.deltaY);
		const dominant = absY >= absX ? e.deltaY : e.deltaX;
		let scale = 1;
		if (e.deltaMode === 1) scale = 16;
		else if (e.deltaMode === 2) scale = listboxEl?.clientHeight ?? 800;
		return dominant * scale;
	}

	function onReelWheel(e: WheelEvent) {
		// Make the reel feel like a slot machine: one "tick" per wheel gesture.
		// Also: always consume the wheel event while hovering the reel so the page
		// doesn't sideways-scroll on trackpads (deltaX) or scroll-chain away.
		if (!listboxEl) return;
		if (projects.length <= 1) return;

		// Let pinch-to-zoom / browser zoom gestures work.
		if (e.ctrlKey) return;

		e.preventDefault();
		e.stopPropagation();

		const now = typeof window !== 'undefined' ? performance.now() : Date.now();
		if (now < wheelLockUntil) return;

		const dominantPx = wheelDominantPx(e);
		wheelAccum += dominantPx;

		// Higher threshold reduces accidental "ticks" from tiny trackpad noise.
		// Keep mouse wheels responsive by using a lower threshold for non-pixel delta modes.
		const threshold = e.deltaMode === 0 ? 90 : 48;
		if (Math.abs(wheelAccum) < threshold) return;

		const dir = wheelAccum > 0 ? 1 : -1;
		wheelAccum = 0;
		wheelLockUntil = now + 220;

		const step = getSlotStepPx();
		listboxEl.scrollBy({ top: dir * step, behavior: 'smooth' });
		requestUpdateActiveFromCenter();

		if (wheelResetTimer) clearTimeout(wheelResetTimer);
		wheelResetTimer = setTimeout(() => {
			wheelAccum = 0;
		}, 180);
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

	$: {
		// Make the description transition follow the direction the selection moved.
		// Down the list: enter from below, exit upwards. Up the list: reverse it.
		if (activeId !== lastActiveId) {
			const prevIdx = lastActiveId ? projects.findIndex((p) => p.id === lastActiveId) : -1;
			const nextIdx = activeId ? projects.findIndex((p) => p.id === activeId) : -1;
			if (prevIdx !== -1 && nextIdx !== -1 && prevIdx !== nextIdx) {
				descDir = nextIdx > prevIdx ? 1 : -1;
			}
			lastActiveId = activeId;
		}
	}

	$: active = projects.find((p) => p.id === activeId) ?? null;
	$: motionOff = prefersReducedMotion();
	$: descKey = active?.id ?? 'empty';
	$: projectLogo =
		!active
			? null
			: (active.name ?? '').trim().toLowerCase() === 'confcap'
				? { src: confcapLogo, alt: 'ConfCap logo' }
				: (active.name ?? '').trim().toLowerCase() === 'kid by kid'
					? { src: kbkLogo, alt: 'Kid By Kid logo' }
					: (active.name ?? '').trim().toLowerCase() === 'riseaqi'
						? { src: raqiLogo, alt: 'RiseAQI logo' }
						: null;

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
		const fadeOk = !prefersReducedMotion() && typeof IntersectionObserver !== 'undefined';
		if (fadeOk && wrapEl && reelEl && descEl) {
			reelViewportRevealed = elIntersectsViewport(reelEl);
			descViewportRevealed = elIntersectsViewport(descEl);
			viewportFadeMode = true;
			viewportFadeObs = new IntersectionObserver(
				(entries) => {
					for (const entry of entries) {
						const t = entry.target;
						if (t === reelEl) reelViewportRevealed = entry.isIntersecting;
						if (t === descEl) descViewportRevealed = entry.isIntersecting;
					}
				},
				{ threshold: 0.12, root: null, rootMargin: '0px' }
			);
			viewportFadeObs.observe(reelEl);
			viewportFadeObs.observe(descEl);
		} else {
			reelViewportRevealed = true;
			descViewportRevealed = true;
		}

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
		viewportFadeObs?.disconnect();
		viewportFadeObs = null;
		if (wheelResetTimer) clearTimeout(wheelResetTimer);
		wheelResetTimer = null;
	});
</script>

<div class="wrap" class:js-viewport-fade={viewportFadeMode} aria-label="Project selector" bind:this={wrapEl}>
	<div class="reel" class:viewport-revealed={reelViewportRevealed} aria-label="Project slot reel" bind:this={reelEl}>
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

	<div class="desc" class:viewport-revealed={descViewportRevealed} aria-live="polite" bind:this={descEl}>
		{#key descKey}
			<div
				class="desc-inner"
				in:fly={{ y: 8 * descDir, duration: motionOff ? 0 : 170, easing: cubicOut }}
				out:fly={{ y: -6 * descDir, duration: motionOff ? 0 : 130, easing: cubicIn }}
			>
				{#if active}
					<InfoCard
						variant="project"
						heading={active.name}
						subheading={active.blurb}
						body={active.description}
						items={active.highlights ?? []}
						backParagraphs={active.backParagraphs ?? []}
						tech={active.tech ?? []}
						links={active.links ?? []}
						logoSrc={projectLogo?.src ?? null}
						logoAlt={projectLogo?.alt ?? null}
						customBackBody={!!(active.backSections?.length || active.backImages?.length)}
					>
						<div
							slot="backBody"
							class="project-back"
							class:project-back--with-photos={!!active.backImages?.length}
							aria-label="{active.name} details"
						>
							{#if active.backSections?.length}
								<div
									class="project-copy"
									class:project-copy--grid={active.backSections.length === 4}
								>
									{#each active.backSections as section}
										<div class="project-section">
											<h2 class="project-section-heading">{section.heading}</h2>
											<div class="project-section-body">
												{#each section.items as item}
													<p class="project-section-item">{item}</p>
												{/each}
											</div>
										</div>
									{/each}
								</div>
							{/if}

							{#if active.backImages?.length}
								<div class="project-photos" aria-label="{active.name} photos">
									{#each active.backImages as image (image.src)}
										<figure class="project-photo">
											<img
												src={image.src}
												alt={image.alt}
												loading="lazy"
												decoding="async"
											/>
										</figure>
									{/each}
								</div>
							{/if}
						</div>
					</InfoCard>
				{:else}
					<p class="desc-empty">Add some projects to see details here.</p>
				{/if}
			</div>
		{/key}
	</div>
</div>

<style>
	.wrap {
		display: grid;
		grid-template-columns: var(--project-reel-w, 280px) var(--project-card-w, 508px);
		gap: 16px;
		align-items: stretch;
		width: max-content;
		max-width: none;
		--project-reel-w: 280px;
		--project-card-w: 508px;
		--selector-h: 240px;
		--slot-h: 56px;
		/* aquamarine accents — matches InfoCard project theme */
		--select-border: rgba(30, 110, 95, 0.42);
		--select-border-strong: rgba(22, 95, 82, 0.55);
		--select-accent: rgba(30, 110, 95, 0.12);
		--select-shadow: 45, 125, 110;
	}

	.wrap.js-viewport-fade .reel:not(.viewport-revealed),
	.wrap.js-viewport-fade .desc:not(.viewport-revealed) {
		opacity: 0;
	}

	.wrap.js-viewport-fade .reel,
	.wrap.js-viewport-fade .desc {
		transition: opacity 1.1s ease;
	}

	.wrap.js-viewport-fade .reel.viewport-revealed,
	.wrap.js-viewport-fade .desc.viewport-revealed {
		opacity: 1;
	}

	.desc {
		position: relative;
		width: var(--project-card-w);
		height: var(--selector-h);
		overflow: visible;
	}

	.desc-inner {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: visible;
	}

	.desc-inner :global(.info-card) {
		height: 100%;
	}

	.listbox {
		position: relative;
		border-radius: 16px;
		border: 2px solid var(--select-border);
		background: rgba(255, 255, 255, 0.22);
		backdrop-filter: blur(var(--glass-blur)) saturate(1.2);
		-webkit-backdrop-filter: blur(var(--glass-blur)) saturate(1.2);
		box-shadow:
			0 18px 50px rgba(11, 18, 32, 0.1),
			0 0 16px rgba(var(--select-shadow), 0.1);
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
		border: 1px solid var(--select-border);
		background: rgba(255, 255, 255, 0.22);
		box-shadow:
			inset 0 0 0 1px rgba(255, 255, 255, 0.35),
			0 4px 12px rgba(var(--select-shadow), 0.14);
	}

	.scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.32);
	}

	.listbox:focus-visible {
		outline: 3px solid rgba(var(--select-shadow), 0.28);
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
			transform 140ms ease;
	}

	.opt:hover {
		background: rgba(255, 255, 255, 0.22);
		border-color: rgba(var(--select-shadow), 0.22);
	}

	.opt[aria-selected='true'] {
		background: var(--select-accent);
		border-color: var(--select-border-strong);
		transform: scale(1.02);
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
		border-radius: 4px;
		border: 2px solid var(--select-border-strong);
		background: rgba(255, 255, 255, 0.18);
		box-shadow:
			inset 0 0 0 1px rgba(255, 255, 255, 0.35),
			0 0 12px rgba(var(--select-shadow), 0.14);
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
		border-top-left-radius: 16px;
		border-top-right-radius: 16px;
	}

	.reel-shade--bottom {
		bottom: 0;
		background: linear-gradient(to top, rgba(11, 18, 32, 0.14), rgba(11, 18, 32, 0));
		border-bottom-left-radius: 16px;
		border-bottom-right-radius: 16px;
	}

	.desc-empty {
		margin: 0;
		padding: 14px;
		color: rgba(216, 226, 242, 0.82);
	}

	.project-back {
		flex: 1 1 auto;
		min-height: 0;
		width: 100%;
		overflow: hidden;
	}

	.project-back--with-photos {
		display: flex;
		flex-direction: column;
		gap: calc(var(--back-gap-sm, 1.13cqw) * 0.7);
	}

	.project-copy {
		flex: 1 1 auto;
		min-height: 0;
		overflow: hidden;
	}

	.project-copy--grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		grid-template-rows: repeat(2, minmax(0, 1fr));
		gap: calc(var(--back-gap-sm, 1.13cqw) * 0.7) calc(var(--back-gap, 1.8cqw) * 0.7);
		align-content: stretch;
	}

	.project-copy--grid .project-section {
		min-height: 0;
		overflow: hidden;
	}

	.project-copy--grid .project-section-heading {
		margin-top: 0;
	}

	.project-copy--grid .project-section-body {
		margin-left: 0;
	}

	.project-photos {
		display: grid;
		grid-template-columns: repeat(6, minmax(0, 1fr));
		gap: calc(var(--back-gap-xs, 0.45cqw) * 0.7);
		flex: 0 0 auto;
		width: 100%;
		align-self: stretch;
	}

	.project-photo {
		margin: 0;
		aspect-ratio: 1 / 1;
		overflow: hidden;
		border-radius: 2px;
		border: 1px solid rgba(0, 0, 0, 0.12);
		background: rgba(0, 0, 0, 0.04);
	}

	.project-photo img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
	}

	.project-section-heading {
		margin: calc(var(--back-gap, 1.8cqw) * 0.7) 0 calc(var(--back-gap-xs, 0.45cqw) * 0.7);
		color: #000;
		font-size: calc(var(--back-fs-md, 2.41cqw) * 0.7);
		font-weight: 700;
		line-height: 1.2;
		overflow-wrap: anywhere;
	}

	.project-section:first-child .project-section-heading {
		margin-top: 0;
	}

	.project-section-body {
		margin: 0 0 calc(var(--back-gap-xs, 0.45cqw) * 0.7) 1.54em;
	}

	.project-section-item {
		margin: 0 0 calc(var(--back-gap-xs, 0.45cqw) * 0.7);
		color: #000;
		font-size: calc(var(--back-fs-sm, 2.02cqw) * 0.7);
		line-height: 1.35;
		overflow-wrap: anywhere;
	}

</style>

