<script lang="ts">
	type ExperienceEducationVariant = 'experience' | 'education';

	export let heading: string;
	export let subheading: string;
	export let dates: string;
	export let variant: ExperienceEducationVariant;
	export let items: string[] = [];
</script>

<div class="experience-header">
	<div class="experience-meta">
		<p class="experience-company">{heading}</p>
		<p class="experience-sub">{subheading}</p>
	</div>
	<p class="experience-dates">{dates}</p>
</div>

{#if variant === 'experience'}
	<ul class="experience-highlights">
		{#each items as item}
			<li>{item}</li>
		{/each}
	</ul>
{:else}
	<div class="education-details">
		{#each items as item}
			<p>{item}</p>
		{/each}
	</div>
{/if}

<style>
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
</style>

