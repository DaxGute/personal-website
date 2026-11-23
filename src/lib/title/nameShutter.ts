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
	const leftPhase = 0.42;
	if (t <= leftPhase) {
		return { left: smoothstep(t / leftPhase) * 0.48, right: 0 };
	}
	const right = smoothstep((t - leftPhase) / (1 - leftPhase)) * 0.54;
	return { left: 0.48, right };
}

/** Covered before this point, then opening toward the midpoint. */
const HEADER_COVERED_BEFORE = 0.35;
/** Fully open here, while the section is centered. */
const HEADER_OPEN_AT = 0.5;
/** Covered again from here through the rest of the section. */
const HEADER_COVERED_AFTER = 0.65;

/**
 * Glyph shutter for a section heading across the time that heading is displayed.
 * `progress` 0 is the previous section, 1 is the next. The heading is completely
 * covered at 35% and 65%, and fully open at 50%. The open and close use the
 * name's left-then-right shutter.
 */
export function headerDisplayInsets(progress: number): { left: number; right: number } {
	const openSpan = HEADER_OPEN_AT - HEADER_COVERED_BEFORE;
	let covered = 1;
	if (progress > HEADER_COVERED_BEFORE && progress < HEADER_OPEN_AT) {
		covered = 1 - (progress - HEADER_COVERED_BEFORE) / openSpan;
	} else if (progress >= HEADER_OPEN_AT && progress < HEADER_COVERED_AFTER) {
		covered = (progress - HEADER_OPEN_AT) / (HEADER_COVERED_AFTER - HEADER_OPEN_AT);
	}
	return nameShutterInsets(covered, 1);
}

/** 1 when the heading letters are fully open, 0 when the shutter covers them. */
export function headerGlyphVisibility(progress: number): number {
	const { left, right } = headerDisplayInsets(progress);
	return clamp01(1 - left - right);
}
