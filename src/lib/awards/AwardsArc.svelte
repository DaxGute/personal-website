<script lang="ts">
	import { onMount } from 'svelte';
	import InfoCard from '$lib/InfoCard.svelte';
	import { abbreviateMonths } from '$lib/format';
	import { isCardModalOpen } from '$lib/cardModal';
	import { createWheelIntent, type WheelIntent } from '$lib/wheelIntent';
	import type { AwardItem } from '$lib/awards/awards';
	import ShutterHeading from '$lib/title/ShutterHeading.svelte';

	type Award = AwardItem;

	export let title: string;
	export let awards: Award[] = [];

	// Repeat the awards list to tighten pacing while keeping spacing constant.
	export let repeatFactor = 3;

	// Autoscroll (disabled by default).
	export let autoScroll = false;
	// If enabled, autoscroll speed (one full cycle duration).
	export let durationMs = 9000;

	// Visible arc window (0..1).
	// Wider window keeps more awards on the arc so several previews stay in view.
	export let windowStart = 0.0;
	export let windowEnd = 0.8;

	// Higher = more slowdown at the tip (u≈0.5).
	export let slowAtTip = 0.08; // 0..1 (must be < 1)

	// Arc geometry in container coordinates.
	// Peak stays near the top of the orbit so preview cards above the focus remain on screen.
	export let peakY = -0.16; // fraction of height (negative => above top)
	// Center the active award at mid-screen.
	export let centerY = 0.5; // fraction of height
	// Controls how quickly the arc falls (higher => stays high longer, then drops).
	export let fallExp = 1.22;
	// Narrower horizontal travel => awards sit closer together.
	export let startX = -0.24; // fraction of width
	export let endX = 1.24; // fraction of width

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
	/** Accumulated button-nav burst: same-direction clicks extend the target instead of restarting. */
	let navState: { direction: -1 | 1; originIdx: number; totalSteps: number } | null = null;
	let snapTimer: number | null = null;
	let didInitialSnap = false;

	/** Wheel began on an award card; keep blocking page scroll until idle or leaving the awards block. */
	let wheelCapturedFromCard = false;
	let wheelIdleTimer: ReturnType<typeof setTimeout> | null = null;
	let wheelGlobalListenerActive = false;
	/** Armed only after the pointer moves on the awards block, never by the block sliding under a still cursor. */
	let wheelIntent: WheelIntent | null = null;

	// One-time “push” when the awards first scroll into view: phase spins then eases to rest.
	let entryImpulseVelocity = 0; // cycles per second
	let didEntryImpulse = false;
	let awardsRootEl: HTMLElement | null = null;

	let hoverCapable = false;
	let allowManual = false; // true only while hovered (desktop)
	/** Short landscape (flipped phone): keep the arc inside the viewport. */
	let compactArc = false;
	/** RAF timestamp when modal freeze began; used to shift phaseAnim clocks on resume. */
	let modalFreezeAt: number | null = null;

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

	function easeOutCubic(t: number) {
		return 1 - Math.pow(1 - clamp01(t), 3);
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

	function clearNavState() {
		navState = null;
	}

	function animatePhaseTo(target: number, durationMs = 560) {
		clearNavState();
		entryImpulseVelocity = 0;
		phaseAnim = {
			start: phase,
			delta: shortestDelta(phase, wrap01(target)),
			startTime: typeof window !== 'undefined' ? performance.now() : Date.now(),
			durationMs
		};
	}

	/** Recompute phaseAnim from navState; repeated same-direction clicks extend distance and shorten duration. */
	function applyNavAnimation() {
		if (!navState) return;
		const n = displayCount();
		if (n <= 0) return;

		const tip = tipPhase();
		const stepSize = 1 / n;
		const originPhase = wrap01(tip - navState.originIdx / n);
		const signedTotalDelta = -navState.direction * navState.totalSteps * stepSize;
		const targetPhase = wrap01(originPhase + signedTotalDelta);

		// Continue in the nav direction (not shortest arc) so multi-step bursts feel continuous.
		let delta = targetPhase - phase;
		if (navState.direction === -1) {
			if (delta <= 0) delta += 1;
		} else if (delta >= 0) {
			delta -= 1;
		}

		const perStepMs = 520;
		const burstSpeed = (stepSize / perStepMs) * Math.sqrt(navState.totalSteps);
		const durationMs = clamp(Math.abs(delta) / burstSpeed, 220, 680);

		entryImpulseVelocity = 0;
		if (snapTimer != null) {
			window.clearTimeout(snapTimer);
			snapTimer = null;
		}

		phaseAnim = {
			start: phase,
			delta,
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

	function stepCentered(steps: -1 | 1) {
		const n = displayCount();
		if (n <= 0) return;

		if (navState && navState.direction === steps) {
			navState.totalSteps += 1;
		} else {
			navState = {
				direction: steps,
				originIdx: closestIndexToTip(),
				totalSteps: 1
			};
		}

		applyNavAnimation();
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
		clearNavState();
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
		if (!wheelCapturedFromCard || !wheelIntent?.claims()) {
			endWheelCapture();
			return;
		}
		if (!shouldAnimate()) {
			endWheelCapture();
			return;
		}
		e.preventDefault();
		e.stopImmediatePropagation();
		applyWheelToPhase(e);
		scheduleWheelCaptureIdle();
	}

	/**
	 * Opacity by distance from the arc tip, in award steps.
	 * The focused award stays solid. Previews above and below it are lighter
	 * and stay readable through the third card, with a hint of a fourth.
	 */
	function arcOpacity(stepsFromTip: number) {
		const dist = Math.abs(stepsFromTip);
		if (dist <= 0.2) return 1;
		const goneBy = 4.2;
		if (dist >= goneBy) return 0;
		const t = clamp01((dist - 0.2) / (goneBy - 0.2));
		// First preview is already translucent; the third stays readable.
		return 0.46 * Math.pow(1 - t, 0.62);
	}

	/** Focused card stays full size. Previews shrink so three or more fit on the arc. */
	function arcScale(stepsFromTip: number) {
		const dist = Math.abs(stepsFromTip);
		const lead = Math.max(0, dist - 0.12);
		return clamp(1 / (1 + lead * 0.95), 0.3, 1);
	}

	/** Avoid translucent award surfaces during modal open/close (backdrop-filter / clip toggles flash them). */
	function snapAwardOpacitiesForModal(els: HTMLElement[]) {
		for (const el of els) {
			const surface = el.querySelector('.award-card-surface');
			if (!(surface instanceof HTMLElement)) continue;
			const raw = Number.parseFloat(surface.style.opacity || '1');
			const snapped = Number.isFinite(raw) && raw >= 0.5 ? 1 : 0;
			surface.style.opacity = String(snapped);
			if (snapped === 0) {
				el.style.visibility = 'hidden';
				el.style.pointerEvents = 'none';
			}
		}
	}

	function readCompactArc() {
		compactArc =
			typeof window !== 'undefined' &&
			window.matchMedia('(max-height: 520px) and (min-aspect-ratio: 1)').matches;
	}

	function shouldAnimate() {
		if (typeof window === 'undefined') return false;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
		// Narrow portrait falls back to a static stack. Landscape phones keep the arc.
		if (window.matchMedia('(max-width: 720px) and (max-aspect-ratio: 1)').matches) return false;
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

			// Freeze while a card modal zooms the stage — otherwise sibling awards
			// remeasure against the scaled getBoundingClientRect and drift.
			if (isCardModalOpen()) {
				if (modalFreezeAt == null) {
					modalFreezeAt = now;
					snapAwardOpacitiesForModal(els);
				}
				lastNow = 0;
				raf = requestAnimationFrame(tick);
				return;
			}
			if (modalFreezeAt != null) {
				const freezeMs = now - modalFreezeAt;
				if (phaseAnim) phaseAnim.startTime += freezeMs;
				modalFreezeAt = null;
			}

			const dt = lastNow > 0 ? Math.max(8, now - lastNow) : 16;
			lastNow = now;

			if (phaseAnim) {
				const t = clamp01((now - phaseAnim.startTime) / phaseAnim.durationMs);
				const eased = navState ? easeOutCubic(t) : easeInOutCubic(t);
				phase = wrap01(phaseAnim.start + phaseAnim.delta * eased);
				if (t >= 1) {
					phaseAnim = null;
					clearNavState();
				}
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

			// Layout size (not transformed) so stage zoom / scroll compensate don't move the arc.
			const w = orbitEl.clientWidth;
			const h = orbitEl.clientHeight;

			const arcStart = compactArc ? 0.2 : startX;
			const arcEnd = compactArc ? 0.8 : endX;
			const arcPeak = compactArc ? 0.28 : peakY;
			const arcCenter = compactArc ? 0.48 : centerY;
			const arcFall = compactArc ? 1.05 : fallExp;
			const x0 = arcStart * w;
			const x1 = arcEnd * w;
			const yPeak = arcPeak * h;
			// Choose yBase so that at p=0.5 the award sits at centerY * h.
			const k = Math.pow(0.5, Math.max(0.3, arcFall));
			const yCenter = clamp(arcCenter, 0.2, 0.8) * h;
			const yBase = yPeak + (yCenter - yPeak) / k;
			const tip = tipPhase();
			const step = 1 / n;

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

				const along = clamp(p, 0, 1);
				const fromMid = Math.abs(along - 0.5) * 2;
				// Hold the path beside the focused card, then hook the ends
				// so awards arrive from the top and leave through the bottom.
				const hookStart = 0.26;
				const hookT = clamp((fromMid - hookStart) / (1 - hookStart), 0, 1);
				const curl = hookT * hookT * (3 - 2 * hookT);
				const curlLift = (compactArc ? 0.1 : 0.26) * h;
				const curlTuck = (compactArc ? 0.1 : 0.38) * (x1 - x0);
				const side = along < 0.5 ? -1 : 1;
				const x = x0 + (x1 - x0) * along - side * curl * curlTuck;
				const y =
					yPeak +
					(yBase - yPeak) * Math.pow(along, Math.max(0.3, arcFall)) +
					side * curl * curlLift;
				const rawTilt = 360 * (along - 0.5) * (compactArc ? 0.32 : 1);
				const rot = clamp(rawTilt * Math.pow(1 - curl, 1.15), -62, 62);

				// Signed award-steps from this card to the tip (positive = still incoming).
				const stepsToTip = shortestDelta(phaseI, tip) / step;
				const opacity = arcOpacity(stepsToTip);
				const scale = arcScale(stepsToTip);
				// Nearer cards paint above farther ones. The header is a later sibling
				// stacking context, so these stay underneath the title and nav.
				const depth = Math.min(Math.abs(stepsToTip), 8);

				el.style.visibility = opacity < 0.02 ? 'hidden' : 'visible';
				el.style.pointerEvents = opacity < 0.12 ? 'none' : 'auto';
				el.style.zIndex = String(Math.round(40 - depth * 5));
				el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${rot}deg) scale(${scale})`;
				if (surface) surface.style.opacity = String(opacity);
			}

			raf = requestAnimationFrame(tick);
		};

		raf = requestAnimationFrame(tick);
	}

	onMount(() => {
		if (typeof window !== 'undefined') {
			lastNow = performance.now();
			hoverCapable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
			readCompactArc();
		}

		const onResize = () => {
			readCompactArc();
			start();
		};

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
			// Gesture owner was chosen on the first wheel event. A card that slides
			// under a still cursor does not own it, so the page keeps scrolling.
			if (!wheelIntent?.claims()) return;

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
			const target = e.target as HTMLElement | null;
			if (target?.closest?.('.info-card')) return;
			if (hoverCapable && !allowManual) return;
			clearNavState();
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

		if (awardsRootEl) {
			wheelIntent = createWheelIntent(awardsRootEl, (e) => {
				const node = e.target instanceof Element ? e.target : (e.target as Node | null)?.parentElement;
				return !!node?.closest('.award-card-surface');
			});
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
			wheelIntent?.destroy();
			wheelIntent = null;
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
							dates={abbreviateMonths(award.dates)}
							items={award.items}
							logoSrc={award.logoSrc ?? null}
							logoAlt={award.logoAlt ?? null}
							logoHref={award.logoHref ?? null}
							logoLinkLabel={award.logoLinkLabel ?? null}
							backTextScale={award.backTextScale ?? 1}
						/>
					</div>
				</li>
			{/each}
		</ul>
	</div>

	<div class="awards-header" aria-label="Awards summary">
		<div class="awards-title-row" aria-label="Awards title and navigation">
			<button type="button" class="awards-nav-btn" aria-label="Previous award" onclick={() => stepCentered(1)}>
				<span aria-hidden="true">‹</span>
			</button>
			<ShutterHeading {title} flush />
			<button type="button" class="awards-nav-btn" aria-label="Next award" onclick={() => stepCentered(-1)}>
				<span aria-hidden="true">›</span>
			</button>
		</div>
	</div>
</div>

<style>
	.awards {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: min(calc(980px * 1.3), calc(100% - 46.8px));
		height: min(720px, 76vh);
		isolation: isolate;
		--award-card-w: var(--playing-card-w, 220px);
		--award-card-h: var(--playing-card-h, 308px);
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
		width: var(--award-card-w);
		height: var(--award-card-h);
		aspect-ratio: var(--playing-card-ratio, 5 / 7);
		position: relative;
		opacity: 1;
		will-change: opacity;
	}

	.awards-header {
		position: absolute;
		left: 50%;
		top: 50%;
		z-index: 2;
		pointer-events: none;
		/* Keep copy just below the arc focal point */
		transform: translate(-50%, calc(var(--award-card-h) / 2 + 36px));
		text-align: center;
		width: min(520px, 92%);
	}

	.awards-header :global(.shutter-title) {
		pointer-events: none;
	}

	.awards-title-row {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		pointer-events: auto;
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

	@media (prefers-reduced-motion: reduce) {
		.awards {
			position: relative;
			left: auto;
			top: auto;
			transform: none;
			width: 100%;
			height: auto;
			padding: clamp(90px, 12vh, 140px) calc(18px * 1.3) 24px;
		}
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
			width: var(--award-card-w);
			height: var(--award-card-h);
			margin-inline: auto;
		}
	}

	@media (max-width: 720px) {
		.awards {
			position: relative;
			left: auto;
			top: auto;
			transform: none;
			width: 100%;
			height: auto;
			padding: clamp(90px, 12vh, 140px) calc(18px * 1.3) 24px;
		}
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
			width: var(--award-card-w);
			height: var(--award-card-h);
			margin-inline: auto;
		}
	}

	/* Flipped phone: title sits above a shorter arc so cards stay inside the screen. */
	@media (max-height: 520px) and (min-aspect-ratio: 1) {
		.awards {
			position: absolute;
			left: 50%;
			top: 50%;
			transform: translate(-50%, -50%);
			width: calc(100% - 8px);
			height: 100%;
			padding: 0;
			--award-card-w: clamp(100px, calc((100vh - 214px) * 5 / 7), var(--playing-card-w, 148px));
			--award-card-w: clamp(100px, calc((100dvh - 214px) * 5 / 7), var(--playing-card-w, 148px));
			--award-card-h: calc(var(--award-card-w) * 7 / 5);
		}

		.awards-carousel,
		.awards-orbit,
		.awards-ring {
			position: absolute;
			inset: 0;
			display: block;
			height: 100%;
			padding: 0;
		}

		.award-item {
			position: absolute;
			top: 0;
			left: 0;
		}

		.awards-header {
			top: 6px;
			width: min(440px, 94%);
			transform: translate(-50%, 0);
		}

		.awards-nav-btn {
			width: 30px;
			height: 30px;
		}
	}
</style>

