<script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';
	import {
		GREETING_SCROLL_UNLOCK_MS,
		RIBBON_PATH_D,
		RIBBON_RENDER_HEIGHT_PX,
		RIBBON_RENDER_WIDTH_PX,
		RIBBON_SIDE_BLEED_PX,
		RIBBON_VIEWBOX_H,
		RIBBON_VIEWBOX_W,
		buildRibbonDistanceAtNormalizedTime,
		prefersReducedMotionRibbon,
		ribbonLayerWidthPx
	} from '$lib/ribbon';

	/** Only the first 1/5 of normalized `t` passed to `buildRibbonDistanceAtNormalizedTime`. */
	const REVEAL_FIRST_FIFTH = 0.25;

	let ribbonLayerEl: HTMLDivElement | null = null;
	let ribbonEl: SVGSVGElement | null = null;
	let ribbonRevealMaskEl: SVGPathElement | null = null;
	let ribbonPaintW = ribbonLayerWidthPx(RIBBON_RENDER_WIDTH_PX);
	let revealIdleRaf: number | null = null;
	let revealFinalized = false;

	let revealPathL = 0;
	let revealDistanceAtTime: ((t: number) => number) | null = null;
	let revealStartMs = 0;
	let lastScrollLeft = 0;

	/** After the reveal finishes, drop mask + dim layer so scroll only paints one gradient stroke. */
	function finalizeReveal() {
		if (revealFinalized || !ribbonEl) return;
		cancelRevealIdleLoop();
		revealFinalized = true;
		const bright = ribbonEl.querySelector<SVGPathElement>('.ribbon-path--bright');
		const base = ribbonEl.querySelector<SVGPathElement>('.ribbon-path--base');
		bright?.removeAttribute('mask');
		base?.remove();
		ribbonEl.querySelector('#ribbonRevealMask')?.remove();
		ribbonRevealMaskEl = null;
		revealDistanceAtTime = null;
	}

	/** Called from the page on every scroll sample — first non-zero scroll completes the ribbon. */
	export function syncRevealScroll(scrollLeft: number) {
		lastScrollLeft = scrollLeft;
		if (scrollLeft > 0 && !revealFinalized) finalizeReveal();
	}

	/** Match painted width to the scroll track (imperative — avoids reactive prop invalidation). */
	export function syncLayout(trackWidthPx: number) {
		const w = ribbonLayerWidthPx(trackWidthPx);
		if (w === ribbonPaintW) return;
		ribbonPaintW = w;
		if (ribbonLayerEl) ribbonLayerEl.style.width = `${w}px`;
		if (ribbonEl) ribbonEl.setAttribute('width', String(w));
	}

	function cancelRevealIdleLoop() {
		if (revealIdleRaf != null) cancelAnimationFrame(revealIdleRaf);
		revealIdleRaf = null;
	}

	function cancelRevealAnim() {
		cancelRevealIdleLoop();
	}

	function startRevealAnimation() {
		const path = ribbonRevealMaskEl;
		if (!path) return;
		cancelRevealAnim();
		const L = path.getTotalLength();
		if (!(L > 0)) return;
		path.style.strokeDasharray = String(L);
		const distanceAtTime = buildRibbonDistanceAtNormalizedTime(path);
		if (!distanceAtTime) return;

		if (prefersReducedMotionRibbon()) {
			path.style.strokeDashoffset = '0';
			queueMicrotask(finalizeReveal);
			return;
		}

		revealPathL = L;
		revealDistanceAtTime = distanceAtTime;
		revealStartMs = performance.now();
		path.style.strokeDashoffset = String(L);

		function revealIdleTick() {
			if (revealFinalized || !ribbonRevealMaskEl || !revealDistanceAtTime) {
				revealIdleRaf = null;
				return;
			}
			const p = ribbonRevealMaskEl;
			if (lastScrollLeft > 0) {
				finalizeReveal();
				return;
			}
			const elapsed = performance.now() - revealStartMs;
			const linearT = Math.min(1, elapsed / GREETING_SCROLL_UNLOCK_MS);
			const tNorm = REVEAL_FIRST_FIFTH * linearT;
			const s = revealDistanceAtTime(tNorm);
			p.style.strokeDashoffset = String(revealPathL - s);
			if (linearT >= 1) {
				revealIdleRaf = null;
				return;
			}
			revealIdleRaf = requestAnimationFrame(revealIdleTick);
		}
		revealIdleRaf = requestAnimationFrame(revealIdleTick);
	}

	function scheduleRevealAfterIdle() {
		const run = () => startRevealAnimation();
		if (typeof requestIdleCallback !== 'undefined') {
			requestIdleCallback(run, { timeout: 150 });
		} else {
			setTimeout(run, 0);
		}
	}

	onMount(() => {
		void tick().then(() => {
			requestAnimationFrame(() => {
				scheduleRevealAfterIdle();
			});
		});
	});

	onDestroy(() => {
		cancelRevealIdleLoop();
	});
