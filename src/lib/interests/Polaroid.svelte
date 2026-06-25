<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import CardShell from '$lib/CardShell.svelte';

	export let src: string | null = null;
	export let alt = '';
	export let caption: string;
	export let subtitle: string | null = null;
	export let loading: 'lazy' | 'eager' = 'lazy';
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

<div class="polaroid-root" bind:this={rootEl}>
	<CardShell theme="green" class="polaroid-card">
		<figure class="polaroid-content" class:is-revealed={revealed}>
			<div class="photo">
				{#if src}
					<img src={src} {alt} {loading} decoding="async" />
				{:else}
					<div class="placeholder" aria-hidden="true"></div>
				{/if}
				<div class="reveal-overlay" aria-hidden="true"></div>
			</div>
			<figcaption class="caption">
				<span class="experience-company">{caption}</span>
				{#if subtitle}
					<span class="experience-sub wrap-sub">{subtitle}</span>
				{/if}
			</figcaption>
		</figure>
	</CardShell>
</div>

<style>
	.polaroid-root {
		width: 100%;
		height: 100%;
	}

	:global(.polaroid-card:hover) {
		z-index: 2000;
	}

	.polaroid-content {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 10px;
		height: 100%;
	}

	.photo {
		transform: translateZ(calc(10px * var(--hover, 0)));
		transition: transform 140ms ease;
		position: relative;
		width: 100%;
		border-radius: 3px;
		overflow: hidden;
		border: 1px solid rgba(61, 84, 65, 0.3);
		background: #aebeaa;
		box-shadow:
			inset 0 0 0 1px rgba(255, 255, 255, 0.45),
			inset 0 0 24px rgba(255, 255, 255, 0.08);
		aspect-ratio: 1 / 1;
	}

	@media (prefers-reduced-motion: reduce) {
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
		background: #a8b5a4;
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

	.polaroid-content.is-revealed .photo img,
	.polaroid-content.is-revealed .photo .placeholder {
		opacity: 1;
	}

	.polaroid-content.is-revealed .reveal-overlay {
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
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
	}

	.caption :global(.experience-company) {
		font-size: 12px;
		line-height: 1.25;
	}

	.caption :global(.experience-sub) {
		font-size: 11px;
		line-height: 1.2;
		letter-spacing: 0.01em;
	}
</style>
