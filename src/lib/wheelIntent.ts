/**
 * Nested scrollers (awards arc, project reel) may take the wheel only after the
 * pointer actually moves on them. A stationary cursor — including one that a
 * section slides under while the page is scrolling — never steals the gesture.
 *
 * The owner of a gesture is chosen on its first wheel event and kept until the
 * gesture goes quiet, so control cannot flip halfway through a flick.
 */

const GESTURE_GAP_MS = 140;
/** Travel while the wheel is idle. Ignores a resting cursor and tiny jitter. */
const ARM_MOVE_PX = 6;
/** One-event travel during a gesture. Small enough to be a deliberate move, large enough to ignore noise. */
const ARM_SWIPE_PX = 8;

type Region = {
	id: symbol;
	el: HTMLElement;
	armed: boolean;
	/** Real move that happened during a page gesture. Applies to the next gesture, not this one. */
	pending: boolean;
	accepts: (event: WheelEvent) => boolean;
};

const regions: Region[] = [];
let ownerId: symbol | null = null;
let lastWheelAt = 0;
let tracking = false;

function eventElement(event: Event): Element | null {
	const target = event.target;
	if (target instanceof Element) return target;
	if (target instanceof Node) return target.parentElement;
	return null;
}

function ensureTracking() {
	if (tracking || typeof window === 'undefined') return;
	tracking = true;
	// Registered first so it still runs before later window listeners that
	// stop propagation (the awards arc does this once it owns a gesture).
	window.addEventListener(
		'wheel',
		(event) => {
			const now = performance.now();
			const isNew = now - lastWheelAt > GESTURE_GAP_MS;
			lastWheelAt = now;
			if (!isNew) return;

			for (const region of regions) {
				if (!region.pending) continue;
				region.armed = true;
				region.pending = false;
			}

			ownerId = null;
			for (const region of regions) {
				if (region.armed && region.accepts(event)) {
					ownerId = region.id;
					break;
				}
			}
		},
		{ capture: true, passive: true }
	);
}

export type WheelIntent = {
	/** True when this region owns the gesture that produced the current wheel event. */
	claims: () => boolean;
	destroy: () => void;
};

export function createWheelIntent(
	regionEl: HTMLElement,
	accepts: (event: WheelEvent) => boolean = (event) => {
		const node = eventElement(event);
		return !!node && regionEl.contains(node);
	}
): WheelIntent {
	ensureTracking();

	const finePointer =
		typeof window !== 'undefined' &&
		window.matchMedia('(hover: hover) and (pointer: fine)').matches;

	const region: Region = {
		id: Symbol(),
		el: regionEl,
		// Touch has no hovering cursor; keep the previous always-on behavior.
		armed: !finePointer,
		pending: false,
		accepts
	};
	regions.push(region);

	let accum = 0;
	let lastX = Number.NaN;
	let lastY = Number.NaN;

	const onPointerMove = (event: PointerEvent) => {
		if (!finePointer || event.pointerType === 'touch') return;
		const x = event.clientX;
		const y = event.clientY;
		if (Number.isNaN(lastX)) {
			lastX = x;
			lastY = y;
			return;
		}
		const dist = Math.hypot(x - lastX, y - lastY);
		lastX = x;
		lastY = y;
		// Same coordinates: the element moved under a still cursor, or a hover refresh.
		if (dist < 0.5) return;

		if (performance.now() - lastWheelAt < GESTURE_GAP_MS) {
			// Do not add this into the idle accumulator. Scroll jitter and
			// per-frame fake moves would eventually cross the threshold.
			if (dist >= ARM_SWIPE_PX) region.pending = true;
			return;
		}

		accum += dist;
		if (accum >= ARM_MOVE_PX) region.armed = true;
	};

	const onPointerLeave = () => {
		if (!finePointer) return;
		region.armed = false;
		region.pending = false;
		accum = 0;
		lastX = Number.NaN;
		lastY = Number.NaN;
		if (ownerId === region.id) ownerId = null;
	};

	regionEl.addEventListener('pointermove', onPointerMove, { passive: true });
	regionEl.addEventListener('pointerleave', onPointerLeave, { passive: true });

	return {
		claims: () => ownerId === region.id,
		destroy() {
			regionEl.removeEventListener('pointermove', onPointerMove);
			regionEl.removeEventListener('pointerleave', onPointerLeave);
			const index = regions.indexOf(region);
			if (index >= 0) regions.splice(index, 1);
			if (ownerId === region.id) ownerId = null;
		}
	};
}
