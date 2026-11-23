<script lang="ts">
	import signature from '$lib/assets/signature.svg';
	import signatureFavicon from '$lib/assets/signature-favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={signatureFavicon} />
	<title>DG CV</title>
</svelte:head>

<div class="mobile-gate" role="status" aria-live="polite">
	<div class="mobile-gate__bg" aria-hidden="true"></div>
	<div class="mobile-gate__content">
		<div class="mobile-gate__icon" aria-hidden="true">
			<svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
				<!-- landscape phone (behind) -->
				<g>
					<rect
						x="36"
						y="58"
						width="88"
						height="44"
						rx="10"
						stroke="rgb(11 18 32)"
						stroke-opacity="0.32"
						stroke-width="4"
					/>
					<rect
						x="46"
						y="66"
						width="68"
						height="28"
						rx="7"
						fill="rgb(11 18 32)"
						fill-opacity="0.05"
					/>
					<circle cx="116" cy="80" r="3.3" fill="rgb(11 18 32)" fill-opacity="0.28" />
				</g>

				<!-- portrait phone (front) -->
				<g>
					<rect
						x="64"
						y="14"
						width="44"
						height="88"
						rx="12"
						stroke="rgb(11 18 32)"
						stroke-opacity="0.60"
						stroke-width="4"
					/>
					<rect
						x="72"
						y="26"
						width="28"
						height="62"
						rx="7"
						fill="rgb(11 18 32)"
						fill-opacity="0.06"
					/>
					<circle cx="86" cy="94" r="3.3" fill="rgb(11 18 32)" fill-opacity="0.46" />
				</g>

				<!-- rotate arrow (mirrored horizontally) -->
				<g transform="translate(88 0) scale(-1 1)">
					<path
						d="M30 24H58V46"
						stroke="rgb(92 129 255)"
						stroke-opacity="0.95"
						stroke-width="5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<path
						d="M58 46L51 39 M58 46L65 39"
						stroke="rgb(92 129 255)"
						stroke-opacity="0.95"
						stroke-width="5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</g>
			</svg>
		</div>
		<h1 class="mobile-gate__headline">Please Rotate Your Device</h1>
		<p class="mobile-gate__sub">
			This experience is designed for larger screens. Open it on a desktop/laptop to continue.
		</p>
	</div>
</div>

<div class="desktop-app">
	{@render children()}
</div>

