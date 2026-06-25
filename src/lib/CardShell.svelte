<script lang="ts">
	let className = '';
	export { className as class };

	export let surfaceClass = '';
	export let theme: 'dark' | 'green' | 'teal' | 'aquamarine' | 'blue' | 'periwinkle' = 'dark';

	let rootEl: HTMLElement | null = null;
	let tiltEl: HTMLElement | null = null;
	let surfaceEl: HTMLElement | null = null;

	function prefersReducedMotion() {
		return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	const MAX_TILT_DEG = 9;
	const HOVER_SCALE = 1.055;
	const PERSPECTIVE_PX = 900;

	function setPointerGlow(e: PointerEvent) {
		if (!surfaceEl || !rootEl) return;

		const rootRect = rootEl.getBoundingClientRect();
		const u = (e.clientX - rootRect.left) / rootRect.width;
		const v = (e.clientY - rootRect.top) / rootRect.height;

		surfaceEl.style.setProperty('--pointer-u', `${(u * 100).toFixed(3)}%`);
		surfaceEl.style.setProperty('--pointer-v', `${(v * 100).toFixed(3)}%`);
		surfaceEl.style.setProperty('--spotlight', '1');
	}

	function setTilt(e: PointerEvent) {
		if (!rootEl || !tiltEl || !surfaceEl) return;

		setPointerGlow(e);

		if (prefersReducedMotion()) return;

		const r = rootEl.getBoundingClientRect();
		const x = (e.clientX - r.left) / r.width;
		const y = (e.clientY - r.top) / r.height;
		const dx = x - 0.5;
		const dy = y - 0.5;

		const rotXDeg = dy * 2 * MAX_TILT_DEG;
		const rotYDeg = -dx * 2 * MAX_TILT_DEG;

		tiltEl.style.transform = `perspective(${PERSPECTIVE_PX}px) rotateX(${rotXDeg.toFixed(3)}deg) rotateY(${rotYDeg.toFixed(3)}deg)`;
		rootEl.style.setProperty('--scale', `${HOVER_SCALE}`);
		rootEl.style.setProperty('--hover', '1');
		rootEl.style.setProperty('--lift', '-10px');
	}

	function resetTilt() {
		if (!rootEl) return;

		if (tiltEl) tiltEl.style.transform = `perspective(${PERSPECTIVE_PX}px) rotateX(0deg) rotateY(0deg)`;
		rootEl.style.setProperty('--scale', `1`);
		rootEl.style.setProperty('--hover', '0');
		rootEl.style.setProperty('--lift', '0px');
		surfaceEl?.style.setProperty('--spotlight', '0');
		surfaceEl?.style.setProperty('--pointer-u', '50%');
		surfaceEl?.style.setProperty('--pointer-v', '50%');
	}
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="info-card hover-polaroid-scale {theme !== 'dark' ? `info-card--${theme}` : ''} {className}"
	bind:this={rootEl}
	on:pointerenter={setTilt}
	on:pointermove={setTilt}
	on:pointerleave={resetTilt}
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

<style>
	.info-card {
		width: 100%;
		height: 100%;
		transform: scale(var(--scale, 1)) translateY(var(--lift, 0px));
		transition: transform 0.26s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.info-card:global(.info-card--project),
	.info-card:global(.info-card--project) .info-card-tilt {
		overflow: visible;
	}

	.info-card:global(.info-card--project) .info-card-surface {
		overflow: hidden;
	}

	.info-card-tilt {
		width: 100%;
		height: 100%;
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

	:global(.hover-polaroid-scale:hover) .info-card-surface {
		filter: brightness(1.12) saturate(1.15);
	}

	:global(.hover-polaroid-scale:hover) .info-card-surface::before {
		border-color: rgba(220, 235, 255, 0.72);
		box-shadow:
			inset 0 0 48px rgba(180, 220, 255, 0.24),
			0 0 32px rgba(180, 220, 255, 0.35);
	}

	:global(.hover-polaroid-scale:hover) .info-card-surface::after {
		opacity: 0.92;
	}

	:global(.hover-polaroid-scale:hover) .holo-layer {
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

	:global(.hover-polaroid-scale:hover) :global(.experience-company) {
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
	:global(.info-card--periwinkle.hover-polaroid-scale:hover) .info-card-surface {
		filter: brightness(1.04) saturate(1.1);
	}

	:global(.info-card--green.hover-polaroid-scale:hover) .info-card-surface::before,
	:global(.info-card--teal.hover-polaroid-scale:hover) .info-card-surface::before,
	:global(.info-card--aquamarine.hover-polaroid-scale:hover) .info-card-surface::before,
	:global(.info-card--blue.hover-polaroid-scale:hover) .info-card-surface::before,
	:global(.info-card--periwinkle.hover-polaroid-scale:hover) .info-card-surface::before {
		border-color: rgba(var(--tone-border-hover), 0.42);
		box-shadow:
			inset 0 0 48px rgba(255, 255, 255, 0.16),
			0 0 32px rgba(var(--tone-shadow), 0.14);
	}

	:global(.info-card--green.hover-polaroid-scale:hover) .info-card-surface::after,
	:global(.info-card--teal.hover-polaroid-scale:hover) .info-card-surface::after,
	:global(.info-card--aquamarine.hover-polaroid-scale:hover) .info-card-surface::after,
	:global(.info-card--blue.hover-polaroid-scale:hover) .info-card-surface::after,
	:global(.info-card--periwinkle.hover-polaroid-scale:hover) .info-card-surface::after {
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
	:global(.info-card--periwinkle.hover-polaroid-scale:hover) :global(.experience-company) {
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
