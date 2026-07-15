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
	export let backParagraphs: { heading: string; body: string }[] = [];
	export let skills: string[] = [];
	export let logoSrc: string | null = null;
	export let logoAlt: string | null = null;
	export let backImageSrc: string | null = null;
	export let backImageAlt: string | null = null;
	export let backImageHref: string | null = null;
	export let backLinkLabel: string | null = null;
	export let backImageGrayscale = false;
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
	$: sidePhotoLinkOverlay = sidePhotoOnBack && !!backImageHref;
	$: hasHeaderLogo = (variant === 'education' || variant === 'award') && !!logoSrc;
	$: showHeaderSide = (dates && variant !== 'award') || hasHeaderLogo;
	$: primaryLink =
		links.find((l) => {
			const label = (l.label ?? '').trim().toLowerCase();
			return label === 'website' || label === 'app store';
		}) ?? null;
	$: otherLinks = links.filter((l) => l !== primaryLink);
	$: showBackHeaderSide = showHeaderSide || (variant === 'project' && !!primaryLink);
</script>

<CardShell
	theme={themeForVariant(variant)}
	class={variant === 'project'
		? 'info-card--project'
		: variant === 'experience'
			? 'info-card--experience'
			: variant === 'award'
				? 'info-card--award'
				: variant === 'education'
					? 'info-card--education'
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
		{#if hasSideLogo && variant !== 'project' && (sidePhotoOnBack ? backImageSrc : logoSrc)}
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
					class:card-back-photo--bw={sidePhotoOnBack && backImageGrayscale}
					src={sidePhotoOnBack ? backImageSrc : logoSrc}
					alt={sidePhotoOnBack ? (backImageAlt ?? '') : (logoAlt ?? '')}
					loading="lazy"
					decoding="async"
				/>
				{#if sidePhotoLinkOverlay && backImageHref}
					<a
						class="card-back-link-box card-back-link-box--overlay"
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
				{/if}
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
				{#if showBackHeaderSide}
					<div class="experience-side">
						{#if variant === 'project' && primaryLink}
							<a
								class="project-website-bubble"
								href={primaryLink.href}
								target="_blank"
								rel="noreferrer"
							>
								{primaryLink.label}
							</a>
						{/if}
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
				class:card-back-main--with-copy={backItems.length > 0 || backParagraphs.length > 0 || skills.length > 0 || (variant === 'award' && items.length > 0)}
				class:card-back-main--custom={customBackBody}
			>
				{#if customBackBody}
					<slot name="backBody" />
				{:else}
					{#if backImageSrc && backItems.length === 0 && backParagraphs.length === 0 && !sidePhotoOnBack}
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
					{:else if backImageHref && !sidePhotoLinkOverlay && backItems.length === 0 && backParagraphs.length === 0}
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
					{:else if backItems.length === 0 && backParagraphs.length === 0 && !sidePhotoOnBack && !(variant === 'award' && items.length > 0)}
						<p class="card-back-marker">backside</p>
					{/if}
					{#if variant === 'experience'}
						{#if backParagraphs.length}
							<div class="experience-back-copy" aria-label="Experience details">
								{#each backParagraphs as paragraph}
									<p class="experience-back-paragraph">
										<strong>{paragraph.heading}</strong>
										{#if paragraph.body}{' '}{paragraph.body}{/if}
									</p>
								{/each}
							</div>
						{:else if backItems.length}
							<ul class="experience-highlights experience-highlights--back">
								{#each backItems as item}
									<li>{item}</li>
								{/each}
							</ul>
						{:else if !backImageSrc && !backImageHref && !skills.length}
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
						{#if backParagraphs.length}
							<div class="experience-back-copy" aria-label="Project details">
								{#each backParagraphs as paragraph}
									<p class="experience-back-paragraph">
										<strong>{paragraph.heading}</strong>
										{#if paragraph.body}{' '}{paragraph.body}{/if}
									</p>
								{/each}
							</div>
						{:else}
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

			{#if variant === 'experience' && skills.length}
				<div class="experience-skills" aria-label="Skills">
					{#each skills as skill}
						<span class="project-chip">{skill}</span>
					{/each}
				</div>
			{/if}
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
		flex: 0 0 var(--exp-card-h, 112px);
		width: var(--exp-card-h, 112px);
		height: var(--exp-card-h, 112px);
		padding: 0;
		overflow: hidden;
		border-right: none;
		background: transparent;
		box-shadow: none;
	}

	:global(.info-card--experience) .card-logo img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
	}

	/* Modal back: square photo matching card height, flush top / bottom / left. */
	:global(.info-card--experience.info-card--modal) .card-row--back .card-logo,
	:global(.info-card--experience.info-card--modal) .card-row--back .card-logo--back-photo {
		flex: 0 0 auto;
		width: auto;
		height: 100%;
		aspect-ratio: 1 / 1;
		align-self: stretch;
		padding: 0;
		margin: 0;
		border-right: none;
		background: transparent;
		box-shadow: none;
		border-radius: 4px 0 0 4px;
	}

	:global(.info-card--experience) .card-logo--back-photo {
		position: relative;
		align-self: stretch;
		flex: 0 0 var(--exp-card-h, 112px);
		width: var(--exp-card-h, 112px);
		height: 100%;
	}

	:global(.info-card--experience) .card-logo--back-photo img {
		object-fit: cover;
		object-position: center;
	}

	.card-back-photo--bw {
		filter: grayscale(1);
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

	:global(.info-card--project) .card-row:not(.card-row--back) .card-main {
		display: flex;
		flex-direction: column;
	}

	:global(.info-card--project) .card-row:not(.card-row--back) .card-main-content {
		flex: 1 1 auto;
		display: flex;
		flex-direction: column;
		justify-content: center;
		min-height: 0;
	}

	:global(.info-card--project) .card-row:not(.card-row--back) .project-body {
		margin: 0;
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
		width: 260px;
		height: 260px;
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
		flex: 0 0 120px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 12px 10px 12px 12px;
		border-right: 1px solid rgba(160, 190, 230, 0.28);
		background: linear-gradient(180deg, rgba(160, 200, 240, 0.08), rgba(160, 200, 240, 0));
		box-shadow: inset -10px 0 20px rgba(140, 180, 220, 0.06);
	}

	.card-row--back .card-logo:not(.card-logo--back-photo) {
		flex-basis: 18%;
		padding: var(--back-pad, 1.38cqw) var(--back-gap, 1.8cqw) var(--back-pad, 1.38cqw)
			var(--back-pad, 1.38cqw);
	}

	:global(.info-card--experience) .card-row--back .card-logo:not(.card-logo--back-photo) {
		flex-basis: auto;
		padding: 0;
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

	.card-row--back .card-content {
		padding: var(--back-pad, 1.38cqw);
	}

	:global(.info-card--experience.info-card--modal) .card-row--back .card-content {
		padding: var(--back-pad, 1.38cqw) var(--back-pad, 1.38cqw) var(--back-pad, 1.38cqw)
			calc(var(--back-pad, 1.38cqw) * 1.4);
	}

	:global(.info-card--experience.info-card--modal) .card-row--back .experience-header {
		margin-bottom: var(--back-gap-sm, 1.13cqw);
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
		overflow: hidden;
	}

	.card-back-main--with-image {
		display: flex;
		flex-direction: column;
		justify-content: center;
		overflow: hidden;
	}

	.card-back-main--with-copy {
		display: flex;
		flex-direction: column;
		justify-content: center;
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
		gap: var(--back-gap, 1.8cqw);
		height: 100%;
		width: auto;
		max-width: 100%;
		aspect-ratio: 4 / 3;
		margin-left: auto;
		padding: var(--back-gap-lg, 2.25cqw);
		border-radius: 2px;
		border: 1px solid rgba(150, 160, 175, 0.35);
		background: rgba(150, 158, 170, 0.28);
		color: rgba(40, 46, 58, 0.88);
		font-size: var(--back-fs, 2.15cqw);
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
		width: var(--back-icon, 2cqw);
		height: var(--back-icon, 2cqw);
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

	.card-back-link-box.card-back-link-box--overlay {
		position: absolute;
		inset: 0;
		z-index: 2;
		width: 100%;
		height: 100%;
		max-width: none;
		max-height: none;
		aspect-ratio: auto;
		margin: 0;
		border-radius: 0;
		border-color: rgba(255, 255, 255, 0.28);
		background: rgba(11, 18, 32, 0.42);
		color: #fff;
		text-shadow: 0 1px 2px rgba(11, 18, 32, 0.55);
		box-shadow: none;
	}

	.card-back-link-box.card-back-link-box--overlay .card-back-link-label,
	.card-back-link-box.card-back-link-box--overlay .card-back-link-icon {
		color: #fff;
	}

	.card-back-link-box.card-back-link-box--overlay .card-back-link-icon {
		opacity: 1;
		stroke: #fff;
	}

	.card-back-link-box.card-back-link-box--overlay:hover {
		background: rgba(11, 18, 32, 0.52);
		border-color: rgba(255, 255, 255, 0.4);
	}

	.card-back-link-box.card-back-link-box--overlay:hover .card-back-link-icon {
		opacity: 1;
	}

	.card-back-marker {
		margin: 0 0 var(--back-gap-sm, 1.13cqw);
		color: rgba(216, 226, 242, 0.72);
		font-size: var(--back-fs-xs, 1.84cqw);
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

	.card-row--back .experience-header {
		gap: var(--back-gap, 1.8cqw);
		margin-bottom: var(--back-gap-sm, 1.13cqw);
	}

	.card-row--back .experience-side {
		gap: var(--back-gap-sm, 1.13cqw);
	}

	.card-row--back .experience-meta {
		gap: var(--back-gap-xs, 0.45cqw);
	}

	:global(.info-card.info-card--blue) .experience-sub {
		overflow: visible;
		text-overflow: unset;
		color: var(--tone-accent);
		font-weight: 600;
		letter-spacing: 0.05em;
		font-size: 13px;
		white-space: nowrap;
		text-shadow:
			0 1px 0 rgba(255, 255, 255, 0.75),
			0 0 10px rgba(var(--tone-glow-2), 0.2);
	}

	:global(.info-card.info-card--blue.info-card--modal) .card-row--back .experience-sub {
		font-size: var(--back-fs, 2.15cqw);
	}

	:global(.info-card.info-card--blue) .experience-company {
		font-size: 16px;
		line-height: 1.2;
		white-space: nowrap;
	}

	:global(.info-card.info-card--blue.info-card--modal) .card-row--back .experience-company {
		font-size: var(--back-fs-lg, 2.71cqw);
	}

	:global(.info-card.info-card--blue) .experience-dates {
		font-size: 13px;
		white-space: nowrap;
	}

	:global(.info-card.info-card--blue.info-card--modal) .card-row--back .experience-dates {
		font-size: var(--back-fs, 2.15cqw);
	}

	:global(.info-card.info-card--blue) .education-details {
		font-size: 13px;
		line-height: 1.6;
	}

	:global(.info-card.info-card--blue.info-card--modal) .card-row--back .education-details {
		font-size: var(--back-fs, 2.15cqw);
		line-height: 1.35;
	}

	:global(.info-card.info-card--blue) .card-hover-hint {
		font-size: 13px;
	}

	:global(.info-card.info-card--blue) .card-content {
		padding: 14px 14px;
	}

	:global(.info-card.info-card--blue.info-card--modal) .card-row--back .card-content {
		padding: var(--back-pad, 1.38cqw);
	}

	:global(.info-card.info-card--blue) .experience-header {
		gap: 12px;
		margin-bottom: 8px;
		flex-direction: row;
		align-items: flex-start;
	}

	:global(.info-card.info-card--blue.info-card--modal) .card-row--back .experience-header {
		gap: var(--back-gap, 1.8cqw);
		margin-bottom: var(--back-gap-sm, 1.13cqw);
	}

	:global(.info-card.info-card--blue) .education-logo {
		width: 44px;
		height: 44px;
	}

	:global(.info-card.info-card--blue.info-card--modal) .card-row--back .education-logo {
		width: var(--back-logo-sm, 4cqw);
		height: var(--back-logo-sm, 4cqw);
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

	.card-row--back .experience-dates {
		font-size: var(--back-fs, 2.15cqw);
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

	:global(.info-card.info-card--experience.info-card--modal) .card-row--back .experience-header {
		column-gap: var(--back-gap, 1.8cqw);
		row-gap: var(--back-gap-xs, 0.45cqw);
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

	:global(.info-card.info-card--award .info-card-face--front .info-card-surface) {
		padding: 0;
	}

	:global(.info-card.info-card--award) .card-row:not(.card-row--back) .card-content {
		padding: 10px 12px;
		height: 100%;
		box-sizing: border-box;
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

	:global(.info-card.info-card--award) .card-row:not(.card-row--back) .experience-header {
		margin-bottom: 0;
		height: 100%;
		align-items: center;
	}

	:global(.info-card.info-card--award.info-card--modal) .card-row--back .experience-header {
		column-gap: var(--back-gap, 1.8cqw);
		row-gap: var(--back-gap-xs, 0.45cqw);
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
		width: 44px;
		height: 44px;
	}

	:global(.info-card.info-card--award) .card-row:not(.card-row--back) .education-logo {
		width: 40px;
		height: 40px;
	}

	:global(.info-card.info-card--award.info-card--modal) .card-row--back .education-logo {
		width: var(--back-logo, 4.5cqw);
		height: var(--back-logo, 4.5cqw);
	}

	.award-dates {
		white-space: nowrap;
	}

	.education-logo {
		position: relative;
		z-index: 2;
		isolation: isolate;
		width: 44px;
		height: 44px;
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

	.card-row--back .education-logo {
		width: var(--back-logo-sm, 4cqw);
		height: var(--back-logo-sm, 4cqw);
		padding: 0.5cqw;
	}

	.education-logo img {
		position: relative;
		z-index: 1;
		display: block;
		width: 100%;
		height: 100%;
		object-fit: contain;
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

	.experience-back-copy {
		display: grid;
		gap: 10px;
	}

	.experience-back-paragraph {
		margin: 0;
		color: #000;
		font-size: 12.5px;
		line-height: 1.45;
	}

	.experience-back-paragraph strong {
		font-weight: 700;
		color: inherit;
	}

	.education-details {
		display: grid;
		gap: 6px;
		color: rgba(216, 226, 242, 0.94);
		font-size: 13px;
		line-height: 1.6;
		overflow-wrap: anywhere;
		text-shadow: 0 1px 2px rgba(11, 18, 32, 0.75);
	}

	.education-details p {
		margin: 0;
	}

	/* Shared front body size for both education cards. */
	:global(.info-card--education) .info-card-face--front .education-details,
	:global(.info-card--blue) .info-card-face--front .education-details {
		color: var(--tone-text, #1e2531);
		text-shadow: 0 1px 0 rgba(255, 255, 255, 0.7);
		font-size: 13px;
		line-height: 1.6;
		gap: 6px;
	}

	/* Back body keeps the education cqw scale. */
	:global(.info-card--education) .info-card-face--back .education-details,
	:global(.info-card--blue) .info-card-face--back .education-details,
	.card-row--back .education-details {
		font-size: var(--back-fs, 2.15cqw);
		line-height: 1.35;
		gap: var(--back-gap-sm, 1.13cqw);
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

	.project-website-bubble {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 24px;
		padding: 0 11px;
		border-radius: 999px;
		border: 1px solid rgba(176, 196, 228, 0.55);
		background: rgba(140, 180, 220, 0.22);
		color: #e8f2ff;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.03em;
		text-decoration: none;
		text-shadow: 0 1px 2px rgba(11, 18, 32, 0.75);
		white-space: nowrap;
		transition:
			transform 140ms ease,
			background 140ms ease,
			border-color 140ms ease;
	}

	.project-website-bubble:hover {
		transform: translateY(-1px);
		background: rgba(140, 180, 220, 0.34);
		border-color: rgba(200, 220, 255, 0.72);
	}

	.project-website-bubble:focus-visible {
		outline: 2px solid rgba(200, 220, 255, 0.55);
		outline-offset: 2px;
	}

	.card-row--back .project-website-bubble {
		height: var(--back-chip-h, 4.1cqw);
		padding: 0 2.6cqw;
		font-size: var(--back-fs-xs, 1.84cqw);
	}

	.project-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin: 0 0 8px;
	}

	.experience-skills {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: auto;
		padding-top: 8px;
		flex: 0 0 auto;
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

	/* Back-only: size type / spacing as % of card width. */
	.card-row--back .experience-highlights {
		font-size: var(--back-fs-sm, 2.02cqw);
	}

	.card-row--back .experience-back-copy {
		gap: var(--back-gap-lg, 2.25cqw);
	}

	.card-row--back .experience-back-paragraph {
		font-size: var(--back-fs-sm, 2.02cqw);
	}

	.card-row--back .education-details {
		gap: var(--back-gap-sm, 1.13cqw);
		font-size: var(--back-fs, 2.15cqw);
	}

	.card-row--back .award-details {
		gap: var(--back-gap-sm, 1.13cqw);
		font-size: var(--back-fs, 2.15cqw);
	}

	.card-row--back .project-body,
	.card-row--back .project-website {
		margin: 0 0 var(--back-gap-sm, 1.13cqw);
		font-size: var(--back-fs-sm, 2.02cqw);
	}

	.card-row--back .project-chips {
		gap: var(--back-gap-sm, 1.13cqw);
		margin: 0 0 var(--back-gap-sm, 1.13cqw);
	}

	.card-row--back .experience-skills {
		gap: var(--back-gap-sm, 1.13cqw);
		padding-top: var(--back-gap-sm, 1.13cqw);
	}

	.card-row--back .project-chip {
		height: var(--back-chip-h, 4.1cqw);
		padding: 0 2.4cqw;
		font-size: var(--back-fs-xs, 1.84cqw);
	}

	.card-row--back .project-links {
		gap: var(--back-gap-sm, 1.13cqw);
	}

	.card-row--back .project-link {
		height: var(--back-link-h, 4.42cqw);
		padding: 0 2.4cqw;
		font-size: var(--back-fs-xs, 1.84cqw);
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
	:global(.info-card--periwinkle) .project-website-link,
	:global(.info-card--green) .project-website-bubble,
	:global(.info-card--teal) .project-website-bubble,
	:global(.info-card--aquamarine) .project-website-bubble,
	:global(.info-card--blue) .project-website-bubble,
	:global(.info-card--periwinkle) .project-website-bubble {
		color: var(--tone-accent);
	}

	:global(.info-card--green) .project-website-bubble,
	:global(.info-card--teal) .project-website-bubble,
	:global(.info-card--aquamarine) .project-website-bubble,
	:global(.info-card--blue) .project-website-bubble,
	:global(.info-card--periwinkle) .project-website-bubble {
		border-color: rgba(var(--tone-border), 0.45);
		background: rgba(255, 255, 255, 0.34);
		text-shadow: 0 1px 0 rgba(255, 255, 255, 0.7);
	}

	:global(.info-card--green) .project-website-bubble:hover,
	:global(.info-card--teal) .project-website-bubble:hover,
	:global(.info-card--aquamarine) .project-website-bubble:hover,
	:global(.info-card--blue) .project-website-bubble:hover,
	:global(.info-card--periwinkle) .project-website-bubble:hover {
		background: rgba(255, 255, 255, 0.48);
		border-color: rgba(var(--tone-border-hover), 0.62);
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
