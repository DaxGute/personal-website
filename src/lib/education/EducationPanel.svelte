<script lang="ts">
	import InfoCard from '$lib/InfoCard.svelte';
	import { abbreviateMonths } from '$lib/format';
	import { educations } from '$lib/education/education';

	export let kicker: string | undefined = undefined;
	export let title: string;
	export let body: string;
</script>

{#if kicker}
	<p class="kicker">{kicker}</p>
{/if}
<h1 class="title">{title}</h1>
<p class="body">{body}</p>

<div class="education-carousel" aria-label="Education carousel">
	{#each educations.slice(0, 2) as edu (edu.school)}
		<article class="education-card" class:is-stanford={edu.school === 'Stanford University'}>
			<InfoCard
				variant="education"
				heading={edu.school}
				subheading={`${edu.degree} · ${edu.location}`}
				dates={abbreviateMonths(edu.dates)}
				items={edu.details}
				logoSrc={edu.logoSrc}
				logoAlt={edu.logoAlt}
			/>
		</article>
	{/each}
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

	.education-carousel {
		position: relative;
		isolation: isolate;
		--edu-card-width: clamp(229px, 38.6vw, 371px);
		--edu-card-height: var(--edu-card-width);
		--edu-base-x: clamp(40px, 10vw, 140px);
		--edu-split: clamp(70px, 10vw, 130px);
		--edu-stack-sep: clamp(4px, 0.5vw, 8px);
		--edu-stack-x: clamp(8px, 1vw, 14px);
		width: min(980px, 100%);
		height: var(--edu-card-height);
		margin: 18px auto 0;
		top: -71px;
		left: 0;
	}

	.education-card {
		position: absolute;
		top: 0;
		left: 50%;
		width: var(--edu-card-width);
		height: var(--edu-card-height);
		margin: 0;
		transform-origin: bottom left;
		transform: translate3d(-50%, 0, 0);
		will-change: transform;
	}

	.education-card.is-stanford {
		z-index: 2;
		transform: rotate(calc(-9deg * var(--edu-t, 0)))
			translate3d(-50%, 0, 0)
			translateX(calc(var(--edu-base-x) - var(--edu-split) * var(--edu-t, 0)))
			translateY(calc(-1 * var(--edu-stack-sep) * var(--edu-t, 0)))
			translateZ(0);
	}

	.education-card:not(.is-stanford) {
		z-index: 1;
		transform: rotate(calc(11deg * var(--edu-t, 0)))
			translate3d(-50%, 0, 0)
			translateX(
				calc(
					var(--edu-base-x) + var(--edu-stack-x) * (1 - var(--edu-t, 0)) +
						var(--edu-split) * var(--edu-t, 0)
				)
			)
			translateY(calc(var(--edu-stack-sep) * var(--edu-t, 0)))
			translateZ(0);
	}

	.education-card:hover {
		z-index: 5;
	}

	@media (prefers-reduced-motion: reduce) {
		.education-carousel {
			width: min(980px, 100%);
			height: auto;
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 18px;
			top: 0;
			left: 0;
		}

		.education-card {
			position: relative;
			left: auto;
			width: 100%;
			aspect-ratio: 1 / 1;
			height: auto;
			transform: none;
		}
	}
</style>
