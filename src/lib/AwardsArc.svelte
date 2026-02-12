<script lang="ts">
	import { onMount } from 'svelte';
	import InfoCard from '$lib/InfoCard.svelte';

	type Award = {
		heading: string;
		subheading: string;
		items: string[];
	};

	export let kicker: string | undefined = undefined;
	export let title: string;
	export let body: string;
	export let awards: Award[] = [];

	// Tuning knobs
	// Overall orbit speed (keep this stable).
	export let durationMs = 26000;
	// Wider visible window => multiple awards can be "in the air" at the same time.
	export let windowStart = 0.1; // visible arc window start (0..1)
	export let windowEnd = 0.55; // visible arc window end (0..1)
	// Repeat the awards list to tighten pacing while keeping spacing constant (no end-of-loop pause).
	// Example: 2 => a 4-award list becomes 8 orbiting cards (same order, repeats seamlessly).
	export let repeatFactor = 2;
	// Higher = more slowdown at the tip (u≈0.5). Lower = faster at the top of the arc.
	export let slowAtTip = 0.08; // 0..1 (must be < 1)
	export let peakY = 0.0; // as fraction of container height (negative => above top)
	export let baseY = 1.4; // as fraction of container height
	// Make the card exist slightly offscreen while visible (so it "appears before it enters")
	export let startX = -0.18; // as fraction of container width
	export let endX = 1.18; // as fraction of container width

	let orbitEl: HTMLElement | null = null;
	let awardEls: (HTMLElement | null)[] = [];
	let raf: number | null = null;

	$: safeRepeatFactor = Math.max(1, Math.min(6, Math.floor(repeatFactor || 1)));
	$: displayAwards = Array.from(
		{ length: awards.length * safeRepeatFactor },
		(_, i) => awards[i % awards.length]!
	);

	function clamp(n: number, min: number, max: number) {
		return Math.max(min, Math.min(max, n));
	}

	function smoothstep(edge0: number, edge1: number, x: number) {
		const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
		return t * t * (3 - 2 * t);
	}

	function shouldAnimate() {
		if (typeof window === 'undefined') return false;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
		if (window.matchMedia('(max-width: 720px)').matches) return false;
		return true;
	}

	function stop() {
		if (raf != null) cancelAnimationFrame(raf);
		raf = null;
	}

	function start() {
		stop();
		if (!shouldAnimate()) return;
		if (!orbitEl) return;

		const tick = (now: number) => {
			if (!orbitEl) return;
			const els = awardEls.filter((el): el is HTMLElement => el instanceof HTMLElement);
			const n = els.length;
			if (n === 0) return;

			const rect = orbitEl.getBoundingClientRect();
			const w = rect.width;
			const h = rect.height;

			// Arc geometry (true parabola) in container coordinates.
			const x0 = startX * w;
			const x1 = endX * w;
			const yBase = baseY * h;
			const yPeak = peakY * h;

			const tCycle = ((now % durationMs) / durationMs) % 1; // 0..1

			for (let i = 0; i < n; i++) {
				const el = els[i];
				// Even spacing across the whole cycle => seamless restart after the last card.
				const phase = (tCycle + i / n) % 1;

				// Hide outside the arc window; only appear "when it's their time".
				const surface = el.querySelector('.award-card-surface') as HTMLElement | null;

				if (phase < windowStart || phase > windowEnd) {
					el.style.visibility = 'hidden';
					el.style.pointerEvents = 'none';
					if (surface) surface.style.opacity = '0';
					continue;
				}

				// Normalize time within the visible window.
				const u = (phase - windowStart) / (windowEnd - windowStart); // 0..1

				// Time-warp so speed is slowest at the tip (u≈0.5) and faster near edges.
				// p(u) = u + a/(2π) * sin(2πu) with a in (0,1). Derivative: 1 + a*cos(2πu)
				// => minimum at u=0.5 (cos π = -1).
				const a = clamp(slowAtTip, 0, 0.98);
				const p = u + (a / (2 * Math.PI)) * Math.sin(2 * Math.PI * u);

				const x = x0 + (x1 - x0) * p;
				// Parabola with apex at p=0.5.
				const y = yPeak + (yBase - yPeak) * 4 * Math.pow(p - 0.5, 2);

				// One full rotation across the arc, but flat/upright at the tip.
				const rot = 360 * (p - 0.5);

				// No fade: pop on before entering, pop off after leaving.
				el.style.visibility = 'visible';
				el.style.pointerEvents = 'auto';
				// Use 2D transforms (avoid translate3d) to keep backdrop-filter reliable on some browsers.
				el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${rot}deg)`;
				if (surface) surface.style.opacity = `1`;
			}

			raf = requestAnimationFrame(tick);
		};

		raf = requestAnimationFrame(tick);
	}

	onMount(() => {
		const onResize = () => start();
		start();
		window.addEventListener('resize', onResize);
		return () => {
			window.removeEventListener('resize', onResize);
			stop();
		};
	});
</script>

<div class="awards-orbit" bind:this={orbitEl} aria-label="Awards orbit">
	<div class="awards-center" aria-label="Awards summary">
		{#if kicker}
			<p class="kicker">{kicker}</p>
		{/if}
		<h1 class="title">{title}</h1>
		<p class="body">{body}</p>
	</div>

	<ul class="awards-ring" aria-label="Awards list">
		{#each displayAwards as award, i (`${award.heading}-${i}`)}
			<li class="award-item" bind:this={awardEls[i]}>
				<div class="award-card-surface">
					<InfoCard
						variant="award"
						heading={award.heading}
						subheading={award.subheading}
						dates={null}
						items={award.items}
					/>
				</div>
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

	.awards-orbit {
		position: relative;
		width: min(980px, 100%);
		min-height: clamp(420px, 62vh, 620px);
		display: grid;
		place-items: center;
		isolation: isolate;
	}

	.awards-center {
		text-align: center;
		width: min(520px, 92%);
		z-index: 2;
		/* tweak as desired */
		transform: translateY(-70%);
	}

	.awards-center .body {
		margin-bottom: 0;
	}

	.awards-ring {
		position: absolute;
		inset: 0;
		margin: 0;
		padding: 0;
		list-style: none;
		z-index: 6;
	}

	.award-item {
		position: absolute;
		left: 0;
		top: 0;
		transform-origin: center;
		visibility: hidden;
		will-change: transform;
	}

	.award-card-surface {
		width: min(360px, 42vw);
		position: relative;
		/* surface styling now lives in InfoCard */
		opacity: 1;
	}

	@media (hover: hover) and (pointer: fine) {
		.award-item:hover {
			z-index: 20;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.awards-ring {
			position: relative;
			inset: unset;
			display: grid;
			gap: 12px;
		}
		.award-item {
			position: relative;
			visibility: visible;
			transform: none;
		}
		.award-card-surface {
			opacity: 1;
		}
	}

	@media (max-width: 720px) {
		.awards-orbit {
			min-height: unset;
			gap: 18px;
			padding: 18px 0;
		}
		.awards-ring {
			position: relative;
			inset: unset;
			display: grid;
			gap: 12px;
		}
		.award-item {
			position: relative;
			transform: none;
			visibility: visible;
		}
		.award-card-surface {
			opacity: 1;
		}
		.award-card-surface {
			width: min(540px, 92vw);
			margin-inline: auto;
		}
	}
</style>

