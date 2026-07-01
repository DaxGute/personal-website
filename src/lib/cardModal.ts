type CollapseFn = () => void | Promise<void>;

/** Shared duration for backdrop + card move/flip (keep in sync with layout CSS). */
export const CARD_MODAL_MS = 760;

/** Visual-only stage zoom on the modal backdrop clone (not applied to the real .stage). */
export const STAGE_VIGNETTE_SCALE = 1.035;

const MODAL_EASING = 'cubic-bezier(0.6, 0.5, 0.36, 1)';
const VIGNETTE_SIZE_EASING = 'cubic-bezier(0.6, 0.5, 0.36, 1)';

let backdropEl: HTMLDivElement | null = null;
let modalLayerEl: HTMLDivElement | null = null;
let stageCloneEl: HTMLDivElement | null = null;
let lockCount = 0;
let activeCollapse: CollapseFn | null = null;
let scrollContainer: HTMLElement | null = null;
let savedScrollLeft = 0;

export function registerScrollContainer(el: HTMLElement) {
	scrollContainer = el;
}

export function readScrollLeft() {
	return scrollContainer?.scrollLeft ?? 0;
}

export function writeScrollLeft(left: number) {
	if (scrollContainer) scrollContainer.scrollLeft = left;
}

/** Keep horizontal scroll pinned through modal DOM/class changes (scroll anchoring). */
export function pinScrollLeft(left: number) {
	writeScrollLeft(left);
	requestAnimationFrame(() => {
		writeScrollLeft(left);
		requestAnimationFrame(() => writeScrollLeft(left));
	});
}

