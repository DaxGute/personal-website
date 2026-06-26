type CollapseFn = () => void | Promise<void>;

/** Shared duration for backdrop + card move/flip (keep in sync with layout CSS). */
export const CARD_MODAL_MS = 380;

const MODAL_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

let backdropEl: HTMLDivElement | null = null;
let backdropBlurEl: HTMLDivElement | null = null;
let modalLayerEl: HTMLDivElement | null = null;
let lockCount = 0;
let activeCollapse: CollapseFn | null = null;
let scrollContainer: HTMLElement | null = null;
let savedScrollLeft = 0;

export function registerScrollContainer(el: HTMLElement) {
	scrollContainer = el;
}

export function isCardModalOpen() {
	return lockCount > 0;
}

export function modalMotionMs() {
	if (typeof window === 'undefined') return 0;
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : CARD_MODAL_MS;
}

export function modalTransition() {
	const ms = modalMotionMs();
	return ms === 0 ? 'none' : `${ms}ms ${MODAL_EASING}`;
}

export function viewportCenter() {
	const vv = window.visualViewport;
	if (!vv) {
		return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
	}
	return {
		x: vv.offsetLeft + vv.width / 2,
		y: vv.offsetTop + vv.height / 2
	};
}

function ensureBackdropLayers() {
	if (!backdropEl) return;

	const existingBlur = backdropEl.querySelector('.card-modal-backdrop__blur');
	if (existingBlur instanceof HTMLDivElement) {
		backdropBlurEl = existingBlur;
		backdropEl.querySelector('.card-modal-backdrop__shade')?.remove();
		return;
	}

	backdropBlurEl = document.createElement('div');
	backdropBlurEl.className = 'card-modal-backdrop__blur';
	backdropBlurEl.setAttribute('aria-hidden', 'true');
	backdropEl.replaceChildren(backdropBlurEl);
}

function ensureModalRoot() {
	if (!backdropEl) {
		backdropEl = document.createElement('div');
		backdropEl.className = 'card-modal-backdrop';
		backdropEl.setAttribute('aria-hidden', 'true');
		backdropEl.addEventListener('click', onBackdropClick);
		document.body.appendChild(backdropEl);
	}

	ensureBackdropLayers();

	if (!modalLayerEl) {
		modalLayerEl = document.createElement('div');
		modalLayerEl.className = 'card-modal-layer';
		modalLayerEl.setAttribute('aria-hidden', 'true');
		document.body.appendChild(modalLayerEl);
	}
}

function onBackdropClick() {
	void activeCollapse?.();
}

const VIGNETTE_OPEN_CLASS = 'card-modal-vignette-open';

function setVignetteVisible(visible: boolean) {
	backdropEl?.classList.toggle('is-visible', visible);
	document.documentElement.classList.toggle(VIGNETTE_OPEN_CLASS, visible);
}

function showBackdrop() {
	ensureModalRoot();
	document.documentElement.classList.add('card-modal-open');
	document.documentElement.style.setProperty('--card-modal-ms', `${CARD_MODAL_MS}ms`);
	if (!backdropEl) return;

	setVignetteVisible(false);
	void document.documentElement.offsetHeight;
	requestAnimationFrame(() => {
		setVignetteVisible(true);
	});
}

export function dismissBackdrop() {
	setVignetteVisible(false);
}

export function portalCardToModalLayer(cardEl: HTMLElement) {
	ensureModalRoot();
	modalLayerEl?.appendChild(cardEl);
}

export function returnCardToAnchor(cardEl: HTMLElement, anchorEl: HTMLElement) {
	anchorEl.appendChild(cardEl);
}

export function lockCardModal() {
	lockCount++;
	if (lockCount === 1) {
		if (scrollContainer) savedScrollLeft = scrollContainer.scrollLeft;
		showBackdrop();
	}
}

export function unlockCardModal() {
	lockCount = Math.max(0, lockCount - 1);
	if (lockCount === 0) {
		document.documentElement.classList.remove('card-modal-open', VIGNETTE_OPEN_CLASS);
		dismissBackdrop();
		if (scrollContainer) scrollContainer.scrollLeft = savedScrollLeft;
	}
}

export async function claimCardModal(collapse: CollapseFn) {
	await activeCollapse?.();
	activeCollapse = collapse;
}

export function releaseCardModal(collapse: CollapseFn) {
	if (activeCollapse === collapse) activeCollapse = null;
}
