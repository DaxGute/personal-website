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
			{#if edu.backImages?.length}
				<InfoCard
					variant="education"
					heading={edu.school}
					subheading={`${edu.degree} · ${edu.location}`}
					dates={abbreviateMonths(edu.dates)}
					items={edu.details}
					logoSrc={edu.logoSrc}
					logoAlt={edu.logoAlt}
					customBackBody
				>
					<div slot="backBody" class="edu-back" aria-label="{edu.school} photos">
						<figure class="edu-photo edu-photo--primary">
							<img
								src={edu.backImages[0].src}
								alt={edu.backImages[0].alt}
								loading="lazy"
								decoding="async"
							/>
						</figure>
						<figure class="edu-photo edu-photo--secondary">
							<img
								src={edu.backImages[1].src}
								alt={edu.backImages[1].alt}
								loading="lazy"
								decoding="async"
							/>
						</figure>
					</div>
				</InfoCard>
			{:else}
				<InfoCard
					variant="education"
					heading={edu.school}
					subheading={`${edu.degree} · ${edu.location}`}
					dates={abbreviateMonths(edu.dates)}
					items={edu.details}
					logoSrc={edu.logoSrc}
					logoAlt={edu.logoAlt}
				/>
			{/if}
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
			translateY(calc(-10px + var(--edu-stack-sep) * var(--edu-t, 0)))
			translateZ(0);
	}

	.edu-back {
		position: relative;
		flex: 1 1 auto;
		min-height: 0;
		width: 100%;
		height: 100%;
		overflow: visible;
	}

	.edu-photo {
		position: absolute;
		margin: 0;
		width: min(69%, 222px);
		aspect-ratio: 1 / 1;
		overflow: hidden;
		border-radius: 2px;
		background: rgba(140, 180, 220, 0.12);
		box-shadow:
			0 2px 4px rgba(40, 70, 110, 0.16),
			0 10px 22px rgba(40, 70, 110, 0.22);
	}

	.edu-photo img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.edu-photo--primary {
		top: 50%;
		right: 6px;
		transform: translateY(-50%);
	}

	.edu-photo--secondary {
		bottom: 6px;
		left: 6px;
	}

	.education-card.is-stanford .edu-photo--primary img {
		object-position: center 40%;
	}

	.education-card.is-stanford .edu-photo--secondary img {
		object-position: center 20%;
	}

	.education-card:not(.is-stanford) .edu-photo--primary img {
		object-position: center 18%;
	}

	.education-card:not(.is-stanford) .edu-photo--secondary img {
		object-position: center 55%;
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
