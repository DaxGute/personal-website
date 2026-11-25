<script lang="ts">
	import { onMount } from 'svelte';
	import { nameShutterInsets, SHUTTER_EXIT_FRACTION } from '$lib/title/nameShutter';

	export let title: string;
	export let linkedinHref = 'https://www.linkedin.com/in/daxton-gutekunst/';
	export let githubHref = 'https://github.com/DaxGute';
	export let resumeHref: string | undefined = '/daxton-gutekunst-resume.pdf';
	export let resumeFilename = 'Daxton-Gutekunst-Resume.pdf';

	let titleEl: HTMLHeadingElement | null = null;
	let nameRow: HTMLDivElement | null = null;
	let cachedSpan = 640;
	let cachedVw = -1;

	function splitTitle(name: string): { first: string; last: string } {
		const parts = (name ?? '')
			.trim()
			.split(/\s+/g)
			.filter(Boolean);
		if (parts.length <= 1) return { first: parts[0] ?? name ?? '', last: '' };
		return { first: parts[0] ?? '', last: parts.slice(1).join(' ') };
	}

	function charsOf(text: string): string[] {
		return [...(text ?? '')];
	}

	$: parts = splitTitle(title);

	/** Scroll-linked per-letter shutter. `introShiftPx` is the opening pan still remaining. */
	export function syncShutter(scrollLeft: number, introShiftPx: number) {
		if (!titleEl) return;
		const vw = window.innerWidth;
		const box = titleEl.getBoundingClientRect();
		if (box.width > 40 && vw !== cachedVw) {
			cachedVw = vw;
			const naturalRight = scrollLeft + box.right - introShiftPx;
			if (naturalRight > 80) cachedSpan = Math.max(420, naturalRight * SHUTTER_EXIT_FRACTION);
		}
		const signed = scrollLeft - introShiftPx;
		const { left, right } = nameShutterInsets(signed, cachedSpan);
		const clipHost = nameRow ?? titleEl;
		if (left < 0.004 && right < 0.004) {
			clipHost.style.setProperty('--char-clip', 'none');
			return;
		}
		clipHost.style.setProperty(
			'--char-clip',
			`inset(0 ${(right * 100).toFixed(2)}% 0 ${(left * 100).toFixed(2)}%)`
		);
	}

	onMount(() => {
		const scroller = document.querySelector('.scroller');
		const track = document.querySelector('.scroll-track');
		const shift = parseFloat(getComputedStyle(track ?? document.body).getPropertyValue('--intro-shift')) || 0;
		syncShutter(scroller?.scrollLeft ?? 0, shift);
	});
</script>

