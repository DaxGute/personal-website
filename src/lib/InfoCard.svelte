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
	export let subheading = '';
	export let location: string | null = null;
	export let dates: string | null = null;
	export let variant: CardVariant;
	export let items: string[] = [];
	export let backItems: string[] = [];
	export let logoSrc: string | null = null;
	export let logoAlt: string | null = null;
	export let backImageSrc: string | null = null;
	export let backImageAlt: string | null = null;
	export let backImageHref: string | null = null;
	export let backLinkLabel: string | null = null;
	export let body: string | null = null;
	export let tech: string[] = [];
	export let links: ProjectLink[] = [];
	export let expandOnClick = true;
	/** When true, render the `frontBody` slot instead of default front-main content. */
	export let customFrontBody = false;
	/** When true, render the `backBody` slot instead of default back-main content. */
	export let customBackBody = false;

	$: hasSideLogo = (variant === 'experience' || variant === 'project') && !!logoSrc;
	$: sidePhotoOnBack = variant === 'experience' && !!backImageSrc;
	$: hasHeaderLogo = (variant === 'education' || variant === 'award') && !!logoSrc;
	$: showHeaderSide = (dates && variant !== 'award') || hasHeaderLogo;
	$: primaryLink =
		links.find((l) => {
			const label = (l.label ?? '').trim().toLowerCase();
			return label === 'website' || label === 'app store';
		}) ?? null;
	$: otherLinks = links.filter((l) => l !== primaryLink);
</script>

<CardShell
	theme={themeForVariant(variant)}
	class={variant === 'project'
		? 'info-card--project'
		: variant === 'experience'
			? 'info-card--experience'
			: variant === 'award'
				? 'info-card--award'
				: ''}
	surfaceClass={hasSideLogo ? 'has-logo' : ''}
	{expandOnClick}
