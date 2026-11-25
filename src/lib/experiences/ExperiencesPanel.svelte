<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import InfoCard from '$lib/InfoCard.svelte';
	import { abbreviateMonths } from '$lib/format';
	import { experiences, moreExperiences } from '$lib/experiences/experiences';
	import ShutterHeading from '$lib/title/ShutterHeading.svelte';

	export let title: string;

	let panelEl: HTMLElement | null = null;
	let hintRevealed = false;
	let moreShown = false;
	let motionReady = false;
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

	function showMore() {
		moreShown = true;
	}

	onMount(() => {
		motionReady = true;
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
		<ShutterHeading {title} />
	</div>

	<ul
		class="experience-list"
		class:motion-ready={motionReady}
		class:is-expanded={moreShown}
		aria-label="Jobs and internships list"
	>
		{#each experiences as exp, i}
			<li class="experience-item">
				<InfoCard
					variant="experience"
					heading={exp.company}
					subheading={exp.title}
					location={exp.location}
					dates={abbreviateMonths(exp.dates)}
					logoSrc={exp.logoSrc}
					logoAlt={exp.logoAlt}
					backImageSrc={exp.backImageSrc}
					backImageAlt={exp.backImageAlt}
					backImageHref={exp.backImageHref}
					backLinkLabel={exp.backLinkLabel}
					backImageGrayscale={exp.backImageGrayscale ?? false}
					backLead={exp.backLead}
					backBullets={exp.backBullets}
					skills={exp.skills ?? []}
				/>
				{#if i === experiences.length - 1}
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
		{#each moreExperiences as exp (exp.company)}
			<li
				class="experience-item experience-item--more"
				class:is-in={moreShown}
				aria-hidden={moreShown ? undefined : true}
				inert={moreShown ? undefined : true}
			>
				<InfoCard
					variant="experience"
					heading={exp.company}
					subheading={exp.title}
					location={exp.location}
					dates={abbreviateMonths(exp.dates)}
					logoSrc={exp.logoSrc}
					logoAlt={exp.logoAlt}
					backImageSrc={exp.backImageSrc}
					backImageAlt={exp.backImageAlt}
					backImageHref={exp.backImageHref}
					backLinkLabel={exp.backLinkLabel}
					backImageGrayscale={exp.backImageGrayscale ?? false}
					backLead={exp.backLead}
					backBullets={exp.backBullets}
					skills={exp.skills ?? []}
				/>
			</li>
		{/each}
		<li class="show-more-slot" class:is-gone={moreShown} aria-hidden={moreShown || undefined} inert={moreShown || undefined}>
			<button
				type="button"
				class="show-more"
				aria-expanded={moreShown}
				on:click={showMore}
			>
				<svg class="show-more-lines" focusable="false" aria-hidden="true">
					<rect class="show-more-perimeter" />
				</svg>
				<span class="show-more-photo" aria-hidden="true">
					<span class="show-more-square-wrap">
						<svg class="show-more-lines" focusable="false">
							<rect class="show-more-square" />
						</svg>
						<svg class="show-more-plus" viewBox="0 0 24 24" focusable="false">
							<path d="M12 5v14M5 12h14" />
						</svg>
					</span>
				</span>
				<span class="show-more-label">Show more</span>
			</button>
		</li>
	</ul>
</div>

<style>
	@property --enter {
		syntax: '<number>';
		inherits: false;
		initial-value: 0;
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
		min-height: clamp(560px, 72vh, 700px);
	}

	.experience-item {
		/* Each card eases in on its own clock. --clump-start delays that card
		   without changing where the whole fan finishes. */
		--t: clamp(0, (var(--exp-t, 1) - var(--clump-start, 0)) / (1 - var(--clump-start, 0)), 1);
		--clump-start: 0;
		--clump-rot: 0deg;
		--spread-x: 0px;
		--spread-y: 0px;
		--enter: 0;
		--enter-x: 0px;
		--enter-y: 0px;
		--enter-rot: 0deg;
		--exp-card-w: var(--playing-card-w, 220px);
		--exp-card-h: var(--playing-card-h, 308px);
		position: relative;
		z-index: 1;
		width: var(--exp-card-w);
		height: var(--exp-card-h);
		aspect-ratio: var(--playing-card-ratio, 5 / 7);
		min-height: var(--exp-card-h);
		transform: translate3d(
				calc(var(--spread-x) * (1 - var(--t)) + var(--enter-x) * var(--enter)),
				calc(var(--spread-y) * (1 - var(--t)) + var(--enter-y) * var(--enter)),
				0
			)
			rotate(calc(var(--clump-rot) * (1 - var(--t)) + var(--enter-rot) * var(--enter)));
		will-change: transform;
	}

	.experience-item--more {
		--enter: 1;
		--fade-dur: 0.8s;
		--enter-dur: 0.95s;
		--enter-delay: 0ms;
		--enter-ease: cubic-bezier(0.16, 1, 0.3, 1);
		opacity: 0;
		pointer-events: none;
		transition: none;
	}

	/* Show-more cards. The first one replaces the dotted placeholder in place.
	   The other two travel their own paths into the checkerboard. */
	:global(#experiences) .experience-item--more:nth-child(5),
	.show-more-slot {
		--clump-start: 0.04;
		--clump-rot: -6deg;
		--spread-x: 70px;
		--spread-y: 230px;
	}

	:global(#experiences) .experience-item--more:nth-child(5) {
		--enter-x: 0px;
		--enter-y: 0px;
		--enter-rot: 0deg;
		--enter-dur: 0.45s;
		--enter-delay: 0ms;
		--fade-dur: 0.45s;
		--enter-ease: cubic-bezier(0.16, 1, 0.3, 1);
	}

	:global(#experiences) .experience-item--more:nth-child(6) {
		--clump-start: 0.22;
		--clump-rot: 7deg;
		--spread-x: 150px;
		--spread-y: -210px;
		--enter-x: 280px;
		--enter-y: -250px;
		--enter-rot: -8deg;
		--enter-dur: 0.86s;
		--enter-delay: 0ms;
		--fade-dur: 0.58s;
		--enter-ease: cubic-bezier(0.22, 1.15, 0.36, 1);
	}

	:global(#experiences) .experience-item--more:nth-child(7) {
		--clump-start: 0.12;
		--clump-rot: -3deg;
		--spread-x: 300px;
		--spread-y: -30px;
		--enter-x: 480px;
		--enter-y: 90px;
		--enter-rot: 5deg;
		--enter-dur: 1.2s;
		--enter-delay: 150ms;
		--fade-dur: 0.84s;
		--enter-ease: cubic-bezier(0.05, 0.7, 0.2, 1);
	}

	.motion-ready .experience-item--more {
		transition:
			opacity var(--fade-dur) ease var(--enter-delay),
			--enter var(--enter-dur) var(--enter-ease) var(--enter-delay);
	}

	.experience-item--more.is-in {
		--enter: 0;
		opacity: 1;
		pointer-events: auto;
	}

	.show-more-slot {
		/* Same scroll float as the first extra card, so that card can take this pose. */
		--t: clamp(0, (var(--exp-t, 1) - var(--clump-start, 0)) / (1 - var(--clump-start, 0)), 1);
		--show-more-w: var(--playing-card-w, 220px);
		--show-more-h: var(--playing-card-h, 308px);
		position: absolute;
		z-index: 15;
		top: 176px;
		left: 904px;
		width: var(--show-more-w);
		height: var(--show-more-h);
		aspect-ratio: var(--playing-card-ratio, 5 / 7);
		margin: 0;
		transform: translate3d(
				calc(var(--spread-x) * (1 - var(--t))),
				calc(var(--spread-y) * (1 - var(--t))),
				0
			)
			rotate(calc(var(--clump-rot) * (1 - var(--t))));
		transition: opacity 0.45s ease;
	}

	.show-more-slot.is-gone {
		opacity: 0;
		pointer-events: none;
	}

	.show-more {
		container-type: inline-size;
		--show-more-line: 1px;
		/* Inside edge of the inner stripe: 2px border + the band + 1px inner stroke. */
		--show-more-frame: calc(2px + 2.4cqw + 1px);
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		width: 100%;
		height: 100%;
		margin: 0;
		padding: 0;
		border: 0;
		border-radius: 5.5% / 3.94%;
		background: transparent;
		box-shadow: none;
		color: #3e4d72;
		font: inherit;
		cursor: pointer;
		transition: background-color 0.22s ease;
	}

	.show-more-lines {
		display: block;
		width: 100%;
		height: 100%;
		overflow: visible;
		pointer-events: none;
	}

	.show-more > .show-more-lines {
		position: absolute;
		inset: 0;
	}

	.show-more-lines rect {
		fill: none;
		stroke: currentColor;
		stroke-width: var(--show-more-line);
		stroke-linejoin: round;
	}

	.show-more-perimeter {
		x: calc(var(--show-more-line) / 2);
		y: calc(var(--show-more-line) / 2);
		width: calc(100% - var(--show-more-line));
		height: calc(100% - var(--show-more-line));
		rx: calc(5.5cqw - var(--show-more-line) / 2);
		ry: calc(5.5cqw - var(--show-more-line) / 2);
	}

	/* Square photo, as wide as the card between the inner border stripes. */
	.show-more-photo {
		flex: 1 1 auto;
		min-height: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding-inline: var(--show-more-frame);
	}

	.show-more-photo .show-more-square-wrap {
		position: relative;
		width: 100%;
		aspect-ratio: 1;
	}

	.show-more-photo .show-more-lines {
		width: 100%;
		height: 100%;
	}

	.show-more-plus {
		position: absolute;
		left: 50%;
		top: 50%;
		width: 22%;
		height: 22%;
		transform: translate(-50%, -50%);
		overflow: visible;
	}

	.show-more-plus path {
		fill: none;
		stroke: currentColor;
		stroke-width: 1px;
		stroke-linecap: square;
		vector-effect: non-scaling-stroke;
	}

	.show-more-square {
		x: calc(var(--show-more-line) / 2);
		y: calc(var(--show-more-line) / 2);
		width: calc(100% - var(--show-more-line));
		height: calc(100% - var(--show-more-line));
		rx: 3.2cqw;
		ry: 3.2cqw;
	}

	.show-more-label {
		position: relative;
		z-index: 1;
		flex: 0 0 auto;
		margin-top: auto;
		padding: 8px 12px calc(12px + 2px + 11px * 1.35);
		text-align: center;
		font-size: 14px;
		font-weight: 700;
		letter-spacing: 0.02em;
		line-height: 1.15;
		color: #181e2a;
		text-shadow:
			0 1px 0 rgba(255, 255, 255, 0.75),
			0 1px 3px rgba(75, 85, 120, 0.18);
	}

	.show-more:hover {
		background: rgba(168, 178, 208, 0.34);
		color: #3e4d72;
	}

	.show-more:hover .show-more-label {
		color: #121820;
	}

	.show-more:focus-visible {
		outline: 2px solid rgba(62, 77, 114, 0.72);
		outline-offset: 4px;
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

		.motion-ready .experience-item--more,
		.show-more-slot {
			transition: none;
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

		:global(#experiences) .experience-item.experience-item--more {
			position: absolute;
			z-index: 4;
			opacity: 0;
			pointer-events: none;
			transform: translate3d(
					calc(var(--enter-x) * var(--enter)),
					calc(var(--enter-y) * var(--enter)),
					0
				)
				rotate(calc(var(--enter-rot) * var(--enter)));
		}

		:global(#experiences) .experience-item.experience-item--more.is-in {
			opacity: 1;
			pointer-events: auto;
		}

		:global(#experiences) .experience-item--more:nth-child(5) {
			top: calc(var(--exp-card-h) + 28px);
			left: 0;
		}

		:global(#experiences) .experience-item--more:nth-child(6) {
			top: calc(var(--exp-card-h) * 0.35);
			left: calc(var(--exp-card-w) + 16px);
		}

		:global(#experiences) .experience-item--more:nth-child(7) {
			top: calc(var(--exp-card-h) + 28px);
			left: calc(var(--exp-card-w) + 16px);
		}

		.show-more-slot {
			/* Same cell the first extra card uses once it drops in. */
			top: calc(var(--playing-card-h) + 28px);
			left: 0;
			transform: none;
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
			--clump-start: 0;
			--clump-rot: -7deg;
			--spread-x: -180px;
			--spread-y: 120px;
			top: 168px;
			left: 0;
			right: auto;
			z-index: 10;
		}

		:global(#experiences) .experience-item:nth-child(2) {
			--clump-start: 0.18;
			--clump-rot: 5deg;
			--spread-x: 40px;
			--spread-y: -130px;
			top: 12px;
			left: 680px;
			right: auto;
			z-index: 8;
		}

		:global(#experiences) .experience-item:nth-child(3) {
			--clump-start: 0.08;
			--clump-rot: -4deg;
			--spread-x: -140px;
			--spread-y: 60px;
			top: 0;
			left: 236px;
			right: auto;
			bottom: auto;
			z-index: 9;
		}

		:global(#experiences) .experience-item:nth-child(4) {
			--clump-start: 0.24;
			--clump-rot: 6deg;
			--spread-x: -40px;
			--spread-y: -20px;
			top: 176px;
			left: 456px;
			right: auto;
			bottom: auto;
			z-index: 14;
		}

		/* Continue the checkerboard past Benevolent: down-right, up-right, then right.
		   Show more holds the first of those cells until the extra cards drop in. */
		:global(#experiences) .experience-item:nth-child(5),
		:global(#experiences) .show-more-slot {
			top: 176px;
			left: 904px;
		}

		:global(#experiences) .experience-item:nth-child(5) {
			z-index: 16;
		}

		:global(#experiences) .experience-item--more:nth-child(5).is-in {
			z-index: 19;
		}

		:global(#experiences) .experience-item:nth-child(6) {
			top: 0;
			left: 1128px;
			z-index: 11;
		}

		:global(#experiences) .experience-item:nth-child(7) {
			top: 176px;
			left: 1352px;
			z-index: 18;
		}
	}

	/*
	  Flipped phone. The desktop fan and the wide 2×2 grid both leave cards
	  off-screen in a short landscape viewport. One centered row instead;
	  Show more is a card in the slot the first extra card takes.
	*/
	@media (max-height: 520px) and (min-aspect-ratio: 1) {
		.experiences-panel {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			width: 100%;
			gap: 8px;
		}

		.experiences-header {
			position: relative;
			z-index: 2;
			width: auto;
			max-width: 100%;
			text-align: center;
		}

		:global(#experiences) .experience-list {
			--ls-gap: 8px;
			--ls-card: min(
				var(--playing-card-w),
				calc((100vw - 40px - 4 * var(--ls-gap)) / 5)
			);
			position: relative;
			top: auto;
			left: auto;
			display: flex;
			flex-wrap: nowrap;
			justify-content: center;
			align-items: center;
			gap: var(--ls-gap);
			width: 100%;
			min-height: 0;
			margin: 0;
			padding: 0 0 26px;
			grid-template-columns: none;
			grid-template-rows: none;
		}

		:global(#experiences) .experience-list.is-expanded {
			--ls-card: min(var(--playing-card-w), calc((100vw - 40px - 6 * var(--ls-gap)) / 7));
		}

		.experience-item,
		:global(#experiences) .experience-item,
		:global(#experiences) .experience-item:nth-child(n) {
			position: relative;
			inset: auto;
			top: auto;
			right: auto;
			bottom: auto;
			left: auto;
			z-index: 1;
			width: var(--ls-card);
			height: calc(var(--ls-card) * 7 / 5);
			min-height: 0;
			margin: 0;
			transform: none;
			will-change: auto;
		}

		/* Hint lives in the 4th card; keep that card from trapping it so it can center on the row. */
		:global(#experiences) .experience-item:nth-child(4) {
			position: static;
		}

		:global(#experiences) .experience-item.experience-item--more:nth-child(n):not(.is-in) {
			position: absolute;
			width: 0;
			height: 0;
			min-height: 0;
			overflow: hidden;
			opacity: 0;
			pointer-events: none;
			transform: none;
		}

		:global(#experiences) .experience-item.experience-item--more:nth-child(n).is-in {
			position: relative;
			width: var(--ls-card);
			height: calc(var(--ls-card) * 7 / 5);
			opacity: 1;
			pointer-events: auto;
			overflow: visible;
			transform: none;
		}

		.show-more-slot,
		.show-more-slot.is-gone {
			position: relative;
			top: auto;
			left: auto;
			width: var(--ls-card);
			height: calc(var(--ls-card) * 7 / 5);
			transform: none;
		}

		.show-more-label {
			padding: 4px 6px calc(6px + 9px * 1.2);
			font-size: 11px;
		}

		.show-more-slot.is-gone {
			position: absolute;
			width: 0;
			height: 0;
			overflow: hidden;
			opacity: 0;
		}

		.exp-click-hint {
			top: auto;
			bottom: 0;
			left: 50%;
			width: max-content;
			max-width: calc(100vw - 32px);
			transform: translateX(-50%);
		}

		.exp-click-hint-arrow {
			display: none;
		}

		.exp-click-hint-text {
			font-size: 11px;
		}
	}
</style>
