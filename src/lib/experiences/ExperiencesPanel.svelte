<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import InfoCard from '$lib/InfoCard.svelte';
	import { abbreviateMonths } from '$lib/format';
	import { experiences } from '$lib/experiences/experiences';

	export let kicker: string | undefined = undefined;
	export let title: string;
	export let body: string;

	let panelEl: HTMLElement | null = null;
	let hintRevealed = false;
	let rafId: number | null = null;

	/**
	 * Scroll-in progress at which the hint reveals. The section slides in from
	 * the right; progress goes 0 (just entering) → 0.5 (centered) → 1 (scrolled
	 * fully past). Higher = fires later. Desktop only — the hint is disabled on
	 * mobile (see `isMobile` + CSS).
	 */
	const REVEAL_PROGRESS = 0.4;

	function prefersReducedMotion() {
		return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	// Treat as "mobile" when either the grid layout is active (card list becomes
	// `position: absolute`) OR the device is touch/coarse-pointer. Landscape
	// phones are frequently wider than the 900px CSS breakpoint, so a width check
	// alone misses them.
	function isMobile() {
		if (typeof window === 'undefined') return false;
		if (window.matchMedia('(pointer: coarse)').matches) return true;
		const list = panelEl?.querySelector('.experience-list');
		return !!list && getComputedStyle(list).position === 'absolute';
	}

	function revealHint() {
		if (hintRevealed) return;
		hintRevealed = true;
		stopPolling();
	}

	function stopPolling() {
		if (rafId != null) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
	}

	function isCentered() {
		if (!panelEl) return false;
		const vw = window.innerWidth;
		if (vw === 0) return false;
		// Measure the full-width section, not `.experiences-panel`: on mobile the
		// card list is absolutely positioned, so the panel box only wraps the
		// left-side header and its center would cross the threshold far too early.
		const section = panelEl.closest('section') as HTMLElement | null;
		const rect = (section ?? panelEl).getBoundingClientRect();
		const center = rect.left + rect.width / 2;
		const progress = 1 - center / vw;
		return progress >= REVEAL_PROGRESS;
	}

	// Poll geometry every frame until revealed. Robust to programmatic scrolls,
	// the greeting intro lock, and any animation-driven position changes.
	function tick() {
		if (hintRevealed) return;
		if (isCentered()) {
			revealHint();
			return;
		}
		rafId = requestAnimationFrame(tick);
	}

	onMount(() => {
		// Disabled on mobile — no hint, no animation.
		if (isMobile()) return;
		if (prefersReducedMotion()) {
			revealHint();
			return;
		}
		if (!panelEl) return;
		rafId = requestAnimationFrame(tick);
	});

	onDestroy(stopPolling);
</script>

<div class="experiences-panel" bind:this={panelEl}>
	<div class="experiences-header">
		{#if kicker}
			<p class="kicker">{kicker}</p>
		{/if}
		<h1 class="title">{title}</h1>
		<p class="body">{body}</p>
	</div>

	<ul class="experience-list" aria-label="Jobs and internships list">
		{#each experiences as exp}
			<li class="experience-item">
				<InfoCard
					variant="experience"
					heading={exp.company}
					subheading={`${exp.title} · ${exp.location}`}
					dates={abbreviateMonths(exp.dates)}
					items={exp.highlights}
					logoSrc={exp.logoSrc}
					logoAlt={exp.logoAlt}
					backImageSrc={exp.backImageSrc}
					backImageAlt={exp.backImageAlt}
					backImageHref={exp.backImageHref}
					backLinkLabel={exp.backLinkLabel}
					backImageGrayscale={exp.backImageGrayscale ?? false}
					backParagraphs={exp.backParagraphs ?? []}
					skills={exp.skills ?? []}
				/>
				{#if exp.company === 'City of San Diego'}
					<div class="exp-click-hint" class:is-visible={hintRevealed} aria-hidden="true">
						<svg
							class="exp-click-hint-arrow"
							viewBox="0 0 56 52"
							width="56"
							height="52"
							fill="none"
							aria-hidden="true"
						>
							<path
								d="M52 48H16Q8 48 8 40V12"
								stroke="currentColor"
								stroke-width="2.25"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M0 18l8-10 8 10"
								stroke="currentColor"
								stroke-width="2.25"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
						<p class="exp-click-hint-text"><span class="exp-click-hint-verb exp-click-hint-verb--desktop">Click</span><span class="exp-click-hint-verb exp-click-hint-verb--mobile">Tap</span> <span class="exp-click-hint-any">ANY</span> card to learn more</p>
					</div>
				{/if}
			</li>
		{/each}
	</ul>
</div>

<style>
	.kicker {
		margin: 0 0 10px;
		color: var(--muted);
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		font-size: 12px;
	}

	.title {
		margin: 0 0 10px;
		font-size: clamp(32px, 4vw, 54px);
		line-height: 1.05;
		letter-spacing: -0.03em;
	}

	.body {
		margin: 0 0 18px;
		color: var(--muted);
		font-size: 16px;
		line-height: 1.6;
	}

	.experience-list {
		list-style: none;
		margin: 0 0 18px;
		padding: 0;
		display: grid;
		gap: 16px;
	}

	:global(#experiences) .experience-list {
		display: block;
		position: relative;
		margin-bottom: 0;
		margin-top: 18px;
		min-height: clamp(420px, 62vh, 620px);
	}

	.experience-item {
		--t: var(--exp-t, 1);
		--spread-x: 0px;
		--spread-y: 0px;
		--exp-card-w: 573px;
		--exp-card-h: 112px;
		position: relative;
		z-index: 1;
		width: var(--exp-card-w);
		height: var(--exp-card-h);
		min-height: var(--exp-card-h);
		transform: translate3d(
			calc(var(--spread-x) * (1 - var(--t))),
			calc(var(--spread-y) * (1 - var(--t))),
			0
		);
		will-change: transform;
	}

	.exp-click-hint {
		position: absolute;
		top: calc(100% - 3px);
		left: calc(8% + 40%);
		z-index: 6;
		display: flex;
		align-items: flex-end;
		gap: 2px;
		pointer-events: none;
		user-select: none;
	}

	.exp-click-hint-arrow,
	.exp-click-hint-text {
		opacity: 0;
		transition: opacity 0.55s ease;
	}

	.exp-click-hint-arrow {
		flex: 0 0 auto;
		color: var(--muted);
		margin-bottom: 2px;
		transform: translate(-4px, 6px);
		transition:
			opacity 0.55s ease,
			transform 0.55s ease;
	}

	.exp-click-hint-text {
		position: relative;
		top: 3px;
		margin: 0;
		padding-bottom: 2px;
		color: var(--muted);
		font-size: 13px;
		font-weight: 600;
		letter-spacing: 0.02em;
		white-space: nowrap;
	}

	.exp-click-hint-any {
		font-weight: 800;
		letter-spacing: 0.06em;
	}

	.exp-click-hint-verb--mobile {
		display: none;
	}

	/* Mobile: the hint is shown statically (no scroll-in animation) and says
	   "Tap". Covers the grid layout and any touch device (landscape phones can
	   exceed the 900px breakpoint). */
	@media (max-width: 900px), (pointer: coarse) {
		.exp-click-hint-verb--desktop {
			display: none;
		}

		.exp-click-hint-verb--mobile {
			display: inline;
		}

		.exp-click-hint {
			top: calc(100% + 2px);
			left: calc(6% + 40%);
		}

		.exp-click-hint-text {
			font-size: 12px;
		}

		.exp-click-hint-arrow,
		.exp-click-hint-text {
			opacity: 1;
			transition: none;
		}

		.exp-click-hint-arrow {
			transform: none;
		}
	}

	.exp-click-hint.is-visible .exp-click-hint-arrow {
		opacity: 1;
		transform: translate(0, 0);
	}

	.exp-click-hint.is-visible .exp-click-hint-text {
		opacity: 1;
		transition-delay: 0.25s;
	}

	@media (prefers-reduced-motion: reduce) {
		.exp-click-hint-arrow,
		.exp-click-hint-text {
			transition: none;
		}

		.exp-click-hint.is-visible .exp-click-hint-text {
			transition-delay: 0s;
		}
	}

	:global(#experiences) .experience-item:nth-child(1) {
		z-index: 40;
	}
	:global(#experiences) .experience-item:nth-child(2) {
		z-index: 30;
	}
	:global(#experiences) .experience-item:nth-child(3) {
		z-index: 20;
	}
	:global(#experiences) .experience-item:nth-child(4) {
		z-index: 10;
	}

	/* Mobile: static 2×2 grid — header left, cards shifted right. */
	@media (max-width: 900px) {
		.experiences-panel {
			position: relative;
			display: block;
		}

		.experiences-header {
			position: relative;
			z-index: 2;
			width: min(420px, 46vw);
			max-width: none;
		}

		.experiences-header .title {
			font-size: clamp(36px, 5.5vw, 54px);
		}

		.experiences-header .body {
			margin-bottom: 0;
			font-size: 15px;
			line-height: 1.55;
		}

		:global(#experiences) .experience-list {
			position: absolute;
			top: 0;
			left: 50vw;
			display: grid;
			grid-template-columns: repeat(2, var(--exp-card-w, 573px));
			grid-template-rows: repeat(2, var(--exp-card-h, 112px));
			gap: 12px;
			min-height: 0;
			margin: 0;
			z-index: 1;
		}

		.experience-item,
		:global(#experiences) .experience-item {
			position: relative;
			inset: auto;
			margin: 0;
			z-index: 1;
			width: var(--exp-card-w);
			height: var(--exp-card-h);
			min-height: var(--exp-card-h);
			transform: none;
			will-change: auto;
		}

		/* top-right */
		:global(#experiences) .experience-item:nth-child(2) {
			transform: translate(10%, -65%);
		}

		/* bottom-left */
		:global(#experiences) .experience-item:nth-child(3) {
			transform: translate(-10%, -5%);
		}

		/* bottom-right */
		:global(#experiences) .experience-item:nth-child(4) {
			transform: translateY(-70%);
		}
	}

	@media (min-width: 901px) {
		.experience-item {
			margin-inline: auto;
		}

		:global(#experiences) .experience-item {
			position: absolute;
			margin: 0;
		}

		:global(#experiences) .experience-item:nth-child(1) {
			--spread-x: -240px;
			--spread-y: 150px;
			top: 150px;
			left: -60px;
			right: auto;
			z-index: 5;
		}

		:global(#experiences) .experience-item:nth-child(2) {
			--spread-x: -40px;
			--spread-y: -150px;
			top: -90px;
			left: calc(var(--exp-card-w) + 100px);
			right: auto;
			z-index: 5;
		}

		:global(#experiences) .experience-item:nth-child(3) {
			--spread-x: -140px;
			--spread-y: 90px;
			top: 0;
			left: 0;
			right: auto;
			bottom: auto;
		}

		:global(#experiences) .experience-item:nth-child(4) {
			--spread-x: -140px;
			--spread-y: -90px;
			top: 44px;
			left: calc(var(--exp-card-w) + 28px);
			right: auto;
			bottom: auto;
		}
	}
</style>
