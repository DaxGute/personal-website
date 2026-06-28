<script lang="ts">
	import CardShell from '$lib/CardShell.svelte';
	import type { ProjectLink } from '$lib/projects/projects';

	type CardVariant = 'experience' | 'education' | 'award' | 'project';

	function themeForVariant(variant: CardVariant): 'periwinkle' | 'blue' | 'teal' | 'aquamarine' {
		if (variant === 'experience') return 'periwinkle';
		if (variant === 'education') return 'blue';
		if (variant === 'award') return 'teal';
		return 'aquamarine';
	}

	export let heading: string;
	export let subheading: string;
	export let dates: string | null = null;
	export let variant: CardVariant;
	export let items: string[] = [];
	export let logoSrc: string | null = null;
	export let logoAlt: string | null = null;
	export let body: string | null = null;
	export let tech: string[] = [];
	export let links: ProjectLink[] = [];
	export let expandOnClick = true;

	$: hasSideLogo = (variant === 'experience' || variant === 'project') && !!logoSrc;
	$: primaryLink =
		links.find((l) => {
			const label = (l.label ?? '').trim().toLowerCase();
			return label === 'website' || label === 'app store';
		}) ?? null;
	$: otherLinks = links.filter((l) => l !== primaryLink);
</script>

<CardShell
	theme={themeForVariant(variant)}
	class={variant === 'project' ? 'info-card--project' : ''}
	surfaceClass={hasSideLogo ? 'has-logo' : ''}
	{expandOnClick}
