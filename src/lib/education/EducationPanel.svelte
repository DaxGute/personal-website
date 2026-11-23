<script lang="ts">
	import InfoCard from '$lib/InfoCard.svelte';
	import { abbreviateMonths } from '$lib/format';
	import { educations } from '$lib/education/education';
	import ShutterHeading from '$lib/title/ShutterHeading.svelte';

	export let title: string;
</script>

<ShutterHeading {title} />

<div class="education-carousel" aria-label="Education carousel">
	{#each educations as edu, i (`${edu.school}|${edu.degree}`)}
		<article class="education-card" class:is-stanford={edu.school === 'Stanford University'} data-slot={i}>
			{#if edu.backSections?.length || edu.backImages?.length}
				<InfoCard
					variant="education"
					heading={edu.school}
					subheading={edu.degree}
					location={edu.location}
					dates={edu.dates ? abbreviateMonths(edu.dates) : null}
					logoSrc={edu.logoSrc}
					logoAlt={edu.logoAlt}
					customBackBody
				>
					<div
						slot="backBody"
						class="edu-back"
						class:edu-back--photos={!!edu.backImages?.length}
						aria-label="{edu.school} details"
					>
						{#if edu.backImages?.length}
							<div class="edu-photo-row">
								{#each edu.backImages as image}
									<figure class="edu-shot">
										<img src={image.src} alt={image.alt} loading="lazy" decoding="async" />
									</figure>
								{/each}
							</div>
						{/if}
						{#if edu.backSections?.length}
							<div class="edu-copy">
								{#each edu.backSections as section}
									<div class="edu-section-heading-row">
										<h2 class="edu-section-heading">{section.heading}</h2>
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
									</div>
									{#if section.items?.length || section.activities?.length}
										<div class="edu-section-body">
											{#if section.items?.length}
												{#each section.items as item}
													<p class="edu-section-item">{item}</p>
												{/each}
											{/if}
											{#if section.activities?.length}
												<p class="edu-activities">{section.activities.join(' · ')}</p>
											{/if}
										</div>
									{/if}
								{/each}
							</div>
						{/if}
					</div>
				</InfoCard>
			{:else}
				<InfoCard
					variant="education"
					heading={edu.school}
					subheading={edu.degree}
					location={edu.location}
					dates={edu.dates ? abbreviateMonths(edu.dates) : null}
					logoSrc={edu.logoSrc}
					logoAlt={edu.logoAlt}
					customBackBody
				>
					<div slot="backBody" class="edu-back edu-back--empty" aria-label="{edu.school} details"></div>
				</InfoCard>
			{/if}
		</article>
	{/each}
</div>

<style>
	.education-carousel {
		position: relative;
		isolation: isolate;
		--edu-card-width: var(--playing-card-w, 220px);
		--edu-card-height: var(--playing-card-h, 308px);
		--edu-base-x: calc(var(--edu-card-width) * 0.22);
		--edu-spread: calc(var(--edu-card-width) * 0.92);
		--edu-stack-sep: 8px;
		--edu-stack-x: 14px;
		width: min(calc(980px * 1.15), 100%);
		height: var(--edu-card-height);
		margin: 18px auto 0;
		top: 12px;
		left: 0;
	}

	.education-card {
		--fan-rot: 0deg;
		--fan-x: 0px;
		--fan-y: 0px;
		--stack-x: 0px;
		--stack-y: 0px;
		position: absolute;
		top: 0;
		left: 50%;
		width: var(--edu-card-width);
		height: var(--edu-card-height);
		aspect-ratio: var(--playing-card-ratio, 5 / 7);
		margin: 0;
		transform-origin: bottom left;
		transform: rotate(calc(var(--fan-rot) * var(--edu-t, 0)))
			translate3d(-50%, 0, 0)
			translateX(
				calc(
					var(--edu-base-x) + var(--stack-x) * (1 - var(--edu-t, 0)) + var(--fan-x) * var(--edu-t, 0)
				)
			)
			translateY(calc(var(--stack-y) * (1 - var(--edu-t, 0)) + var(--fan-y) * var(--edu-t, 0)))
			translateZ(0);
		will-change: transform;
	}

	/* Same fan as before: left card leans back, right card leans forward, tops stay level. */
	.education-card[data-slot='0'] {
		z-index: 3;
		--fan-rot: -9deg;
		--fan-x: calc(-1 * var(--edu-spread));
		--fan-y: -8px;
	}

	.education-card[data-slot='1'] {
		z-index: 2;
		--fan-rot: 1deg;
		--fan-x: 0px;
		--fan-y: -4px;
		--stack-x: var(--edu-stack-x);
		--stack-y: -10px;
	}

	.education-card[data-slot='2'] {
		z-index: 1;
		--fan-rot: 11deg;
		--fan-x: var(--edu-spread);
		--fan-y: -2px;
		--stack-x: calc(var(--edu-stack-x) * 2);
		--stack-y: -18px;
	}

	.edu-back {
		display: flex;
		flex-direction: column;
		gap: var(--back-gap, 1.8cqw);
		flex: 1 1 auto;
		min-height: 0;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.edu-photo-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--back-gap-sm, 1.13cqw);
		flex: 0 0 30%;
		min-height: 0;
	}

	.edu-shot {
		margin: 0;
		min-width: 0;
		min-height: 0;
		overflow: hidden;
		border-radius: 4px;
		background: rgba(140, 180, 220, 0.12);
	}

	.edu-shot img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.education-card.is-stanford .edu-shot:first-child img {
		object-position: center 40%;
	}

	.education-card.is-stanford .edu-shot:last-child img {
		object-position: center 22%;
	}

	.education-card:not(.is-stanford) .edu-shot:first-child img {
		object-position: center 18%;
	}

	.education-card:not(.is-stanford) .edu-shot:last-child img {
		object-position: center 55%;
	}

	.edu-copy {
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
	}

	.edu-section-heading-row {
		display: flex;
		align-items: baseline;
		justify-content: flex-start;
		flex-wrap: wrap;
		gap: 0.35em 0.7em;
		margin: 0 0 var(--back-gap-xs, 0.45cqw);
	}

	.edu-section-heading-row + .edu-section-body + .edu-section-heading-row,
	.edu-section-body + .edu-section-heading-row {
		margin-top: var(--back-gap, 1.8cqw);
	}

	.edu-section-heading {
		display: inline;
		margin: 0;
		color: #000;
		font-size: var(--back-fs-md, 2.7cqw);
		font-weight: 700;
		line-height: 1.25;
	}

	.edu-section-body {
		box-sizing: border-box;
		margin: 0;
	}

	.edu-section-item,
	.edu-activities {
		display: block;
		margin: 0 0 var(--back-gap-xs, 0.45cqw);
		color: #000;
		font-size: var(--back-fs, 2.45cqw);
		line-height: 1.4;
		overflow-wrap: break-word;
	}

	.edu-activities {
		margin-top: var(--back-gap-xs, 0.45cqw);
	}

	.edu-section-link {
		display: inline;
		margin: 0;
		color: #000;
		font-size: var(--back-fs-sm, 2.2cqw);
		font-weight: 700;
		line-height: 1.25;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.edu-section-link:hover {
		text-decoration-thickness: 2px;
	}

	/* Mobile: always splayed, shifted up and right. */
	@media (max-width: 900px) {
		.education-carousel {
			--edu-t: 1;
			top: 0;
			left: 8%;
		}
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