function restoreSavedScroll() {
	pinScrollLeft(savedScrollLeft);
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

function findStageEl() {
	return document.querySelector('.desktop-app > .stage') ?? document.querySelector('.stage');
}

const STAGE_CLONE_ID_SUFFIX = '-stage-clone';

function rewriteSvgUrlRefs(value: string, idMap: Map<string, string>) {
	return value.replace(/url\(#([^)]+)\)/g, (match, id: string) => {
		const mapped = idMap.get(id);
		return mapped ? `url(#${mapped})` : match;
	});
}

function patchCloneSvgIds(clone: HTMLElement, suffix: string) {
	const idMap = new Map<string, string>();

	clone.querySelectorAll('svg [id]').forEach((el) => {
		const nextId = `${el.id}${suffix}`;
		idMap.set(el.id, nextId);
		el.id = nextId;
	});

	clone.querySelectorAll('svg, svg *').forEach((node) => {
		if (!(node instanceof Element)) return;

		for (const attr of ['mask', 'fill', 'stroke', 'filter', 'clip-path', 'href', 'xlink:href']) {
			const value = node.getAttribute(attr);
			if (!value?.includes('url(#')) continue;
			node.setAttribute(attr, rewriteSvgUrlRefs(value, idMap));
		}

		if (node instanceof SVGElement && node.hasAttribute('style')) {
			const style = node.getAttribute('style');
			if (style?.includes('url(#')) {
				node.setAttribute('style', rewriteSvgUrlRefs(style, idMap));
			}
		}
	});

	if (idMap.has('ribbonStroke')) {
		const style = document.createElement('style');
		style.textContent = `
			.card-modal-stage-clone .ribbon-path--base {
				stroke: url(#ribbonStroke${suffix});
				opacity: 0.14;
			}
			.card-modal-stage-clone .ribbon-path--bright {
				stroke: url(#ribbonStroke${suffix});
				opacity: 1;
			}
		`;
		clone.insertBefore(style, clone.firstChild);
	}
}

function mirrorInlineStyle(source: Element | null, target: Element | null, props: string[]) {
	if (!(source instanceof HTMLElement) || !(target instanceof HTMLElement)) return;
	for (const prop of props) {
		const value = source.style.getPropertyValue(prop);
		if (value) target.style.setProperty(prop, value);
	}
}

function mirrorInlineStylesTree(source: Element, target: Element) {
	if (source instanceof HTMLElement && target instanceof HTMLElement && source.style.cssText) {
		target.style.cssText = source.style.cssText;
	}

	const sourceChildren = source.children;
	const targetChildren = target.children;
	for (let i = 0; i < sourceChildren.length; i++) {
		const targetChild = targetChildren[i];
		if (targetChild) mirrorInlineStylesTree(sourceChildren[i]!, targetChild);
	}
}

function syncStageCloneLayout(source: HTMLElement, clone: HTMLElement) {
	const sourceScroller = source.querySelector('.scroller');
	const cloneScroller = clone.querySelector('.scroller');
	if (sourceScroller instanceof HTMLElement && cloneScroller instanceof HTMLElement) {
		const scrollLeft = scrollContainer?.scrollLeft ?? sourceScroller.scrollLeft;
		cloneScroller.scrollLeft = scrollLeft;
		cloneScroller.scrollTop = sourceScroller.scrollTop;
	}

	mirrorInlineStyle(
		source.querySelector('.scroll-track'),
		clone.querySelector('.scroll-track'),
		['width']
	);
	mirrorInlineStyle(
		source.querySelector('.scroller-wash'),
		clone.querySelector('.scroller-wash'),
		['width']
	);
	mirrorInlineStyle(
		source.querySelector('.ribbon-layer'),
		clone.querySelector('.ribbon-layer'),
		['width', 'left']
	);

	const sourcePanels = source.querySelectorAll<HTMLElement>('.panel');
	const clonePanels = clone.querySelectorAll<HTMLElement>('.panel');
	for (let i = 0; i < sourcePanels.length; i++) {
		mirrorInlineStyle(sourcePanels[i], clonePanels[i], ['left', '--exp-t', '--edu-t']);
	}
}

function stripModalCardFromClone(clone: HTMLElement) {
	clone.querySelectorAll('.info-card-anchor[data-modal-slot="true"]').forEach((anchor) => {
		anchor.querySelector('.info-card')?.remove();
	});
}

function prepareStageClone(source: HTMLElement, clone: HTMLElement) {
	mirrorInlineStylesTree(source, clone);
	syncStageCloneLayout(source, clone);
	stripModalCardFromClone(clone);
}

function mountStageClone() {
	if (stageCloneEl) return;
	const stage = findStageEl();
	if (!(stage instanceof HTMLElement)) return;

	const stageCopy = stage.cloneNode(true) as HTMLDivElement;
	patchCloneSvgIds(stageCopy, STAGE_CLONE_ID_SUFFIX);

	const wrapper = document.createElement('div');
	wrapper.className = 'card-modal-stage-clone';
	wrapper.setAttribute('aria-hidden', 'true');
	wrapper.inert = true;
	wrapper.appendChild(stageCopy);
	stageCloneEl = wrapper;

	ensureModalRoot();
	if (backdropEl) {
		document.body.insertBefore(wrapper, backdropEl);
	} else {
		document.body.appendChild(wrapper);
	}

	const sync = () => prepareStageClone(stage, stageCopy);
	sync();
	requestAnimationFrame(sync);
}

function removeStageClone() {
	stageCloneEl?.remove();
	stageCloneEl = null;
}

function setStageCloneZoomed(zoomed: boolean) {
	stageCloneEl?.classList.toggle('is-zoomed', zoomed);
}

function ensureModalRoot() {
	if (!backdropEl) {
		backdropEl = document.createElement('div');
		backdropEl.className = 'card-modal-backdrop';
		backdropEl.setAttribute('aria-hidden', 'true');
		backdropEl.addEventListener('click', onBackdropClick);
		document.body.appendChild(backdropEl);
	}

	backdropEl.querySelector('.card-modal-backdrop__shade')?.remove();
	backdropEl.querySelector('.card-modal-backdrop__cutout')?.remove();

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

const VIGNETTE_OPEN_RX = '0vmax';
const VIGNETTE_OPEN_RY = '0vmax';
const VIGNETTE_CLOSED_RX = '120vmax';
const VIGNETTE_CLOSED_RY = '120vmax';

export type VignetteOrigin = {
	x: number;
	y: number;
};

function setVignetteOval(rx: string, ry: string) {
	if (!backdropEl) return;
	backdropEl.style.setProperty('--vignette-rx', rx);
	backdropEl.style.setProperty('--vignette-ry', ry);
}

function setVignetteCenter(x: number, y: number) {
	if (!backdropEl) return;
	backdropEl.style.setProperty('--vignette-cx', `${x}px`);
	backdropEl.style.setProperty('--vignette-cy', `${y}px`);
}

function resetVignetteCenter() {
	backdropEl?.style.removeProperty('--vignette-cx');
	backdropEl?.style.removeProperty('--vignette-cy');
}

function dismissStartRadii() {
	return { rx: '0px', ry: '0px' };
}

function dismissEndRadii(origin?: VignetteOrigin) {
	if (!origin) {
		return { rx: VIGNETTE_CLOSED_RX, ry: VIGNETTE_CLOSED_RY };
	}
	const reach = Math.hypot(
		Math.max(origin.x, window.innerWidth - origin.x),
		Math.max(origin.y, window.innerHeight - origin.y)
	);
	const radius = `${(reach * 1.15).toFixed(2)}px`;
	return { rx: radius, ry: radius };
}

function resetVignetteOval() {
	backdropEl?.style.removeProperty('--vignette-rx');
	backdropEl?.style.removeProperty('--vignette-ry');
	resetVignetteCenter();
}

function setVignetteInteractive(interactive: boolean) {
	backdropEl?.classList.toggle('is-visible', interactive);
}

/** Jump to closed with no transition (unlock / prepare). */
function snapVignetteClosed() {
	if (!backdropEl) return;
	const transition = backdropEl.style.transition;
	backdropEl.style.transition = 'none';
	setVignetteInteractive(false);
	resetVignetteOval();
	void backdropEl.offsetHeight;
	backdropEl.style.transition = transition;
}

function prepareModalBackdrop() {
	ensureModalRoot();
	document.documentElement.style.setProperty('--card-modal-ms', `${CARD_MODAL_MS}ms`);
	document.documentElement.style.setProperty('--card-modal-easing', MODAL_EASING);
	document.documentElement.style.setProperty('--vignette-size-easing', VIGNETTE_SIZE_EASING);
	snapVignetteClosed();
}

/** Contract vignette oval (same frame as card flight). */
export function syncVignetteOpen() {
	ensureModalRoot();
	if (!backdropEl) return;
	mountStageClone();
	document.documentElement.classList.add('card-modal-open');
	restoreSavedScroll();
	resetVignetteCenter();
	setVignetteInteractive(false);
	setVignetteOval(VIGNETTE_CLOSED_RX, VIGNETTE_CLOSED_RY);
	void backdropEl.offsetHeight;
	setVignetteInteractive(true);
	setVignetteOval(VIGNETTE_OPEN_RX, VIGNETTE_OPEN_RY);
	setStageCloneZoomed(true);
}

/** Expand vignette oval out from a viewport point while stage unzooms. */
export function syncVignetteDismiss(origin?: VignetteOrigin) {
	ensureModalRoot();
	if (!backdropEl) {
		setStageCloneZoomed(false);
		return;
	}

	setStageCloneZoomed(false);
	if (!backdropEl.classList.contains('is-visible')) return;

	const start = dismissStartRadii();
	const end = dismissEndRadii(origin);
	const transition = backdropEl.style.transition;
	backdropEl.style.transition = 'none';
	if (origin) setVignetteCenter(origin.x, origin.y);
	setVignetteOval(start.rx, start.ry);
	void backdropEl.offsetHeight;
	backdropEl.style.transition = transition;
	void backdropEl.offsetHeight;
	setVignetteOval(end.rx, end.ry);
	setVignetteInteractive(false);
}

export function waitVignetteMotion() {
	return new Promise<void>((resolve) => {
		const ms = modalMotionMs();
		const backdrop = backdropEl;
		if (!backdrop || ms === 0) {
			resolve();
			return;
		}

		let settled = false;
		const finish = () => {
			if (settled) return;
			settled = true;
			backdrop.removeEventListener('transitionend', onEnd);
			window.clearTimeout(timer);
			resolve();
		};
		const onEnd = (e: TransitionEvent) => {
			if (e.target !== backdrop) return;
			if (e.propertyName !== '--vignette-rx' && e.propertyName !== '--vignette-ry') return;
			finish();
		};

		backdrop.addEventListener('transitionend', onEnd);
		const timer = window.setTimeout(finish, ms + 50);
	});
}

/** Reset vignette after unlock — collapse animation already expanded the oval. */
export function dismissVignette() {
	setStageCloneZoomed(false);
}

export function dismissBackdrop() {
	dismissVignette();
}

export function mountInModalLayer(el: HTMLElement) {
	ensureModalRoot();
	modalLayerEl?.appendChild(el);
}

export function removeFromModalLayer(el: HTMLElement) {
	el.remove();
}

export function lockCardModal(preScrollLeft?: number) {
	lockCount++;
	if (lockCount === 1) {
		if (scrollContainer) {
			savedScrollLeft = preScrollLeft ?? scrollContainer.scrollLeft;
		}
		prepareModalBackdrop();
		restoreSavedScroll();
	}
}

export function unlockCardModal() {
	lockCount = Math.max(0, lockCount - 1);
	if (lockCount === 0) {
		document.documentElement.classList.remove('card-modal-open');
		dismissBackdrop();
		snapVignetteClosed();
		removeStageClone();
		restoreSavedScroll();
	}
}

export async function claimCardModal(collapse: CollapseFn) {
	await activeCollapse?.();
	activeCollapse = collapse;
}

export function releaseCardModal(collapse: CollapseFn) {
	if (activeCollapse === collapse) activeCollapse = null;
}
