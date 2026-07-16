<script lang="ts">
	import Polaroid from '$lib/interests/Polaroid.svelte';
	import { interests } from '$lib/interests/interests';

	export let kicker: string | undefined = undefined;
	export let title: string;
	export let body: string;
	export let sourceCodeHref: string;

	const layoutClass: Record<string, string> = {
		ski: 'interest-ski',
		chess: 'interest-chess',
		padi: 'interest-padi',
		tt: 'interest-tt',
		billiards: 'interest-billiards'
	};

	$: featured = interests.filter((item) => item.layout);
	$: overflow = interests.filter((item) => !item.layout);
</script>

<div class="interests-copy">
	{#if kicker}
		<p class="kicker">{kicker}</p>
	{/if}
	<h1 class="title">{title}</h1>
	<p class="body">{body}</p>
</div>

<div class="interests-content" aria-label="Interests">
	{#each featured as item (item.caption)}
		<div class="{layoutClass[item.layout ?? '']} interest-float" aria-label={item.caption}>
			<Polaroid
				src={item.src ?? null}
				alt={item.alt ?? item.caption}
				backImages={item.backImages ?? []}
				backMessage={item.backMessage ?? null}
				revealRootMargin={item.revealRootMargin ?? '0px -35% 0px -35%'}
				revealThreshold={item.revealThreshold ?? 0.01}
				caption={item.caption}
				subtitle={item.subtitle ?? null}
			/>
		</div>
	{/each}

	{#if overflow.length > 0}
		<div class="interests-grid" aria-label="Interests grid">
			{#each overflow as item (item.caption)}
				<Polaroid src={item.src ?? null} caption={item.caption} subtitle={item.subtitle ?? null} />
			{/each}
		</div>
	{/if}
</div>

<div class="repo-note">
	<span>Like my website? The code can be found </span>
	<a class="repo-note__link" href={sourceCodeHref} target="_blank" rel="noreferrer">here</a>
	<span>.</span>
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

	.interests-copy {
		position: absolute;
		top: clamp(110px, 14vh, 170px);
		right: 0;
		z-index: 3;
		max-width: min(980px, 100%);
		padding-right: 20px;
		text-align: right;
	}

	.interests-content {
		position: absolute;
		inset: 0;
		z-index: 1;
		--float-card-w: 260px;
	}

	.interest-ski {
		position: absolute;
		top: 5%;
		right: 80%;
		width: var(--float-card-w);
		transform: rotate(-3deg);
		transform-origin: top left;
		z-index: 2;
	}

	.interest-chess {
		position: absolute;
		top: 7%;
		right: 50%;
		width: var(--float-card-w);
		transform: rotate(2deg);
		transform-origin: top center;
		z-index: 2;
	}

	.interest-padi {
		position: absolute;
		top: 35%;
		right: 5%;
		width: var(--float-card-w);
		transform: rotate(5deg);
		transform-origin: top right;
		z-index: 2;
	}

	.interest-tt {
		position: absolute;
		top: 38%;
		right: 65%;
		width: var(--float-card-w);
		transform: rotate(1deg);
		transform-origin: bottom left;
		z-index: 2;
	}

	.interest-billiards {
		position: absolute;
		top: 33%;
		right: 35%;
		width: var(--float-card-w);
		transform: rotate(0deg);
		transform-origin: bottom left;
		z-index: 2;
	}

	.interests-grid {
		margin-top: 18px;
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: clamp(12px, 2vw, 18px);
		align-items: stretch;
	}

	.repo-note {
		position: absolute;
		right: 5px;
		bottom: 5px;
		z-index: 20;
		font-size: 12px;
		line-height: 1.25;
		text-align: right;
		white-space: nowrap;
		color: rgba(11, 18, 32, 0.72);
		pointer-events: auto;
	}

	.repo-note__link {
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 2px;
	}

	.repo-note__link:hover {
		color: rgba(11, 18, 32, 0.9);
	}

	@media (max-width: 1100px) {
		.interests-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}

	/* Match site mobile breakpoint (900px). Portrait phones get the rotate gate;
	   landscape / narrow widths use these styles. */
	@media (max-width: 900px) {
		.repo-note {
			display: none;
		}

		.interests-copy {
			top: 0;
			right: 0;
			left: auto;
			transform: none;
			text-align: right;
			padding-top: 8px;
		}

		.interest-chess {
			right: 65%; /* +15% left */
		}

		.interest-tt {
			top: 28%; /* +10% up */
			right: 95%; /* +30% left */
		}

		.interest-ski {
			right: 125%; /* +45% left */
		}
	}

	@media (max-width: 720px) {
		.interests-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 460px) {
		.interests-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
