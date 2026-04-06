/** `static/background.svg` — path in viewBox 0 0 3200 300 */
export const RIBBON_VIEWBOX_W = 3200;
export const RIBBON_VIEWBOX_H = 300;

/** Ribbon extends this far past each viewport edge (total +60px vs scroll track). */
export const RIBBON_SIDE_BLEED_PX = 30;

/** Matches greeting intro: `greetingScrollLocked` clears after this (see `+page.svelte`). */
export const GREETING_SCROLL_UNLOCK_MS = 1750;

export const RIBBON_PATH_D =
	'm -12.914181,111.40442 c 590.857891,-0.62626 143.701551,103.81272 282.481281,80.44502 86.94196,-14.63927 92.43184,-84.44327 34.74779,-45.56945 -110.24799,74.29716 111.69439,9.92858 129.58722,-3.31676 18.30719,-13.55208 -34.95776,-14.26853 -79.79039,46.93158 -14.63959,19.9842 64.74964,-15.98568 64.74964,-15.98568 0,0 5.34627,6.47487 -20.4468,23.8173 -62.06536,41.73075 -63.74974,152.47679 85.06848,34.83426 173.31068,-137.004109 389.59544,-125.31322 432.39345,-124.95271 28.71572,0.24189 25.61363,-23.184702 25.45812,-41.241642 -0.0901,-10.46198 -19.13995,-19.511717 -43.78868,-19.511717 -26.72535,0 -51.04783,4.08019 -50.82093,18.37206 0.0648,4.08065 19.95517,21.62226 91.92951,0.54052 7.79074,-2.28196 24.97896,2.23571 24.97896,12.18953 0,15.99737 0.69239,38.915039 0.10005,53.502339 -0.82645,20.35281 -11.39545,19.56432 -27.86198,20.03815 -41.4397,1.19245 -52.19109,1.54534 -76.35443,0.59983 -24.16334,-0.9455 -42.09036,4.30987 -40.59794,-15.71555 1.24481,-16.70291 1.33659,-42.973249 1.33659,-59.082379 0,-7.64016 5.29566,-11.671529 23.97462,-12.10887 128.08727,-2.99898 243.08752,96.296669 380.64162,107.332739 137.5541,11.03607 30.5571,70.25212 107.2486,69.92756 76.6916,-0.32455 -16.6336,-21.40533 -46.4866,-32.47007 -8.4961,-2.08473 -8.3613,-7.48661 -1.9659,-10.16374 11.9584,-5.00586 19.464,-7.7785 34.4289,-13.68073 14.965,-5.90223 21.1368,-5.73995 32.8048,0.0966 11.668,5.83657 24.427,12.17776 30.0241,15.61324 5.5971,3.43548 5.3442,6.33512 0.4744,8.1921 -16.387,6.24883 -65.9392,-6.06203 -49.1374,-6.3776 65.7042,-1.23405 44.2886,71.24002 46.6522,85.09903 0,0 209.7418,-226.591175 291.2449,-162.38755 81.5031,64.20362 91.5819,72.92109 120.5784,98.25797 5.1885,4.53365 13.2354,20.72681 12.8695,21.02603 -0.4737,0.38741 -13.6585,-1.23737 -22.7355,-7.28722 -24.6101,-16.40273 -89.4174,-66.45412 -117.502,-89.20891 -10.7189,-8.68466 -6.1218,-13.31021 -1.3383,-17.51679 9.0044,-7.91843 20.4871,4.36347 12.9381,5.02917 -4.6881,0.41342 -10.5068,5.12676 -8.6145,10.46865 2.6844,7.57779 171.8412,131.42977 202.7858,129.75844 46.8074,-2.52811 37.8146,-32.7113 61.59,-40.43437 35.8333,-11.63991 16.976,117.5622 91.4932,-1.24948 132.6328,-211.472315 292.2986,3.89055 282.3923,16.75118 -9.9063,12.86063 -67.2951,-14.47013 -121.7691,-30.58036 -54.474,-16.11022 60.9163,-29.44165 114.0783,-39.62421 53.162,-10.18256 -124.384,128.0261 -92.342,56.42455 32.042,-71.60155 -13.9634,-166.396561 538.0936,-150.186567 338.0187,9.925208 149.1456,98.051147 78.4522,112.014567 0,0 -98.0235,-210.142931 30.7525,-126.221477 128.776,83.921457 -166.3845,82.588727 -87.1505,145.443827 79.2339,62.85511 505.3109,-2.19859 505.3109,-2.19859';