>
	<div slot="front" class="card-row" class:card-row--edu-bg={variant === 'education' && !!logoSrc}>
		{#if variant === 'education' && logoSrc}
			<div class="education-bg-logo" aria-hidden="true">
				<img src={logoSrc} alt="" loading="lazy" decoding="async" />
			</div>
		{/if}

		{#if hasSideLogo && logoSrc}
			<div class="card-logo" aria-hidden={logoAlt ? undefined : 'true'}>
				<img src={logoSrc} alt={logoAlt ?? ''} loading="lazy" decoding="async" />
			</div>
		{/if}

		<div class="card-content">
			<div class="card-header experience-header" class:experience-header--award={variant === 'award'}>
				<div class="experience-meta">
					<p class="experience-company">{heading}</p>
					{#if variant !== 'award'}
						<p
							class="experience-sub"
							class:wrap-sub={variant !== 'experience' && variant !== 'education'}
						>
							{subheading}{#if location}<span class="experience-location"> · {location}</span>{/if}
						</p>
					{:else if dates}
						<div class="award-date-slot">
							<p class="experience-dates award-dates">{dates}</p>
							<p class="award-hover-hint" aria-hidden="true">Click to learn more &gt;</p>
						</div>
					{/if}
				</div>
				{#if showHeaderSide}
					<div class="experience-side">
						{#if dates && variant !== 'award'}
							<p class="experience-dates">{dates}</p>
						{/if}
						{#if hasHeaderLogo && logoSrc && variant !== 'education'}
							<div class="education-logo" aria-hidden={logoAlt ? undefined : 'true'}>
								<img src={logoSrc} alt={logoAlt ?? ''} loading="lazy" decoding="async" />
							</div>
						{/if}
					</div>
				{/if}
			</div>

			{#if variant !== 'award'}
				<div class="card-main">
					<div class="card-main-content" class:card-main-content--custom={customFrontBody}>
						{#if customFrontBody}
							<slot name="frontBody" />
						{:else if variant === 'experience'}
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
						{/if}
					</div>

					<p class="card-hover-hint" aria-hidden="true">Click to learn more &gt;</p>
				</div>
			{/if}
		</div>
	</div>

	<div slot="back" class="card-row card-row--back">
		{#if hasSideLogo && (sidePhotoOnBack ? backImageSrc : logoSrc)}
			<div
				class="card-logo"
				class:card-logo--back-photo={sidePhotoOnBack}
				aria-hidden={sidePhotoOnBack
					? backImageAlt
						? undefined
						: 'true'
					: logoAlt
						? undefined
						: 'true'}
			>
				<img
					src={sidePhotoOnBack ? backImageSrc : logoSrc}
					alt={sidePhotoOnBack ? (backImageAlt ?? '') : (logoAlt ?? '')}
					loading="lazy"
					decoding="async"
				/>
			</div>
		{/if}

		<div class="card-content">
			<div class="card-header experience-header" class:experience-header--award={variant === 'award'}>
				<div class="experience-meta">
					<p class="experience-company">{heading}</p>
					{#if variant !== 'award'}
						<p
							class="experience-sub"
							class:wrap-sub={variant !== 'experience' && variant !== 'education'}
						>
							{subheading}{#if location}<span class="experience-location"> · {location}</span>{/if}
						</p>
					{:else if dates}
						<p class="experience-dates award-dates">{dates}</p>
					{/if}
				</div>
				{#if showHeaderSide}
					<div class="experience-side">
						{#if dates && variant !== 'award'}
							<p class="experience-dates">{dates}</p>
						{/if}
						{#if hasHeaderLogo && logoSrc}
							<div class="education-logo" aria-hidden={logoAlt ? undefined : 'true'}>
								<img src={logoSrc} alt={logoAlt ?? ''} loading="lazy" decoding="async" />
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<div
				class="card-back-main"
				class:card-back-main--with-image={(!sidePhotoOnBack && !!backImageSrc) || !!backImageHref}
				class:card-back-main--with-copy={backItems.length > 0 || (variant === 'award' && items.length > 0)}
				class:card-back-main--custom={customBackBody}
			>
				{#if customBackBody}
					<slot name="backBody" />
				{:else}
					{#if backImageSrc && backItems.length === 0 && !sidePhotoOnBack}
						<div class="card-back-image">
							{#if backImageHref}
								<a
									class="card-back-image-link"
									href={backImageHref}
									target="_blank"
									rel="noreferrer"
									aria-label={backImageAlt ?? 'Open related page'}
								>
									<img
										src={backImageSrc}
										alt={backImageAlt ?? ''}
										loading="lazy"
										decoding="async"
									/>
								</a>
							{:else}
								<img
									src={backImageSrc}
									alt={backImageAlt ?? ''}
									loading="lazy"
									decoding="async"
								/>
							{/if}
						</div>
					{:else if backImageHref && backItems.length === 0}
						<div class="card-back-image">
							<a
								class="card-back-link-box"
								href={backImageHref}
								target="_blank"
								rel="noreferrer"
							>
								<span class="card-back-link-label">
									{backLinkLabel ?? backImageAlt ?? 'View more'}
								</span>
								<svg
									class="card-back-link-icon"
									viewBox="0 0 24 24"
									aria-hidden="true"
									focusable="false"
								>
									<path
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M14 4h6v6M10 14L20 4M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"
									/>
								</svg>
							</a>
						</div>
					{:else if backItems.length === 0 && !sidePhotoOnBack && !(variant === 'award' && items.length > 0)}
						<p class="card-back-marker">backside</p>
					{/if}
					{#if variant === 'experience'}
						{#if backItems.length}
							<ul class="experience-highlights experience-highlights--back">
								{#each backItems as item}
									<li>{item}</li>
								{/each}
							</ul>
						{:else if !backImageSrc && !backImageHref}
							<ul class="experience-highlights">
								{#each items as item}
									<li>{item}</li>
								{/each}
							</ul>
						{/if}
					{:else if variant === 'education' && !backImageSrc}
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
				{/if}
			</div>
		</div>
	</div>
</CardShell>

<style>
	:global(.hover-polaroid-scale:hover:not(.info-card--modal):not(.info-card--animating):not(.info-card--dismissing))
		.card-content {
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

	:global(.info-card--experience) .card-row {
		height: 100%;
		overflow: hidden;
	}

	:global(.info-card--experience) .card-logo {
		align-self: stretch;
		flex: 0 0 var(--exp-card-h, clamp(117px, 13vh, 156px));
		width: var(--exp-card-h, clamp(117px, 13vh, 156px));
		height: var(--exp-card-h, clamp(117px, 13vh, 156px));
		padding: 0;
		overflow: hidden;
	}

	:global(.info-card--experience) .card-logo img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
	}

	:global(.info-card--experience) .card-logo--back-photo {
		align-self: stretch;
		flex: 0 0 calc(var(--exp-card-h, clamp(117px, 13vh, 156px)) * 2);
		width: calc(var(--exp-card-h, clamp(117px, 13vh, 156px)) * 2);
		height: 100%;
	}

	:global(.info-card--experience) .card-logo--back-photo img {
		object-fit: cover;
		object-position: center;
	}

	:global(.info-card--experience) .card-content {
		min-height: 0;
		overflow: hidden;
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

	.card-row--edu-bg {
		isolation: isolate;
	}

	.education-bg-logo {
		position: absolute;
		inset: 0;
		z-index: 0;
		display: grid;
		place-items: center;
		pointer-events: none;
		overflow: hidden;
	}

	.education-bg-logo img {
		display: block;
		width: min(78%, 260px);
		height: min(78%, 260px);
		object-fit: contain;
		opacity: 0.22;
		filter: saturate(0.85) contrast(1.05);
	}

	.card-row--edu-bg > .card-logo,
	.card-row--edu-bg > .card-content {
		position: relative;
		z-index: 1;
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

	.card-main-content--custom {
		display: flex;
		flex-direction: column;
		min-height: 0;
		height: 100%;
		overflow: hidden;
	}

	.card-back-main {
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
	}

	.card-back-main--with-image {
		display: flex;
		flex-direction: column;
		justify-content: center;
		overflow: hidden;
	}

	.card-back-main--custom {
		display: flex;
		flex-direction: column;
		overflow: visible;
	}

	.card-back-image {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		width: 100%;
		min-height: 0;
		flex: 1 1 auto;
	}

	.card-back-image img {
		display: block;
		max-width: 100%;
		max-height: 100%;
		width: auto;
		height: auto;
		object-fit: contain;
		object-position: right center;
		border-radius: 2px;
		margin-left: auto;
	}

	.card-back-image-link {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		max-width: 100%;
		max-height: 100%;
		min-height: 0;
		margin-left: auto;
		overflow: hidden;
		border-radius: 2px;
		text-decoration: none;
		transition:
			transform 140ms ease,
			opacity 140ms ease;
	}

	.card-back-image-link img {
		margin-left: 0;
	}

	.card-back-image-link:hover {
		transform: translateY(-1px);
		opacity: 0.96;
	}

	.card-back-image-link:focus-visible {
		outline: 2px solid rgba(200, 220, 255, 0.55);
		outline-offset: 2px;
	}

	/* Landscape box matching BAI / Youth Commission photo proportions (~4:3). */
	.card-back-link-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		height: 100%;
		width: auto;
		max-width: 100%;
		aspect-ratio: 4 / 3;
		margin-left: auto;
		padding: 16px;
		border-radius: 2px;
		border: 1px solid rgba(150, 160, 175, 0.35);
		background: rgba(150, 158, 170, 0.28);
		color: rgba(40, 46, 58, 0.88);
		font-size: 13px;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-align: center;
		text-decoration: none;
		text-shadow: 0 1px 0 rgba(255, 255, 255, 0.45);
		box-sizing: border-box;
		transition:
			background 140ms ease,
			border-color 140ms ease;
	}

	.card-back-link-label {
		display: block;
	}

	.card-back-link-icon {
		width: 22px;
		height: 22px;
		flex: 0 0 auto;
		opacity: 0.78;
	}

	.card-back-link-box:hover {
		background: rgba(150, 158, 170, 0.4);
		border-color: rgba(120, 130, 145, 0.5);
	}

	.card-back-link-box:hover .card-back-link-icon {
		opacity: 1;
	}

	.card-back-link-box:focus-visible {
		outline: 2px solid rgba(120, 130, 145, 0.55);
		outline-offset: 2px;
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

	:global(.hover-polaroid-scale:hover:not(.info-card--modal):not(.info-card--animating):not(.info-card--dismissing))
		.card-main-content {
		opacity: 0;
	}

	:global(.hover-polaroid-scale:hover:not(.info-card--modal):not(.info-card--animating):not(.info-card--dismissing))
		.card-hover-hint {
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

	:global(.info-card.info-card--blue) .experience-sub {
		overflow: visible;
		text-overflow: unset;
		color: var(--tone-accent);
		font-weight: 600;
		letter-spacing: 0.05em;
		text-shadow:
			0 1px 0 rgba(255, 255, 255, 0.75),
			0 0 10px rgba(var(--tone-glow-2), 0.2);
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

	:global(.info-card.info-card--experience) .experience-sub,
	:global(.info-card.info-card--experience) .experience-location {
		color: #e8f2ff;
		font-weight: 600;
		white-space: nowrap;
		overflow: visible;
		text-overflow: unset;
		text-shadow:
			0 1px 2px rgba(11, 18, 32, 0.85),
			0 0 12px rgba(170, 210, 255, 0.4);
	}

	:global(.info-card.info-card--experience) .experience-header {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		grid-template-rows: auto auto;
		align-items: start;
		column-gap: 12px;
		row-gap: 2px;
		overflow: visible;
	}

	:global(.info-card.info-card--experience) .experience-meta {
		display: contents;
	}

	:global(.info-card.info-card--experience) .experience-company {
		grid-column: 1;
		grid-row: 1;
		min-width: 0;
	}

	:global(.info-card.info-card--experience) .experience-sub {
		grid-column: 1 / -1;
		grid-row: 2;
	}

	:global(.info-card.info-card--experience) .experience-side {
		grid-column: 2;
		grid-row: 1;
	}

	:global(.info-card.info-card--award) .experience-header {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		grid-template-rows: auto auto;
		align-items: start;
		column-gap: 12px;
		row-gap: 2px;
		overflow: visible;
	}

	:global(.info-card.info-card--award) .experience-meta {
		display: contents;
	}

	:global(.info-card.info-card--award) .experience-company {
		grid-column: 1;
		grid-row: 1;
		min-width: 0;
	}

	:global(.info-card.info-card--award) .award-date-slot,
	:global(.info-card.info-card--award) .experience-meta > .award-dates {
		grid-column: 1;
		grid-row: 2;
		min-width: 0;
	}

	:global(.info-card.info-card--award) .award-date-slot {
		position: relative;
		min-height: 1.2em;
	}

	:global(.info-card.info-card--award) .award-dates {
		transition: opacity 0.28s ease;
	}

	.award-hover-hint {
		position: absolute;
		top: 0;
		left: 0;
		margin: 0;
		opacity: 0;
		color: #e8f2ff;
		font-size: 13px;
		font-weight: 700;
		letter-spacing: 0.04em;
		white-space: nowrap;
		text-shadow:
			0 1px 2px rgba(11, 18, 32, 0.85),
			0 0 12px rgba(170, 210, 255, 0.4);
		transition: opacity 0.28s ease;
		pointer-events: none;
	}

	:global(.hover-polaroid-scale.info-card--award:hover:not(.info-card--modal):not(.info-card--animating):not(.info-card--dismissing))
		.award-date-slot
		.award-dates {
		opacity: 0;
	}

	:global(.hover-polaroid-scale.info-card--award:hover:not(.info-card--modal):not(.info-card--animating):not(.info-card--dismissing))
		.award-date-slot
		.award-hover-hint {
		opacity: 1;
	}

	:global(.info-card.info-card--award) .experience-side {
		grid-column: 2;
		grid-row: 1 / span 2;
		align-self: center;
	}

	:global(.info-card.info-card--award) .education-logo {
		width: clamp(34px, 3.8vw, 50px);
		height: clamp(34px, 3.8vw, 50px);
	}

	.award-dates {
		white-space: nowrap;
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
	:global(.info-card--periwinkle) .experience-dates,
	:global(.info-card--green) .experience-location,
	:global(.info-card--teal) .experience-location,
	:global(.info-card--aquamarine) .experience-location,
	:global(.info-card--blue) .experience-location,
	:global(.info-card--periwinkle) .experience-location,
	:global(.info-card.info-card--periwinkle.info-card--experience) .experience-sub {
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