</script>

<!-- Absolutely positioned inside `.scroller`: moves with native horizontal scroll (no per-frame viewBox/transform). -->
<div
	bind:this={ribbonLayerEl}
	class="ribbon-layer"
	aria-hidden="true"
	style:left={`-${RIBBON_SIDE_BLEED_PX}px`}
	style:width={`${ribbonPaintW}px`}
>
	<svg
		bind:this={ribbonEl}
		class="ribbon"
		focusable="false"
		width={ribbonPaintW}
		height={RIBBON_RENDER_HEIGHT_PX}
		viewBox={`0 0 ${RIBBON_VIEWBOX_W} ${RIBBON_VIEWBOX_H}`}
		preserveAspectRatio="none"
	>
		<defs>
			<linearGradient
				id="ribbonStroke"
				gradientUnits="objectBoundingBox"
				x1="0"
				y1="0"
				x2="1"
				y2="0"
			>
				<stop offset="0%" stop-color="rgb(124 58 237)" stop-opacity="1" />
				<stop offset="45%" stop-color="rgb(34 211 238)" stop-opacity="1" />
				<stop offset="100%" stop-color="rgb(16 185 129)" stop-opacity="1" />
			</linearGradient>

			<mask
				id="ribbonRevealMask"
				maskUnits="userSpaceOnUse"
				maskContentUnits="userSpaceOnUse"
				x="0"
				y="0"
				width={RIBBON_VIEWBOX_W}
				height={RIBBON_VIEWBOX_H}
			>
				<path
					bind:this={ribbonRevealMaskEl}
					class="ribbon-reveal-mask"
					d={RIBBON_PATH_D}
					fill="none"
					stroke="white"
					stroke-width="2"
					stroke-linecap="butt"
					stroke-linejoin="miter"
					stroke-miterlimit="10"
				/>
			</mask>
		</defs>

		<path class="ribbon-path ribbon-path--base" d={RIBBON_PATH_D} />
		<path class="ribbon-path ribbon-path--bright" d={RIBBON_PATH_D} mask="url(#ribbonRevealMask)" />
	</svg>
</div>

<style>
	.ribbon-layer {
		position: absolute;
		top: 0;
		height: 100%;
		z-index: 1;
		pointer-events: none;
		overflow: visible;
		contain: paint;
		display: flex;
		align-items: center;
	}

	.ribbon {
		display: block;
		flex: 0 0 auto;
	}

	.ribbon-path {
		fill: none;
		stroke-width: 2;
		stroke-linecap: butt;
		stroke-linejoin: miter;
		stroke-miterlimit: 10;
		shape-rendering: optimizeSpeed;
	}

	.ribbon-path--base {
		stroke: url(#ribbonStroke);
		opacity: 0.14;
	}

	.ribbon-path--bright {
		stroke: url(#ribbonStroke);
		opacity: 1;
	}

	.ribbon-reveal-mask {
		stroke-dasharray: 100000;
		stroke-dashoffset: 100000;
	}
</style>