<div class="greeting-layout">
	<div class="greeting">
		<div class="title-row" bind:this={nameRow}>
			<h1 class="title title--greeting" bind:this={titleEl} aria-label={title}>
				<span class="title-first" aria-hidden="true"
					>{#each charsOf(parts.first) as ch, i (i)}<span class="char">{ch}</span>{/each}</span
				>{#if parts.last}<span class="title-last" aria-hidden="true"
					>{#each charsOf(parts.last) as ch, i (`l${i}`)}<span class="char">{ch}</span>{/each}</span
				>{/if}
			</h1>
			<div class="social-row">
				<a
					class="social-link"
					href={linkedinHref}
					target="_blank"
					rel="noreferrer"
					aria-label="LinkedIn"
				>
					<span class="icon-shutter">
						<svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true">
							<path
								fill="currentColor"
								d="M20.45 20.45h-3.55v-5.56c0-1.33-.03-3.04-1.86-3.04-1.86 0-2.15 1.45-2.15 2.95v5.65H9.34V9h3.4v1.56h.05c.47-.89 1.62-1.83 3.33-1.83 3.56 0 4.22 2.34 4.22 5.38v6.34ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM3.56 20.45h3.56V9H3.56v11.45Z"
							/>
						</svg>
					</span>
					<span class="social-tooltip" aria-hidden="true">LinkedIn</span>
				</a>
				<a
					class="social-link"
					href={githubHref}
					target="_blank"
					rel="noreferrer"
					aria-label="GitHub"
				>
					<span class="icon-shutter">
						<svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true">
							<path
								fill="currentColor"
								d="M12 .5a11.5 11.5 0 0 0-3.64 22.42c.58.1.8-.25.8-.56v-2.1c-3.26.7-3.95-1.38-3.95-1.38-.54-1.36-1.32-1.72-1.32-1.72-1.08-.74.08-.73.08-.73 1.2.08 1.83 1.23 1.83 1.23 1.06 1.82 2.78 1.3 3.46 1 .11-.78.42-1.3.76-1.6-2.6-.3-5.34-1.3-5.34-5.78 0-1.28.46-2.32 1.22-3.14-.12-.3-.53-1.52.12-3.17 0 0 1-.32 3.28 1.2a11.3 11.3 0 0 1 5.98 0c2.28-1.52 3.28-1.2 3.28-1.2.65 1.65.24 2.87.12 3.17.76.82 1.22 1.86 1.22 3.14 0 4.5-2.75 5.48-5.37 5.77.43.37.82 1.1.82 2.22v3.3c0 .31.22.67.8.56A11.5 11.5 0 0 0 12 .5Z"
							/>
						</svg>
					</span>
					<span class="social-tooltip" aria-hidden="true">GitHub</span>
				</a>
				{#if resumeHref}
					<a
						class="social-link"
						href={resumeHref}
						download={resumeFilename}
						aria-label="Download résumé"
					>
						<span class="icon-shutter">
							<svg
								class="social-icon"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
							>
								<path d="M12 15V3"></path>
								<path d="m7 10 5 5 5-5"></path>
								<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
							</svg>
						</span>
						<span class="social-tooltip" aria-hidden="true">Download résumé</span>
					</a>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.greeting-layout {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: clamp(28px, 4vw, 56px);
		width: min(980px, 100%);
		margin-top: 170px;
	}

	@media (max-width: 900px) {
		.greeting-layout {
			margin-top: 24px;
			transform: translateX(20%);
		}
	}

	@media (max-height: 520px) and (min-aspect-ratio: 1) {
		.greeting-layout {
			margin-top: 0;
			transform: none;
			width: 100%;
		}

		.greeting {
			display: flex;
			justify-content: center;
			width: 100%;
		}

		.title-row {
			margin-top: 0;
		}
	}

	.greeting {
		width: min(calc(860px * 1.3), 100%);
		padding: 6px;
		flex: 1 1 auto;
		min-width: 0;
		--title-outer-glow:
			0 0 18px rgba(255, 255, 255, 0.9),
			0 0 36px rgba(255, 255, 255, 0.6),
			0 0 64px rgba(255, 255, 255, 0.35);
	}

	.title {
		margin: 0 0 10px;
		font-size: var(--heading-size);
		line-height: 1.05;
	}

	.title--greeting {
		white-space: nowrap;
	}

	/* Owns the shared shutter so the name and the icons below it open together. */
	.title-row {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: max-content;
		max-width: 100%;
		/* Holds the name where it sat under the old kicker, clear of the ribbon. */
		margin: 44px 0 0;
		/* First paint matches the opening pose: far left of each glyph is already cut. */
		--shutter-left: 34%;
		--shutter-right: 0%;
	}

	.title-row .title {
		margin: 0;
	}

	.social-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 18px;
		margin-top: 16px;
	}

	.social-link {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 4px;
		color: var(--fg);
		text-decoration: none;
		border-radius: 6px;
	}

	.social-link:hover .icon-shutter,
	.social-link:focus-visible .icon-shutter {
		transform: scale(1.12);
	}

	.social-tooltip {
		position: absolute;
		top: calc(100% + 6px);
		left: 50%;
		transform: translate(-50%, -2px);
		padding: 4px 8px;
		border-radius: 6px;
		border: 1px solid var(--card-border);
		background: var(--card-strong);
		backdrop-filter: blur(var(--glass-blur));
		color: var(--muted);
		font-size: 12px;
		font-weight: 500;
		letter-spacing: 0;
		line-height: 1.3;
		white-space: nowrap;
		pointer-events: none;
		opacity: 0;
		transition:
			opacity 200ms ease,
			transform 200ms ease;
	}

	.social-link:hover .social-tooltip,
	.social-link:focus-visible .social-tooltip {
		opacity: 1;
		transform: translate(-50%, 0);
		transition-delay: 150ms;
	}

	.social-link:focus-visible {
		outline: 3px solid rgba(124, 58, 237, 0.25);
		outline-offset: 2px;
	}

	/* Pad sits in the opening slit so the mark is whole while the letters are still cut. */
	.icon-shutter {
		display: inline-flex;
		padding-left: 13px;
		margin-left: -13px;
		clip-path: var(--char-clip, inset(0 var(--shutter-right) 0 var(--shutter-left)));
		transition: transform 220ms ease;
	}

	.social-icon {
		width: 22px;
		height: 22px;
		display: block;
		filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.9))
			drop-shadow(0 0 22px rgba(255, 255, 255, 0.5));
	}

	.title--greeting .char {
		display: block;
		flex: 0 0 auto;
		letter-spacing: -0.03em;
		text-shadow: var(--title-outer-glow);
		clip-path: var(--char-clip, inset(0 var(--shutter-right) 0 var(--shutter-left)));
	}

	.title-first {
		display: inline-flex;
	}

	.title-last {
		display: inline-flex;
		margin-left: 0.22em;
	}

	@media (prefers-reduced-motion: reduce) {
		.title-row {
			--shutter-left: 0%;
			--shutter-right: 0%;
		}

		.icon-shutter,
		.social-tooltip {
			transition: none;
		}
	}
</style>
