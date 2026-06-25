<script lang="ts">
	import { onMount } from 'svelte';
	import { GREETING_SCROLL_UNLOCK_MS } from '$lib/ribbon';
	import ContactFanout from '$lib/title/ContactFanout.svelte';

	export let kicker: string | undefined = undefined;
	export let title: string;
	export let body: string;
	export let linkedinHref: string;
	export let githubHref: string;
	export let emailHref: string;
	export let scrollLocked = true;
	export let onUnlock: (() => void) | undefined = undefined;

	let timelineOn = false;
	let dotsOn = false;
	let dotsTimer: number | null = null;

	function prefersReducedMotion() {
		return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	function splitTitle(name: string): { first: string; last: string } {
		const parts = (name ?? '')
			.trim()
			.split(/\s+/g)
			.filter(Boolean);
		if (parts.length <= 1) return { first: parts[0] ?? name ?? '', last: '' };
		return { first: parts[0] ?? '', last: parts.slice(1).join(' ') };
	}

	function splitSuffixFade(text: string, suffix: string): { prefix: string; fade: string } {
		const t = (text ?? '').trim();
		const s = (suffix ?? '').trim();
		if (!t || !s) return { prefix: t, fade: '' };
		if (t.toLowerCase().endsWith(s.toLowerCase())) {
			return { prefix: t.slice(0, -s.length), fade: t.slice(-s.length) };
		}
		return { prefix: t, fade: '' };
	}

	function splitHeadFadeRest(text: string, headChars = 1): { head: string; fade: string } {
		const t = (text ?? '').trim();
		const n = Math.max(0, Math.min(t.length, Math.floor(headChars)));
		return { head: t.slice(0, n), fade: t.slice(n) };
	}

	$: parts = splitTitle(title);
	$: firstParts = splitSuffixFade(parts.first, 'ton');
	$: lastParts = splitHeadFadeRest(parts.last, 1);

	onMount(() => {
		requestAnimationFrame(() => {
			timelineOn = true;
			if (prefersReducedMotion()) {
				dotsOn = true;
				scrollLocked = false;
				onUnlock?.();
				return;
			}
			dotsTimer = window.setTimeout(() => {
				dotsOn = true;
				scrollLocked = false;
				onUnlock?.();
			}, GREETING_SCROLL_UNLOCK_MS);
		});

		return () => {
			if (dotsTimer != null) window.clearTimeout(dotsTimer);
			dotsTimer = null;
		};
	});
</script>

<div class="greeting-layout">
	<div class="greeting-contact">
		<ContactFanout {linkedinHref} {githubHref} {emailHref} />
	</div>
	<div class="greeting" class:greeting--animate={timelineOn}>
		{#if kicker}
			<p class="kicker greeting-kicker">{kicker}</p>
		{/if}
		<h1 class="title title--greeting">
			<span class="title-first"
				><span class="first-static">{firstParts.prefix}</span
				>{#if firstParts.fade}<span class="first-fade">{firstParts.fade}</span>{/if}</span
			>{#if parts.last}<span class="title-last"
				><span class="last-g">{lastParts.head}</span><span class="last-fade">{lastParts.fade}</span></span
			>{/if}
		</h1>
		<p class="body greeting-body">
			{body}<span class="jump-dots" class:jump-dots--on={dotsOn} aria-hidden="true"
				><span>.</span><span>.</span><span>.</span></span
			>
		</p>
	</div>
</div>

<style>
	.greeting-layout {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: clamp(28px, 4vw, 56px);
		width: min(980px, 100%);
		margin-top: 170px;
	}

	.greeting-contact {
		flex: 0 0 auto;
		align-self: center;
		pointer-events: auto;
		opacity: 1;
		transform: translateY(0);
		transition:
			opacity 1200ms cubic-bezier(0.16, 1, 0.3, 1),
			transform 1200ms cubic-bezier(0.16, 1, 0.3, 1);
	}

	.greeting-contact :global(.contact-menu) {
		transform-origin: center left;
	}

	.greeting {
		width: min(860px, 100%);
		padding: 6px;
		flex: 1 1 auto;
		min-width: 0;
		--title-outer-glow:
			0 0 18px rgba(255, 255, 255, 0.9),
			0 0 36px rgba(255, 255, 255, 0.6),
			0 0 64px rgba(255, 255, 255, 0.35);
		--greeting-sub-glow:
			0 0 28px rgba(255, 255, 255, 1),
			0 0 56px rgba(255, 255, 255, 1),
			0 0 100px rgba(255, 255, 255, 0.98),
			0 0 160px rgba(255, 255, 255, 0.6);
	}

	.kicker {
		margin: 0 0 10px;
		color: var(--muted);
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		font-size: 12px;
	}

	.greeting .kicker {
		margin-top: 20px;
	}

	.title {
		margin: 0 0 10px;
		font-size: clamp(32px, 4vw, 54px);
		line-height: 1.05;
		letter-spacing: -0.03em;
	}

	.body {
		margin: 0 0 18px;
		color: var(--muted);
		font-size: 16px;
		line-height: 1.6;
	}

	.title--greeting {
		white-space: nowrap;
	}

	.title--greeting .first-static,
	.title--greeting .first-fade,
	.title--greeting .last-g,
	.title--greeting .last-fade {
		text-shadow: var(--title-outer-glow);
	}

	.title-first {
		display: inline-block;
	}

	.first-static {
		display: inline-block;
	}

	.first-fade {
		display: inline-block;
		opacity: 0;
		will-change: opacity;
	}

	.title-last {
		display: inline-flex;
		margin-left: 0.22em;
	}

	.last-g {
		display: inline-block;
		opacity: 0;
		transform: translateX(-14px);
		will-change: transform, opacity;
	}

	.last-fade {
		display: inline-block;
		opacity: 0;
		transform: translateX(-14px);
		will-change: transform, opacity;
	}

	.greeting-kicker,
	.greeting-body {
		opacity: 0;
		transform: translateY(10px);
		will-change: transform, opacity;
		text-shadow: var(--greeting-sub-glow);
	}

	.greeting-kicker {
		transform: translateY(-10px);
	}

	.greeting--animate .first-fade {
		animation: greetTonIn 1200ms ease-out 0ms forwards;
	}

	.greeting--animate .last-g {
		animation: greetGIn 650ms cubic-bezier(0.16, 1, 0.3, 1) 0ms forwards;
	}

	.greeting--animate .last-fade {
		animation:
			greetTonIn 1200ms ease-out 0ms forwards,
			greetSlideXIn 650ms cubic-bezier(0.16, 1, 0.3, 1) 0ms forwards;
	}

	.greeting--animate .greeting-kicker {
		animation: greetTopTextIn 420ms cubic-bezier(0.16, 1, 0.3, 1) 560ms forwards;
	}

	.greeting--animate .greeting-body {
		animation: greetContinueIn 420ms cubic-bezier(0.16, 1, 0.3, 1) 1080ms forwards;
	}

	.jump-dots {
		display: inline-flex;
		gap: 3px;
		margin-left: 4px;
	}

	.jump-dots > span {
		display: inline-block;
		transform: translateY(0);
		animation: none;
		opacity: 0.65;
	}

	.jump-dots.jump-dots--on > span {
		animation: dotJump 1s infinite ease-in-out;
	}

	.jump-dots.jump-dots--on > span:nth-child(2) {
		animation-delay: 0.12s;
	}
	.jump-dots.jump-dots--on > span:nth-child(3) {
		animation-delay: 0.24s;
	}

	@keyframes greetTonIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes greetGIn {
		from {
			opacity: 0;
			transform: translateX(-14px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	@keyframes greetSlideXIn {
		from {
			transform: translateX(-14px);
		}
		to {
			transform: translateX(0);
		}
	}

	@keyframes greetTopTextIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes greetContinueIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes dotJump {
		0%,
		80%,
		100% {
			transform: translateY(0);
			opacity: 0.65;
		}
		40% {
			transform: translateY(-6px);
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.title-first,
		.title-last,
		.greeting-kicker,
		.greeting-body {
			animation: none !important;
			opacity: 1 !important;
			transform: none !important;
		}

		.first-fade {
			opacity: 1 !important;
		}

		.last-g,
		.last-fade {
			opacity: 1 !important;
			transform: none !important;
		}

		.jump-dots > span {
			animation: none !important;
		}
	}
</style>
