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
			{#if edu.backSections?.length || edu.backImages?.length}
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
					<div
						slot="backBody"
						class="edu-back"
						class:edu-back--copy={!!edu.backSections?.length}
						class:edu-back--photos={!!edu.backImages?.length}
						class:edu-back--hybrid={!!edu.backSections?.length && !!edu.backImages?.length}
						aria-label="{edu.school} details"
					>
						{#if edu.backSections?.length}
							<div class="edu-copy">
								{#if edu.backImages?.length}
									<!--
										Zero-width spacer pushes the mid-right exclusion down WITHOUT
										stealing horizontal space (margin-top on a float would).
									-->
									<div class="edu-shim edu-shim--primary-spacer" aria-hidden="true"></div>
									<div class="edu-shim edu-shim--primary" aria-hidden="true"></div>
									<div class="edu-shim edu-shim--secondary" aria-hidden="true"></div>
								{/if}
								{#each edu.backSections as section}
									<h2
										class="edu-section-heading"
										class:edu-section-heading--spaced={section.heading === 'Highlights'}
									>
										{section.heading}
									</h2>
									{#if section.items?.length}
										{#each section.items as item}
											<p class="edu-section-item">{item}</p>
										{/each}
									{/if}
									{#if section.activities?.length}
										<p class="edu-activities">{section.activities.join(' · ')}</p>
									{/if}
									{#if section.link}
										<a
											class="edu-section-link"
											href={section.link.href}
											download={section.link.download ? '' : undefined}
											target={section.link.download ? undefined : '_blank'}
											rel={section.link.download ? undefined : 'noreferrer'}
										>
											{section.link.label}
										</a>
									{/if}
								{/each}
							</div>
						{/if}

						{#if edu.backImages?.length}
							<div class="edu-photos" aria-label="{edu.school} photos">
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
						{/if}
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
		--edu-card-width: 371px;
		--edu-card-height: 371px;
		--edu-base-x: 140px;
		--edu-split: 160px;
		--edu-stack-sep: 8px;
		--edu-stack-x: 14px;
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
		overflow: hidden;
		--edu-photo-size: 33.12%;
	}

	.edu-back--copy:not(.edu-back--hybrid),
	.edu-back--hybrid {
		overflow: hidden;
	}

	.edu-copy {
		position: relative;
		z-index: 0;
		box-sizing: border-box;
		width: 100%;
		height: 100%;
		/* Normal block flow — required for floats + line-box wrapping. */
		display: block;
	}

	.edu-section-heading {
		display: block;
		margin: var(--back-gap-lg, 1.5cqw) 0 var(--back-gap-xs, 0.3cqw);
		color: #000;
		font-size: var(--back-fs-md, 2.41cqw);
		font-weight: 700;
		line-height: 1.25;
		overflow-wrap: anywhere;
	}

	.edu-section-heading--spaced {
		/* Three lines of space after the previous section before Highlights. */
		margin-top: calc(var(--back-gap-lg, 1.5cqw) + 3 * 1.35em);
	}

	.edu-shim--secondary + .edu-section-heading {
		margin-top: 0;
	}

	.edu-section-item,
	.edu-activities {
		display: block;
		width: auto;
		max-width: none;
		margin: 0 0 var(--back-gap-xs, 0.3cqw);
		color: #000;
		font-size: var(--back-fs, 2.15cqw);
		line-height: 1.35;
		overflow-wrap: anywhere;
	}

	.edu-activities {
		margin-top: var(--back-gap-xs, 0.3cqw);
	}

	.edu-section-link {
		display: inline-block;
		margin: var(--back-gap-xs, 0.3cqw) 0 var(--back-gap-sm, 0.75cqw);
		color: #000;
		font-size: var(--back-fs, 2.15cqw);
		font-weight: 700;
		line-height: 1.35;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.edu-section-link:hover {
		text-decoration-thickness: 2px;
	}

	.edu-photos {
		position: absolute;
		inset: 0;
		z-index: 1;
		width: 100%;
		height: 100%;
		min-height: 0;
		overflow: visible;
		pointer-events: none;
	}

	.edu-photo {
		position: absolute;
		margin: 0;
		width: var(--edu-photo-size);
		height: var(--edu-photo-size);
		overflow: hidden;
		border-radius: 2px;
		pointer-events: auto;
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
		right: var(--back-gap-sm, 0.75cqw);
		transform: translateY(-50%);
	}

	.edu-photo--secondary {
		bottom: var(--back-gap-sm, 0.75cqw);
		left: var(--back-gap-sm, 0.75cqw);
	}

	/*
	 * Invisible floats reserve the same boxes as the absolute photos.
	 * Primary uses a 0-width spacer so top lines stay full-width; a float
	 * with margin-top would still steal horizontal space for its margin box.
	 */
	.edu-shim {
		box-sizing: border-box;
		pointer-events: none;
		opacity: 0;
	}

	.edu-shim--primary-spacer {
		float: right;
		width: 0;
		height: 33.44%;
		margin: 0;
	}

	.edu-shim--primary {
		float: right;
		clear: right;
		width: var(--edu-photo-size);
		aspect-ratio: 1 / 1;
		margin: 0 var(--back-gap-sm, 0.75cqw) var(--back-gap, 1.2cqw) var(--back-gap, 1.2cqw);
		shape-outside: border-box;
		shape-margin: var(--back-gap-sm, 0.75cqw);
	}

	.edu-shim--secondary {
		float: left;
		clear: right;
		width: var(--edu-photo-size);
		aspect-ratio: 1 / 1;
		margin: 0 var(--back-gap, 1.2cqw) var(--back-gap-sm, 0.75cqw) var(--back-gap-sm, 0.75cqw);
		shape-outside: border-box;
		shape-margin: var(--back-gap-sm, 0.75cqw);
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
			display: flex;
			flex-wrap: wrap;
			justify-content: center;
			gap: 18px;
			top: 0;
			left: 0;
		}

		.education-card {
			position: relative;
			left: auto;
			width: var(--edu-card-width);
			height: var(--edu-card-height);
			transform: none;
		}
	}

</style>