<style>
	:global(:root) {
		color-scheme: light;
		--bg: #ffffff;
		/* Standard poker card, 2.5in × 3.5in. One size for every card. */
		--playing-card-ratio: 5 / 7;
		--playing-card-w: 220px;
		--playing-card-h: calc(var(--playing-card-w) * 7 / 5);
		--fg: #0b1220;
		--heading-size: clamp(40px, 5vw, 68px);
		--muted: rgba(11, 18, 32, 0.68);
		/* Glassy surfaces */
		--glass-blur: 14px;
		--card: rgba(255, 255, 255, 0.22);
		--card-strong: rgba(255, 255, 255, 0.32);
		--card-hover: rgba(255, 255, 255, 0.38);
		--card-border: rgba(11, 18, 32, 0.12);
		--shadow: 0 18px 50px rgba(11, 18, 32, 0.12);
		/* Stage zoom defaults — keep transform applied idle so open/close doesn't promote layers. */
		--stage-tx: 0px;
		--stage-ty: 0px;
		--stage-scale: 1;
		--stage-origin-x: 0px;
		--stage-origin-y: 0px;
	}

	:global(html, body) {
		height: 100%;
	}

	:global(body) {
		margin: 0;
		background: var(--bg);
		color: var(--fg);
		font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial,
			'Apple Color Emoji', 'Segoe UI Emoji';
		overflow: hidden; /* horizontal site: prevent accidental page vertical scrolling */
	}

	:global(a) {
		color: inherit;
	}

	:global(*),
	:global(*::before),
	:global(*::after) {
		box-sizing: border-box;
	}

	@property --vignette-rx {
		syntax: '<length>';
		inherits: false;
		initial-value: 120vmax;
	}

	@property --vignette-ry {
		syntax: '<length>';
		inherits: false;
		initial-value: 120vmax;
	}

	@property --vignette-cx {
		syntax: '<length-percentage>';
		inherits: false;
		initial-value: 50%;
	}

	@property --vignette-cy {
		syntax: '<length-percentage>';
		inherits: false;
		initial-value: 50%;
	}

	:global(.card-modal-backdrop) {
		position: fixed;
		inset: 0;
		z-index: 9998;
		pointer-events: none;
		--vignette-rx: 120vmax;
		--vignette-ry: 120vmax;
		--vignette-cx: 50%;
		--vignette-cy: 50%;
		/* Hole shrinks from full-bleed to a point; the shade is the area outside the circle. */
		transition:
			--vignette-rx var(--card-modal-ms, 760ms)
				var(--vignette-size-easing, cubic-bezier(0.6, 0.5, 0.36, 1)),
			--vignette-ry var(--card-modal-ms, 760ms)
				var(--vignette-size-easing, cubic-bezier(0.6, 0.5, 0.36, 1));
		background: radial-gradient(
			ellipse 120vmax 120vmax at 50% 50%,
			rgba(11, 18, 32, 0.28) 0%,
			rgba(11, 18, 32, 0.48) 58%,
			rgba(11, 18, 32, 0.68) 78%,
			rgba(7, 12, 22, 0.82) 100%
		);
		-webkit-mask-image:
			linear-gradient(#fff, #fff),
			radial-gradient(
				ellipse var(--vignette-rx) var(--vignette-ry) at var(--vignette-cx) var(--vignette-cy),
				#000 0%,
				#000 100%,
				transparent 100%
			);
		-webkit-mask-composite: xor;
		mask-image:
			linear-gradient(#fff, #fff),
			radial-gradient(
				ellipse var(--vignette-rx) var(--vignette-ry) at var(--vignette-cx) var(--vignette-cy),
				#000 0%,
				#000 100%,
				transparent 100%
			);
		mask-composite: exclude;
	}

	:global(.card-modal-backdrop.is-visible) {
		pointer-events: auto;
		cursor: pointer;
	}

	/* Mobile: solid black fade. */
	@media (max-width: 900px) {
		:global(.card-modal-backdrop) {
			background: #000;
			opacity: 0;
			-webkit-mask-image: none;
			mask-image: none;
			transition: opacity var(--card-modal-ms, 760ms)
				var(--card-modal-easing, cubic-bezier(0.6, 0.5, 0.36, 1));
		}

		:global(.card-modal-backdrop.is-visible) {
			opacity: 1;
		}

		:global(.card-modal-layer .info-card--animating .info-card-flip),
		:global(.card-modal-layer .info-card--animating.info-card--flip-dismiss .info-card-flip),
		:global(html.card-modal-open .info-card--zoom-active .info-card-flip) {
			transition: none !important;
		}
	}

	:global(.card-modal-layer) {
		position: fixed;
		inset: 0;
		z-index: 10000;
		pointer-events: none;
		isolation: isolate;
	}

	:global(.card-modal-layer .info-card) {
		pointer-events: auto;
	}

	:global(.card-modal-layer .info-card--modal-centered) {
		transition: none;
	}

	:global(.card-modal-layer .info-card--modal) {
		transform-style: preserve-3d;
	}

	:global(.card-modal-layer .info-card--animating .info-card-flip) {
		transition: transform var(--card-modal-ms, 760ms) var(--card-modal-easing, cubic-bezier(0.6, 0.5, 0.36, 1)) !important;
	}

	:global(.card-modal-layer .info-card--animating.info-card-motion) {
		transition: transform var(--card-modal-ms, 760ms) var(--card-modal-easing, cubic-bezier(0.6, 0.5, 0.36, 1)) !important;
	}

	:global(.card-modal-layer .info-card--animating.info-card--flip-dismiss) {
		transition:
			transform var(--card-modal-ms, 760ms) var(--card-modal-easing, cubic-bezier(0.6, 0.5, 0.36, 1)),
			opacity var(--card-modal-ms, 760ms) var(--card-modal-easing, cubic-bezier(0.6, 0.5, 0.36, 1)) !important;
	}

	:global(.card-modal-layer .info-card--animating.info-card--flip-dismiss .info-card-flip) {
		transition: transform var(--card-modal-ms, 760ms) var(--card-modal-easing, cubic-bezier(0.6, 0.5, 0.36, 1)) !important;
	}

	/* Intro pan only. The modal zoom must NOT live here: the track is ~10000px wide and
	   cannot be cached as one GPU texture, so scaling it repaints every frame. */
	:global(.desktop-app > .stage .scroll-track) {
		transform: translateX(var(--intro-shift, 0px));
	}

	/* Zoom the viewport-sized stage (overflow hidden) so the animated layer stays
	   within the GPU texture limit. Drop transforms that would promote the full-width
	   track or ribbon into their own textures. */
	:global(html.card-modal-open .desktop-app > .stage) {
		overflow: hidden;
		pointer-events: none;
		transform-origin: var(--stage-origin-x, 0px) var(--stage-origin-y, 0px);
		transform: translate(var(--stage-tx, 0px), var(--stage-ty, 0px)) scale(var(--stage-scale, 1));
		transition: transform var(--card-modal-ms, 760ms)
			var(--stage-easing, cubic-bezier(0.6, 0.5, 0.36, 1));
		will-change: transform;
	}

	:global(html.card-modal-open .desktop-app > .stage .scroll-track) {
		transform: none;
		left: var(--intro-shift, 0px);
	}

	:global(html.card-modal-open .ribbon-layer) {
		transform: none;
		backface-visibility: visible;
	}

	/* Backdrop-filter and the looping sheen both invalidate the stage layer every zoom frame. */
	:global(html.card-modal-open .desktop-app > .stage),
	:global(html.card-modal-open .desktop-app > .stage *) {
		backdrop-filter: none !important;
		-webkit-backdrop-filter: none !important;
	}

	:global(html.card-modal-open #projects .listbox) {
		background: rgba(255, 255, 255, 0.94) !important;
	}

	:global(html.card-modal-open #projects .panel-inner),
	:global(.card-modal-stage-clone #projects .panel-inner) {
		background: transparent !important;
		box-shadow: none !important;
	}

	:global(html.card-modal-open .desktop-app > .stage .holo-layer) {
		animation-play-state: paused !important;
	}

	:global(html.card-modal-open .desktop-app > .stage .info-card-tilt),
	:global(html.card-modal-open .desktop-app > .stage .info-card-flip-stage),
	:global(html.card-modal-open .desktop-app > .stage .info-card-flip),
	:global(html.card-modal-open .desktop-app > .stage .info-card-face),
	:global(html.card-modal-open .desktop-app > .stage .hover-polaroid-tilt) {
		transform-style: flat !important;
	}

	:global(html.card-modal-open .desktop-app > .stage .scroll-track),
	:global(html.card-modal-open .awards),
	:global(html.card-modal-open .award-item) {
		overflow: visible !important;
	}

	:global(html.card-modal-open .awards) {
		-webkit-clip-path: none !important;
		clip-path: none !important;
	}

	:global(html.card-modal-open .info-card--zoom-active .info-card-flip-stage),
	:global(html.card-modal-open .info-card--zoom-active .info-card-flip) {
		overflow: visible;
	}

	:global(html.card-modal-open .info-card--zoom-active .info-card-flip) {
		transition: transform var(--card-modal-ms, 760ms) var(--card-modal-easing, cubic-bezier(0.6, 0.5, 0.36, 1)) !important;
	}

	:global(.card-modal-layer .info-card-anchor--zoom-pinned) {
		pointer-events: auto;
		z-index: 1;
	}

	:global(.card-modal-stage-clone) {
		position: fixed;
		/* Pad beyond the viewport so scale(1.035) doesn't hard-clip wash edges. */
		inset: -6%;
		z-index: 9997;
		overflow: hidden;
		visibility: visible;
		pointer-events: none;
		transform: scale(1);
		transform-origin: center center;
		transition: transform var(--card-modal-ms, 760ms) var(--card-modal-easing, cubic-bezier(0.6, 0.5, 0.36, 1));
		background: var(--bg);
	}

	:global(.card-modal-stage-clone.is-zoomed) {
		transform: scale(1.035);
	}

	:global(.card-modal-stage-clone .scroller-wash) {
		/* Clone wash already covers the padded shell; keep it from double-scaling soft edges. */
		inset: 0;
	}

	:global(.card-modal-stage-clone > .stage) {
		width: 100%;
		height: 100%;
	}

	:global(.card-modal-stage-clone .panel-inner) {
		backdrop-filter: none;
		-webkit-backdrop-filter: none;
		background: rgba(255, 255, 255, 0.92);
	}

	:global(html.card-modal-open .desktop-app > .stage .scroller) {
		touch-action: none;
		overflow: hidden !important;
		overscroll-behavior: none;
	}

	/* Grid cards brighten on hover. The open card stays flat. */
	:global(.hover-polaroid-tilt) {
		transform-style: preserve-3d;
	}

	:global(.hover-polaroid-surface) {
		border: 1px solid var(--hp-border, rgba(11, 18, 32, 0.14));
		background: var(--hp-bg, rgba(255, 255, 255, 0.86));
		box-shadow: var(--hp-shadow, 0 0px 30px rgba(11, 18, 32, 0.12));
		transition-property: background, box-shadow, border-color;
		transition-duration: 160ms, 180ms, 160ms;
		transition-timing-function: ease, ease, ease;
	}

	:global(.hover-polaroid-scale:hover:not(.info-card--modal):not(.info-card--animating):not(.info-card--dismissing)
		.hover-polaroid-surface) {
		border-color: var(--hp-border-hover, var(--hp-border, rgba(11, 18, 32, 0.14)));
		background: var(--hp-bg-hover, var(--hp-bg, rgba(255, 255, 255, 0.86)));
		box-shadow: var(--hp-shadow-hover, var(--hp-shadow, 0 0px 30px rgba(11, 18, 32, 0.12)));
	}

	/* Modal back face: always hover tokens (not :hover). */
	:global(.info-card--modal .info-card-surface--back.hover-polaroid-surface) {
		border-color: var(--hp-border-hover, var(--hp-border, rgba(11, 18, 32, 0.14)));
		background: var(--hp-bg-hover, var(--hp-bg, rgba(255, 255, 255, 0.86)));
		box-shadow: var(--hp-shadow-hover, var(--hp-shadow, 0 0px 30px rgba(11, 18, 32, 0.12)));
	}

	:global(.info-card--dismissing.hover-polaroid-scale .info-card-face--front .hover-polaroid-surface),
	:global(.info-card--dismissing.hover-polaroid-scale:hover .info-card-face--front .hover-polaroid-surface) {
		border-color: var(--hp-border, rgba(11, 18, 32, 0.14));
		background: var(--hp-bg, rgba(255, 255, 255, 0.86));
		box-shadow: var(--hp-shadow, 0 0px 30px rgba(11, 18, 32, 0.12));
	}

	@media (prefers-reduced-motion: reduce) {
		:global(html) {
			transition: none;
		}

		:global(.card-modal-backdrop) {
			transition: none;
		}

		:global(.desktop-app > .stage .scroll-track),
		:global(html.card-modal-open .desktop-app > .stage) {
			transition: none;
		}

		:global(.card-modal-stage-clone) {
			transition: none;
		}

		:global(.hover-polaroid-tilt),
		:global(.hover-polaroid-surface) {
			transition: none;
			transform: none;
		}
	}

	@media (max-width: 900px) {
		:global(:root) {
			--playing-card-w: 168px;
		}
	}

	/* Flipped phone: short and wide. Shrink cards so a row still fits under the heading. */
	@media (max-height: 520px) and (min-aspect-ratio: 1) {
		:global(:root) {
			--playing-card-w: clamp(112px, calc((100vh - 168px) * 5 / 7), 148px);
			--playing-card-w: clamp(112px, calc((100dvh - 168px) * 5 / 7), 148px);
			--heading-size: clamp(28px, 7.2vh, 40px);
		}
	}

	.desktop-app {
		display: block;
	}

	.mobile-gate {
		display: none;
	}

	/* Only show the "rotate / desktop only" gate on SMALL + narrower-than-square viewports.
	   This prevents the gate from appearing on square (1/1) and wider aspect ratios. */
	@media (max-width: 900px) and (max-aspect-ratio: 999/1000),
		(max-height: 520px) and (max-aspect-ratio: 999/1000) {
		.desktop-app {
			display: none; /* no functionality on mobile */
		}

		.mobile-gate {
			position: fixed;
			inset: 0;
			display: grid;
			place-items: center;
			padding: 28px 18px;
			background: radial-gradient(1200px 700px at 20% 10%, rgba(92, 129, 255, 0.22), transparent 60%),
				radial-gradient(900px 600px at 90% 25%, rgba(255, 92, 220, 0.18), transparent 55%),
				radial-gradient(800px 500px at 30% 95%, rgba(38, 198, 218, 0.18), transparent 55%),
				linear-gradient(180deg, #ffffff 0%, #f6f7fb 100%);
			color: var(--fg);
			overflow: hidden;
		}

		.mobile-gate__bg {
			position: absolute;
			inset: -2px;
			background:
				linear-gradient(135deg, rgba(11, 18, 32, 0.04), rgba(11, 18, 32, 0.0)),
				radial-gradient(1400px 700px at 50% 10%, rgba(11, 18, 32, 0.08), transparent 60%);
			filter: blur(0px);
		}

		.mobile-gate__content {
			position: relative;
			width: min(560px, 100%);
			padding: 22px 18px;
			border-radius: 18px;
			background: rgba(255, 255, 255, 0.64);
			border: 1px solid rgba(11, 18, 32, 0.12);
			box-shadow: 0 22px 70px rgba(11, 18, 32, 0.16);
			backdrop-filter: blur(14px);
			-webkit-backdrop-filter: blur(14px);
			text-align: center;
		}

		.mobile-gate__icon {
			display: grid;
			place-items: center;
			margin: 2px auto 14px auto;
			width: 92px;
			height: 72px;
			border-radius: 16px;
			background: rgba(11, 18, 32, 0.04);
			border: 1px solid rgba(11, 18, 32, 0.10);
			box-shadow: 0 14px 40px rgba(11, 18, 32, 0.10);
		}

		.mobile-gate__icon svg {
			width: 76px;
			height: 56px;
		}

		.mobile-gate__headline {
			margin: 0 0 10px 0;
			font-size: clamp(28px, 7vw, 44px);
			line-height: 1.06;
			letter-spacing: -0.03em;
			background: linear-gradient(135deg, #0b1220 0%, rgba(11, 18, 32, 0.70) 55%, #0b1220 100%);
			-webkit-background-clip: text;
			background-clip: text;
			color: transparent;
		}

		.mobile-gate__sub {
			margin: 0;
			font-size: 15px;
			line-height: 1.5;
			color: rgba(11, 18, 32, 0.72);
		}
	}
</style>
