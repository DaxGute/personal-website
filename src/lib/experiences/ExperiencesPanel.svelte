<script lang="ts">
	import { onMount } from 'svelte';
	import InfoCard from '$lib/InfoCard.svelte';
	import { abbreviateMonths } from '$lib/format';
	import { experiences } from '$lib/experiences/experiences';

	export let kicker: string | undefined = undefined;
	export let title: string;
	export let body: string;

	const EXP_MAGNET_RADIUS = 280;
	const EXP_MAGNET_STRENGTH = 0.22;
	const EXP_MAGNET_MAX_PX = 24;

	let rootEl: HTMLElement | null = null;

	function prefersReducedMotion() {
		return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	function updateMagnet(panel: HTMLElement, clientX: number, clientY: number) {
		const cards = panel.querySelectorAll<HTMLElement>('.experience-item .info-card');
		for (const card of cards) {
			const r = card.getBoundingClientRect();
			const cx = r.left + r.width * 0.5;
			const cy = r.top + r.height * 0.5;
			const dx = clientX - cx;
			const dy = clientY - cy;
			const dist = Math.hypot(dx, dy);

			if (dist > EXP_MAGNET_RADIUS) {
				card.style.setProperty('--mag-x', '0px');
				card.style.setProperty('--mag-y', '0px');
				continue;
			}

			const t = 1 - dist / EXP_MAGNET_RADIUS;
			const pull = t * t * EXP_MAGNET_STRENGTH;
			let mx = dx * pull;
			let my = dy * pull;
			const mag = Math.hypot(mx, my);
			if (mag > EXP_MAGNET_MAX_PX) {
				const s = EXP_MAGNET_MAX_PX / mag;
				mx *= s;
				my *= s;
			}

			card.style.setProperty('--mag-x', `${mx.toFixed(2)}px`);
			card.style.setProperty('--mag-y', `${my.toFixed(2)}px`);
		}
	}

	function resetMagnet(panel: HTMLElement | null) {
		panel?.querySelectorAll<HTMLElement>('.experience-item .info-card').forEach((card) => {
			card.style.setProperty('--mag-x', '0px');
			card.style.setProperty('--mag-y', '0px');
		});
	}

	onMount(() => {
		const panelEl = rootEl?.closest('#experiences') as HTMLElement | null;
		const hoverCapable =
			typeof window !== 'undefined' &&
			window.matchMedia('(hover: hover) and (pointer: fine)').matches;
		let magnetRaf: number | null = null;
		let magnetX = 0;
		let magnetY = 0;

		const onPointerMove = (e: PointerEvent) => {
			if (!panelEl || !hoverCapable || prefersReducedMotion()) return;
			magnetX = e.clientX;
			magnetY = e.clientY;
			if (magnetRaf != null) return;
			magnetRaf = requestAnimationFrame(() => {
				magnetRaf = null;
				if (panelEl) updateMagnet(panelEl, magnetX, magnetY);
			});
		};

		const onPointerLeave = () => {
			if (magnetRaf != null) {
				cancelAnimationFrame(magnetRaf);
				magnetRaf = null;
			}
			resetMagnet(panelEl);
		};

		if (panelEl && hoverCapable && !prefersReducedMotion()) {
			panelEl.addEventListener('pointermove', onPointerMove, { passive: true });
			panelEl.addEventListener('pointerleave', onPointerLeave, { passive: true });
		}

		return () => {
			if (magnetRaf != null) cancelAnimationFrame(magnetRaf);
			panelEl?.removeEventListener('pointermove', onPointerMove as EventListener);
			panelEl?.removeEventListener('pointerleave', onPointerLeave as EventListener);
			resetMagnet(panelEl);
		};
	});
</script>

<div class="experiences-panel" bind:this={rootEl}>
	{#if kicker}
		<p class="kicker">{kicker}</p>
	{/if}
	<h1 class="title">{title}</h1>
	<p class="body">{body}</p>

	<ul class="experience-list" aria-label="Jobs and internships list">
		{#each experiences as exp}
			<li class="experience-item">
				<InfoCard
					variant="experience"
					heading={exp.company}
					subheading={`${exp.title} · ${exp.location}`}
					dates={abbreviateMonths(exp.dates)}
					items={exp.highlights}
					logoSrc={exp.logoSrc}
					logoAlt={exp.logoAlt}
				/>
			</li>
		{/each}
	</ul>
</div>

<style>
	.kicker {
		margin: 0 0 10px;
		color: var(--muted);
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		font-size: 12px;
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

	.experience-list {
		list-style: none;
		margin: 0 0 18px;
		padding: 0;
		display: grid;
		gap: 16px;
	}

	:global(#experiences) .experience-list {
		display: block;
		position: relative;
		margin-bottom: 0;
		margin-top: 18px;
		min-height: clamp(420px, 62vh, 620px);
	}

	.experience-item {
		--t: var(--exp-t, 1);
		--spread-x: 0px;
		--spread-y: 0px;
		position: relative;
		z-index: 1;
		width: 100%;
		min-height: clamp(180px, 20vh, 240px);
		transform: translate3d(
			calc(var(--spread-x) * (1 - var(--t))),
			calc(var(--spread-y) * (1 - var(--t))),
			0
		);
		will-change: transform;
	}

	:global(#experiences) .experience-item:nth-child(1) {
		z-index: 40;
	}
	:global(#experiences) .experience-item:nth-child(2) {
		z-index: 30;
	}
	:global(#experiences) .experience-item:nth-child(3) {
		z-index: 20;
	}
	:global(#experiences) .experience-item:nth-child(4) {
		z-index: 10;
	}
	:global(#experiences) .experience-item:hover {
		z-index: 40;
	}

	:global(#experiences) .experience-item :global(.hover-polaroid-scale) {
		--mag-x: 0px;
		--mag-y: 0px;
		transform: translate3d(var(--mag-x), var(--mag-y), 0) scale(var(--scale, 1));
		transition: none;
	}

	@media (min-width: 720px) {
		:global(#experiences) .experience-list {
			--exp-card-w: min(520px, 46vw);
		}

		.experience-item {
			width: 50%;
			margin-inline: auto;
		}

		:global(#experiences) .experience-item {
			position: absolute;
			width: var(--exp-card-w);
			margin: 0;
		}

		:global(#experiences) .experience-item:nth-child(1) {
			--spread-x: -240px;
			--spread-y: 150px;
			top: 150px;
			left: -60px;
			right: auto;
			z-index: 5;
		}

		:global(#experiences) .experience-item:nth-child(2) {
			--spread-x: -40px;
			--spread-y: -150px;
			top: -90px;
			left: calc(var(--exp-card-w) + 100px);
			right: auto;
			z-index: 5;
		}

		:global(#experiences) .experience-item:nth-child(3) {
			--spread-x: -140px;
			--spread-y: 90px;
			top: 0;
			left: 0;
			right: auto;
			bottom: auto;
		}

		:global(#experiences) .experience-item:nth-child(4) {
			--spread-x: -140px;
			--spread-y: -90px;
			top: 44px;
			left: calc(var(--exp-card-w) + 28px);
			right: auto;
			bottom: auto;
		}
	}
</style>