>
	<div slot="front" class="card-row">
		{#if hasSideLogo && logoSrc}
			<div class="card-logo" aria-hidden={logoAlt ? undefined : 'true'}>
				<img src={logoSrc} alt={logoAlt ?? ''} loading="lazy" decoding="async" />
			</div>
		{/if}

		<div class="card-content">
			<div class="card-header experience-header">
				<div class="experience-meta">
					<p class="experience-company">{heading}</p>
					<p
						class="experience-sub"
						class:wrap-sub={variant !== 'experience' && variant !== 'education'}
					>
						{subheading}
					</p>
				</div>
				{#if dates || (variant === 'education' && logoSrc)}
					<div class="experience-side">
						{#if dates}
							<p class="experience-dates">{dates}</p>
						{/if}
						{#if variant === 'education' && logoSrc}
							<div class="education-logo" aria-hidden={logoAlt ? undefined : 'true'}>
								<img src={logoSrc} alt={logoAlt ?? ''} loading="lazy" decoding="async" />
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<div class="card-main">
				<div class="card-main-content">
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
					{:else if variant === 'project'}
						{#if body}
							<p class="project-body">{body}</p>
						{/if}

						{#if primaryLink}
							<p class="project-website">
								<a
									class="project-website-link"
									href={primaryLink.href}
									target="_blank"
									rel="noreferrer"
								>
									{primaryLink.label}.
								</a>
							</p>
						{/if}

						{#if items.length}
							<ul class="experience-highlights" aria-label="Project highlights">
								{#each items as item}
									<li>{item}</li>
								{/each}
							</ul>
						{/if}
					{:else}
						<div class="award-details">
							{#each items as item}
								<p>{item}</p>
							{/each}
						</div>
					{/if}
				</div>

				<p class="card-hover-hint" aria-hidden="true">Click to learn more &gt;</p>
			</div>
		</div>
	</div>

	<div slot="back" class="card-row card-row--back">
		{#if hasSideLogo && logoSrc}
			<div class="card-logo" aria-hidden={logoAlt ? undefined : 'true'}>
				<img src={logoSrc} alt={logoAlt ?? ''} loading="lazy" decoding="async" />
			</div>
		{/if}

		<div class="card-content">
			<div class="card-header experience-header">
				<div class="experience-meta">
					<p class="experience-company">{heading}</p>
					<p
						class="experience-sub"
						class:wrap-sub={variant !== 'experience' && variant !== 'education'}
					>
						{subheading}
					</p>
				</div>
				{#if dates || (variant === 'education' && logoSrc)}
					<div class="experience-side">
						{#if dates}
							<p class="experience-dates">{dates}</p>
						{/if}
						{#if variant === 'education' && logoSrc}
							<div class="education-logo" aria-hidden={logoAlt ? undefined : 'true'}>
								<img src={logoSrc} alt={logoAlt ?? ''} loading="lazy" decoding="async" />
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<div class="card-back-main">
				<p class="card-back-marker">backside</p>
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
				{:else if variant === 'project'}
					{#if body}
						<p class="project-body">{body}</p>
					{/if}

					{#if primaryLink}
						<p class="project-website">
							<a
								class="project-website-link"
								href={primaryLink.href}
								target="_blank"
								rel="noreferrer"
							>
								{primaryLink.label}.
							</a>
						</p>
					{/if}

					{#if items.length}
						<ul class="experience-highlights" aria-label="Project highlights">
							{#each items as item}
								<li>{item}</li>
							{/each}
						</ul>
					{/if}

					{#if tech.length}
						<div class="project-chips" aria-label="Tech stack">
							{#each tech as t}
								<span class="project-chip">{t}</span>
							{/each}
						</div>
					{/if}

					{#if otherLinks.length}
						<div class="project-links" aria-label="Project links">
							{#each otherLinks as link}
								<a class="project-link" href={link.href} target="_blank" rel="noreferrer">
									{link.label}
								</a>
							{/each}
						</div>
					{/if}
				{:else}
					<div class="award-details">
						{#each items as item}
							<p>{item}</p>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</CardShell>

<style>
	:global(.hover-polaroid-scale:hover) .card-content {
		background: transparent;
		box-shadow: none;
	}

	:global(.info-card--project) .card-row {
		height: 100%;
		overflow: hidden;
	}

	:global(.info-card--project) .card-logo {
		align-self: stretch;
		align-items: center;
		justify-content: center;
	}

	:global(.info-card--project) .card-logo img {
		width: 100%;
		height: auto;
		max-height: 100%;
		object-fit: contain;
	}

	:global(.info-card--project) .card-content {
		min-height: 0;
		overflow: hidden;
	}

	:global(.info-card--project) .card-main,
	:global(.info-card--project) .card-back-main {
		min-height: 0;
		overflow: hidden;
	}

	.card-row {
		display: flex;
		align-items: stretch;
		width: 100%;
		height: 100%;
	}

	.card-logo {
		position: relative;
		z-index: 2;
		isolation: isolate;
		flex: 0 0 clamp(64px, 18%, 120px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 12px 10px 12px 12px;
		border-right: 1px solid rgba(160, 190, 230, 0.28);
		background: linear-gradient(180deg, rgba(160, 200, 240, 0.08), rgba(160, 200, 240, 0));
		box-shadow: inset -10px 0 20px rgba(140, 180, 220, 0.06);
	}

	.card-logo img {
		position: relative;
		z-index: 1;
		display: block;
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.card-content {
		flex: 1 1 auto;
		min-width: 0;
		display: flex;
		flex-direction: column;
		padding: 14px 14px;
		border-radius: 3px;
		background: transparent;
		box-shadow: none;
		transition:
			background 0.28s ease,
			box-shadow 0.28s ease;
	}

	.card-main {
		position: relative;
		flex: 1 1 auto;
		min-height: 0;
	}

	.card-back-main {
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
	}

	.card-back-marker {
		margin: 0 0 8px;
		color: rgba(216, 226, 242, 0.72);
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: lowercase;
		text-shadow: 0 1px 2px rgba(11, 18, 32, 0.75);
	}

	.card-main-content {
		transition: opacity 0.28s ease;
	}

	.card-hover-hint {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0;
		padding: 0 12px;
		opacity: 0;
		pointer-events: none;
		color: #e8f2ff;
		font-size: 13px;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-align: center;
		text-shadow:
			0 1px 2px rgba(11, 18, 32, 0.85),
			0 0 12px rgba(170, 210, 255, 0.4);
		transition: opacity 0.28s ease;
	}

	:global(.hover-polaroid-scale:hover) .card-main-content {
		opacity: 0;
	}

	:global(.hover-polaroid-scale:hover) .card-hover-hint {
		opacity: 1;
	}

	:global(.info-card--expanded) .card-hover-hint,
	:global(.info-card--expanded:hover) .card-hover-hint,
	:global(.info-card--animating) .card-hover-hint,
	:global(.info-card--dismissing) .card-hover-hint,
	:global(.info-card--dismissing:hover) .card-hover-hint,
	:global(.info-card--hover-frozen) .card-hover-hint {
		opacity: 0;
	}

	:global(.info-card--expanded) .card-main-content,
	:global(.info-card--expanded:hover) .card-main-content,
	:global(.info-card--animating) .card-main-content,
	:global(.info-card--animating:hover) .card-main-content,
	:global(.info-card--dismissing) .card-main-content,
	:global(.info-card--dismissing:hover) .card-main-content {
		opacity: 1;
	}

	.experience-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 8px;
		flex: 0 0 auto;
	}

	.experience-side {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 8px;
		flex: 0 0 auto;
	}

	.experience-meta {
		display: grid;
		gap: 2px;
		min-width: 0;
	}

	:global(.info-card--blue) .experience-sub {
		overflow: visible;
		text-overflow: unset;
	}

	.experience-dates {
		margin: 0;
		color: #e8f2ff;
		font-size: 13px;
		white-space: nowrap;
		letter-spacing: 0.05em;
		font-variant-numeric: tabular-nums;
		font-weight: 600;
		text-shadow:
			0 1px 2px rgba(11, 18, 32, 0.85),
			0 0 12px rgba(170, 210, 255, 0.4);
	}

	.education-logo {
		position: relative;
		z-index: 2;
		isolation: isolate;
		width: clamp(28px, 3.2vw, 44px);
		height: clamp(28px, 3.2vw, 44px);
		display: grid;
		place-items: center;
		padding: 2px;
		border-radius: 4px;
		background: rgba(140, 180, 220, 0.1);
		border: 1px solid rgba(176, 196, 228, 0.45);
		box-shadow:
			inset 0 0 12px rgba(140, 180, 220, 0.12),
			0 0 14px rgba(140, 180, 220, 0.18);
	}

	.education-logo img {
		position: relative;
		z-index: 1;
		display: block;
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	@media (max-width: 520px) {
		.experience-header {
			flex-direction: column;
			gap: 6px;
			align-items: flex-start;
		}

		.experience-side {
			align-items: flex-start;
			gap: 6px;
		}
	}

	@media (max-width: 520px) {
		.card-logo {
			flex-basis: clamp(56px, 22%, 88px);
			padding: 10px 8px 10px 10px;
		}

		.card-content {
			padding: 12px 12px;
		}
	}

	.experience-highlights {
		margin: 0;
		padding-left: 0;
		color: rgba(216, 226, 242, 0.94);
		font-size: 12px;
		line-height: 1.4;
		list-style: none;
		text-shadow: 0 1px 2px rgba(11, 18, 32, 0.75);
	}

	.experience-highlights li {
		margin: 0;
	}

	.education-details {
		display: grid;
		gap: 6px;
		color: rgba(216, 226, 242, 0.94);
		line-height: 1.6;
		overflow-wrap: anywhere;
		text-shadow: 0 1px 2px rgba(11, 18, 32, 0.75);
	}

	.education-details p {
		margin: 0;
	}

	.award-details {
		display: grid;
		gap: 6px;
		color: rgba(216, 226, 242, 0.94);
		line-height: 1.55;
		text-shadow: 0 1px 2px rgba(11, 18, 32, 0.75);
	}

	.award-details p {
		margin: 0;
	}

	.project-body {
		margin: 0 0 8px;
		color: rgba(216, 226, 242, 0.94);
		font-size: 12px;
		line-height: 1.55;
		text-shadow: 0 1px 2px rgba(11, 18, 32, 0.75);
	}

	.project-website {
		margin: 0 0 8px;
		color: rgba(216, 226, 242, 0.94);
		font-size: 12px;
		line-height: 1.55;
		text-shadow: 0 1px 2px rgba(11, 18, 32, 0.75);
	}

	.project-website-link {
		color: #e8f2ff;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.project-website-link:hover {
		text-decoration-thickness: 2px;
	}

	.project-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin: 0 0 8px;
	}

	.project-chip {
		display: inline-flex;
		align-items: center;
		height: 24px;
		padding: 0 9px;
		border-radius: 999px;
		border: 1px solid rgba(176, 196, 228, 0.45);
		background: rgba(140, 180, 220, 0.12);
		color: rgba(228, 236, 248, 0.96);
		font-size: 11px;
		font-weight: 650;
		text-shadow: 0 1px 2px rgba(11, 18, 32, 0.75);
	}

	.project-links {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.project-link {
		display: inline-flex;
		align-items: center;
		height: 26px;
		padding: 0 9px;
		border-radius: 6px;
		border: 1px solid rgba(176, 196, 228, 0.45);
		background: rgba(140, 180, 220, 0.1);
		text-decoration: none;
		font-size: 11px;
		font-weight: 700;
		color: #e8f2ff;
		text-shadow: 0 1px 2px rgba(11, 18, 32, 0.75);
		transition:
			transform 140ms ease,
			background 140ms ease,
			border-color 140ms ease;
	}

	.project-link:hover {
		transform: translateY(-1px);
		background: rgba(140, 180, 220, 0.18);
		border-color: rgba(200, 220, 255, 0.62);
	}

	.project-link:focus-visible {
		outline: 2px solid rgba(200, 220, 255, 0.55);
		outline-offset: 2px;
	}

	:global(.info-card--green) .card-logo,
	:global(.info-card--teal) .card-logo,
	:global(.info-card--aquamarine) .card-logo,
	:global(.info-card--blue) .card-logo,
	:global(.info-card--periwinkle) .card-logo {
		border-right-color: rgba(var(--tone-border), 0.24);
		background: var(--tone-inset);
		box-shadow: inset -10px 0 20px rgba(var(--tone-border), 0.06);
	}

	:global(.info-card--green) .experience-dates,
	:global(.info-card--teal) .experience-dates,
	:global(.info-card--aquamarine) .experience-dates,
	:global(.info-card--blue) .experience-dates,
	:global(.info-card--periwinkle) .experience-dates {
		color: var(--tone-accent);
		text-shadow:
			0 1px 0 rgba(255, 255, 255, 0.75),
			0 0 10px rgba(var(--tone-glow-2), 0.2);
	}

	:global(.info-card--green) .education-logo,
	:global(.info-card--teal) .education-logo,
	:global(.info-card--aquamarine) .education-logo,
	:global(.info-card--blue) .education-logo,
	:global(.info-card--periwinkle) .education-logo {
		background: rgba(255, 255, 255, 0.22);
		border-color: rgba(var(--tone-border), 0.35);
		box-shadow:
			inset 0 0 12px rgba(255, 255, 255, 0.12),
			0 0 14px rgba(var(--tone-shadow), 0.1);
	}

	:global(.info-card--green) .card-back-marker,
	:global(.info-card--teal) .card-back-marker,
	:global(.info-card--aquamarine) .card-back-marker,
	:global(.info-card--blue) .card-back-marker,
	:global(.info-card--periwinkle) .card-back-marker {
		color: rgba(var(--tone-sub), 0.72);
		text-shadow: 0 1px 0 rgba(255, 255, 255, 0.7);
	}

	:global(.info-card--green) .experience-highlights,
	:global(.info-card--teal) .experience-highlights,
	:global(.info-card--aquamarine) .experience-highlights,
	:global(.info-card--blue) .experience-highlights,
	:global(.info-card--periwinkle) .experience-highlights,
	:global(.info-card--green) .education-details,
	:global(.info-card--teal) .education-details,
	:global(.info-card--aquamarine) .education-details,
	:global(.info-card--blue) .education-details,
	:global(.info-card--periwinkle) .education-details,
	:global(.info-card--green) .award-details,
	:global(.info-card--teal) .award-details,
	:global(.info-card--aquamarine) .award-details,
	:global(.info-card--blue) .award-details,
	:global(.info-card--periwinkle) .award-details,
	:global(.info-card--green) .project-body,
	:global(.info-card--teal) .project-body,
	:global(.info-card--aquamarine) .project-body,
	:global(.info-card--blue) .project-body,
	:global(.info-card--periwinkle) .project-body,
	:global(.info-card--green) .project-website,
	:global(.info-card--teal) .project-website,
	:global(.info-card--aquamarine) .project-website,
	:global(.info-card--blue) .project-website,
	:global(.info-card--periwinkle) .project-website {
		color: rgba(var(--tone-sub), 0.92);
		text-shadow: 0 1px 0 rgba(255, 255, 255, 0.7);
	}

	:global(.info-card--green) .project-website-link,
	:global(.info-card--teal) .project-website-link,
	:global(.info-card--aquamarine) .project-website-link,
	:global(.info-card--blue) .project-website-link,
	:global(.info-card--periwinkle) .project-website-link {
		color: var(--tone-accent);
	}

	:global(.info-card--green) .project-chip,
	:global(.info-card--teal) .project-chip,
	:global(.info-card--aquamarine) .project-chip,
	:global(.info-card--blue) .project-chip,
	:global(.info-card--periwinkle) .project-chip {
		border-color: rgba(var(--tone-border), 0.38);
		background: rgba(255, 255, 255, 0.22);
		color: rgba(var(--tone-sub), 0.96);
		text-shadow: 0 1px 0 rgba(255, 255, 255, 0.7);
	}

	:global(.info-card--green) .project-link,
	:global(.info-card--teal) .project-link,
	:global(.info-card--aquamarine) .project-link,
	:global(.info-card--blue) .project-link,
	:global(.info-card--periwinkle) .project-link {
		border-color: rgba(var(--tone-border), 0.38);
		background: rgba(255, 255, 255, 0.18);
		color: var(--tone-accent);
		text-shadow: 0 1px 0 rgba(255, 255, 255, 0.7);
	}

	:global(.info-card--green) .project-link:hover,
	:global(.info-card--teal) .project-link:hover,
	:global(.info-card--aquamarine) .project-link:hover,
	:global(.info-card--blue) .project-link:hover,
	:global(.info-card--periwinkle) .project-link:hover {
		background: rgba(255, 255, 255, 0.32);
		border-color: rgba(var(--tone-border-hover), 0.55);
	}

	:global(.info-card--green) .project-link:focus-visible,
	:global(.info-card--teal) .project-link:focus-visible,
	:global(.info-card--aquamarine) .project-link:focus-visible,
	:global(.info-card--blue) .project-link:focus-visible,
	:global(.info-card--periwinkle) .project-link:focus-visible {
		outline-color: rgba(var(--tone-border-hover), 0.55);
	}

	:global(.info-card--green) .card-hover-hint,
	:global(.info-card--teal) .card-hover-hint,
	:global(.info-card--aquamarine) .card-hover-hint,
	:global(.info-card--blue) .card-hover-hint,
	:global(.info-card--periwinkle) .card-hover-hint {
		color: var(--tone-accent);
		text-shadow:
			0 1px 0 rgba(255, 255, 255, 0.75),
			0 0 10px rgba(var(--tone-glow-2), 0.2);
	}

	@media (prefers-reduced-motion: reduce) {
		.card-main-content,
		.card-hover-hint {
			transition: none;
		}
	}
</style>
