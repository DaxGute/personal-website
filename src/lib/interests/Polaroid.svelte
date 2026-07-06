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
	let revealComplete = false;
	let obs: IntersectionObserver | null = null;

	function prefersReducedMotion() {
		return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	function markRevealComplete() {
		revealComplete = true;
	}

	function triggerReveal() {
		if (revealed) return;
		revealed = true;
		obs?.disconnect();
		obs = null;
	}

	function onCardModalOpen() {
		if (revealed) {
			markRevealComplete();
			return;
		}
		triggerReveal();
	}

	function handleRevealAnimationEnd() {
		markRevealComplete();
	}

	onMount(() => {
		if (revealed) return;
		if (prefersReducedMotion()) {
			revealed = true;
			revealComplete = true;
			return;
		}
		if (!rootEl) return;
		if (typeof IntersectionObserver === 'undefined') {
			revealed = true;
			revealComplete = true;
			return;
		}

		obs = new IntersectionObserver(
			(entries) => {
				if (entries.some((e) => e.isIntersecting)) {
					triggerReveal();
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
	<CardShell theme="green" class="polaroid-card" onModalOpen={onCardModalOpen}>
		<div
			slot="front"
			class="polaroid-content"
			class:is-revealed={revealed}
			class:reveal-complete={revealComplete}
			role="group"
			aria-label={caption}
		>
			<div class="polaroid-front-main">
				<div class="photo">
					{#if src}
						<img src={src} {alt} {loading} decoding="async" />
					{:else}
						<div class="placeholder" aria-hidden="true"></div>
					{/if}
					<div
						class="reveal-overlay"
						aria-hidden="true"
						on:animationend={handleRevealAnimationEnd}
					></div>
				</div>
				<div class="caption">
					<span class="experience-company">{caption}</span>
					{#if subtitle}
						<span class="experience-sub wrap-sub">{subtitle}</span>
					{/if}
				</div>
			</div>
			<p class="polaroid-hover-hint" aria-hidden="true">Click to learn more &gt;</p>
		</div>

		<div slot="back" class="polaroid-content polaroid-content--back">
			<div class="polaroid-back-main">
				<p class="polaroid-back-marker">backside</p>
				<p class="experience-company">{caption}</p>
				{#if subtitle}
					<p class="experience-sub wrap-sub">{subtitle}</p>
				{/if}
			</div>
		</div>
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
		position: relative;
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.polaroid-front-main {
		display: flex;
		flex-direction: column;
		gap: 10px;
		height: 100%;
		transition: opacity 0.28s ease;
	}

	:global(.hover-polaroid-scale:hover) .polaroid-front-main {
		opacity: 0;
	}

	.polaroid-hover-hint {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0;
		padding: 0 12px;
		opacity: 0;
		pointer-events: none;
		color: #e8f2ff;
		font-size: 13px;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-align: center;
		text-shadow:
			0 1px 2px rgba(11, 18, 32, 0.85),
			0 0 12px rgba(170, 210, 255, 0.4);
		transition: opacity 0.28s ease;
	}

	:global(.hover-polaroid-scale:hover) .polaroid-hover-hint {
		opacity: 1;
	}

	.polaroid-content--back {
		justify-content: center;
	}

	.polaroid-back-main {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 6px;
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
		text-align: center;
	}

	.polaroid-back-marker {
		margin: 0 0 4px;
		color: rgba(var(--tone-sub), 0.72);
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: lowercase;
		text-shadow: 0 1px 0 rgba(255, 255, 255, 0.7);
	}

	.polaroid-content--back :global(.experience-company) {
		font-size: 14px;
		line-height: 1.25;
	}

	.polaroid-content--back :global(.experience-sub) {
		font-size: 12px;
		line-height: 1.3;
		letter-spacing: 0.01em;
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

	.polaroid-content.is-revealed:not(.reveal-complete) .reveal-overlay {
		animation: revealFlash 1100ms ease forwards;
	}

	.polaroid-content.reveal-complete .reveal-overlay {
		opacity: 0;
		background: transparent;
		animation: none;
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
