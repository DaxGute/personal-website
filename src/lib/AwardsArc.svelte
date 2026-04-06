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

	// Repeat the awards list to tighten pacing while keeping spacing constant.
	export let repeatFactor = 3;

	// Autoscroll (disabled by default).
	export let autoScroll = false;
	// If enabled, autoscroll speed (one full cycle duration).
	export let durationMs = 9000;

	// Visible arc window (0..1).
	// Smaller window => more “gap/delay” between awards.
	export let windowStart = 0.1;
	export let windowEnd = 0.7;

	// Higher = more slowdown at the tip (u≈0.5).
	export let slowAtTip = 0.08; // 0..1 (must be < 1)

	// Arc geometry in container coordinates.
	// More pronounced arc: higher peak + lower base.
	// Start well above the page, then arc down through the orbit.
	export let peakY = -0.75; // fraction of height (negative => above top)
	// Center the active award at mid-screen.
	export let centerY = 0.5; // fraction of height
	// Controls how quickly the arc falls (higher => stays high longer, then drops).
	export let fallExp = 1.6;
	// Narrower horizontal travel => awards sit closer together.
	export let startX = -0.1; // fraction of width
	export let endX = 1.1; // fraction of width

	// Manual control (only while hovered).
	export let wheelPhasePerPx = 0.00015; // cycles per px of wheel delta (lower = slower scroll/drag)

	/** Initial spin speed when the block first enters the viewport (cycles per second). */
	const ENTRY_IMPULSE_SPEED = 0.507;
	/** Exponential decay time constant for that spin (ms); higher = longer glide. */
	const ENTRY_IMPULSE_DECAY_MS = 820;

	/** After this long without a wheel event, end capture so the page can scroll normally again. */
	const WHEEL_CAPTURE_IDLE_MS = 450;

	let orbitEl: HTMLElement | null = null;
	let awardEls: (HTMLElement | null)[] = [];
	let raf: number | null = null;
	let lastNow = 0;
	let phase = 0; // 0..1
	let phaseAnim: { start: number; delta: number; startTime: number; durationMs: number } | null = null;
	let snapTimer: number | null = null;
	let didInitialSnap = false;

	/** Wheel began on an award card; keep blocking page scroll until idle or leaving the awards block. */
	let wheelCapturedFromCard = false;
	let wheelIdleTimer: ReturnType<typeof setTimeout> | null = null;
	let wheelGlobalListenerActive = false;

	// One-time “push” when the awards first scroll into view: phase spins then eases to rest.
	let entryImpulseVelocity = 0; // cycles per second
	let didEntryImpulse = false;
	let awardsRootEl: HTMLElement | null = null;

	let hoverCapable = false;
	let allowManual = false; // true only while hovered (desktop)

	let dragging = false;
	let dragStartX = 0;
	let dragStartPhase = 0;

	$: safeRepeatFactor = Math.max(1, Math.min(6, Math.floor(repeatFactor || 1)));
	$: displayAwards =
		awards.length === 0
			? []
			: Array.from({ length: awards.length * safeRepeatFactor }, (_, i) => awards[i % awards.length]!);

	function clamp(n: number, min: number, max: number) {
		return Math.max(min, Math.min(max, n));
	}

	function clamp01(n: number) {
		return Math.max(0, Math.min(1, n));
	}

	function wrap01(n: number) {
		const x = n % 1;
		return x < 0 ? x + 1 : x;
	}

	function easeInOutCubic(t: number) {
		const x = clamp01(t);
		return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
	}

	function shortestDelta(from: number, to: number) {
		// returns delta in [-0.5, 0.5)
		// NOTE: JS % can be negative, so we wrap explicitly.
		let d = wrap01(to - from); // [0,1)
		if (d >= 0.5) d -= 1; // [-0.5,0.5)
		return d;
	}

	function tipPhase() {
		return wrap01(windowStart + 0.5 * (windowEnd - windowStart));
	}

	function displayCount() {
		return Math.max(1, awards.length * safeRepeatFactor);
	}

	function closestIndexToTip() {
		const n = displayCount();
		if (n <= 0) return 0;
		const tip = tipPhase();
		let best = 0;
		let bestDist = Infinity;
		for (let j = 0; j < n; j++) {
			const pj = wrap01(phase + j / n);
			const d = shortestDelta(pj, tip);
			const ad = Math.abs(d);
			if (ad < bestDist) {
				bestDist = ad;
				best = j;
			}
		}
		return best;
	}

	function animatePhaseTo(target: number, durationMs = 560) {
		entryImpulseVelocity = 0;
		phaseAnim = {
			start: phase,
			delta: shortestDelta(phase, wrap01(target)),
			startTime: typeof window !== 'undefined' ? performance.now() : Date.now(),
			durationMs
		};
	}

	function animateToCenteredIndex(idx: number, durationMs = 560) {
		const n = displayCount();
		if (n <= 0) return;
		const tip = tipPhase();
		const targetPhase = wrap01(tip - idx / n);
		animatePhaseTo(targetPhase, durationMs);
	}

	function stepCentered(steps: -1 | 1, durationMs = 560) {
		const n = displayCount();
		if (n <= 0) return;
		const cur = closestIndexToTip();
		const next = (cur + steps + n) % n;
		animateToCenteredIndex(next, durationMs);
	}

	function snapToNearest(durationMs = 420) {
		const n = displayCount();
		if (n <= 0) return;
		animateToCenteredIndex(closestIndexToTip(), durationMs);
	}

	function snapImmediatelyToNearest() {
		const n = displayCount();
		if (n <= 0) return;
		const idx = closestIndexToTip();
		const tip = tipPhase();
		entryImpulseVelocity = 0;
		phaseAnim = null;
		phase = wrap01(tip - idx / n);
	}

	function scheduleSnap(delayMs = 120, durationMs = 420) {
		if (snapTimer != null) window.clearTimeout(snapTimer);
		snapTimer = window.setTimeout(() => {
			snapTimer = null;
			snapToNearest(durationMs);
		}, delayMs);
	}

	function applyWheelToPhase(e: WheelEvent) {
		entryImpulseVelocity = 0;
		phaseAnim = null;
		const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
		phase = (phase - d * wheelPhasePerPx) % 1;
		if (phase < 0) phase += 1;
		scheduleSnap(140, 420);
	}

	function endWheelCapture() {
		wheelCapturedFromCard = false;
		if (wheelIdleTimer != null) {
			clearTimeout(wheelIdleTimer);
			wheelIdleTimer = null;
		}
		if (wheelGlobalListenerActive) {
			window.removeEventListener('wheel', onGlobalWheelWhileCaptured, { capture: true });
			wheelGlobalListenerActive = false;
		}
	}

	function scheduleWheelCaptureIdle() {
		if (wheelIdleTimer != null) clearTimeout(wheelIdleTimer);
		wheelIdleTimer = window.setTimeout(() => {
			wheelIdleTimer = null;
			endWheelCapture();
		}, WHEEL_CAPTURE_IDLE_MS);
	}

	function onGlobalWheelWhileCaptured(e: WheelEvent) {
		if (!wheelCapturedFromCard) return;
		if (!shouldAnimate()) {
			endWheelCapture();
			return;
		}
		e.preventDefault();
		e.stopImmediatePropagation();
		applyWheelToPhase(e);
		scheduleWheelCaptureIdle();
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

			const dt = lastNow > 0 ? Math.max(8, now - lastNow) : 16;
			lastNow = now;

			if (phaseAnim) {
				const t = clamp01((now - phaseAnim.startTime) / phaseAnim.durationMs);
				phase = wrap01(phaseAnim.start + phaseAnim.delta * easeInOutCubic(t));
				if (t >= 1) phaseAnim = null;
			}

			if (entryImpulseVelocity > 1e-6) {
				phase = wrap01(phase + entryImpulseVelocity * (dt / 1000));
				entryImpulseVelocity *= Math.exp(-dt / ENTRY_IMPULSE_DECAY_MS);
				if (entryImpulseVelocity < 0.0016) {
					entryImpulseVelocity = 0;
					scheduleSnap(40, 420);
				}
			}

			// Stop on hover (and while dragging).
			const paused = (hoverCapable && allowManual) || dragging;
			if (autoScroll && !paused) {
				const dur = Math.max(3000, durationMs || 9000);
				phase = (phase + dt / dur) % 1;
			}

			const rect = orbitEl.getBoundingClientRect();
			const w = rect.width;
			const h = rect.height;

			const x0 = startX * w;
			const x1 = endX * w;
			const yPeak = peakY * h;
			// Choose yBase so that at p=0.5 the award sits at centerY * h.
			const k = Math.pow(0.5, Math.max(0.3, fallExp));
			const yCenter = clamp(centerY, 0.2, 0.8) * h;
			const yBase = yPeak + (yCenter - yPeak) / k;

			for (let i = 0; i < n; i++) {
				const el = els[i];
				const phaseI = (phase + i / n) % 1;
				const surface = el.querySelector('.award-card-surface') as HTMLElement | null;

				if (phaseI < windowStart || phaseI > windowEnd) {
					el.style.visibility = 'hidden';
					el.style.pointerEvents = 'none';
					if (surface) surface.style.opacity = '0';
					continue;
				}

				const u = (phaseI - windowStart) / (windowEnd - windowStart); // 0..1
				const a = clamp(slowAtTip, 0, 0.98);
				const p = u + (a / (2 * Math.PI)) * Math.sin(2 * Math.PI * u);

				const x = x0 + (x1 - x0) * p;
				// Enter from above, then arc down as p progresses.
				const y = yPeak + (yBase - yPeak) * Math.pow(p, Math.max(0.3, fallExp));
				const rot = 360 * (p - 0.5);

				el.style.visibility = 'visible';
				el.style.pointerEvents = 'auto';
				el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${rot}deg)`;
				if (surface) surface.style.opacity = '1';
			}

			raf = requestAnimationFrame(tick);
		};

		raf = requestAnimationFrame(tick);
	}

	onMount(() => {
		if (typeof window !== 'undefined') {
			lastNow = performance.now();
			hoverCapable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
		}

		const onResize = () => start();

		const onHoverCheck = (e: MouseEvent) => {
			const t = e.target as HTMLElement | null;
			allowManual = !!t?.closest?.('.award-card-surface');
		};

		const onLeaveOrbit = () => {
			allowManual = false;
		};

		const onWheel = (e: WheelEvent) => {
			if (!shouldAnimate()) return;
			if (!hoverCapable) return;
			const target = e.target as HTMLElement | null;
			const overCard = !!target?.closest?.('.award-card-surface');

			if (overCard) {
				wheelCapturedFromCard = true;
				if (!wheelGlobalListenerActive) {
					window.addEventListener('wheel', onGlobalWheelWhileCaptured, { capture: true, passive: false });
					wheelGlobalListenerActive = true;
				}
			}

			if (!overCard && !wheelCapturedFromCard) return;

			e.preventDefault();
			e.stopPropagation();
			applyWheelToPhase(e);
			scheduleWheelCaptureIdle();
		};

		const onLeaveAwardsForWheel = () => {
			endWheelCapture();
		};

		const onPointerDown = (e: PointerEvent) => {
			if (!shouldAnimate()) return;
			if (hoverCapable && !allowManual) return;
			entryImpulseVelocity = 0;
			phaseAnim = null;
			dragging = true;
			dragStartX = e.clientX;
			dragStartPhase = phase;
			orbitEl?.setPointerCapture?.(e.pointerId);
		};

		const onPointerMove = (e: PointerEvent) => {
			if (!dragging) return;
			const dx = e.clientX - dragStartX;
			phase = (dragStartPhase - dx * wheelPhasePerPx * 1.8) % 1;
			if (phase < 0) phase += 1;
		};

		const onPointerUp = () => {
			if (!dragging) return;
			dragging = false;
			scheduleSnap(40, 460);
		};

		start();
		// On load, pick a resting award snapped to the middle.
		// Wait for bindings/layout so `awardEls` exist.
		if (!didInitialSnap) {
			didInitialSnap = true;
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					snapImmediatelyToNearest();
				});
			});
		}

		let awardsRevealObserver: IntersectionObserver | null = null;
		if (typeof IntersectionObserver !== 'undefined' && awardsRootEl) {
			awardsRevealObserver = new IntersectionObserver(
				(entries) => {
					for (const e of entries) {
						if (!e.isIntersecting || didEntryImpulse) continue;
						if (!shouldAnimate()) continue;
						didEntryImpulse = true;
						phaseAnim = null;
						entryImpulseVelocity = ENTRY_IMPULSE_SPEED;
						awardsRevealObserver?.disconnect();
						awardsRevealObserver = null;
						break;
					}
				},
				{ threshold: 0.16, rootMargin: '0px 0px -6% 0px' }
			);
			awardsRevealObserver.observe(awardsRootEl);
		}

		awardsRootEl?.addEventListener('mouseleave', onLeaveAwardsForWheel, { passive: true });
		orbitEl?.addEventListener('mousemove', onHoverCheck, { passive: true });
		orbitEl?.addEventListener('mouseleave', onLeaveOrbit, { passive: true });
		// Capture phase so we intercept before the page scroller's wheel handler.
		orbitEl?.addEventListener('wheel', onWheel, { passive: false, capture: true });
		orbitEl?.addEventListener('pointerdown', onPointerDown, { passive: true });
		window.addEventListener('pointermove', onPointerMove, { passive: true });
		window.addEventListener('pointerup', onPointerUp, { passive: true });
		window.addEventListener('resize', onResize);
		return () => {
			endWheelCapture();
			awardsRevealObserver?.disconnect();
			if (snapTimer != null) window.clearTimeout(snapTimer);
			awardsRootEl?.removeEventListener('mouseleave', onLeaveAwardsForWheel as EventListener);
			orbitEl?.removeEventListener('mousemove', onHoverCheck as EventListener);
			orbitEl?.removeEventListener('mouseleave', onLeaveOrbit as EventListener);
			orbitEl?.removeEventListener('wheel', onWheel as EventListener, true);
			orbitEl?.removeEventListener('pointerdown', onPointerDown as EventListener);
			window.removeEventListener('pointermove', onPointerMove as EventListener);
			window.removeEventListener('pointerup', onPointerUp as EventListener);
			window.removeEventListener('resize', onResize);
			stop();
		};
	});
</script>

<div class="awards" aria-label="Awards" bind:this={awardsRootEl}>
	<div
		class="awards-carousel awards-orbit"
		bind:this={orbitEl}
		role="region"
		aria-label="Awards carousel"
	>
		<ul class="awards-ring" aria-label="Awards list">
			{#each displayAwards as award, i (`${award.heading}-${i}`)}
				<li class="award-item" bind:this={awardEls[i]}>
					<div class="award-card-surface" aria-hidden={i >= awards.length ? 'true' : undefined}>
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

	<div class="awards-header" aria-label="Awards summary">
		{#if kicker}
			<p class="kicker">{kicker}</p>
		{/if}
		<div class="awards-title-row" aria-label="Awards title and navigation">
			<button type="button" class="awards-nav-btn" aria-label="Previous award" onclick={() => stepCentered(1)}>
				<span aria-hidden="true">‹</span>
			</button>
			<h1 class="title">{title}</h1>
			<button type="button" class="awards-nav-btn" aria-label="Next award" onclick={() => stepCentered(-1)}>
				<span aria-hidden="true">›</span>
			</button>
		</div>
		<p class="body">{body}</p>
	</div>
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

	.awards {
		position: relative;
		width: min(980px, 100%);
		height: 100%;
		isolation: isolate;
	}

	.awards-carousel {
		position: relative;
		width: 100%;
		height: 100%;
		/* Important: avoid overflow clipping so the arc can extend vertically. */
		overflow: visible;
		/* Clip left/right like before, without clipping top/bottom. */
		-webkit-clip-path: inset(-1200px 0 -1200px 0);
		clip-path: inset(-1200px 0 -1200px 0);
		padding: 0;
	}

	/* (no edge fades) */

	.awards-orbit {
		position: absolute;
		inset: 0;
		isolation: isolate;
		touch-action: pan-y;
		cursor: default;
	}

	@media (hover: hover) and (pointer: fine) {
		.awards-orbit:hover {
			cursor: grab;
		}
		.awards-orbit:hover:active {
			cursor: grabbing;
		}
	}

	.awards-ring {
		position: absolute;
		inset: 0;
		margin: 0;
		padding: 0;
		list-style: none;
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
		opacity: 1;
	}

	.awards-header {
		position: absolute;
		left: 50%;
		top: 53%;
		/* Keep copy just below mid-screen */
		transform: translate(-50%, clamp(60px, 8vh, 120px));
		text-align: center;
		width: min(520px, 92%);
	}

	.awards-title-row {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
	}

	.awards-title-row .title {
		margin: 0;
		text-shadow:
			0 0 28px rgba(255, 255, 255, 1),
			0 0 56px rgba(255, 255, 255, 0.85),
			0 0 100px rgba(255, 255, 255, 0.55),
			0 0 160px rgba(255, 255, 255, 0.35);
	}

	.awards-nav-btn {
		appearance: none;
		border: 1px solid var(--card-border);
		background: rgba(255, 255, 255, 0.55);
		backdrop-filter: blur(calc(var(--glass-blur) + 2px));
		border-radius: 999px;
		width: 34px;
		height: 34px;
		display: grid;
		place-items: center;
		color: rgba(11, 18, 32, 0.9);
		cursor: pointer;
		user-select: none;
		transition: transform 140ms ease, background-color 140ms ease;
	}

	.awards-nav-btn:hover {
		background: rgba(255, 255, 255, 0.7);
		transform: translateY(-1px);
	}

	.awards-nav-btn:active {
		transform: translateY(0);
	}

	.awards-header .body {
		margin-bottom: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		.awards-carousel {
			padding-top: 0;
		}
		.awards-carousel::before,
		.awards-carousel::after {
			display: none;
		}
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
			width: min(540px, 92vw);
			margin-inline: auto;
		}
	}

	@media (max-width: 720px) {
		.awards-carousel {
			padding-top: 0;
		}
		.awards-carousel::before,
		.awards-carousel::after {
			display: none;
		}
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
			width: min(540px, 92vw);
			margin-inline: auto;
		}
	}
</style>

