<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	export let src: string | null = null;
	export let alt = '';
	export let caption: string;
	export let loading: 'lazy' | 'eager' = 'lazy';
	// IntersectionObserver tuning (used for reveal animation timing).
	// "Earlier" reveal = less-negative root margins (wider in-view band) and/or lower threshold.
	export let revealRootMargin = '0px -35% 0px -35%';
	export let revealThreshold = 0.01;

	let rootEl: HTMLElement | null = null;
	let revealed = false;
	let obs: IntersectionObserver | null = null;

	function prefersReducedMotion() {
		return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

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
				// The page scrolls horizontally; delay reveal until the item has slid far enough into view.
				// Negative LEFT/RIGHT margins create a "center band" (here: middle ~30% of viewport width).
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

<figure class="polaroid" class:is-revealed={revealed} bind:this={rootEl}>
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
		box-shadow: 0 18px 50px rgba(11, 18, 32, 0.12);
		transform: translateZ(0);
		transition:
			transform 200ms ease,
			box-shadow 200ms ease;
	}

	.polaroid:hover {
		transform: translateY(-4px);
		box-shadow: 0 22px 65px rgba(11, 18, 32, 0.14);
	}

	.photo {
		position: relative;
		width: 100%;
		border-radius: 10px;
		overflow: hidden;
		border: 1px solid rgba(11, 18, 32, 0.1);
		background: rgba(255, 255, 255, 0.35);
		aspect-ratio: 1 / 1;
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

