<script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';
	import {
		claimCardModal,
		dismissBackdrop,
		lockCardModal,
		modalMotionMs,
		modalTransition,
		portalCardToModalLayer,
		releaseCardModal,
		returnCardToAnchor,
		unlockCardModal,
		viewportCenter
	} from '$lib/cardModal';

	let className = '';
	export { className as class };

	export let surfaceClass = '';
	export let theme: 'dark' | 'green' | 'teal' | 'aquamarine' | 'blue' | 'periwinkle' = 'dark';
	export let expandOnClick = true;
	export let onModalOpen: (() => void) | undefined = undefined;

	let anchorEl: HTMLElement | null = null;
	let rootEl: HTMLElement | null = null;
	let tiltEl: HTMLElement | null = null;
	let surfaceEl: HTMLElement | null = null;

	let expanded = false;
	let animating = false;
	let spacerW = 0;
	let spacerH = 0;
	let lastPointerX = 0;
	let lastPointerY = 0;

	function trackPointer(clientX: number, clientY: number) {
		lastPointerX = clientX;
		lastPointerY = clientY;
	}

	function pointerEventAtLastPointer(): PointerEvent {
		return { clientX: lastPointerX, clientY: lastPointerY } as PointerEvent;
	}

	function isPointerOverRoot() {
		if (!rootEl) return false;
		const hit = document.elementFromPoint(lastPointerX, lastPointerY);
		return !!hit && rootEl.contains(hit);
	}

	function refreshHoverFromPointer() {
		if (!rootEl || animating || !expanded) return;
		if (!isPointerOverRoot()) {
			resetTilt();
			return;
		}
		setPointerGlow(pointerEventAtLastPointer());
	}

	function prefersReducedMotion() {
		return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	const MAX_TILT_DEG = 9;
	const HOVER_SCALE = 1.055;
	const PERSPECTIVE_PX = 900;
	const FLIP_OPEN_DEG = 360;
	const FLIP_CLOSE_DEG = -360;

	function isInteractiveTarget(target: EventTarget | null) {
		return target instanceof Element && !!target.closest('a, button, input, textarea, select, label');
	}

	function flipTransform(deg: number) {
		return `perspective(${PERSPECTIVE_PX}px) rotateX(0deg) rotateY(${deg}deg)`;
	}

	function resetFlipInstant() {
		if (!tiltEl) return;
		tiltEl.style.transition = 'none';
		tiltEl.style.transform = flipTransform(0);
		void tiltEl.offsetHeight;
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

	function readHoverScale() {
		if (!rootEl) return 1;
		return parseFloat(rootEl.style.getPropertyValue('--scale') || '1') || 1;
	}

	function readLiftPx() {
		if (!rootEl) return 0;
		return parseFloat(rootEl.style.getPropertyValue('--lift') || '0') || 0;
	}

	function modalRootTransform(rotZ: number, scale: number, liftPx: number) {
		return `translate(-50%, calc(-50% + ${liftPx}px)) rotate(${rotZ}deg) scale(${scale})`;
	}

	function applyModalAtCenter(
		cx: number,
		cy: number,
		width: number,
		height: number,
		{
			rotZ = 0,
			scale = 1,
			liftPx = 0
		}: { rotZ?: number; scale?: number; liftPx?: number } = {}
	) {
		if (!rootEl) return;
		rootEl.classList.remove('info-card--modal-centered');
		rootEl.style.position = 'fixed';
		rootEl.style.top = `${cy}px`;
		rootEl.style.left = `${cx}px`;
		rootEl.style.right = 'auto';
		rootEl.style.bottom = 'auto';
		rootEl.style.width = `${width}px`;
		rootEl.style.height = `${height}px`;
		rootEl.style.margin = '0';
		rootEl.style.transformOrigin = 'center center';
		rootEl.style.transform = modalRootTransform(rotZ, scale, liftPx);
	}

	function captureCardVisualState() {
		if (!rootEl || !anchorEl) {
			return {
				cx: 0,
				cy: 0,
				width: 0,
				height: 0,
				planeRot: 0,
				scale: 1,
				liftPx: 0
			};
		}

		const rect = rootEl.getBoundingClientRect();
		return {
			cx: rect.left + rect.width / 2,
			cy: rect.top + rect.height / 2,
			width: rootEl.offsetWidth,
			height: rootEl.offsetHeight,
			planeRot: getTargetPlaneRotation(anchorEl),
			scale: readHoverScale(),
			liftPx: readLiftPx()
		};
	}

	function beginFlipAnimation(toDeg: number) {
		if (!rootEl || !tiltEl) return;
		const motion = modalTransition();
		rootEl.classList.add('info-card--modal-flip');
		const current = tiltEl.style.transform || getComputedStyle(tiltEl).transform;
		tiltEl.style.transition = 'none';
		tiltEl.style.transform = !current || current === 'none' ? flipTransform(0) : current;
		void tiltEl.offsetHeight;
		tiltEl.style.transition = motion === 'none' ? 'none' : `transform ${motion}`;
		tiltEl.style.transform = flipTransform(toDeg);
	}

	function endFlipAnimation() {
		resetFlipInstant();
		rootEl?.classList.remove('info-card--modal-flip');
	}

	function clearModalMotion() {
		if (!rootEl || !tiltEl) return;
		rootEl.style.transition = '';
		tiltEl.style.transition = 'none';
		rootEl.classList.remove('info-card--modal-flip');
	}

	function snapModalCentered(width: number, height: number) {
		if (!rootEl) return;
		const { x, y } = viewportCenter();
		rootEl.style.transition = 'none';
		rootEl.style.position = 'fixed';
		rootEl.style.top = `${y}px`;
		rootEl.style.left = `${x}px`;
		rootEl.style.right = 'auto';
		rootEl.style.bottom = 'auto';
		rootEl.style.width = `${width}px`;
		rootEl.style.height = `${height}px`;
		rootEl.style.margin = '0';
		rootEl.style.transform = '';
		rootEl.style.setProperty('--modal-scale', '1');
		rootEl.style.setProperty('--modal-lift', '0px');
		rootEl.style.setProperty('--scale', '1');
		rootEl.style.setProperty('--lift', '0px');
		rootEl.classList.add('info-card--modal-centered');
		void rootEl.offsetHeight;
		rootEl.style.transition = '';
	}

	function clearModalRect() {
		if (!rootEl) return;
		rootEl.style.position = '';
		rootEl.style.top = '';
		rootEl.style.left = '';
		rootEl.style.right = '';
		rootEl.style.bottom = '';
		rootEl.style.width = '';
		rootEl.style.height = '';
		rootEl.style.margin = '';
		rootEl.style.transform = '';
		rootEl.style.removeProperty('--modal-scale');
		rootEl.style.removeProperty('--modal-lift');
		rootEl.classList.remove('info-card--modal', 'info-card--modal-centered');
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

	function waitModalTransition() {
		return new Promise<void>((resolve) => {
			window.setTimeout(resolve, modalMotionMs());
		});
	}

	function setRectMotion() {
		if (!rootEl) return;
		const motion = modalTransition();
		rootEl.style.transition =
			motion === 'none'
				? 'none'
				: `top ${motion}, left ${motion}, width ${motion}, height ${motion}, transform ${motion}`;
	}

	function setHoverTilt(rotXDeg: number, rotYDeg: number) {
		if (!tiltEl) return;
		tiltEl.style.transform = `perspective(${PERSPECTIVE_PX}px) rotateX(${rotXDeg.toFixed(3)}deg) rotateY(${rotYDeg.toFixed(3)}deg)`;
	}

	function setPointerGlow(e: PointerEvent) {
		if (!surfaceEl || !rootEl || animating) return;

		const rootRect = rootEl.getBoundingClientRect();
		const u = (e.clientX - rootRect.left) / rootRect.width;
		const v = (e.clientY - rootRect.top) / rootRect.height;

		surfaceEl.style.setProperty('--pointer-u', `${(u * 100).toFixed(3)}%`);
		surfaceEl.style.setProperty('--pointer-v', `${(v * 100).toFixed(3)}%`);
		surfaceEl.style.setProperty('--spotlight', '1');
	}

	function setTilt(e: PointerEvent) {
		if (!rootEl || !tiltEl || !surfaceEl || animating) return;

		if (expanded) {
			setPointerGlow(e);
			return;
		}

		setPointerGlow(e);

		if (prefersReducedMotion()) return;

		const r = rootEl.getBoundingClientRect();
		const x = (e.clientX - r.left) / r.width;
		const y = (e.clientY - r.top) / r.height;
		const dx = x - 0.5;
		const dy = y - 0.5;

		const rotXDeg = dy * 2 * MAX_TILT_DEG;
		const rotYDeg = -dx * 2 * MAX_TILT_DEG;

		setHoverTilt(rotXDeg, rotYDeg);

		rootEl.style.setProperty('--scale', `${HOVER_SCALE}`);
		rootEl.style.setProperty('--hover', '1');
		rootEl.style.setProperty('--lift', '-10px');
	}

	function resetTilt() {
		if (!rootEl || animating) return;

		surfaceEl?.style.setProperty('--spotlight', '0');
		surfaceEl?.style.setProperty('--pointer-u', '50%');
		surfaceEl?.style.setProperty('--pointer-v', '50%');

		if (expanded) return;

		if (tiltEl) setHoverTilt(0, 0);
		rootEl.style.setProperty('--scale', `1`);
		rootEl.style.setProperty('--hover', '0');
		rootEl.style.setProperty('--lift', '0px');
	}

	async function expandCard() {
		if (!expandOnClick || !rootEl || !anchorEl || !tiltEl || expanded || animating) return;

		const start = captureCardVisualState();
		spacerW = start.width;
		spacerH = start.height;

		await claimCardModal(collapseCard);
		expanded = true;
		animating = true;
		lockCardModal();
		rootEl.classList.add('info-card--modal');
		portalCardToModalLayer(rootEl);
		onModalOpen?.();

		applyModalAtCenter(start.cx, start.cy, start.width, start.height, {
			rotZ: start.planeRot,
			scale: start.scale,
			liftPx: start.liftPx
		});

		await tick();

		const targetSize = centeredTargetSize(start.width, start.height);
		const { x, y } = viewportCenter();
		setRectMotion();
		beginFlipAnimation(FLIP_OPEN_DEG);

		requestAnimationFrame(() => {
			applyModalAtCenter(x, y, targetSize.width, targetSize.height, {
				rotZ: 0,
				scale: 1,
				liftPx: 0
			});
		});

		await waitModalTransition();
		endFlipAnimation();
		resetTilt();
		snapModalCentered(targetSize.width, targetSize.height);
		clearModalMotion();
		animating = false;
		requestAnimationFrame(() => refreshHoverFromPointer());
	}

	async function collapseCard() {
		if (!rootEl || !anchorEl || !tiltEl || !expanded) return;
		if (animating) return;

		animating = true;
		dismissBackdrop();
		const anchorRect = anchorEl.getBoundingClientRect();
		const anchorCx = anchorRect.left + anchorRect.width / 2;
		const anchorCy = anchorRect.top + anchorRect.height / 2;
		const anchorW = anchorEl.offsetWidth;
		const anchorH = anchorEl.offsetHeight;
		const planeRotTarget = getTargetPlaneRotation(anchorEl);
		const { x, y } = viewportCenter();
		const modalRect = rootEl.getBoundingClientRect();

		rootEl.classList.remove('info-card--modal-centered');
		applyModalAtCenter(
			modalRect.left + modalRect.width / 2,
			modalRect.top + modalRect.height / 2,
			modalRect.width,
			modalRect.height,
			{ rotZ: 0, scale: 1, liftPx: 0 }
		);
		resetFlipInstant();

		await tick();

		setRectMotion();
		beginFlipAnimation(FLIP_CLOSE_DEG);

		requestAnimationFrame(() => {
			applyModalAtCenter(anchorCx, anchorCy, anchorW, anchorH, {
				rotZ: planeRotTarget,
				scale: 1,
				liftPx: 0
			});
		});

		await waitModalTransition();
		endFlipAnimation();
		clearModalRect();
		returnCardToAnchor(rootEl, anchorEl);
		clearModalMotion();
		resetTilt();
		expanded = false;
		animating = false;
		spacerW = 0;
		spacerH = 0;
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
		resetTilt();
	}

	onMount(() => {
		const onPointerMove = (e: PointerEvent) => trackPointer(e.clientX, e.clientY);
		window.addEventListener('pointermove', onPointerMove, { passive: true });
		return () => window.removeEventListener('pointermove', onPointerMove);
	});

	onDestroy(() => {
		if (expanded && rootEl && anchorEl) {
			returnCardToAnchor(rootEl, anchorEl);
			clearModalRect();
		}
		if (expanded) {
			unlockCardModal();
			releaseCardModal(collapseCard);
		}
	});
</script>

<div class="info-card-anchor" bind:this={anchorEl}>
	{#if expanded}
		<div
			class="info-card-spacer"
			style:width="{spacerW}px"
			style:height="{spacerH}px"
			aria-hidden="true"
		></div>
	{/if}

	<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
	<div
		class="info-card hover-polaroid-scale {theme !== 'dark' ? `info-card--${theme}` : ''} {className}"
		class:info-card--expanded={expanded}
		bind:this={rootEl}
		on:click={handleClick}
		on:pointerenter={setTilt}
		on:pointermove={setTilt}
		on:pointerleave={handlePointerLeave}
	>
		<div class="info-card-tilt hover-polaroid-tilt" bind:this={tiltEl}>
			<div class="info-card-surface hover-polaroid-surface {surfaceClass}" bind:this={surfaceEl}>
				<div class="holo-layer" aria-hidden="true"></div>
				<div class="grid-base" aria-hidden="true"></div>
				<div class="grid-cursor" aria-hidden="true"></div>
				<slot />
			</div>
		</div>
	</div>
</div>

<style>
	.info-card-anchor {
		width: 100%;
		height: 100%;
	}

	.info-card-spacer {
		pointer-events: none;
		visibility: hidden;
	}

	.info-card {
		width: 100%;
		height: 100%;
		transform: scale(var(--scale, 1)) translateY(var(--lift, 0px));
		transition: transform 0.26s cubic-bezier(0.22, 1, 0.36, 1);
		cursor: pointer;
	}

	.info-card.info-card--modal,
	.info-card.info-card--modal-centered {
		pointer-events: auto;
		cursor: default;
	}

	.info-card.info-card--modal-centered {
		z-index: 1;
	}

	.info-card-tilt {
		width: 100%;
		height: 100%;
		transform-style: preserve-3d;
	}

	.info-card:global(.info-card--project),
	.info-card:global(.info-card--project) .info-card-tilt {
		overflow: visible;
	}

	.info-card:global(.info-card--project) .info-card-surface {
		overflow: hidden;
	}

	.info-card-surface {
		--pointer-u: 50%;
		--pointer-v: 50%;
		--spotlight: 0;
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
		background-image:
			repeating-linear-gradient(
				to bottom,
				transparent 0,
				transparent calc(var(--grid-fine) - 1px),
				rgba(186, 206, 234, 0.07) calc(var(--grid-fine) - 1px),
				rgba(186, 206, 234, 0.07) var(--grid-fine)
			),
			repeating-linear-gradient(
				to right,
				transparent 0,
				transparent calc(var(--grid-fine) - 1px),
				rgba(186, 206, 234, 0.06) calc(var(--grid-fine) - 1px),
				rgba(186, 206, 234, 0.06) var(--grid-fine)
			);
	}

	.grid-cursor {
		background-image:
			repeating-linear-gradient(
				to bottom,
				transparent 0,
				transparent calc(var(--grid-fine) - 1px),
				rgba(210, 228, 255, 0.82) calc(var(--grid-fine) - 1px),
				rgba(210, 228, 255, 0.82) var(--grid-fine)
			),
			repeating-linear-gradient(
				to right,
				transparent 0,
				transparent calc(var(--grid-fine) - 1px),
				rgba(200, 222, 252, 0.76) calc(var(--grid-fine) - 1px),
				rgba(200, 222, 252, 0.76) var(--grid-fine)
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
	:global(.info-card--modal.hover-polaroid-scale) .info-card-surface {
		filter: brightness(1.12) saturate(1.15);
	}

	:global(.hover-polaroid-scale:hover) .info-card-surface::before,
	:global(.info-card--modal.hover-polaroid-scale) .info-card-surface::before {
		border-color: rgba(220, 235, 255, 0.72);
		box-shadow:
			inset 0 0 48px rgba(180, 220, 255, 0.24),
			0 0 32px rgba(180, 220, 255, 0.35);
	}

	:global(.hover-polaroid-scale:hover) .info-card-surface::after,
	:global(.info-card--modal.hover-polaroid-scale) .info-card-surface::after {
		opacity: 0.92;
	}

	:global(.hover-polaroid-scale:hover) .holo-layer,
	:global(.info-card--modal.hover-polaroid-scale) .holo-layer {
		opacity: 1;
		animation-duration: 2.8s;
	}

	@media (prefers-reduced-motion: reduce) {
		.holo-layer {
			animation: none;
			background-position: 50% 0;
		}

		.info-card {
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
	:global(.info-card--modal.hover-polaroid-scale) :global(.experience-company) {
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
		.grid-base {
		background-image:
			repeating-linear-gradient(
				to bottom,
				transparent 0,
				transparent calc(var(--grid-fine) - 1px),
				rgba(var(--tone-grid), 0.12) calc(var(--grid-fine) - 1px),
				rgba(var(--tone-grid), 0.12) var(--grid-fine)
			),
			repeating-linear-gradient(
				to right,
				transparent 0,
				transparent calc(var(--grid-fine) - 1px),
				rgba(var(--tone-grid), 0.1) calc(var(--grid-fine) - 1px),
				rgba(var(--tone-grid), 0.1) var(--grid-fine)
			);
	}

	.info-card:is(.info-card--green, .info-card--teal, .info-card--aquamarine, .info-card--blue, .info-card--periwinkle)
		.grid-cursor {
		background-image:
			repeating-linear-gradient(
				to bottom,
				transparent 0,
				transparent calc(var(--grid-fine) - 1px),
				rgba(var(--tone-grid-cursor), 0.5) calc(var(--grid-fine) - 1px),
				rgba(var(--tone-grid-cursor), 0.5) var(--grid-fine)
			),
			repeating-linear-gradient(
				to right,
				transparent 0,
				transparent calc(var(--grid-fine) - 1px),
				rgba(var(--tone-grid-cursor), 0.44) calc(var(--grid-fine) - 1px),
				rgba(var(--tone-grid-cursor), 0.44) var(--grid-fine)
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