export const RIBBON_REVEAL_DURATION_MS = 3000;
/** Relative arc-length speed on nearly straight runs (κ → 0). */
export const RIBBON_REVEAL_SPEED_MAX = 2;
/** Floor speed at sharp bends (high κ), so curves still get visible dwell time. */
export const RIBBON_REVEAL_SPEED_MIN = 0.5;
/**
 * Scales κ = (turn angle)/(segment length) into speed = speedMax/(1 + scale·κ).
 * Larger → stronger slowdown on tight curves.
 */
export const RIBBON_REVEAL_CURVATURE_SCALE = 200;

function clamp01(n: number) {
	return Math.max(0, Math.min(1, n));
}

function clamp(n: number, min: number, max: number) {
	return Math.max(min, Math.min(max, n));
}

export function prefersReducedMotionRibbon() {
	return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Maps linear time t∈[0,1] to arc length s∈[0,L]. Reveal **speed** (arc per unit time)
 * scales inversely with local curvature κ ≈ (turn angle)/(step length): straights move faster,
 * tight bends slower; total duration stays fixed.
 */
export function buildRibbonDistanceAtNormalizedTime(path: SVGPathElement): ((t: number) => number) | null {
	const L = path.getTotalLength();
	if (!(L > 0)) return null;
	// Fewer samples: getPointAtLength is expensive on long paths; ~350–500 steps is enough for the mask.
	const n = Math.min(480, Math.max(96, Math.ceil(L / 28)));
	const ds = L / n;
	const weights: number[] = new Array(n + 1);
	weights[0] = 0;
	for (let i = 0; i < n; i++) {
		const s0 = i * ds;
		const s1 = (i + 0.5) * ds;
		const s2 = Math.min((i + 1) * ds, L);
		const p0 = path.getPointAtLength(s0);
		const p1 = path.getPointAtLength(s1);
		const p2 = path.getPointAtLength(s2);
		const v1x = p1.x - p0.x;
		const v1y = p1.y - p0.y;
		const v2x = p2.x - p1.x;
		const v2y = p2.y - p1.y;
		const len1 = Math.hypot(v1x, v1y);
		const len2 = Math.hypot(v2x, v2y);
		let segmentCost = ds;
		if (len1 > 1e-6 && len2 > 1e-6) {
			const dot = (v1x * v2x + v1y * v2y) / (len1 * len2);
			const angleRad = Math.acos(clamp(dot, -1, 1));
			// Scalar curvature proxy: turning per unit length along the sample polyline.
			const kappa = angleRad / Math.max(ds, 1e-6);
			const rawSpeed = RIBBON_REVEAL_SPEED_MAX / (1 + RIBBON_REVEAL_CURVATURE_SCALE * kappa);
			const speed = clamp(rawSpeed, RIBBON_REVEAL_SPEED_MIN, RIBBON_REVEAL_SPEED_MAX);
			segmentCost = ds / speed;
		}
		weights[i + 1] = weights[i]! + segmentCost;
	}
	const totalW = weights[n]!;
	return (t: number) => {
		const u = clamp01(t) * totalW;
		let lo = 0;
		let hi = n;
		while (lo < hi) {
			const mid = (lo + hi + 1) >> 1;
			if (weights[mid]! <= u) lo = mid;
			else hi = mid - 1;
		}
		const i = Math.min(lo, n - 1);
		const w0 = weights[i]!;
		const w1 = weights[i + 1]!;
		const segT = w1 > w0 ? (u - w0) / (w1 - w0) : 0;
		return Math.min(L, (i + segT) * ds);
	};
}
