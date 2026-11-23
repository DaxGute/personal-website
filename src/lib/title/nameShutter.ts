/** Track starts this far to the right, then eases left to 0. Not a scroll position — it cannot be re-entered. */
export const NAME_INTRO_SHIFT_PX = 120;

export const NAME_INTRO_MS = 1450;

function clamp01(n: number) {
	return Math.max(0, Math.min(1, n));
}

function smoothstep(t: number) {
	const x = clamp01(t);
	return x * x * (3 - 2 * x);
}

function inverseSmoothstep(s: number) {
	const x = clamp01(s);
	const arg = Math.min(1, Math.max(-1, 1 - 2 * x));
	return 0.5 - Math.sin(Math.asin(arg) / 3);
}

/** Share of the close spent bringing the left edge in, then the right. */
const CLOSE_LEFT_PHASE = 0.42;
const CLOSE_LEFT_INSET = 0.48;
const CLOSE_RIGHT_INSET = 0.54;

/**
 * `signedScroll` < 0 is the opening pose (far left of each glyph cut, fully open at 0).
 * `signedScroll` > 0 is user scroll: the left side of each glyph closes first, then the right,
 * until the glyph is fully covered at `shutterSpanPx`.
 * Fractions are clip-path insets (0–1) from the left and right of each character.
 */
export function nameShutterInsets(
	signedScroll: number,
	shutterSpanPx: number
): { left: number; right: number } {
	if (signedScroll <= 0) {
		const t = clamp01(-signedScroll / NAME_INTRO_SHIFT_PX);
		return { left: smoothstep(t) * 0.34, right: 0 };
	}

	const t = clamp01(signedScroll / Math.max(1, shutterSpanPx));
	if (t <= CLOSE_LEFT_PHASE) {
		return { left: smoothstep(t / CLOSE_LEFT_PHASE) * CLOSE_LEFT_INSET, right: 0 };
	}
	const right = smoothstep((t - CLOSE_LEFT_PHASE) / (1 - CLOSE_LEFT_PHASE)) * CLOSE_RIGHT_INSET;
	return { left: CLOSE_LEFT_INSET, right };
}

/**
 * `0.3^p = 1/5`, so the heading is 80% open at 35% and 65% of its travel
 * (0.3 of the way from center to either edge) and fully open at the center.
 */
const HEADER_OPEN_FALLOFF = Math.log(0.2) / Math.log(0.3);

/**
 * How open a section heading is while it travels across the screen.
 * `progress` 0 is the previous section, 1 is the next.
 * 0 at either edge, 0.8 at 35% and 65%, 1 while the section is centered.
 */
function headerOpenAmount(progress: number) {
	const fromCenter = Math.abs(clamp01(progress) - 0.5) * 2;
	return 1 - Math.pow(fromCenter, HEADER_OPEN_FALLOFF);
}

/** Covered amount (0 open, 1 shut) that leaves `open` of each glyph showing. */
function coveredForOpenAmount(open: number) {
	const visible = clamp01(open);
	if (visible >= 1) return 0;
	if (visible <= 0) return 1;
	const afterLeft = 1 - CLOSE_LEFT_INSET;
	if (visible >= afterLeft) {
		return inverseSmoothstep((1 - visible) / CLOSE_LEFT_INSET) * CLOSE_LEFT_PHASE;
	}
	const rightPhase = (afterLeft - visible) / CLOSE_RIGHT_INSET;
	if (rightPhase >= 1) return 1;
	return CLOSE_LEFT_PHASE + inverseSmoothstep(rightPhase) * (1 - CLOSE_LEFT_PHASE);
}

/**
 * Glyph shutter for a section heading across the time that heading is displayed.
 * `progress` 0 is the previous section, 1 is the next. The heading is covered at
 * the edges, 80% open at 35% and 65%, and fully open at 50%. The open and close
 * use the name's left-then-right shutter.
 */
export function headerDisplayInsets(progress: number): { left: number; right: number } {
	return nameShutterInsets(coveredForOpenAmount(headerOpenAmount(progress)), 1);
}

/** 1 when the heading letters are fully open, 0 when the shutter covers them. */
export function headerGlyphVisibility(progress: number): number {
	const { left, right } = headerDisplayInsets(progress);
	return clamp01(1 - left - right);
}
