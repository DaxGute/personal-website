<script lang="ts">
	type CardVariant = 'experience' | 'education' | 'award';

	export let heading: string;
	export let subheading: string;
	export let dates: string | null = null;
	export let variant: CardVariant;
	export let items: string[] = [];
	export let logoSrc: string | null = null;
	export let logoAlt: string | null = null;

	let rootEl: HTMLElement | null = null;
	let tiltEl: HTMLElement | null = null;

	function prefersReducedMotion() {
		return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	// Match Polaroid hover tilt
	const MAX_TILT_DEG = 9;
	const HOVER_SCALE = 1.035;

	function setTilt(e: PointerEvent) {
		if (!rootEl || !tiltEl) return;
		if (prefersReducedMotion()) return;

		const r = rootEl.getBoundingClientRect();
		const x = (e.clientX - r.left) / r.width;
		const y = (e.clientY - r.top) / r.height;

		const dx = x - 0.5;
		const dy = y - 0.5;

		const rotX = (dy * 2 * MAX_TILT_DEG).toFixed(3);
		const rotY = (-dx * 2 * MAX_TILT_DEG).toFixed(3);

		tiltEl.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
		rootEl.style.setProperty('--scale', `${HOVER_SCALE}`);
		rootEl.style.setProperty('--hover', '1');
	}

	function resetTilt() {
		if (!rootEl) return;

		if (tiltEl) tiltEl.style.transform = `perspective(900px) rotateX(0deg) rotateY(0deg)`;
		rootEl.style.setProperty('--scale', `1`);
		rootEl.style.setProperty('--hover', '0');
	}
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="info-card hover-polaroid-scale"
	data-variant={variant}
	bind:this={rootEl}
	on:pointerenter={setTilt}
	on:pointermove={setTilt}
	on:pointerleave={resetTilt}
>
	<div class="info-card-tilt hover-polaroid-tilt" bind:this={tiltEl}>
		<div
			class="info-card-surface hover-polaroid-surface"
			class:has-logo={variant === 'experience' && !!logoSrc}
		>
			<div class="card-row">
				{#if variant === 'experience' && logoSrc}
					<div class="card-logo" aria-hidden={logoAlt ? undefined : 'true'}>
						<img src={logoSrc} alt={logoAlt ?? ''} loading="lazy" decoding="async" />
					</div>
				{/if}

				<div class="card-content">
					<div class="experience-header">
						<div class="experience-meta">
							<p class="experience-company">{heading}</p>
							<p class="experience-sub" class:wrap-sub={variant !== 'experience'}>{subheading}</p>
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
			</div>
		</div>
	</div>
</div>

<style>
	/* Glass surface (apply to every InfoCard) */
	.info-card {
		width: 100%;
		height: 100%;
	}

	.info-card-tilt {
		width: 100%;
		height: 100%;
	}

	.info-card-surface {
		--hp-border: rgba(11, 18, 32, 0.18);
		--hp-border-hover: rgba(11, 18, 32, 0.22);
		--hp-bg: linear-gradient(135deg, rgba(124, 58, 237, 0.14), rgba(34, 211, 238, 0.1)),
			rgba(255, 255, 255, 0.86);
		--hp-bg-hover: linear-gradient(135deg, rgba(124, 58, 237, 0.18), rgba(34, 211, 238, 0.14)),
			rgba(255, 255, 255, 0.92);
		--hp-shadow: 0 22px 70px rgba(11, 18, 32, 0.16);
		--hp-shadow-hover: 0 28px 84px rgba(11, 18, 32, 0.18);
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		border-radius: 16px;
		backface-visibility: hidden;
		padding: 14px 14px;
	}

	.info-card-surface.has-logo {
		padding: 0;
	}

	.card-row {
		display: flex;
		align-items: stretch;
		width: 100%;
		height: 100%;
	}

	.card-logo {
		flex: 0 0 clamp(64px, 18%, 120px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 12px 10px 12px 12px;
		border-right: 1px solid rgba(11, 18, 32, 0.08);
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0));
	}

	.card-logo img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.card-content {
		flex: 1 1 auto;
		min-width: 0;
		padding: 14px 14px;
	}

	/* hover surface polish handled by `.hover-polaroid-scale:hover .hover-polaroid-surface` */

	.experience-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 8px;
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
		overflow-wrap: anywhere;
	}

	.experience-dates {
		margin: 0;
		color: var(--muted);
		font-size: 13px;
		white-space: nowrap;
	}

	.education-logo {
		width: clamp(28px, 3.2vw, 44px);
		height: clamp(28px, 3.2vw, 44px);
		display: grid;
		place-items: center;
		padding: 2px;
		border-radius: 10px;
		background: rgba(255, 255, 255, 0.35);
		border: 1px solid rgba(11, 18, 32, 0.08);
	}

	.education-logo img {
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
		overflow-wrap: anywhere;
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

