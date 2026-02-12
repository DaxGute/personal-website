<script lang="ts">
	type CardVariant = 'experience' | 'education' | 'award';

	export let heading: string;
	export let subheading: string;
	export let dates: string | null = null;
	export let variant: CardVariant;
	export let items: string[] = [];
</script>

<div class="info-card" data-variant={variant}>
	<div class="experience-header">
		<div class="experience-meta">
			<p class="experience-company">{heading}</p>
			<p class="experience-sub" class:wrap-sub={variant === 'award'}>{subheading}</p>
		</div>
		{#if dates}
			<p class="experience-dates">{dates}</p>
		{/if}
	</div>

	{#if variant === 'experience'}
		<ul class="experience-highlights">
			{#each items as item}
				<li>{item}</li>
			{/each}
		</ul>
	{:else if variant === 'education'}
		<div class="education-details">
			{#each items as item}
				<p>{item}</p>
			{/each}
		</div>
	{:else}
		<div class="award-details">
			{#each items as item}
				<p>{item}</p>
			{/each}
		</div>
	{/if}
</div>

<style>
	/* Glass surface (apply to every InfoCard) */
	.info-card {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		border-radius: 16px;
		border: 1px solid rgba(11, 18, 32, 0.18);
		background:
			linear-gradient(135deg, rgba(124, 58, 237, 0.14), rgba(34, 211, 238, 0.1)),
			/* keep enough transparency so the backdrop blur is actually visible */
			rgba(255, 255, 255, 0.36);
		backdrop-filter: blur(calc(var(--glass-blur) + 8px)) saturate(1.45);
		-webkit-backdrop-filter: blur(calc(var(--glass-blur) + 8px)) saturate(1.45);
		backface-visibility: hidden;
		box-shadow: 0 22px 70px rgba(11, 18, 32, 0.16);
		padding: 14px 14px;
		transition:
			transform 160ms ease,
			box-shadow 160ms ease,
			border-color 160ms ease,
			background 160ms ease;
	}

	@media (hover: hover) and (pointer: fine) {
		.info-card:hover {
			transform: translateY(-6px) scale(1.02);
			border-color: rgba(11, 18, 32, 0.22);
			background:
				linear-gradient(135deg, rgba(124, 58, 237, 0.18), rgba(34, 211, 238, 0.14)),
				rgba(255, 255, 255, 0.46);
			box-shadow: 0 28px 84px rgba(11, 18, 32, 0.18);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.info-card {
			transition: none;
		}
		@media (hover: hover) and (pointer: fine) {
			.info-card:hover {
				transform: none;
			}
		}
	}

	.experience-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 8px;
	}

	.experience-meta {
		display: grid;
		gap: 2px;
		min-width: 0;
	}

	.experience-company {
		margin: 0;
		font-weight: 700;
	}

	.experience-sub {
		margin: 0;
		color: var(--muted);
		font-size: 13px;
		line-height: 1.2;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.experience-sub.wrap-sub {
		white-space: normal;
		overflow: visible;
		text-overflow: unset;
	}

	.experience-dates {
		margin: 0;
		color: var(--muted);
		font-size: 13px;
		white-space: nowrap;
	}

	@media (max-width: 520px) {
		.experience-header {
			flex-direction: column;
			gap: 6px;
			align-items: flex-start;
		}
	}

	.experience-highlights {
		margin: 0;
		padding-left: 0;
		color: var(--muted);
		font-size: 12px;
		line-height: 1.35;
		list-style: none;
	}

	.experience-highlights li {
		margin: 0;
	}

	.education-details {
		display: grid;
		gap: 6px;
		color: var(--muted);
		line-height: 1.6;
	}

	.education-details p {
		margin: 0;
	}

	.award-details {
		display: grid;
		gap: 6px;
		color: var(--muted);
		line-height: 1.55;
	}

	.award-details p {
		margin: 0;
	}
</style>

