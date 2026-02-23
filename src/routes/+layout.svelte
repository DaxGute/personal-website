<script lang="ts">
	import signature from '$lib/assets/signature.svg';
	import signatureFavicon from '$lib/assets/signature-favicon.svg';

	let { children } = $props();

	const sourceCodeHref = 'https://github.com/DaxGute/personal-website';

	export const prerender = true;
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
	<div class="repo-note">
		<span>Like my website? The code can be found </span>
		<a class="repo-note__link" href={sourceCodeHref} target="_blank" rel="noreferrer">here</a>
		<span>.</span>
	</div>
</div>

<style>
	:global(:root) {
		color-scheme: light;
		--bg: #ffffff;
		--fg: #0b1220;
		--muted: rgba(11, 18, 32, 0.68);
		/* Glassy surfaces */
		--glass-blur: 14px;
		--card: rgba(255, 255, 255, 0.22);
		--card-strong: rgba(255, 255, 255, 0.32);
		--card-hover: rgba(255, 255, 255, 0.38);
		--card-border: rgba(11, 18, 32, 0.12);
		--shadow: 0 18px 50px rgba(11, 18, 32, 0.12);
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

	.desktop-app {
		display: block;
	}

	.repo-note {
		position: fixed;
		right: 14px;
		bottom: 12px;
		z-index: 50;
		font-size: 12px;
		line-height: 1.25;
		color: rgba(11, 18, 32, 0.72);
	}

	.repo-note__link {
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 2px;
	}

	.repo-note__link:hover {
		color: rgba(11, 18, 32, 0.9);
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
