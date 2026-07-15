<script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';
	import {
		claimCardModal,
		computeStageZoomTransform,
		lockCardModal,
		modalMotionMs,
		modalTransition,
		mountInModalLayer,
		prefersMobileCardFade,
		readScrollLeft,
		releaseCardModal,
		setStageZoom,
		syncVignetteDismiss,
		syncVignetteOpen,
		type StageZoomTransform,
		unlockCardModal,
		viewportCenter,
		waitStageZoomMotion,
		waitVignetteMotion
	} from '$lib/cardModal';

	let className = '';
	export { className as class };

	export let surfaceClass = '';
	export let theme: 'dark' | 'green' | 'teal' | 'aquamarine' | 'blue' | 'periwinkle' = 'dark';
	export let expandOnClick = true;
	export let enableFlip = true;
	export let onModalOpen: (() => void) | undefined = undefined;

	let anchorEl: HTMLElement | null = null;
	let rootEl: HTMLElement | null = null;
	let tiltEl: HTMLElement | null = null;
	let flipEl: HTMLElement | null = null;
	let surfaceEl: HTMLElement | null = null;
	let backSurfaceEl: HTMLElement | null = null;

	let expanded = false;
	let animating = false;
	let hoverLocked = false;
	let dismissing = false;
	let openingScrollLeft = 0;
	let zoomTarget: StageZoomTransform | null = null;
	let anchorHome: { parent: HTMLElement; next: ChildNode | null } | null = null;
	let anchorPlaceholder: HTMLElement | null = null;
	let openPinStart: PinMotionState | null = null;
	let openPinEnd: PinMotionState | null = null;
	let pinPlaceholderSize: { w: number; h: number } | null = null;
	let lastPointerX = 0;
	let lastPointerY = 0;

	function trackPointer(clientX: number, clientY: number) {
		lastPointerX = clientX;
		lastPointerY = clientY;
	}

	function pointerEventAtLastPointer(): PointerEvent {
		return { clientX: lastPointerX, clientY: lastPointerY } as PointerEvent;
	}

	function isPointerOverCard() {
		const surface = activeSurfaceEl();
		if (!surface) return false;
		const rect = surface.getBoundingClientRect();
		return (
			lastPointerX >= rect.left &&
			lastPointerX <= rect.right &&
			lastPointerY >= rect.top &&
			lastPointerY <= rect.bottom
		);
	}

	let faceOpen = false;

	function activeSurfaceEl(): HTMLElement | null {
		if (!expanded) return surfaceEl;
		if (!enableFlip) return surfaceEl;
		if (faceOpen) return backSurfaceEl ?? surfaceEl;
		return surfaceEl;
	}

	function prefersReducedMotion() {
		return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	const MAX_TILT_DEG = 9;
	const TILT_PERSPECTIVE_PX = 900;

	function clamp(n: number, min: number, max: number) {
		return Math.max(min, Math.min(max, n));
	}
	const FLIP_OPEN_DEG = 180;
	const FLIP_CLOSED_DEG = 0;

	type PinMotionState = {
		cx: number;
		cy: number;
		layoutW: number;
		layoutH: number;
		scaleX: number;
		scaleY: number;
		rotZ: number;
	};

	function pinCenter(state: PinMotionState) {
		return { x: state.cx, y: state.cy };
	}

	function makePinState(
		cx: number,
		cy: number,
		layoutW: number,
		layoutH: number,
		scaleX: number,
		scaleY: number,
		rotZ: number
	): PinMotionState {
		return {
			cx: Math.round(cx),
			cy: Math.round(cy),
			layoutW: Math.round(layoutW),
			layoutH: Math.round(layoutH),
			scaleX,
			scaleY,
			rotZ
		};
	}

	function configureFrontGridLayout(
		gridW: number,
		gridH: number,
		shellW: number,
		shellH: number
	) {
		if (!rootEl || gridW <= 0 || gridH <= 0) return;
		const scaleX = shellW / gridW;
		const scaleY = shellH / gridH;
		rootEl.style.setProperty('--front-layout-width', `${gridW}px`);
		rootEl.style.setProperty('--front-layout-height', `${gridH}px`);
		rootEl.style.setProperty('--front-layout-scale-x', String(scaleX));
		rootEl.style.setProperty('--front-layout-scale-y', String(scaleY));
		rootEl.classList.add('info-card--front-grid-layout');
	}

	function clearFrontGridLayout() {
		if (!rootEl) return;
		rootEl.classList.remove('info-card--front-grid-layout');
		rootEl.style.removeProperty('--front-layout-width');
		rootEl.style.removeProperty('--front-layout-height');
		rootEl.style.removeProperty('--front-layout-scale-x');
		rootEl.style.removeProperty('--front-layout-scale-y');
	}

	/**
	 * Land on the grid slot without a front reflow: switch the shell to grid
	 * size at scale 1 and drop the internal front scale in the same turn
	 * (no paint between), then unpin into the slot.
	 */
	function handoffPinToGridSlot() {
		if (!anchorEl || !openPinStart || !pinPlaceholderSize) {
			clearFrontGridLayout();
			unpinZoomCard();
			return;
		}
		const gridHome = makePinState(
			openPinStart.cx,
			openPinStart.cy,
			pinPlaceholderSize.w,
			pinPlaceholderSize.h,
			1,
			1,
			openPinStart.rotZ
		);
		// Same synchronous turn: grid-sized shell, then drop internal front scale, then unpin.
		// Front stayed at grid layout width the whole time — no wrapping change.
		setPinTransition(false);
		applyPinState(gridHome);
		clearFrontGridLayout();
		unpinZoomCard();
	}

	function pinTransform(scaleX: number, scaleY: number, rotZ: number) {
		return `translate(-50%, -50%) rotate(${rotZ.toFixed(3)}deg) scale(${scaleX}, ${scaleY})`;
	}

	function parentSkipsPinPlaceholder(parent: HTMLElement) {
		const pos = getComputedStyle(parent).position;
		return pos === 'absolute' || pos === 'fixed';
	}

	function ensurePinMounted(layoutW: number, layoutH: number) {
		if (!anchorEl || !rootEl) return false;

		if (!anchorHome && anchorEl.parentElement) {
			anchorHome = { parent: anchorEl.parentElement, next: anchorEl.nextSibling };
		}
		if (!anchorEl.classList.contains('info-card-anchor--zoom-pinned') && anchorHome) {
			if (!parentSkipsPinPlaceholder(anchorHome.parent)) {
				const phW = pinPlaceholderSize?.w ?? layoutW;
				const phH = pinPlaceholderSize?.h ?? layoutH;
				anchorPlaceholder = document.createElement('div');
				anchorPlaceholder.className = 'info-card-anchor info-card-anchor--zoom-placeholder';
				anchorPlaceholder.setAttribute('aria-hidden', 'true');
				anchorPlaceholder.style.width = `${phW}px`;
				anchorPlaceholder.style.height = `${phH}px`;
				anchorHome.parent.insertBefore(anchorPlaceholder, anchorEl);
			}
			mountInModalLayer(anchorEl);
			anchorEl.classList.add('info-card-anchor--zoom-pinned');
		}

		anchorEl.style.position = 'fixed';
		anchorEl.style.margin = '0';
		anchorEl.style.zIndex = '2';
		anchorEl.style.transformOrigin = 'center center';
		anchorEl.style.willChange = 'transform';
		return true;
	}

	function applyPinState(state: PinMotionState) {
		if (!ensurePinMounted(state.layoutW, state.layoutH)) return;
		anchorEl!.style.left = `${state.cx}px`;
		anchorEl!.style.top = `${state.cy}px`;
		anchorEl!.style.width = `${state.layoutW}px`;
		anchorEl!.style.height = `${state.layoutH}px`;
		anchorEl!.style.transform = pinTransform(state.scaleX, state.scaleY, state.rotZ);
	}

	function setPinTransition(enabled: boolean) {
		if (!anchorEl) return;
		const motion = modalTransition();
		if (!enabled || motion === 'none') {
			anchorEl.style.transition = 'none';
			return;
		}
		// Layout size stays fixed — only position + transform animate.
		anchorEl.style.transition = [`left ${motion}`, `top ${motion}`, `transform ${motion}`].join(', ');
	}

	function snapPinState(state: PinMotionState) {
		setPinTransition(false);
		applyPinState(state);
		void anchorEl?.getBoundingClientRect();
	}

	function animatePinTo(state: PinMotionState) {
		setPinTransition(modalMotionMs() > 0);
		requestAnimationFrame(() => applyPinState(state));
	}

	async function waitPinMotion() {
		if (!anchorEl) return;
		const ms = modalMotionMs();
		await Promise.all([
			waitTransition(anchorEl, 'transform', ms),
			waitTransition(anchorEl, 'left', ms),
			waitTransition(anchorEl, 'top', ms)
		]);
	}

	function isInteractiveTarget(target: EventTarget | null) {
		return target instanceof Element && !!target.closest('a, button, input, textarea, select, label');
	}

	function tiltTransform(rotXDeg: number, rotYDeg: number) {
		return `perspective(${TILT_PERSPECTIVE_PX}px) rotateX(${rotXDeg.toFixed(3)}deg) rotateY(${rotYDeg.toFixed(3)}deg)`;
	}

	function resetTiltInstant() {
		if (!tiltEl) return;
		tiltEl.style.transition = 'none';
		tiltEl.style.transform = tiltTransform(0, 0);
		void tiltEl.offsetHeight;
	}

	function setFaceOpenClass(open: boolean) {
		faceOpen = open;
		rootEl?.classList.toggle('info-card--face-open', open);
	}

	function setFlipDeg(flipTarget: HTMLElement, deg: number) {
		const open = deg === FLIP_OPEN_DEG;
		setFaceOpenClass(open);
		if (prefersMobileCardFade()) {
			flipTarget.style.transform = 'none';
			return;
		}
		flipTarget.style.transform = `rotateY(${deg}deg)`;
	}

	function resetFlipInstant(flipTarget: HTMLElement, deg: number) {
		const open = deg === FLIP_OPEN_DEG;
		setFaceOpenClass(open);
		flipTarget.style.transition = 'none';
		rootEl?.classList.add('info-card--no-face-transition');
		if (prefersMobileCardFade()) {
			flipTarget.style.transform = 'none';
		} else {
			flipTarget.style.transform = `rotateY(${deg}deg)`;
		}
		void flipTarget.offsetHeight;
	}

	function resetCardFlipClosed(card: HTMLElement) {
		if (!enableFlip) return;
		const flip = card.querySelector('.info-card-flip');
		if (!(flip instanceof HTMLElement)) return;
		faceOpen = false;
		card.classList.remove('info-card--face-open');
		flip.style.transition = 'none';
		flip.style.transform = '';
		void flip.offsetHeight;
		flip.style.removeProperty('transition');
	}

	function isModalIsolationRoot(el: HTMLElement) {
		return (
			el.classList.contains('card-modal-layer') || el.classList.contains('card-modal-backdrop')
		);
	}

	function getAncestorPlaneMatrix(anchor: HTMLElement | null) {
		let matrix = new DOMMatrix();
		if (!anchor) return matrix;

		let el: HTMLElement | null = anchor.parentElement;
		while (el && el !== document.documentElement) {
			if (isModalIsolationRoot(el)) break;

			const transform = getComputedStyle(el).transform;
			if (transform && transform !== 'none') {
				matrix = new DOMMatrix(transform).multiply(matrix);
			}
			el = el.parentElement;
		}
		return matrix;
	}

	function getTargetPlaneRotation(anchor: HTMLElement | null) {
		const matrix = getAncestorPlaneMatrix(anchor);
		return (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI;
	}

	function motionTransform(tx: number, ty: number, rotZ: number, scale = 1) {
		return `translate(-50%, -50%) translate3d(${tx}px, ${ty}px, 0) rotate(${rotZ}deg) scale(${scale})`;
	}

	function readCardRect(
		el: HTMLElement,
		anchor: HTMLElement | null = anchorEl,
		{ visual = false, layout = false }: { visual?: boolean; layout?: boolean } = {}
	) {
		const measure =
			visual ? (el.querySelector<HTMLElement>('.info-card-hover-lift') ?? el) : el;
		const rect = measure.getBoundingClientRect();
		const matrix = getAncestorPlaneMatrix(anchor);
		const planeRot = (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI;

		// getBoundingClientRect is an AABB — parent rotation inflates width/height and
		// makes stage zoom undershoot (looks like zooming out on rotated award cards).
		// Use local size × ancestor scale for the true on-screen card size.
		let width = layout ? el.offsetWidth : rect.width;
		let height = layout ? el.offsetHeight : rect.height;
		if (visual && !layout) {
			const scaleX = Math.hypot(matrix.a, matrix.b) || 1;
			const scaleY = Math.hypot(matrix.c, matrix.d) || 1;
			width = el.offsetWidth * scaleX;
			height = el.offsetHeight * scaleY;
		}

		return {
			cx: rect.left + rect.width / 2,
			cy: rect.top + rect.height / 2,
			width,
			height,
			planeRot
		};
	}

	function setMotionTransition(
		el: HTMLElement,
		enabled: boolean,
		{
			includeSize = false,
			includeOpacity = false,
			includeZIndex = false
		}: { includeSize?: boolean; includeOpacity?: boolean; includeZIndex?: boolean } = {}
	) {
		const motion = modalTransition();
		if (!enabled || motion === 'none') {
			el.style.transition = 'none';
			return;
		}
		const parts = [`transform ${motion}`];
		if (includeSize) {
			parts.push(`width ${motion}`, `height ${motion}`);
		}
		if (includeOpacity) {
			parts.push(`opacity ${motion}`);
		}
		if (includeZIndex) {
			parts.push(`z-index ${motion}`);
		}
		el.style.transition = parts.join(', ');
	}

	function readCardOpacity(el: HTMLElement) {
		const wrapped = el.closest('.award-card-surface');
		if (wrapped instanceof HTMLElement) {
			const opacity = Number.parseFloat(getComputedStyle(wrapped).opacity);
			return Number.isFinite(opacity) ? opacity : 1;
		}
		const opacity = Number.parseFloat(getComputedStyle(el).opacity);
		return Number.isFinite(opacity) ? opacity : 1;
	}

	const STACK_PARENT_SELECTOR =
		'.experience-item, .education-card, .award-item, .polaroid-root';

	function readStackParent(anchor: HTMLElement | null) {
		if (!anchor) return null;
		const parent = anchor.closest(STACK_PARENT_SELECTOR);
		return parent instanceof HTMLElement ? parent : null;
	}

	function findCloneStackParent() {
		if (typeof document === 'undefined') return null;
		const cloneAnchor = document.querySelector(
			'.card-modal-stage-clone .info-card-anchor[data-modal-slot="true"]'
		);
		const parent = cloneAnchor?.closest(STACK_PARENT_SELECTOR);
		return parent instanceof HTMLElement ? parent : null;
	}

	function captureStackZIndex(anchor: HTMLElement | null) {
		const parent = readStackParent(anchor);
		if (!parent) return null;
		const z = getComputedStyle(parent).zIndex;
		return z === 'auto' ? null : z;
	}

	function applyStackZIndex(anchor: HTMLElement | null, zIndex: string | null) {
		if (!zIndex) return;
		const parent = readStackParent(anchor);
		if (parent instanceof HTMLElement) parent.style.zIndex = zIndex;
		const cloneParent = findCloneStackParent();
		if (cloneParent instanceof HTMLElement) cloneParent.style.zIndex = zIndex;
	}

	function transitionStackZIndex(anchor: HTMLElement | null, zIndex: string | null) {
		if (!zIndex) return;
		const motion = modalTransition();
		for (const parent of [readStackParent(anchor), findCloneStackParent()]) {
			if (!(parent instanceof HTMLElement)) continue;
			parent.style.transition = motion === 'none' ? 'none' : `z-index ${motion}`;
			parent.style.zIndex = zIndex;
		}
	}

	function clearAppliedStackZIndex(anchor: HTMLElement | null) {
		for (const parent of [readStackParent(anchor), findCloneStackParent()]) {
			if (!(parent instanceof HTMLElement)) continue;
			parent.style.removeProperty('z-index');
			parent.style.removeProperty('transition');
		}
	}

	function setMotionRect(el: HTMLElement, cx: number, cy: number, width: number, height: number) {
		el.classList.remove('info-card--modal-centered');
		el.style.position = 'fixed';
		el.style.top = `${cy}px`;
		el.style.left = `${cx}px`;
		el.style.right = 'auto';
		el.style.bottom = 'auto';
		el.style.width = `${width}px`;
		el.style.height = `${height}px`;
		el.style.margin = '0';
		el.style.transformOrigin = 'center center';
	}

	function applyMotionTransform(
		el: HTMLElement,
		cx: number,
		cy: number,
		width: number,
		height: number,
		{
			tx = 0,
			ty = 0,
			rotZ = 0,
			scale = 1
		}: { tx?: number; ty?: number; rotZ?: number; scale?: number } = {}
	) {
		setMotionRect(el, cx, cy, width, height);
		el.style.transform = motionTransform(tx, ty, rotZ, scale);
	}

	function setFlipTransition(flipTarget: HTMLElement | null, enabled: boolean) {
		if (prefersMobileCardFade()) {
			rootEl?.classList.toggle('info-card--no-face-transition', !enabled || modalMotionMs() === 0);
			if (flipTarget) flipTarget.style.transition = 'none';
			return;
		}
		if (!flipTarget) return;
		const motion = modalTransition();
		flipTarget.style.transition = !enabled || motion === 'none' ? 'none' : `transform ${motion}`;
	}

	function clearMotionWillChange(el: HTMLElement, flipTarget: HTMLElement | null) {
		el.style.removeProperty('will-change');
		flipTarget?.style.removeProperty('will-change');
		if (rootEl) {
			for (const face of rootEl.querySelectorAll<HTMLElement>('.info-card-face')) {
				face.style.removeProperty('will-change');
			}
		}
	}

	function setMotionWillChange(el: HTMLElement, flipTarget: HTMLElement | null) {
		el.style.setProperty('will-change', 'transform');
		if (!enableFlip) return;
		if (prefersMobileCardFade() && rootEl) {
			for (const face of rootEl.querySelectorAll<HTMLElement>('.info-card-face')) {
				face.style.setProperty('will-change', 'opacity');
			}
			return;
		}
		flipTarget?.style.setProperty('will-change', 'transform');
	}

	function clearGhostMotion(el: HTMLElement, flipTarget: HTMLElement | null) {
		el.style.transition = '';
		if (flipTarget) flipTarget.style.transition = '';
		clearMotionWillChange(el, flipTarget);
	}

	function waitTransition(el: HTMLElement, propertyName: string, timeoutMs: number) {
		return new Promise<void>((resolve) => {
			if (timeoutMs === 0) {
				resolve();
				return;
			}

			let settled = false;
			const finish = () => {
				if (settled) return;
				settled = true;
				el.removeEventListener('transitionend', onEnd);
				window.clearTimeout(timer);
				resolve();
			};
			const onEnd = (e: TransitionEvent) => {
				if (e.target !== el || e.propertyName !== propertyName) return;
				finish();
			};

			el.addEventListener('transitionend', onEnd);
			const timer = window.setTimeout(finish, timeoutMs + 80);
		});
	}

	async function waitModalMotion(
		el: HTMLElement,
		flipTarget: HTMLElement | null,
		{ includeSize = false, includeOpacity = false }: { includeSize?: boolean; includeOpacity?: boolean } = {}
	) {
		const ms = modalMotionMs();
		const waits = [waitTransition(el, 'transform', ms)];
		if (includeSize) {
			waits.push(waitTransition(el, 'width', ms));
			waits.push(waitTransition(el, 'height', ms));
		}
		if (includeOpacity) {
			waits.push(waitTransition(el, 'opacity', ms));
		}
		if (enableFlip && flipTarget) {
			if (prefersMobileCardFade()) {
				waits.push(...faceOpacityWaits(flipTarget, ms));
			} else {
				waits.push(waitTransition(flipTarget, 'transform', ms));
			}
		}
		await Promise.all(waits);
	}

	function faceOpacityWaits(flipTarget: HTMLElement, ms: number) {
		const waits: Promise<void>[] = [];
		for (const sel of ['.info-card-face--front', '.info-card-face--back']) {
			const face = flipTarget.querySelector(sel);
			if (face instanceof HTMLElement) waits.push(waitTransition(face, 'opacity', ms));
		}
		return waits;
	}

	function focusTargetSize(width: number, height: number) {
		const vv = window.visualViewport;
		const viewW = vv?.width ?? window.innerWidth;
		const viewH = vv?.height ?? window.innerHeight;
		const maxW = viewW * 0.82;
		const maxH = viewH * 0.82;
		// Always fill 82% of the viewport on the limiting axis (preserve aspect ratio).
		const scale = Math.min(maxW / width, maxH / height);
		return {
			width: width * scale,
			height: height * scale
		};
	}

	function centeredTargetSize(width: number, height: number) {
		return focusTargetSize(width, height);
	}

	function setHoverTilt(rotXDeg: number, rotYDeg: number) {
		if (!tiltEl) return;
		tiltEl.style.transform = tiltTransform(rotXDeg, rotYDeg);
	}

	function tiltAnglesFromPointer(clientX: number, clientY: number) {
		if (!rootEl) return { rotXDeg: 0, rotYDeg: 0 };
		const r = rootEl.getBoundingClientRect();
		if (r.width <= 0 || r.height <= 0) return { rotXDeg: 0, rotYDeg: 0 };
		const dx = (clientX - r.left) / r.width - 0.5;
		const dy = (clientY - r.top) / r.height - 0.5;
		return {
			rotXDeg: clamp(dy * 2 * MAX_TILT_DEG, -MAX_TILT_DEG, MAX_TILT_DEG),
			rotYDeg: clamp(-dx * 2 * MAX_TILT_DEG, -MAX_TILT_DEG, MAX_TILT_DEG)
		};
	}

	/** Ease tilt to a target so open/close don't pop between flat and cursor tilt. */
	function easeTiltTo(rotXDeg: number, rotYDeg: number, ms = 160) {
		if (!tiltEl) return Promise.resolve();
		if (prefersReducedMotion() || modalMotionMs() === 0 || ms === 0) {
			tiltEl.style.transition = 'none';
			setHoverTilt(rotXDeg, rotYDeg);
			return Promise.resolve();
		}
		tiltEl.style.transition = `transform ${ms}ms ease-out`;
		setHoverTilt(rotXDeg, rotYDeg);
		return waitTransition(tiltEl, 'transform', ms).then(() => {
			if (tiltEl) tiltEl.style.transition = 'none';
		});
	}

	async function waitFlipMotion(flipTarget: HTMLElement | null) {
		if (!enableFlip || !flipTarget) return;
		const ms = modalMotionMs();
		if (prefersMobileCardFade()) {
			await Promise.all(faceOpacityWaits(flipTarget, ms));
			return;
		}
		await waitTransition(flipTarget, 'transform', ms);
	}

	function clearSurfaceGlow(surface: HTMLElement | null | undefined) {
		if (!surface) return;
		surface.classList.add('info-card-surface--spotlight-off');
		surface.style.setProperty('--spotlight', '0');
		void surface.offsetHeight;
		surface.classList.remove('info-card-surface--spotlight-off');
	}

	function clearAllSpotlights() {
		for (const surface of [surfaceEl, backSurfaceEl]) {
			clearSurfaceGlow(surface);
		}
	}

	function setPointerGlow(e: PointerEvent) {
		const surface = activeSurfaceEl();
		if (!surface || animating) return;

		const surfaceRect = surface.getBoundingClientRect();
		if (surfaceRect.width <= 0 || surfaceRect.height <= 0) return;

		const u = (e.clientX - surfaceRect.left) / surfaceRect.width;
		const v = (e.clientY - surfaceRect.top) / surfaceRect.height;

		if (expanded && rootEl) {
			for (const candidate of rootEl.querySelectorAll('.info-card-surface')) {
				if (candidate !== surface && candidate instanceof HTMLElement) {
					clearSurfaceGlow(candidate);
				}
			}
		} else {
			const inactive = surface === surfaceEl ? backSurfaceEl : surfaceEl;
			clearSurfaceGlow(inactive);
		}

		surface.classList.remove('info-card-surface--spotlight-off');
		surface.style.setProperty('--pointer-u', `${(u * 100).toFixed(3)}%`);
		surface.style.setProperty('--pointer-v', `${(v * 100).toFixed(3)}%`);
		surface.style.setProperty('--spotlight', '1');
	}

	function syncModalSpotlight(e: PointerEvent) {
		if (!expanded || animating || hoverLocked) return;
		if (isPointerOverCard()) setPointerGlow(e);
		else clearAllSpotlights();
	}

	/** Modal-only: tilt always follows cursor position relative to the card. */
	function applyCursorTilt(clientX: number, clientY: number) {
		if (!expanded || !rootEl || !tiltEl || animating || hoverLocked) return;
		if (prefersReducedMotion()) {
			setHoverTilt(0, 0);
			return;
		}
		const { rotXDeg, rotYDeg } = tiltAnglesFromPointer(clientX, clientY);
		setHoverTilt(rotXDeg, rotYDeg);
	}

	/** Grid/non-modal: spotlight dots only while hovering the card. */
	function onGridPointer(e: PointerEvent) {
		if (expanded || animating || hoverLocked) return;
		trackPointer(e.clientX, e.clientY);
		setPointerGlow(e);
	}

	function onGridPointerLeave() {
		if (expanded || animating) return;
		clearAllSpotlights();
		resetTiltInstant();
	}

	function unpinZoomCard() {
		if (!anchorEl || !anchorHome) return;
		anchorEl.classList.remove('info-card-anchor--zoom-pinned');
		anchorEl.style.position = '';
		anchorEl.style.top = '';
		anchorEl.style.left = '';
		anchorEl.style.width = '';
		anchorEl.style.height = '';
		anchorEl.style.margin = '';
		anchorEl.style.zIndex = '';
		anchorEl.style.transition = '';
		anchorEl.style.transform = '';
		anchorEl.style.transformOrigin = '';
		anchorEl.style.willChange = '';
		anchorEl.style.visibility = '';
		anchorHome.parent.insertBefore(anchorEl, anchorPlaceholder ?? anchorHome.next);
		anchorPlaceholder?.remove();
		anchorPlaceholder = null;
		anchorHome = null;
		pinPlaceholderSize = null;
		clearFrontGridLayout();
	}

	function clearHoverVisuals() {
		clearAllSpotlights();
		resetTiltInstant();
	}

	async function expandCard() {
		if (!expandOnClick || !rootEl || !anchorEl || !tiltEl || expanded || animating) return;
		if (enableFlip && !flipEl) return;

		await claimCardModal(collapseCard);

		openingScrollLeft = readScrollLeft();
		if (tiltEl) {
			tiltEl.style.transition = 'none';
			tiltEl.style.transform = tiltTransform(0, 0);
		}
		void rootEl.offsetHeight;

		const startVisual = readCardRect(rootEl, anchorEl, { visual: true });
		const startLayout = readCardRect(rootEl, anchorEl, { layout: true });
		const targetSize = centeredTargetSize(startLayout.width, startLayout.height);
		const openLayoutW = Math.round(targetSize.width);
		const openLayoutH = Math.round(targetSize.height);
		const gridLayoutW = startLayout.width;
		const gridLayoutH = startLayout.height;
		const center = viewportCenter();

		pinPlaceholderSize = { w: gridLayoutW, h: gridLayoutH };

		// Exact inverse of the front internal scale so transforms cancel at the grid endpoint.
		const gridToModalX = gridLayoutW > 0 ? openLayoutW / gridLayoutW : 1;
		const gridToModalY = gridLayoutH > 0 ? openLayoutH / gridLayoutH : 1;

		openPinStart = makePinState(
			startLayout.cx,
			startLayout.cy,
			openLayoutW,
			openLayoutH,
			1 / gridToModalX,
			1 / gridToModalY,
			startLayout.planeRot
		);
		openPinEnd = makePinState(center.x, center.y, openLayoutW, openLayoutH, 1, 1, 0);

		zoomTarget = computeStageZoomTransform(
			startVisual.cx,
			startVisual.cy,
			startVisual.width,
			startVisual.height,
			targetSize.width,
			targetSize.height,
			openingScrollLeft
		);

		lockCardModal(openingScrollLeft);

		expanded = true;
		hoverLocked = true;
		animating = true;
		clearAllSpotlights();
		onModalOpen?.();

		// Front keeps grid layout coords; shell is modal-resolution. Hide until both are applied.
		configureFrontGridLayout(gridLayoutW, gridLayoutH, openLayoutW, openLayoutH);
		anchorEl.style.visibility = 'hidden';
		snapPinState(openPinStart);
		resetTiltInstant();
		if (enableFlip && flipEl) resetFlipInstant(flipEl, FLIP_CLOSED_DEG);
		setFlipTransition(flipEl, false);
		void anchorEl.getBoundingClientRect();
		anchorEl.style.visibility = '';

		await tick();

		setFlipTransition(flipEl, modalMotionMs() > 0);

		const runOpenMotion = () => {
			if (!zoomTarget || !openPinEnd) return;
			syncVignetteOpen();
			requestAnimationFrame(() => {
				if (!zoomTarget || !openPinEnd) return;
				setStageZoom(
					zoomTarget.tx,
					zoomTarget.ty,
					zoomTarget.scale,
					zoomTarget.originX,
					zoomTarget.originY
				);
				animatePinTo(openPinEnd);
				if (enableFlip && flipEl) setFlipDeg(flipEl, FLIP_OPEN_DEG);
			});
		};

		if (modalMotionMs() === 0) {
			runOpenMotion();
		} else {
			requestAnimationFrame(runOpenMotion);
		}

		await Promise.all([
			waitStageZoomMotion(),
			waitFlipMotion(flipEl),
			waitVignetteMotion(),
			waitPinMotion()
		]);

		if (enableFlip && flipEl) resetFlipInstant(flipEl, FLIP_OPEN_DEG);

		// Flight end is already the settled geometry — no layout/scale handoff.
		animating = false;
		await tick();
		const e = pointerEventAtLastPointer();
		syncModalSpotlight(e);
		// Ease into cursor tilt (keep hoverLocked so pointermove can't snap mid-ease).
		if (!prefersReducedMotion()) {
			const { rotXDeg, rotYDeg } = tiltAnglesFromPointer(e.clientX, e.clientY);
			await easeTiltTo(rotXDeg, rotYDeg);
		} else {
			resetTiltInstant();
		}
		hoverLocked = false;
	}

	async function collapseCard() {
		if (!rootEl || !anchorEl || !expanded || animating) return;

		animating = true;
		dismissing = true;
		hoverLocked = true;
		clearAllSpotlights();
		// Flatten tilt as the close flight begins so it doesn't pop off at the end.
		void easeTiltTo(0, 0);

		setFlipTransition(flipEl, modalMotionMs() > 0);

		const dismissOrigin = openPinEnd
			? pinCenter(openPinEnd)
			: { x: viewportCenter().x, y: viewportCenter().y };
		const dismissOriginX = zoomTarget?.originX ?? 0;
		const dismissOriginY = zoomTarget?.originY ?? 0;

		const runDismissMotion = () => {
			syncVignetteDismiss(dismissOrigin);
			requestAnimationFrame(() => {
				// Keep modal shell + grid front layout; transform home.
				if (openPinEnd) snapPinState(openPinEnd);
				setStageZoom(0, 0, 1, dismissOriginX, dismissOriginY);
				if (openPinStart) animatePinTo(openPinStart);
				if (enableFlip && flipEl) setFlipDeg(flipEl, FLIP_CLOSED_DEG);
			});
		};

		if (modalMotionMs() === 0) {
			runDismissMotion();
		} else {
			requestAnimationFrame(runDismissMotion);
		}

		await Promise.all([
			waitStageZoomMotion(),
			waitFlipMotion(flipEl),
			waitVignetteMotion(),
			waitPinMotion()
		]);

		if (enableFlip && flipEl) resetFlipInstant(flipEl, FLIP_CLOSED_DEG);

		// Still showing grid-layout front at the grid endpoint — hand off without reflow.
		if (openPinStart) snapPinState(openPinStart);
		handoffPinToGridSlot();

		expanded = false;
		zoomTarget = null;
		openPinStart = null;
		openPinEnd = null;
		clearHoverVisuals();
		await tick();

		dismissing = false;
		animating = false;
		hoverLocked = false;
		openingScrollLeft = 0;
		unlockCardModal();
		releaseCardModal(collapseCard);
		requestAnimationFrame(() => {
			if (isPointerOverCard()) setPointerGlow(pointerEventAtLastPointer());
		});
	}

	function handleClick(e: MouseEvent) {
		if (!expandOnClick || expanded || animating || isInteractiveTarget(e.target)) return;
		trackPointer(e.clientX, e.clientY);
		e.stopPropagation();
		void expandCard();
	}

	onMount(() => {
		const onPointerMove = (e: PointerEvent) => {
			trackPointer(e.clientX, e.clientY);
			if (!expanded || animating) return;
			applyCursorTilt(e.clientX, e.clientY);
			syncModalSpotlight(e);
		};
		window.addEventListener('pointermove', onPointerMove, { passive: true });
		return () => window.removeEventListener('pointermove', onPointerMove);
	});

	onDestroy(() => {
		if (typeof document === 'undefined') return;

		unpinZoomCard();
		if (expanded) {
			unlockCardModal();
			releaseCardModal(collapseCard);
		}
	});
</script>
<div class="info-card-anchor" bind:this={anchorEl}>
	<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
	<div
		class="info-card hover-polaroid-scale {theme !== 'dark' ? `info-card--${theme}` : ''} {className}"
		class:info-card--modal={expanded}
		class:info-card--zoom-active={expanded}
		class:info-card--animating={animating}
		class:info-card--dismissing={dismissing}
		bind:this={rootEl}
		on:click={handleClick}
		on:pointerenter={onGridPointer}
		on:pointermove={onGridPointer}
		on:pointerleave={onGridPointerLeave}
	>
		<div class="info-card-hover-lift">
			<div class="info-card-tilt hover-polaroid-tilt" bind:this={tiltEl}>
				{#if enableFlip}
					<div class="info-card-flip-stage">
						<div class="info-card-flip" bind:this={flipEl}>
							<div class="info-card-face info-card-face--front">
								<div class="info-card-front-layout">
									<div
										class="info-card-surface hover-polaroid-surface {surfaceClass}"
										bind:this={surfaceEl}
									>
										<div class="holo-layer" aria-hidden="true"></div>
										<div class="grid-base" aria-hidden="true"></div>
										<div class="grid-cursor" aria-hidden="true"></div>
										<slot name="front" />
									</div>
								</div>
							</div>
							<div class="info-card-face info-card-face--back">
								<div class="info-card-back-layout">
									<div
										class="info-card-surface info-card-surface--back hover-polaroid-surface {surfaceClass}"
										bind:this={backSurfaceEl}
									>
										<div class="holo-layer" aria-hidden="true"></div>
										<div class="grid-base" aria-hidden="true"></div>
										<div class="grid-cursor" aria-hidden="true"></div>
										<slot name="back" />
									</div>
								</div>
							</div>
						</div>
					</div>
				{:else}
					<div
						class="info-card-surface hover-polaroid-surface {surfaceClass}"
						bind:this={surfaceEl}
					>
						<div class="holo-layer" aria-hidden="true"></div>
						<div class="grid-base" aria-hidden="true"></div>
						<div class="grid-cursor" aria-hidden="true"></div>
						<slot />
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.info-card-anchor {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.info-card-anchor.info-card-anchor--zoom-placeholder {
		width: 100%;
		height: 100%;
		min-height: inherit;
		visibility: hidden;
		pointer-events: none;
	}

	.info-card-anchor.info-card-anchor--zoom-pinned {
		will-change: transform;
		transform-style: preserve-3d;
	}

	/* Back fills the modal shell at native size so content can use % / cqw of card width. */
	:global(.info-card--zoom-active .info-card-surface--back .card-row--back),
	:global(.info-card--zoom-active .info-card-surface--back .polaroid-content--back),
	:global(.card-modal-layer .info-card--modal .info-card-surface--back .card-row--back),
	:global(.card-modal-layer .info-card--modal .info-card-surface--back .polaroid-content--back) {
		transform: none;
		width: 100%;
		height: 100%;
	}

	.info-card.info-card--grid-hidden {
		visibility: hidden;
		pointer-events: none;
	}

	.info-card.info-card--modal,
	.info-card.info-card--modal .info-card-hover-lift,
	.info-card.info-card--modal .info-card-tilt,
	.info-card.info-card--modal .info-card-flip-stage,
	.info-card.info-card--modal .info-card-flip {
		transform-style: preserve-3d;
	}

	.info-card.info-card--modal .info-card-flip-stage {
		overflow: visible;
	}

	.info-card {
		width: 100%;
		height: 100%;
		cursor: pointer;
	}

	.info-card-hover-lift {
		width: 100%;
		height: 100%;
	}

	.info-card.info-card--modal,
	.info-card.info-card--modal-centered {
		pointer-events: auto;
		cursor: default;
	}

	.info-card.info-card--modal-centered {
		z-index: 1;
	}

	.info-card.info-card--dismissing {
		pointer-events: none;
	}

	/* Front face must look like the final unhovered grid card during the return flight. */
	.info-card.info-card--dismissing .info-card-face--front .info-card-surface,
	.info-card.info-card--dismissing.hover-polaroid-scale:hover
		.info-card-face--front
		.info-card-surface {
		filter: none;
		border-color: var(--hp-border);
		box-shadow: var(--hp-shadow);
		background: var(--hp-bg);
		transition: none;
	}

	.info-card.info-card--dismissing .info-card-face--front .info-card-surface::before,
	.info-card.info-card--dismissing.hover-polaroid-scale:hover
		.info-card-face--front
		.info-card-surface::before {
		border-color: rgba(160, 190, 230, 0.32);
		box-shadow:
			inset 0 0 28px rgba(140, 180, 220, 0.1),
			0 0 16px rgba(140, 180, 220, 0.12);
	}

	.info-card.info-card--dismissing .info-card-face--front .info-card-surface::after,
	.info-card.info-card--dismissing.hover-polaroid-scale:hover
		.info-card-face--front
		.info-card-surface::after {
		opacity: 0.5;
	}

	.info-card.info-card--dismissing .info-card-face--front .holo-layer,
	.info-card.info-card--dismissing.hover-polaroid-scale:hover
		.info-card-face--front
		.holo-layer {
		opacity: 0.85;
		animation-duration: 7s;
	}

	.info-card.info-card--dismissing .info-card-face--front :global(.experience-company),
	.info-card.info-card--dismissing.hover-polaroid-scale:hover
		.info-card-face--front
		:global(.experience-company) {
		color: #ffffff;
		text-shadow:
			0 1px 2px rgba(11, 18, 32, 0.9),
			0 0 14px rgba(190, 220, 255, 0.35);
	}

	.info-card.info-card--dismissing:is(
			.info-card--green,
			.info-card--teal,
			.info-card--aquamarine,
			.info-card--blue,
			.info-card--periwinkle
		)
		.info-card-face--front
		.info-card-surface,
	.info-card.info-card--dismissing:is(
			.info-card--green,
			.info-card--teal,
			.info-card--aquamarine,
			.info-card--blue,
			.info-card--periwinkle
		).hover-polaroid-scale:hover
		.info-card-face--front
		.info-card-surface {
		filter: none;
		border-color: var(--hp-border);
		box-shadow: var(--hp-shadow);
		background: var(--hp-bg);
	}

	.info-card.info-card--dismissing:is(
			.info-card--green,
			.info-card--teal,
			.info-card--aquamarine,
			.info-card--blue,
			.info-card--periwinkle
		)
		.info-card-face--front
		.info-card-surface::before,
	.info-card.info-card--dismissing:is(
			.info-card--green,
			.info-card--teal,
			.info-card--aquamarine,
			.info-card--blue,
			.info-card--periwinkle
		).hover-polaroid-scale:hover
		.info-card-face--front
		.info-card-surface::before {
		border-color: rgba(var(--tone-border), 0.3);
		box-shadow:
			inset 0 0 28px rgba(255, 255, 255, 0.1),
			0 0 16px rgba(var(--tone-shadow), 0.08);
	}

	.info-card.info-card--dismissing:is(
			.info-card--green,
			.info-card--teal,
			.info-card--aquamarine,
			.info-card--blue,
			.info-card--periwinkle
		)
		.info-card-face--front
		:global(.experience-company),
	.info-card.info-card--dismissing:is(
			.info-card--green,
			.info-card--teal,
			.info-card--aquamarine,
			.info-card--blue,
			.info-card--periwinkle
		).hover-polaroid-scale:hover
		.info-card-face--front
		:global(.experience-company) {
		color: var(--tone-heading);
		text-shadow:
			0 1px 0 rgba(255, 255, 255, 0.75),
			0 1px 3px rgba(var(--tone-border), 0.18);
	}

	.info-card-tilt {
		width: 100%;
		height: 100%;
		transform-style: preserve-3d;
	}

	.info-card-flip-stage {
		width: 100%;
		height: 100%;
		perspective: 10000px;
		transform-style: preserve-3d;
	}

	.info-card-flip {
		position: relative;
		width: 100%;
		height: 100%;
		transform-style: preserve-3d;
		transform: rotateY(0deg);
		transform-origin: center center;
	}

	.info-card-face {
		width: 100%;
		height: 100%;
		transform-style: preserve-3d;
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden;
	}

	.info-card-face--front {
		position: relative;
		width: 100%;
		height: 100%;
		transform: rotateY(0deg);
		overflow: hidden;
	}

	/* Idle: fill the face. Front (pinned): grid design coords scaled into the modal shell.
	   Back always fills the shell so typography can be % of card width (cqw). */
	.info-card-front-layout,
	.info-card-back-layout {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.info-card-back-layout {
		container-type: inline-size;
		container-name: card-back;
	}

	/* Only while pinned — idle grid card must not pick up the scaled front surface. */
	:global(.info-card-anchor--zoom-pinned) .info-card.info-card--front-grid-layout .info-card-front-layout {
		position: absolute;
		left: 0;
		top: 0;
		width: var(--front-layout-width);
		height: var(--front-layout-height);
		transform-origin: top left;
		transform: scale(var(--front-layout-scale-x, 1), var(--front-layout-scale-y, 1));
		overflow: hidden;
		container-type: inline-size;
	}

	.info-card-front-layout > .info-card-surface,
	.info-card-back-layout > .info-card-surface {
		width: 100%;
		height: 100%;
	}

	:global(.info-card-anchor--zoom-pinned)
		.info-card.info-card--front-grid-layout
		.info-card-face--front
		.info-card-surface {
		filter: none;
		border-color: var(--hp-border);
		background: var(--hp-bg);
		box-shadow: var(--hp-shadow);
		transition: none;
	}

	:global(.info-card-anchor--zoom-pinned)
		.info-card.info-card--front-grid-layout
		.info-card-face--front
		.info-card-surface::before {
		border-color: rgba(160, 190, 230, 0.32);
		box-shadow:
			inset 0 0 28px rgba(140, 180, 220, 0.1),
			0 0 16px rgba(140, 180, 220, 0.12);
	}

	:global(.info-card-anchor--zoom-pinned)
		.info-card.info-card--front-grid-layout
		.info-card-face--front
		.info-card-surface::after {
		opacity: 0.5;
	}

	:global(.info-card-anchor--zoom-pinned)
		.info-card.info-card--front-grid-layout
		.info-card-face--front
		.holo-layer {
		opacity: 0.85;
		animation-duration: 7s;
	}

	:global(.info-card-anchor--zoom-pinned)
		.info-card.info-card--front-grid-layout:is(
			.info-card--green,
			.info-card--teal,
			.info-card--aquamarine,
			.info-card--blue,
			.info-card--periwinkle
		)
		.info-card-face--front
		.info-card-surface {
		filter: none;
		border-color: var(--hp-border);
		background: var(--hp-bg);
		box-shadow: var(--hp-shadow);
	}

	:global(.info-card-anchor--zoom-pinned)
		.info-card.info-card--front-grid-layout:is(
			.info-card--green,
			.info-card--teal,
			.info-card--aquamarine,
			.info-card--blue,
			.info-card--periwinkle
		)
		.info-card-face--front
		.info-card-surface::before {
		border-color: rgba(var(--tone-border), 0.3);
		box-shadow:
			inset 0 0 28px rgba(255, 255, 255, 0.1),
			0 0 16px rgba(var(--tone-shadow), 0.08);
	}

	.info-card-face--back {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		transform: rotateY(180deg);
		overflow: hidden;
	}

	/* Mobile: crossfade faces instead of rotateY flip. */
	@media (max-width: 900px) {
		.info-card-flip-stage {
			perspective: none;
		}

		.info-card-flip {
			transform: none;
		}

		.info-card-face {
			backface-visibility: visible;
			-webkit-backface-visibility: visible;
			transition: opacity var(--card-modal-ms, 760ms)
				var(--card-modal-easing, cubic-bezier(0.6, 0.5, 0.36, 1));
		}

		.info-card-face--front {
			position: relative;
			z-index: 1;
			opacity: 1;
		}

		.info-card-face--back {
			transform: none;
			z-index: 0;
			opacity: 0;
			pointer-events: none;
		}

		.info-card.info-card--face-open .info-card-face--front {
			z-index: 0;
			opacity: 0;
			pointer-events: none;
		}

		.info-card.info-card--face-open .info-card-face--back {
			z-index: 1;
			opacity: 1;
			pointer-events: auto;
		}

		.info-card.info-card--no-face-transition .info-card-face--front,
		.info-card.info-card--no-face-transition .info-card-face--back {
			transition: none;
		}
	}

	@media (max-width: 900px) and (prefers-reduced-motion: reduce) {
		.info-card-face--front,
		.info-card-face--back {
			transition: none;
		}
	}

	.info-card:global(.info-card--project),
	.info-card:global(.info-card--project) .info-card-tilt {
		overflow: visible;
	}

	.info-card:global(.info-card--project) .info-card-surface {
		overflow: hidden;
	}

	.info-card-surface--back {
		/* Back type / spacing as % of card width — same scale for every card type. */
		--back-fs-xs: 1.84cqw;
		--back-fs-sm: 2.02cqw;
		--back-fs: 2.15cqw;
		--back-fs-md: 2.41cqw;
		--back-fs-lg: 2.71cqw;
		--back-pad: 0.92cqw;
		--back-gap-xs: 0.3cqw;
		--back-gap-sm: 0.75cqw;
		--back-gap: 1.2cqw;
		--back-gap-lg: 1.5cqw;
		--back-icon: 2cqw;
		--back-logo-sm: 4cqw;
		--back-logo: 4.5cqw;
		--back-chip-h: 4.1cqw;
		--back-link-h: 4.42cqw;
		overflow-y: auto;
		overscroll-behavior: contain;
	}

	.info-card-surface {
		--pointer-u: 50%;
		--pointer-v: 50%;
		--spotlight: 0;
		--grid-dot: 1px;
		--grid-fine: 15px;
		--grid-spot-radius: 60px;
		--hp-border: rgba(176, 196, 228, 0.62);
		--hp-border-hover: rgba(230, 242, 255, 0.95);
		--hp-bg:
			linear-gradient(
				135deg,
				rgba(140, 180, 220, 0.14) 0%,
				rgba(160, 140, 210, 0.1) 38%,
				rgba(100, 200, 210, 0.08) 72%,
				rgba(180, 190, 210, 0.06) 100%
			),
			linear-gradient(158deg, rgba(52, 58, 72, 0.58) 0%, rgba(34, 40, 52, 0.52) 100%);
		--hp-bg-hover:
			linear-gradient(
				135deg,
				rgba(180, 220, 255, 0.28) 0%,
				rgba(200, 180, 255, 0.2) 38%,
				rgba(140, 235, 245, 0.18) 72%,
				rgba(220, 230, 255, 0.12) 100%
			),
			linear-gradient(158deg, rgba(62, 70, 88, 0.68) 0%, rgba(44, 52, 68, 0.62) 100%);
		--hp-shadow:
			0 0 0 1px rgba(140, 170, 210, 0.28),
			0 0 16px rgba(140, 180, 220, 0.22),
			0 0 40px rgba(120, 150, 200, 0.14),
			0 0 72px rgba(160, 140, 210, 0.08),
			inset 0 0 32px rgba(140, 180, 220, 0.08),
			inset 0 1px 0 rgba(255, 255, 255, 0.12);
		--hp-shadow-hover:
			0 0 0 2px rgba(200, 230, 255, 0.55),
			0 0 24px rgba(170, 210, 255, 0.55),
			0 0 56px rgba(150, 190, 245, 0.38),
			0 0 110px rgba(180, 160, 240, 0.24),
			0 0 160px rgba(140, 200, 255, 0.14),
			inset 0 0 56px rgba(180, 220, 255, 0.22),
			inset 0 1px 0 rgba(255, 255, 255, 0.28);
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		border: 2px solid var(--hp-border);
		border-radius: 6px;
		backface-visibility: hidden;
		padding: 14px 14px;
		color: #f6f9fc;
		box-shadow: var(--hp-shadow);
		backdrop-filter: blur(14px) saturate(1.4);
		-webkit-backdrop-filter: blur(14px) saturate(1.4);
		transition:
			border-color 0.26s ease,
			box-shadow 0.32s ease,
			background 0.32s ease,
			filter 0.26s ease;
	}

	.info-card-surface.info-card-surface--back {
		padding: var(--back-pad);
	}

	.holo-layer {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 0;
		border-radius: inherit;
		background:
			linear-gradient(
				115deg,
				transparent 0%,
				rgba(180, 220, 255, 0.06) 42%,
				rgba(200, 180, 255, 0.1) 50%,
				rgba(160, 230, 240, 0.06) 58%,
				transparent 100%
			);
		background-size: 220% 100%;
		animation: holo-sheen 7s ease-in-out infinite;
		mix-blend-mode: screen;
		opacity: 0.85;
		transition: opacity 0.28s ease;
	}

	@keyframes holo-sheen {
		0%,
		100% {
			background-position: 120% 0;
		}
		50% {
			background-position: -20% 0;
		}
	}

	.info-card-surface::before {
		content: '';
		position: absolute;
		inset: 5px;
		border: 1px solid rgba(160, 190, 230, 0.32);
		border-radius: 2px;
		box-shadow:
			inset 0 0 28px rgba(140, 180, 220, 0.1),
			0 0 16px rgba(140, 180, 220, 0.12);
		pointer-events: none;
		z-index: 0;
	}

	.grid-base,
	.grid-cursor {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 0;
		border-radius: inherit;
		background-size: var(--grid-fine) var(--grid-fine);
	}

	.grid-base {
		background-image: none;
	}

	.grid-cursor {
		background-image: radial-gradient(
			circle,
			rgba(210, 228, 255, 1) 0,
			rgba(210, 228, 255, 1) var(--grid-dot),
			transparent calc(var(--grid-dot) + 0.5px)
		);
		opacity: var(--spotlight, 0);
		transition: opacity 0.16s ease;
		-webkit-mask-image: radial-gradient(
			circle var(--grid-spot-radius) at var(--pointer-u, 50%) var(--pointer-v, 50%),
			rgba(0, 0, 0, 1) 0%,
			rgba(0, 0, 0, 0.82) 28%,
			rgba(0, 0, 0, 0.48) 52%,
			rgba(0, 0, 0, 0.18) 76%,
			transparent 100%
		);
		mask-image: radial-gradient(
			circle var(--grid-spot-radius) at var(--pointer-u, 50%) var(--pointer-v, 50%),
			rgba(0, 0, 0, 1) 0%,
			rgba(0, 0, 0, 0.82) 28%,
			rgba(0, 0, 0, 0.48) 52%,
			rgba(0, 0, 0, 0.18) 76%,
			transparent 100%
		);
	}

	.info-card-surface.info-card-surface--spotlight-off .grid-cursor {
		transition: none;
	}

	.info-card-surface::after {
		content: '';
		position: absolute;
		inset: 0;
		background:
			linear-gradient(180deg, rgba(200, 220, 255, 0.12) 0%, transparent 35%, transparent 68%, rgba(170, 150, 220, 0.08) 100%),
			repeating-linear-gradient(
				0deg,
				transparent,
				transparent 3px,
				rgba(200, 220, 255, 0.035) 3px,
				rgba(200, 220, 255, 0.035) 4px
			);
		background-size: 100% 100%, 100% 100%;
		opacity: 0.5;
		pointer-events: none;
		z-index: 0;
		border-radius: inherit;
		mix-blend-mode: screen;
		transition: opacity 0.28s ease;
	}

	.info-card-surface > *:not(.holo-layer):not(.grid-base):not(.grid-cursor) {
		position: relative;
		z-index: 1;
	}

	.info-card-surface:global(.has-logo) > *:not(.holo-layer):not(.grid-base):not(.grid-cursor) {
		z-index: 2;
	}

	/* Grid hover chrome — not applied in modal (dots + tilt only). */
	:global(.hover-polaroid-scale:hover:not(.info-card--modal):not(.info-card--animating):not(.info-card--dismissing))
		.info-card-surface {
		filter: brightness(1.12) saturate(1.15);
	}

	:global(.hover-polaroid-scale:hover:not(.info-card--modal):not(.info-card--animating):not(.info-card--dismissing))
		.info-card-surface::before {
		border-color: rgba(220, 235, 255, 0.72);
		box-shadow:
			inset 0 0 48px rgba(180, 220, 255, 0.24),
			0 0 32px rgba(180, 220, 255, 0.35);
	}

	:global(.hover-polaroid-scale:hover:not(.info-card--modal):not(.info-card--animating):not(.info-card--dismissing))
		.info-card-surface::after {
		opacity: 0.92;
	}

	:global(.hover-polaroid-scale:hover:not(.info-card--modal):not(.info-card--animating):not(.info-card--dismissing))
		.holo-layer {
		opacity: 1;
		animation-duration: 2.8s;
	}

	/* Back face always uses hover chrome in modal — not pointer-driven. */
	.info-card.info-card--modal .info-card-surface--back {
		filter: brightness(1.12) saturate(1.15);
		border-color: var(--hp-border-hover);
		background: var(--hp-bg-hover);
		box-shadow: var(--hp-shadow-hover);
	}

	.info-card.info-card--modal .info-card-surface--back::before {
		border-color: rgba(220, 235, 255, 0.72);
		box-shadow:
			inset 0 0 48px rgba(180, 220, 255, 0.24),
			0 0 32px rgba(180, 220, 255, 0.35);
	}

	.info-card.info-card--modal .info-card-surface--back::after {
		opacity: 0.92;
	}

	.info-card.info-card--modal .info-card-face--back .holo-layer {
		opacity: 1;
		animation-duration: 2.8s;
	}

	.info-card.info-card--modal:is(
			.info-card--green,
			.info-card--teal,
			.info-card--aquamarine,
			.info-card--blue,
			.info-card--periwinkle
		)
		.info-card-surface--back {
		filter: brightness(1.04) saturate(1.1);
	}

	.info-card.info-card--modal:is(
			.info-card--green,
			.info-card--teal,
			.info-card--aquamarine,
			.info-card--blue,
			.info-card--periwinkle
		)
		.info-card-surface--back::before {
		border-color: rgba(var(--tone-border-hover), 0.42);
		box-shadow:
			inset 0 0 48px rgba(255, 255, 255, 0.16),
			0 0 32px rgba(var(--tone-shadow), 0.14);
	}

	.info-card.info-card--modal:is(
			.info-card--green,
			.info-card--teal,
			.info-card--aquamarine,
			.info-card--blue,
			.info-card--periwinkle
		)
		.info-card-surface--back::after {
		opacity: 0.5;
	}

	.info-card.info-card--modal .info-card-face--back :global(.experience-company) {
		color: #ffffff;
		text-shadow:
			0 1px 3px rgba(11, 18, 32, 0.85),
			0 0 20px rgba(210, 235, 255, 0.65),
			0 0 40px rgba(160, 200, 255, 0.35);
	}

	.info-card.info-card--modal:is(
			.info-card--green,
			.info-card--teal,
			.info-card--aquamarine,
			.info-card--blue,
			.info-card--periwinkle
		)
		.info-card-face--back
		:global(.experience-company) {
		color: var(--tone-heading-hover);
		text-shadow:
			0 1px 0 rgba(255, 255, 255, 0.9),
			0 0 18px rgba(var(--tone-glow), 0.45),
			0 0 36px rgba(var(--tone-glow-2), 0.22);
	}

	@media (prefers-reduced-motion: reduce) {
		.holo-layer {
			animation: none;
			background-position: 50% 0;
		}
	}

	.info-card-surface:global(.has-logo) {
		padding: 0;
	}

	:global(.experience-company) {
		margin: 0;
		font-weight: 700;
		letter-spacing: 0.02em;
		color: #ffffff;
		text-shadow:
			0 1px 2px rgba(11, 18, 32, 0.9),
			0 0 14px rgba(190, 220, 255, 0.35);
		transition: text-shadow 0.28s ease, color 0.28s ease;
	}

	:global(.hover-polaroid-scale:hover:not(.info-card--modal):not(.info-card--animating):not(.info-card--dismissing))
		:global(.experience-company) {
		color: #ffffff;
		text-shadow:
			0 1px 3px rgba(11, 18, 32, 0.85),
			0 0 20px rgba(210, 235, 255, 0.65),
			0 0 40px rgba(160, 200, 255, 0.35);
	}

	:global(.experience-sub) {
		margin: 0;
		color: rgba(228, 236, 248, 0.96);
		font-size: 13px;
		line-height: 1.2;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		text-shadow: 0 1px 2px rgba(11, 18, 32, 0.8);
	}

	.info-card-surface--back :global(.experience-company) {
		font-size: var(--back-fs-lg);
		line-height: 1.2;
	}

	.info-card-surface--back :global(.experience-sub) {
		font-size: var(--back-fs);
		line-height: 1.25;
	}

	:global(.experience-sub.wrap-sub) {
		white-space: normal;
		overflow: visible;
		text-overflow: unset;
		overflow-wrap: anywhere;
	}

	/* Colored solid surfaces — holo / grid / tilt touches per tone */
	.info-card--green .info-card-surface {
		--hp-surface: #bbcab7;
		--hp-surface-hover: #c7d5c4;
		--tone-inset: #aebeaa;
		--tone-border: 61, 84, 65;
		--tone-border-hover: 46, 69, 53;
		--tone-text: #18221c;
		--tone-heading: #141f19;
		--tone-heading-hover: #0f1913;
		--tone-sub: 24, 34, 28;
		--tone-accent: #2c4839;
		--tone-grid: 50, 70, 55;
		--tone-grid-cursor: 35, 55, 41;
		--tone-shadow: 73, 98, 78;
		--tone-glow: 187, 208, 182;
		--tone-glow-2: 150, 175, 145;
		--tone-holo-mid: 215, 230, 210;
	}

	.info-card--teal .info-card-surface {
		--hp-surface: #90b5b5;
		--hp-surface-hover: #a0c4c4;
		--tone-inset: #81a6a6;
		--tone-border: 51, 84, 84;
		--tone-border-hover: 40, 70, 70;
		--tone-text: #182424;
		--tone-heading: #141e1e;
		--tone-heading-hover: #0d1515;
		--tone-sub: 24, 34, 34;
		--tone-accent: #2d5252;
		--tone-grid: 44, 71, 71;
		--tone-grid-cursor: 33, 57, 58;
		--tone-shadow: 68, 102, 102;
		--tone-glow: 178, 212, 212;
		--tone-glow-2: 140, 180, 180;
		--tone-holo-mid: 195, 225, 225;
	}

	.info-card--aquamarine .info-card-surface {
		--hp-surface: #8bbcb3;
		--hp-surface-hover: #99c7bf;
		--tone-inset: #7baca3;
		--tone-border: 50, 90, 83;
		--tone-border-hover: 40, 77, 70;
		--tone-text: #192824;
		--tone-heading: #14221e;
		--tone-heading-hover: #0e1a16;
		--tone-sub: 23, 35, 32;
		--tone-accent: #2e574f;
		--tone-grid: 45, 78, 72;
		--tone-grid-cursor: 33, 63, 58;
		--tone-shadow: 65, 105, 98;
		--tone-glow: 171, 214, 204;
		--tone-glow-2: 135, 185, 175;
		--tone-holo-mid: 189, 226, 216;
	}

	.info-card--blue .info-card-surface {
		--hp-surface: #b1c2d5;
		--hp-surface-hover: #bfd0e1;
		--tone-inset: #9eb0c4;
		--tone-border: 69, 91, 116;
		--tone-border-hover: 55, 77, 102;
		--tone-text: #1e2531;
		--tone-heading: #181f28;
		--tone-heading-hover: #11171f;
		--tone-sub: 27, 34, 44;
		--tone-accent: #354b63;
		--tone-grid: 63, 82, 107;
		--tone-grid-cursor: 49, 67, 90;
		--tone-shadow: 80, 102, 130;
		--tone-glow: 191, 211, 234;
		--tone-glow-2: 157, 182, 212;
		--tone-holo-mid: 206, 224, 239;
	}

	.info-card--periwinkle .info-card-surface {
		--hp-surface: #a8b2d0;
		--hp-surface-hover: #b4bdd8;
		--tone-inset: #99a4c4;
		--tone-border: 75, 85, 120;
		--tone-border-hover: 60, 72, 105;
		--tone-text: #1e2430;
		--tone-heading: #181e2a;
		--tone-heading-hover: #121820;
		--tone-sub: 28, 32, 42;
		--tone-accent: #3e4d72;
		--tone-grid: 70, 78, 110;
		--tone-grid-cursor: 55, 63, 95;
		--tone-shadow: 88, 98, 128;
		--tone-glow: 188, 198, 228;
		--tone-glow-2: 158, 170, 208;
		--tone-holo-mid: 198, 208, 238;
	}

	.info-card:is(.info-card--green, .info-card--teal, .info-card--aquamarine, .info-card--blue, .info-card--periwinkle)
		.info-card-surface {
		--hp-border: rgba(var(--tone-border), 0.42);
		--hp-border-hover: rgba(var(--tone-border-hover), 0.72);
		--hp-bg: var(--hp-surface);
		--hp-bg-hover: var(--hp-surface-hover);
		--hp-shadow:
			0 0 0 1px rgba(var(--tone-border), 0.14),
			0 0 16px rgba(var(--tone-shadow), 0.12),
			0 0 40px rgba(var(--tone-shadow), 0.08),
			inset 0 0 32px rgba(255, 255, 255, 0.12),
			inset 0 1px 0 rgba(255, 255, 255, 0.55);
		--hp-shadow-hover:
			0 0 0 2px rgba(var(--tone-border-hover), 0.32),
			0 0 24px rgba(var(--tone-shadow), 0.22),
			0 0 56px rgba(var(--tone-shadow), 0.14),
			inset 0 0 56px rgba(255, 255, 255, 0.18),
			inset 0 1px 0 rgba(255, 255, 255, 0.72);
		color: var(--tone-text);
		backdrop-filter: none;
		-webkit-backdrop-filter: none;
	}

	.info-card:is(.info-card--green, .info-card--teal, .info-card--aquamarine, .info-card--blue, .info-card--periwinkle)
		.holo-layer {
		background:
			linear-gradient(
				115deg,
				transparent 0%,
				rgba(255, 255, 255, 0.14) 42%,
				rgba(var(--tone-holo-mid), 0.18) 50%,
				rgba(255, 255, 255, 0.12) 58%,
				transparent 100%
			);
		mix-blend-mode: soft-light;
		opacity: 0.5;
	}

	.info-card:is(.info-card--green, .info-card--teal, .info-card--aquamarine, .info-card--blue, .info-card--periwinkle)
		.info-card-surface::before {
		border-color: rgba(var(--tone-border), 0.3);
		box-shadow:
			inset 0 0 28px rgba(255, 255, 255, 0.1),
			0 0 16px rgba(var(--tone-shadow), 0.08);
	}

	.info-card:is(.info-card--green, .info-card--teal, .info-card--aquamarine, .info-card--blue, .info-card--periwinkle)
		.grid-cursor {
		background-image: radial-gradient(
			circle,
			rgba(var(--tone-grid-cursor), 1) 0,
			rgba(var(--tone-grid-cursor), 1) var(--grid-dot),
			transparent calc(var(--grid-dot) + 0.5px)
		);
	}

	.info-card:is(.info-card--green, .info-card--teal, .info-card--aquamarine, .info-card--blue, .info-card--periwinkle)
		.info-card-surface::after {
		background: repeating-linear-gradient(
			0deg,
			transparent,
			transparent 3px,
			rgba(var(--tone-grid), 0.04) 3px,
			rgba(var(--tone-grid), 0.04) 4px
		);
		mix-blend-mode: multiply;
		opacity: 0.35;
	}

	.info-card:is(.info-card--green, .info-card--teal, .info-card--aquamarine, .info-card--blue, .info-card--periwinkle)
		:global(.experience-company) {
		color: var(--tone-heading);
		text-shadow:
			0 1px 0 rgba(255, 255, 255, 0.75),
			0 1px 3px rgba(var(--tone-border), 0.18);
	}

	:global(.info-card--green.hover-polaroid-scale:hover:not(.info-card--modal):not(.info-card--animating):not(.info-card--dismissing))
		.info-card-surface,
	:global(.info-card--teal.hover-polaroid-scale:hover:not(.info-card--modal):not(.info-card--animating):not(.info-card--dismissing))
		.info-card-surface,
	:global(.info-card--aquamarine.hover-polaroid-scale:hover:not(.info-card--modal):not(.info-card--animating):not(.info-card--dismissing))
		.info-card-surface,
	:global(.info-card--blue.hover-polaroid-scale:hover:not(.info-card--modal):not(.info-card--animating):not(.info-card--dismissing))
		.info-card-surface,
	:global(.info-card--periwinkle.hover-polaroid-scale:hover:not(.info-card--modal):not(.info-card--animating):not(.info-card--dismissing))
		.info-card-surface {
		filter: brightness(1.04) saturate(1.1);
	}

	:global(.info-card--green.hover-polaroid-scale:hover:not(.info-card--modal):not(.info-card--animating):not(.info-card--dismissing))
		.info-card-surface::before,
	:global(.info-card--teal.hover-polaroid-scale:hover:not(.info-card--modal):not(.info-card--animating):not(.info-card--dismissing))
		.info-card-surface::before,
	:global(.info-card--aquamarine.hover-polaroid-scale:hover:not(.info-card--modal):not(.info-card--animating):not(.info-card--dismissing))
		.info-card-surface::before,
	:global(.info-card--blue.hover-polaroid-scale:hover:not(.info-card--modal):not(.info-card--animating):not(.info-card--dismissing))
		.info-card-surface::before,
	:global(.info-card--periwinkle.hover-polaroid-scale:hover:not(.info-card--modal):not(.info-card--animating):not(.info-card--dismissing))
		.info-card-surface::before {
		border-color: rgba(var(--tone-border-hover), 0.42);
		box-shadow:
			inset 0 0 48px rgba(255, 255, 255, 0.16),
			0 0 32px rgba(var(--tone-shadow), 0.14);
	}

	:global(.info-card--green.hover-polaroid-scale:hover:not(.info-card--modal):not(.info-card--animating):not(.info-card--dismissing))
		.info-card-surface::after,
	:global(.info-card--teal.hover-polaroid-scale:hover:not(.info-card--modal):not(.info-card--animating):not(.info-card--dismissing))
		.info-card-surface::after,
	:global(.info-card--aquamarine.hover-polaroid-scale:hover:not(.info-card--modal):not(.info-card--animating):not(.info-card--dismissing))
		.info-card-surface::after,
	:global(.info-card--blue.hover-polaroid-scale:hover:not(.info-card--modal):not(.info-card--animating):not(.info-card--dismissing))
		.info-card-surface::after,
	:global(.info-card--periwinkle.hover-polaroid-scale:hover:not(.info-card--modal):not(.info-card--animating):not(.info-card--dismissing))
		.info-card-surface::after {
		opacity: 0.5;
	}

	:global(.info-card--green.hover-polaroid-scale:hover:not(.info-card--modal):not(.info-card--animating):not(.info-card--dismissing))
		:global(.experience-company),
	:global(.info-card--teal.hover-polaroid-scale:hover:not(.info-card--modal):not(.info-card--animating):not(.info-card--dismissing))
		:global(.experience-company),
	:global(.info-card--aquamarine.hover-polaroid-scale:hover:not(.info-card--modal):not(.info-card--animating):not(.info-card--dismissing))
		:global(.experience-company),
	:global(.info-card--blue.hover-polaroid-scale:hover:not(.info-card--modal):not(.info-card--animating):not(.info-card--dismissing))
		:global(.experience-company),
	:global(.info-card--periwinkle.hover-polaroid-scale:hover:not(.info-card--modal):not(.info-card--animating):not(.info-card--dismissing))
		:global(.experience-company) {
		color: var(--tone-heading-hover);
		text-shadow:
			0 1px 0 rgba(255, 255, 255, 0.9),
			0 0 18px rgba(var(--tone-glow), 0.45),
			0 0 36px rgba(var(--tone-glow-2), 0.22);
	}

	.info-card:is(.info-card--green, .info-card--teal, .info-card--aquamarine, .info-card--blue, .info-card--periwinkle)
		:global(.experience-sub) {
		color: rgba(var(--tone-sub), 0.88);
		text-shadow: 0 1px 0 rgba(255, 255, 255, 0.7);
	}
</style>