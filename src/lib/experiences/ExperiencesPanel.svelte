<script lang="ts">
	import InfoCard from '$lib/InfoCard.svelte';
	import { abbreviateMonths } from '$lib/format';
	import { experiences } from '$lib/experiences/experiences';

	export let kicker: string | undefined = undefined;
	export let title: string;
	export let body: string;
</script>

<div class="experiences-panel">
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
