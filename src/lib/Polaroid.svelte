<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	export let src: string | null = null;
	export let alt = '';
	export let caption: string;
	export let loading: 'lazy' | 'eager' = 'lazy';
	export let revealRootMargin = '0px -35% 0px -35%';
	export let revealThreshold = 0.01;

	let rootEl: HTMLElement | null = null;
	let revealed = false;
	let obs: IntersectionObserver | null = null;

	function prefersReducedMotion() {
		return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	// ---- 3D tilt hover ----
	const MAX_TILT_DEG = 9; // tweak 6–12 for taste
	const HOVER_SCALE = 1.035; // subtle zoom

	function setTilt(e: PointerEvent) {
		if (!rootEl) return;
		if (prefersReducedMotion()) return;

		const r = rootEl.getBoundingClientRect();
		const x = (e.clientX - r.left) / r.width;
		const y = (e.clientY - r.top) / r.height;

		const dx = x - 0.5;
		const dy = y - 0.5;

		const rotX = (dy * 2 * MAX_TILT_DEG).toFixed(3);
		const rotY = (-dx * 2 * MAX_TILT_DEG).toFixed(3);

		rootEl.style.setProperty('--rx', `${rotX}deg`);
		rootEl.style.setProperty('--ry', `${rotY}deg`);
		rootEl.style.setProperty('--scale', `${HOVER_SCALE}`);
		rootEl.style.setProperty('--hover', '1');
	}

	function resetTilt() {
		if (!rootEl) return;

		rootEl.style.setProperty('--rx', `0deg`);
		rootEl.style.setProperty('--ry', `0deg`);
		rootEl.style.setProperty('--scale', `1`);
		rootEl.style.setProperty('--hover', '0');
	}
	// ------------------------

	onMount(() => {
		if (revealed) return;
		if (prefersReducedMotion()) {
			revealed = true;
			return;
		}
		if (!rootEl) return;
		if (typeof IntersectionObserver === 'undefined') {
			revealed = true;
			return;
		}

		obs = new IntersectionObserver(
			(entries) => {
				if (entries.some((e) => e.isIntersecting)) {
					revealed = true;
					obs?.disconnect();
					obs = null;
				}
			},
			{
				rootMargin: revealRootMargin,
				threshold: revealThreshold
			}
		);

		obs.observe(rootEl);
	});

	onDestroy(() => {
		obs?.disconnect();
		obs = null;
	});
</script>

<figure
	class="polaroid"
	class:is-revealed={revealed}
	bind:this={rootEl}
	on:pointerenter={setTilt}
	on:pointermove={setTilt}
	on:pointerleave={resetTilt}
>
	<div class="photo">
		{#if src}
			<img src={src} {alt} {loading} decoding="async" />
		{:else}
			<div class="placeholder" aria-hidden="true"></div>
		{/if}
		<div class="reveal-overlay" aria-hidden="true"></div>
	</div>
	<figcaption class="caption">{caption}</figcaption>
</figure>

<style>
	.polaroid {
		position: relative;
		z-index: 3;
		margin: 0;
		height: 100%;
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 10px 10px 12px;
		border-radius: 18px;
		border: 1px solid rgba(11, 18, 32, 0.14);
		background: rgba(255, 255, 255, 0.8);
		backdrop-filter: blur(var(--glass-blur)) saturate(1.25);
		-webkit-backdrop-filter: blur(var(--glass-blur)) saturate(1.25);
		box-shadow: 0 0px 30px rgba(11, 18, 32, 0.12);
		transform:
			perspective(900px)
			rotateX(var(--rx, 0deg))
			rotateY(var(--ry, 0deg))
			scale(var(--scale, 1));

		transform-style: preserve-3d;

		transition:
			transform 140ms ease,
			box-shadow 180ms ease;

		will-change: transform;
		isolation: isolate;
	}

	.polaroid:hover {
		z-index: 2000;
		box-shadow: 0 0px 30px rgba(11, 18, 32, 0.3);
	}

	.photo {
		transform: translateZ(calc(10px * var(--hover, 0)));
		transition: transform 140ms ease;
		position: relative;
		width: 100%;
		border-radius: 12px;
		overflow: hidden;
		border: 1px solid rgba(11, 18, 32, 0.1);
		background: rgba(255, 255, 255, 0.4);
		aspect-ratio: 1 / 1;
	}

	@media (prefers-reduced-motion: reduce) {
	.polaroid,
	.photo {
		transition: none;
		transform: none;
	}
}

	.photo img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0;
		transition: opacity 1200ms ease;
		transition-delay: 220ms;
	}

	.placeholder {
		width: 100%;
		height: 100%;
		background:
			radial-gradient(80% 80% at 20% 20%, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0) 55%),
			linear-gradient(135deg, rgba(124, 58, 237, 0.25), rgba(34, 211, 238, 0.18), rgba(16, 185, 129, 0.18)),
			rgba(255, 255, 255, 0.3);
		opacity: 0;
		transition: opacity 1200ms ease;
		transition-delay: 220ms;
	}

	.reveal-overlay {
		position: absolute;
		inset: 0;
		background: #000;
		opacity: 1;
		pointer-events: none;
	}

	.polaroid.is-revealed .photo img,
	.polaroid.is-revealed .photo .placeholder {
		opacity: 1;
	}

	.polaroid.is-revealed .reveal-overlay {
		animation: revealFlash 1100ms ease forwards;
	}

	@keyframes revealFlash {
		0% {
			background: #000;
			opacity: 1;
		}
		14% {
			background: #fff;
			opacity: 1;
		}
		100% {
			background: #fff;
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.photo img,
		.placeholder {
			transition: none;
			opacity: 1;
		}
		.reveal-overlay {
			display: none;
		}
	}

	.caption {
		margin: 0;
		text-align: center;
		font-size: 12px;
		line-height: 1.25;
		letter-spacing: 0.02em;
		color: rgba(11, 18, 32, 0.86);
	}
</style>

