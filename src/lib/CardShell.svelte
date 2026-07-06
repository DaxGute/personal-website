<script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';
	import {
		claimCardModal,
		computeStageZoomTransform,
		computeTrackZoomOrigin,
		lockCardModal,
		modalMotionMs,
		modalTransition,
		mountInModalLayer,
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
	let hoverFrozen = false;
	let suppressHover = false;
	let dismissing = false;
	let openingScrollLeft = 0;
	let zoomTarget: StageZoomTransform | null = null;
	let anchorHome: { parent: HTMLElement; next: ChildNode | null } | null = null;
	let anchorPlaceholder: HTMLElement | null = null;
	let openPinStart: PinMotionState | null = null;
	let openPinEnd: PinMotionState | null = null;
	let openPinFlightEnd: PinMotionState | null = null;
	let lastPointerX = 0;
	let lastPointerY = 0;

	function trackPointer(clientX: number, clientY: number) {
		lastPointerX = clientX;
		lastPointerY = clientY;
	}

	function pointerEventAtLastPointer(): PointerEvent {
		return { clientX: lastPointerX, clientY: lastPointerY } as PointerEvent;
	}

	function isPointerOverModal() {
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

	function modalEl() {
		return rootEl;
	}

	function isShowingBack() {
		return expanded && enableFlip && readFlipDeg(flipEl) === FLIP_OPEN_DEG;
	}

	function refreshHoverFromPointer() {
		if (animating || !expanded) return;
		const el = modalEl();
		if (!el) return;
		if (!isPointerOverModal()) {
			for (const surface of el.querySelectorAll('.info-card-surface')) {
				if (surface instanceof HTMLElement) clearSurfaceGlow(surface);
			}
			if (!hoverLocked && rootEl) {
				resetTiltInstant();
				rootEl.style.setProperty('--scale', '1');
				rootEl.style.setProperty('--hover', '0');
			}
			return;
		}
		const e = pointerEventAtLastPointer();
		setPointerGlow(e);
		applyBackHoverTilt(e);
	}

	function activeSurfaceEl(): HTMLElement | null {
		if (!expanded) return surfaceEl;
		if (!enableFlip) return surfaceEl;
		if (readFlipDeg(flipEl) === FLIP_OPEN_DEG) return backSurfaceEl ?? surfaceEl;
		return surfaceEl;
	}

	function prefersReducedMotion() {
		return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	const MAX_TILT_DEG = 9;
	const HOVER_SCALE = 1.055;
	const TILT_PERSPECTIVE_PX = 900;
	const FLIP_OPEN_DEG = 180;
	const FLIP_CLOSED_DEG = 0;

	type PinMotionState = {
		cx: number;
		cy: number;
		scale: number;
		layoutW: number;
		layoutH: number;
		rotZ: number;
	};

	function pinCenter(state: PinMotionState) {
		return { x: state.cx, y: state.cy };
	}

	function visualScaleFromLayout(
		layoutW: number,
		layoutH: number,
		visualW: number,
		visualH: number
	) {
		if (layoutW <= 0 || layoutH <= 0) return 1;
		return Math.min(visualW / layoutW, visualH / layoutH);
	}

	function computePinState(
		layoutW: number,
		layoutH: number,
		cx: number,
		cy: number,
		visualW: number,
		visualH: number,
		rotZ = 0
	): PinMotionState {
		const scale = visualScaleFromLayout(layoutW, layoutH, visualW, visualH);
		return { cx, cy, scale, layoutW, layoutH, rotZ };
	}

	function pinStateAtShell(
		shellW: number,
		shellH: number,
		cx: number,
		cy: number,
		scale: number,
		rotZ: number
	): PinMotionState {
		return { cx, cy, scale, layoutW: shellW, layoutH: shellH, rotZ };
	}

	function pinTransform(scale: number, rotZ: number) {
		return `translate(-50%, -50%) rotate(${rotZ.toFixed(3)}deg) scale(${scale})`;
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
				anchorPlaceholder = document.createElement('div');
				anchorPlaceholder.className = 'info-card-anchor info-card-anchor--zoom-placeholder';
				anchorPlaceholder.setAttribute('aria-hidden', 'true');
				anchorPlaceholder.style.width = `${layoutW}px`;
				anchorPlaceholder.style.height = `${layoutH}px`;
				anchorHome.parent.insertBefore(anchorPlaceholder, anchorEl);
			}
			mountInModalLayer(anchorEl);
			anchorEl.classList.add('info-card-anchor--zoom-pinned');
		}

		anchorEl.style.position = 'fixed';
		anchorEl.style.margin = '0';
		anchorEl.style.zIndex = '2';
		anchorEl.style.transformOrigin = 'center center';
		return true;
	}

	function applyPinState(state: PinMotionState) {
		if (!ensurePinMounted(state.layoutW, state.layoutH)) return;
		anchorEl!.style.left = `${state.cx}px`;
		anchorEl!.style.top = `${state.cy}px`;
		anchorEl!.style.width = `${state.layoutW}px`;
		anchorEl!.style.height = `${state.layoutH}px`;
		anchorEl!.style.transform = pinTransform(state.scale, state.rotZ);
	}

	function setPinTransition(enabled: boolean, { includeSize = false }: { includeSize?: boolean } = {}) {
		if (!anchorEl) return;
		const motion = modalTransition();
		if (!enabled || motion === 'none') {
			anchorEl.style.transition = 'none';
			return;
		}
		const parts = [`left ${motion}`, `top ${motion}`, `transform ${motion}`];
		if (includeSize) {
			parts.push(`width ${motion}`, `height ${motion}`);
		}
		anchorEl.style.transition = parts.join(', ');
	}

	function snapPinState(state: PinMotionState) {
		setPinTransition(false);
		applyPinState(state);
		void anchorEl?.offsetHeight;
	}

	function animatePinTo(state: PinMotionState) {
		setPinTransition(modalMotionMs() > 0);
		requestAnimationFrame(() => applyPinState(state));
	}

	function isInteractiveTarget(target: EventTarget | null) {
		return target instanceof Element && !!target.closest('a, button, input, textarea, select, label');
	}

	function tiltTransform(rotXDeg: number, rotYDeg: number) {
		return `perspective(${TILT_PERSPECTIVE_PX}px) rotateX(${rotXDeg.toFixed(3)}deg) rotateY(${rotYDeg.toFixed(3)}deg)`;
	}

	function toCrispPinState(state: PinMotionState): PinMotionState {
		const visualW = state.layoutW * state.scale;
		const visualH = state.layoutH * state.scale;
		return {
			cx: Math.round(state.cx),
			cy: Math.round(state.cy),
			scale: 1,
			layoutW: Math.round(visualW),
			layoutH: Math.round(visualH),
			rotZ: 0
		};
	}

	function resetTiltInstant() {
		if (!tiltEl) return;
		tiltEl.style.transition = 'none';
		tiltEl.style.transform = tiltTransform(0, 0);
		void tiltEl.offsetHeight;
	}

	function setFlipDeg(flipTarget: HTMLElement, deg: number) {
		flipTarget.style.transform = `rotateY(${deg}deg)`;
	}

	function resetFlipInstant(flipTarget: HTMLElement, deg: number) {
		flipTarget.style.transition = 'none';
		setFlipDeg(flipTarget, deg);
		void flipTarget.offsetHeight;
	}

	function resetCardFlipClosed(card: HTMLElement) {
		if (!enableFlip) return;
		const flip = card.querySelector('.info-card-flip');
		if (!(flip instanceof HTMLElement)) return;
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

	function getTargetPlaneRotation(anchor: HTMLElement | null) {
		if (!anchor) return 0;

		let matrix = new DOMMatrix();
		let el: HTMLElement | null = anchor.parentElement;

		while (el && el !== document.documentElement) {
			if (isModalIsolationRoot(el)) break;

			const transform = getComputedStyle(el).transform;
			if (transform && transform !== 'none') {
				matrix = new DOMMatrix(transform).multiply(matrix);
			}
			el = el.parentElement;
		}

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
		return {
			cx: rect.left + rect.width / 2,
			cy: rect.top + rect.height / 2,
			width: layout ? el.offsetWidth : rect.width,
			height: layout ? el.offsetHeight : rect.height,
			planeRot: getTargetPlaneRotation(anchor)
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
		if (!flipTarget) return;
		const motion = modalTransition();
		flipTarget.style.transition = !enabled || motion === 'none' ? 'none' : `transform ${motion}`;
	}

	function clearMotionWillChange(el: HTMLElement, flipTarget: HTMLElement | null) {
		el.style.removeProperty('will-change');
		flipTarget?.style.removeProperty('will-change');
	}

	function setMotionWillChange(el: HTMLElement, flipTarget: HTMLElement | null) {
		el.style.setProperty('will-change', 'transform');
		if (enableFlip) flipTarget?.style.setProperty('will-change', 'transform');
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
		if (enableFlip && flipTarget) waits.push(waitTransition(flipTarget, 'transform', ms));
		await Promise.all(waits);
	}

	function readFlipDeg(flipTarget: HTMLElement | null) {
		if (!flipTarget) return FLIP_CLOSED_DEG;
		const transform = flipTarget.style.transform || getComputedStyle(flipTarget).transform;
		if (transform.includes('matrix')) {
			const matrix = new DOMMatrix(transform);
			const angle = (Math.atan2(matrix.m13, matrix.m11) * 180) / Math.PI;
			return Math.abs(angle) > 90 ? FLIP_OPEN_DEG : FLIP_CLOSED_DEG;
		}
		const match = transform.match(/rotateY\(([-\d.]+)deg\)/);
		if (!match) return FLIP_CLOSED_DEG;
		return Math.abs(parseFloat(match[1])) > 90 ? FLIP_OPEN_DEG : FLIP_CLOSED_DEG;
	}

	function focusTargetSize(width: number, height: number) {
		const vv = window.visualViewport;
		const viewW = vv?.width ?? window.innerWidth;
		const viewH = vv?.height ?? window.innerHeight;
		const maxW = viewW * 0.82;
		const maxH = viewH * 0.82;
		const scale = Math.min(1.75, maxW / width, maxH / height);
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

	async function waitFlipMotion(flipTarget: HTMLElement | null) {
		if (!enableFlip || !flipTarget) return;
		await waitTransition(flipTarget, 'transform', modalMotionMs());
	}

	function isGridHovered() {
		if (!rootEl) return false;
		const hover =
			rootEl.style.getPropertyValue('--hover') || getComputedStyle(rootEl).getPropertyValue('--hover');
		return hover.trim() === '1';
	}

	function applyExpandedHoverVisuals(preserveHover: boolean) {
		if (!rootEl) return;
		hoverFrozen = preserveHover;
	}

	function clearSurfaceGlow(surface: HTMLElement | null | undefined) {
		if (!surface) return;
		surface.classList.add('info-card-surface--spotlight-off');
		surface.style.setProperty('--spotlight', '0');
		void surface.offsetHeight;
		surface.classList.remove('info-card-surface--spotlight-off');
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

	function applyBackHoverTilt(e: PointerEvent) {
		if (!rootEl || !tiltEl || animating || hoverLocked || suppressHover) return;
		if (!isShowingBack() || prefersReducedMotion()) return;

		const surface = backSurfaceEl ?? rootEl;
		const r = surface.getBoundingClientRect();
		if (r.width <= 0 || r.height <= 0) return;

		const x = (e.clientX - r.left) / r.width;
		const y = (e.clientY - r.top) / r.height;
		const dx = x - 0.5;
		const dy = y - 0.5;

		const rotXDeg = dy * 2 * MAX_TILT_DEG;
		const rotYDeg = -dx * 2 * MAX_TILT_DEG;

		setHoverTilt(rotXDeg, rotYDeg);
		rootEl.style.setProperty('--scale', `${HOVER_SCALE}`);
		rootEl.style.setProperty('--hover', '1');
	}

	function setTilt(e: PointerEvent) {
		if (!rootEl || !tiltEl || animating || suppressHover || hoverLocked) return;

		if (isShowingBack()) {
			setPointerGlow(e);
			applyBackHoverTilt(e);
			return;
		}

		if (expanded) return;

		// Front face: spotlight only — no pointer tilt or scale.
		setPointerGlow(e);
	}

	function resetTilt() {
		if (!rootEl || animating) return;

		for (const surface of [surfaceEl, backSurfaceEl]) {
			clearSurfaceGlow(surface);
		}

		if (hoverLocked) return;

		resetTiltInstant();
		rootEl.style.setProperty('--scale', '1');
		rootEl.style.setProperty('--hover', '0');
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
		anchorHome.parent.insertBefore(anchorEl, anchorPlaceholder ?? anchorHome.next);
		anchorPlaceholder?.remove();
		anchorPlaceholder = null;
		anchorHome = null;
	}

	function clearHoverVisuals() {
		if (!rootEl) return;
		hoverFrozen = false;
		rootEl.style.setProperty('--scale', '1');
		rootEl.style.setProperty('--hover', '0');
	}

	async function expandCard() {
		if (!expandOnClick || !rootEl || !anchorEl || !tiltEl || expanded || animating) return;
		if (enableFlip && !flipEl) return;

		await claimCardModal(collapseCard);

		openingScrollLeft = readScrollLeft();
		const startVisual = readCardRect(rootEl, anchorEl, { visual: true });
		const startLayout = readCardRect(rootEl, anchorEl, { layout: true });
		const preserveHover = isGridHovered();
		const targetSize = centeredTargetSize(startLayout.width, startLayout.height);
		const backScale = visualScaleFromLayout(
			startLayout.width,
			startLayout.height,
			targetSize.width,
			targetSize.height
		);
		zoomTarget = computeStageZoomTransform(
			startVisual.cx,
			startVisual.cy,
			startVisual.width,
			startVisual.height,
			targetSize.width,
			targetSize.height,
			openingScrollLeft
		);
		const center = viewportCenter();
		const shellW = startLayout.width;
		const shellH = startLayout.height;
		const endScale = visualScaleFromLayout(shellW, shellH, targetSize.width, targetSize.height);
		openPinEnd = pinStateAtShell(shellW, shellH, center.x, center.y, endScale, 0);

		lockCardModal(openingScrollLeft);

		expanded = true;
		hoverLocked = true;
		applyExpandedHoverVisuals(preserveHover);
		rootEl.style.setProperty('--zoom-back-scale', String(backScale));

		await tick();

		animating = true;
		onModalOpen?.();

		resetTiltInstant();

		if (enableFlip && flipEl) resetFlipInstant(flipEl, FLIP_CLOSED_DEG);
		setFlipTransition(flipEl, false);

		await tick();
		setFlipTransition(flipEl, modalMotionMs() > 0);

		const runOpenMotion = () => {
			if (!zoomTarget) return;
			syncVignetteOpen();
			requestAnimationFrame(() => {
				if (!zoomTarget || !openPinEnd) return;
				const liveVisual = readCardRect(rootEl!, anchorEl, { visual: true });
				openPinStart = pinStateAtShell(
					shellW,
					shellH,
					liveVisual.cx,
					liveVisual.cy,
					1,
					liveVisual.planeRot
				);
				snapPinState(openPinStart);
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

		await Promise.all([waitStageZoomMotion(), waitFlipMotion(flipEl), waitVignetteMotion()]);

		if (enableFlip && flipEl) resetFlipInstant(flipEl, FLIP_OPEN_DEG);

		animating = false;
		hoverLocked = false;
		await tick();

		const endVisual = readCardRect(rootEl, anchorEl, { visual: true });
		openPinFlightEnd = computePinState(
			shellW,
			shellH,
			endVisual.cx,
			endVisual.cy,
			endVisual.width,
			endVisual.height,
			0
		);
		openPinEnd = toCrispPinState(openPinFlightEnd);
		snapPinState(openPinEnd);
		requestAnimationFrame(() => refreshHoverFromPointer());
	}

	async function collapseCard() {
		if (!rootEl || !anchorEl || !expanded || animating) return;

		animating = true;
		dismissing = true;
		suppressHover = true;
		hoverLocked = true;
		hoverFrozen = false;

		setFlipTransition(flipEl, modalMotionMs() > 0);

		const dismissOrigin = openPinEnd
			? pinCenter(openPinEnd)
			: pinCenter(
					computePinState(
						rootEl.offsetWidth,
						rootEl.offsetHeight,
						readCardRect(rootEl, anchorEl, { visual: true }).cx,
						readCardRect(rootEl, anchorEl, { visual: true }).cy,
						readCardRect(rootEl, anchorEl, { visual: true }).width,
						readCardRect(rootEl, anchorEl, { visual: true }).height
					)
				);
		const dismissOriginX = zoomTarget?.originX ?? 0;
		const dismissOriginY = zoomTarget?.originY ?? 0;

		const runDismissMotion = () => {
			syncVignetteDismiss(dismissOrigin);
			requestAnimationFrame(() => {
				if (openPinFlightEnd) snapPinState(openPinFlightEnd);
				else if (openPinEnd) snapPinState(openPinEnd);
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

		await Promise.all([waitStageZoomMotion(), waitFlipMotion(flipEl), waitVignetteMotion()]);

		if (enableFlip && flipEl) resetFlipInstant(flipEl, FLIP_CLOSED_DEG);

		expanded = false;
		zoomTarget = null;
		openPinStart = null;
		openPinEnd = null;
		openPinFlightEnd = null;
		rootEl.style.removeProperty('--zoom-back-scale');
		unpinZoomCard();
		clearHoverVisuals();
		await tick();

		dismissing = false;
		animating = false;
		hoverLocked = false;
		suppressHover = true;
		openingScrollLeft = 0;
		unlockCardModal();
		releaseCardModal(collapseCard);
	}

	function handleClick(e: MouseEvent) {
		if (!expandOnClick || expanded || animating || isInteractiveTarget(e.target)) return;
		trackPointer(e.clientX, e.clientY);
		e.stopPropagation();
		void expandCard();
	}

	function handlePointerLeave() {
		suppressHover = false;
		resetTilt();
	}

	onMount(() => {
		const onPointerMove = (e: PointerEvent) => {
			trackPointer(e.clientX, e.clientY);
			if (expanded && modalEl() && !animating) refreshHoverFromPointer();
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
		class:info-card--hover-frozen={hoverFrozen}
		class:info-card--modal={expanded}
		class:info-card--zoom-active={expanded}
		class:info-card--modal-crisp={expanded && !animating}
		class:info-card--dismissing={dismissing}
		bind:this={rootEl}
		on:click={handleClick}
		on:pointerenter={setTilt}
		on:pointermove={setTilt}
		on:pointerleave={handlePointerLeave}
	>
		<div class="info-card-hover-lift">
			<div class="info-card-tilt hover-polaroid-tilt" bind:this={tiltEl}>
				{#if enableFlip}
					<div class="info-card-flip-stage">
						<div class="info-card-flip" bind:this={flipEl}>
							<div class="info-card-face info-card-face--front">
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
							<div class="info-card-face info-card-face--back">
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

	/* Counter-scale back only while zoom animation is running (not crisp). */
	:global(.info-card--zoom-active:not(.info-card--modal-crisp) .info-card-surface--back .card-row--back),
	:global(.info-card--zoom-active:not(.info-card--modal-crisp) .info-card-surface--back .polaroid-content--back),
	:global(
			.card-modal-layer
				.info-card--modal:not(.info-card--modal-crisp)
				.info-card-surface--back
				.card-row--back
		),
	:global(
			.card-modal-layer
				.info-card--modal:not(.info-card--modal-crisp)
				.info-card-surface--back
				.polaroid-content--back
		) {
		transform: scale(calc(1 / var(--zoom-back-scale, 1)));
		transform-origin: top left;
		width: calc(100% * var(--zoom-back-scale, 1));
		height: calc(100% * var(--zoom-back-scale, 1));
	}

	:global(.info-card--zoom-active:not(.info-card--modal-crisp) .info-card-surface--back .card-back-main),
	:global(.info-card--zoom-active:not(.info-card--modal-crisp) .info-card-surface--back .polaroid-back-main),
	:global(
			.card-modal-layer
				.info-card--modal:not(.info-card--modal-crisp)
				.info-card-surface--back
				.card-back-main
		),
	:global(
			.card-modal-layer
				.info-card--modal:not(.info-card--modal-crisp)
				.info-card-surface--back
				.polaroid-back-main
		) {
		overflow: hidden;
	}

	:global(.info-card--modal-crisp .info-card-surface--back .card-row--back),
	:global(.info-card--modal-crisp .info-card-surface--back .polaroid-content--back) {
		transform: none;
		width: 100%;
		height: 100%;
	}

	.info-card.info-card--modal-crisp:not(.info-card--ghost) .info-card-surface,
	.info-card.info-card--modal-crisp:not(.info-card--ghost) .info-card-surface--back {
		--grid-dot: calc(1px * var(--zoom-back-scale, 1));
		--grid-fine: calc(15px * var(--zoom-back-scale, 1));
		--grid-spot-radius: calc(60px * var(--zoom-back-scale, 1));
		--hp-shell-border: calc(2px * var(--zoom-back-scale, 1));
		--hp-frame-border: calc(1px * var(--zoom-back-scale, 1));
		--hp-frame-inset: calc(5px * var(--zoom-back-scale, 1));
		--hp-shell-radius: calc(6px * var(--zoom-back-scale, 1));
		--hp-frame-radius: calc(2px * var(--zoom-back-scale, 1));
		border-width: var(--hp-shell-border);
		border-radius: var(--hp-shell-radius);
		border-color: var(--hp-border-hover);
		background: var(--hp-bg-hover);
		box-shadow: var(--hp-shadow-hover);
		filter: brightness(1.12) saturate(1.15);
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		transition: none !important;
	}

	.info-card.info-card--modal-crisp:not(.info-card--ghost) .info-card-surface:not(:global(.has-logo)),
	.info-card.info-card--modal-crisp:not(.info-card--ghost) .info-card-surface--back:not(:global(.has-logo)) {
		padding: calc(14px * var(--zoom-back-scale, 1));
	}

	.info-card.info-card--modal-crisp:not(.info-card--ghost) .info-card-surface:global(.has-logo),
	.info-card.info-card--modal-crisp:not(.info-card--ghost) .info-card-surface--back:global(.has-logo) {
		padding: 0;
	}

	.info-card.info-card--modal-crisp:not(.info-card--ghost) .info-card-surface::before,
	.info-card.info-card--modal-crisp:not(.info-card--ghost) .info-card-surface--back::before {
		inset: var(--hp-frame-inset);
		border-width: var(--hp-frame-border);
		border-radius: var(--hp-frame-radius);
		border-color: rgba(220, 235, 255, 0.72);
		box-shadow:
			inset 0 0 calc(48px * var(--zoom-back-scale, 1)) rgba(180, 220, 255, 0.24),
			0 0 calc(32px * var(--zoom-back-scale, 1)) rgba(180, 220, 255, 0.35);
	}

	.info-card.info-card--modal-crisp:not(.info-card--ghost):is(
			.info-card--green,
			.info-card--teal,
			.info-card--aquamarine,
			.info-card--blue,
			.info-card--periwinkle
		)
		.info-card-surface,
	.info-card.info-card--modal-crisp:not(.info-card--ghost):is(
			.info-card--green,
			.info-card--teal,
			.info-card--aquamarine,
			.info-card--blue,
			.info-card--periwinkle
		)
		.info-card-surface--back {
		filter: brightness(1.04) saturate(1.1);
	}

	.info-card.info-card--modal-crisp:not(.info-card--ghost):is(
			.info-card--green,
			.info-card--teal,
			.info-card--aquamarine,
			.info-card--blue,
			.info-card--periwinkle
		)
		.info-card-surface::before,
	.info-card.info-card--modal-crisp:not(.info-card--ghost):is(
			.info-card--green,
			.info-card--teal,
			.info-card--aquamarine,
			.info-card--blue,
			.info-card--periwinkle
		)
		.info-card-surface--back::before {
		border-color: rgba(var(--tone-border-hover), 0.42);
		box-shadow:
			inset 0 0 calc(48px * var(--zoom-back-scale, 1)) rgba(255, 255, 255, 0.16),
			0 0 calc(32px * var(--zoom-back-scale, 1)) rgba(var(--tone-shadow), 0.14);
	}

	.info-card.info-card--modal-crisp:not(.info-card--ghost) .info-card-face,
	.info-card.info-card--modal-crisp:not(.info-card--ghost) .info-card-surface,
	.info-card.info-card--modal-crisp:not(.info-card--ghost) .info-card-surface--back {
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	.info-card.info-card--grid-hidden {
		visibility: hidden;
		pointer-events: none;
	}

	/* Ghost flight scale lives on the motion layer only — neutralize nested hover lift. */
	.info-card.info-card--ghost .info-card-hover-lift {
		transform: scale(1);
		transition: none;
	}

	.info-card.info-card--ghost.info-card--animating,
	.info-card.info-card--ghost.info-card--modal,
	.info-card.info-card--ghost.info-card--animating .info-card-hover-lift,
	.info-card.info-card--ghost.info-card--modal .info-card-hover-lift,
	.info-card.info-card--ghost.info-card--animating .info-card-tilt,
	.info-card.info-card--ghost.info-card--modal .info-card-tilt,
	.info-card.info-card--ghost.info-card--animating .info-card-flip-stage,
	.info-card.info-card--ghost.info-card--modal .info-card-flip-stage,
	.info-card.info-card--ghost.info-card--animating .info-card-flip,
	.info-card.info-card--ghost.info-card--modal .info-card-flip {
		transform-style: preserve-3d;
	}

	.info-card.info-card--ghost.info-card--animating .info-card-flip-stage,
	.info-card.info-card--ghost.info-card--modal .info-card-flip-stage {
		overflow: visible;
	}

	.info-card.info-card--modal:not(.info-card--ghost),
	.info-card.info-card--modal:not(.info-card--ghost) .info-card-hover-lift,
	.info-card.info-card--modal:not(.info-card--ghost) .info-card-tilt,
	.info-card.info-card--modal:not(.info-card--ghost) .info-card-flip-stage,
	.info-card.info-card--modal:not(.info-card--ghost) .info-card-flip {
		transform-style: preserve-3d;
	}

	.info-card.info-card--modal:not(.info-card--ghost) .info-card-flip-stage {
		overflow: visible;
	}

	.info-card.info-card--ghost.info-card--animating .info-card-surface,
	.info-card.info-card--ghost.info-card--animating .info-card-surface--back,
	.info-card.info-card--ghost.info-card--modal .info-card-surface,
	.info-card.info-card--ghost.info-card--modal .info-card-surface--back {
		overflow: hidden;
		transition: none !important;
	}

	/* Back lays out at modal width; fixed counter-scale cancels the shell warp. */
	:global(.info-card--ghost .info-card-surface--back .card-row--back) {
		transform: scale(calc(1 / var(--modal-rest-scale, 1)));
		transform-origin: top left;
		width: calc(100% * var(--modal-rest-scale, 1));
		height: calc(100% * var(--modal-rest-scale, 1));
	}

	:global(.info-card--ghost .card-back-main) {
		overflow: hidden;
	}

	/* Scaled grid/border/surface tokens match the warped flight so settle stays continuous. */
	.info-card.info-card--ghost.info-card--modal-crisp .info-card-surface {
		--grid-dot: calc(1px * var(--modal-rest-scale, 1));
		--grid-fine: calc(15px * var(--modal-rest-scale, 1));
		--grid-spot-radius: calc(60px * var(--modal-rest-scale, 1));
		--hp-shell-border: calc(2px * var(--modal-rest-scale, 1));
		--hp-frame-border: calc(1px * var(--modal-rest-scale, 1));
		--hp-frame-inset: calc(5px * var(--modal-rest-scale, 1));
		--hp-shell-radius: calc(6px * var(--modal-rest-scale, 1));
		--hp-frame-radius: calc(2px * var(--modal-rest-scale, 1));
		border-width: var(--hp-shell-border);
		border-radius: var(--hp-shell-radius);
		border-color: var(--hp-border-hover);
		background: var(--hp-bg-hover);
		box-shadow: var(--hp-shadow-hover);
		filter: brightness(1.12) saturate(1.15);
		transition: none !important;
	}

	/* Logo backs keep edge-to-edge layout — same as flight and the real modal. */
	.info-card.info-card--ghost.info-card--modal-crisp .info-card-surface:not(:global(.has-logo)) {
		padding: calc(14px * var(--modal-rest-scale, 1));
	}

	.info-card.info-card--ghost.info-card--modal-crisp .info-card-surface:global(.has-logo) {
		padding: 0;
	}

	.info-card.info-card--ghost.info-card--modal-crisp:is(
			.info-card--green,
			.info-card--teal,
			.info-card--aquamarine,
			.info-card--blue,
			.info-card--periwinkle
		)
		.info-card-surface {
		filter: brightness(1.04) saturate(1.1);
	}

	.info-card.info-card--ghost.info-card--modal-crisp .info-card-surface::before {
		inset: var(--hp-frame-inset);
		border-width: var(--hp-frame-border);
		border-radius: var(--hp-frame-radius);
		border-color: rgba(220, 235, 255, 0.72);
		box-shadow:
			inset 0 0 calc(48px * var(--modal-rest-scale, 1)) rgba(180, 220, 255, 0.24),
			0 0 calc(32px * var(--modal-rest-scale, 1)) rgba(180, 220, 255, 0.35);
	}

	.info-card.info-card--ghost.info-card--modal-crisp:is(
			.info-card--green,
			.info-card--teal,
			.info-card--aquamarine,
			.info-card--blue,
			.info-card--periwinkle
		)
		.info-card-surface::before {
		border-color: rgba(var(--tone-border-hover), 0.42);
		box-shadow:
			inset 0 0 calc(48px * var(--modal-rest-scale, 1)) rgba(255, 255, 255, 0.16),
			0 0 calc(32px * var(--modal-rest-scale, 1)) rgba(var(--tone-shadow), 0.14);
	}

	.info-card.info-card--ghost.info-card--modal-crisp .info-card-surface::after {
		opacity: 0.92;
	}

	.info-card.info-card--ghost.info-card--modal-crisp:is(
			.info-card--green,
			.info-card--teal,
			.info-card--aquamarine,
			.info-card--blue,
			.info-card--periwinkle
		)
		.info-card-surface::after {
		opacity: 0.5;
	}

	.info-card.info-card--ghost.info-card--modal-crisp .holo-layer {
		opacity: 1;
		animation-duration: 2.8s;
	}

	:global(.info-card--ghost.info-card--modal-crisp .info-card-surface--back .card-row--back) {
		transform: none;
		width: 100%;
		height: 100%;
	}

	.info-card.info-card--ghost.info-card--animating .info-card-flip,
	.info-card.info-card--ghost.info-card--animating .info-card-face,
	.info-card.info-card--ghost.info-card--animating .info-card-surface,
	.info-card.info-card--ghost.info-card--modal .info-card-flip,
	.info-card.info-card--ghost.info-card--modal .info-card-face,
	.info-card.info-card--ghost.info-card--modal .info-card-surface {
		box-sizing: border-box;
		min-height: 0;
	}

	.info-card {
		width: 100%;
		height: 100%;
		cursor: pointer;
	}

	.info-card-hover-lift {
		width: 100%;
		height: 100%;
		transform: scale(var(--scale, 1));
		transition: transform 0.26s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.info-card.info-card--modal,
	.info-card.info-card--modal-centered {
		pointer-events: auto;
		cursor: default;
	}

	.info-card.info-card--modal-centered {
		z-index: 1;
	}

	.info-card.info-card--animating .info-card-hover-lift,
	.info-card.info-card--dismissing .info-card-hover-lift {
		transition: none;
		transform: scale(1);
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
	}

	.info-card-face--back {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		transform: rotateY(180deg);
	}

	.info-card:global(.info-card--project),
	.info-card:global(.info-card--project) .info-card-tilt {
		overflow: visible;
	}

	.info-card:global(.info-card--project) .info-card-surface {
		overflow: hidden;
	}

	.info-card-surface--back {
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

	:global(.hover-polaroid-scale:hover) .info-card-surface,
	:global(.info-card--modal.hover-polaroid-scale) .info-card-surface,
	:global(.info-card--hover-frozen.hover-polaroid-scale) .info-card-surface {
		filter: brightness(1.12) saturate(1.15);
	}

	:global(.hover-polaroid-scale:hover) .info-card-surface::before,
	:global(.info-card--modal.hover-polaroid-scale) .info-card-surface::before,
	:global(.info-card--hover-frozen.hover-polaroid-scale) .info-card-surface::before {
		border-color: rgba(220, 235, 255, 0.72);
		box-shadow:
			inset 0 0 48px rgba(180, 220, 255, 0.24),
			0 0 32px rgba(180, 220, 255, 0.35);
	}

	:global(.hover-polaroid-scale:hover) .info-card-surface::after,
	:global(.info-card--modal.hover-polaroid-scale) .info-card-surface::after,
	:global(.info-card--hover-frozen.hover-polaroid-scale) .info-card-surface::after {
		opacity: 0.92;
	}

	:global(.hover-polaroid-scale:hover) .holo-layer,
	:global(.info-card--modal.hover-polaroid-scale) .holo-layer,
	:global(.info-card--hover-frozen.hover-polaroid-scale) .holo-layer {
		opacity: 1;
		animation-duration: 2.8s;
	}

	@media (prefers-reduced-motion: reduce) {
		.holo-layer {
			animation: none;
			background-position: 50% 0;
		}

		.info-card-hover-lift {
			transition: none;
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

	:global(.hover-polaroid-scale:hover) :global(.experience-company),
	:global(.info-card--modal.hover-polaroid-scale) :global(.experience-company),
	:global(.info-card--hover-frozen.hover-polaroid-scale) :global(.experience-company) {
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

	:global(.info-card--green.hover-polaroid-scale:hover) .info-card-surface,
	:global(.info-card--teal.hover-polaroid-scale:hover) .info-card-surface,
	:global(.info-card--aquamarine.hover-polaroid-scale:hover) .info-card-surface,
	:global(.info-card--blue.hover-polaroid-scale:hover) .info-card-surface,
	:global(.info-card--periwinkle.hover-polaroid-scale:hover) .info-card-surface,
	:global(.info-card--green.info-card--modal.hover-polaroid-scale) .info-card-surface,
	:global(.info-card--teal.info-card--modal.hover-polaroid-scale) .info-card-surface,
	:global(.info-card--aquamarine.info-card--modal.hover-polaroid-scale) .info-card-surface,
	:global(.info-card--blue.info-card--modal.hover-polaroid-scale) .info-card-surface,
	:global(.info-card--periwinkle.info-card--modal.hover-polaroid-scale) .info-card-surface {
		filter: brightness(1.04) saturate(1.1);
	}

	:global(.info-card--green.hover-polaroid-scale:hover) .info-card-surface::before,
	:global(.info-card--teal.hover-polaroid-scale:hover) .info-card-surface::before,
	:global(.info-card--aquamarine.hover-polaroid-scale:hover) .info-card-surface::before,
	:global(.info-card--blue.hover-polaroid-scale:hover) .info-card-surface::before,
	:global(.info-card--periwinkle.hover-polaroid-scale:hover) .info-card-surface::before,
	:global(.info-card--green.info-card--modal.hover-polaroid-scale) .info-card-surface::before,
	:global(.info-card--teal.info-card--modal.hover-polaroid-scale) .info-card-surface::before,
	:global(.info-card--aquamarine.info-card--modal.hover-polaroid-scale) .info-card-surface::before,
	:global(.info-card--blue.info-card--modal.hover-polaroid-scale) .info-card-surface::before,
	:global(.info-card--periwinkle.info-card--modal.hover-polaroid-scale) .info-card-surface::before {
		border-color: rgba(var(--tone-border-hover), 0.42);
		box-shadow:
			inset 0 0 48px rgba(255, 255, 255, 0.16),
			0 0 32px rgba(var(--tone-shadow), 0.14);
	}

	:global(.info-card--green.hover-polaroid-scale:hover) .info-card-surface::after,
	:global(.info-card--teal.hover-polaroid-scale:hover) .info-card-surface::after,
	:global(.info-card--aquamarine.hover-polaroid-scale:hover) .info-card-surface::after,
	:global(.info-card--blue.hover-polaroid-scale:hover) .info-card-surface::after,
	:global(.info-card--periwinkle.hover-polaroid-scale:hover) .info-card-surface::after,
	:global(.info-card--green.info-card--modal.hover-polaroid-scale) .info-card-surface::after,
	:global(.info-card--teal.info-card--modal.hover-polaroid-scale) .info-card-surface::after,
	:global(.info-card--aquamarine.info-card--modal.hover-polaroid-scale) .info-card-surface::after,
	:global(.info-card--blue.info-card--modal.hover-polaroid-scale) .info-card-surface::after,
	:global(.info-card--periwinkle.info-card--modal.hover-polaroid-scale) .info-card-surface::after {
		opacity: 0.5;
	}

	.info-card:is(.info-card--green, .info-card--teal, .info-card--aquamarine, .info-card--blue, .info-card--periwinkle)
		:global(.experience-company) {
		color: var(--tone-heading);
		text-shadow:
			0 1px 0 rgba(255, 255, 255, 0.75),
			0 1px 3px rgba(var(--tone-border), 0.18);
	}

	:global(.info-card--green.hover-polaroid-scale:hover) :global(.experience-company),
	:global(.info-card--teal.hover-polaroid-scale:hover) :global(.experience-company),
	:global(.info-card--aquamarine.hover-polaroid-scale:hover) :global(.experience-company),
	:global(.info-card--blue.hover-polaroid-scale:hover) :global(.experience-company),
	:global(.info-card--periwinkle.hover-polaroid-scale:hover) :global(.experience-company),
	:global(.info-card--green.info-card--modal.hover-polaroid-scale) :global(.experience-company),
	:global(.info-card--teal.info-card--modal.hover-polaroid-scale) :global(.experience-company),
	:global(.info-card--aquamarine.info-card--modal.hover-polaroid-scale) :global(.experience-company),
	:global(.info-card--blue.info-card--modal.hover-polaroid-scale) :global(.experience-company),
	:global(.info-card--periwinkle.info-card--modal.hover-polaroid-scale) :global(.experience-company) {
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