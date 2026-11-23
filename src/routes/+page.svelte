<svelte:options runes={false} />

<script lang="ts">
	import { onMount } from 'svelte';
	import Ribbon from '$lib/Ribbon.svelte';
	import {
		isCardModalOpen,
		layoutScrollLeft,
		prefersMobileCardFade,
		registerScrollContainer
	} from '$lib/cardModal';
	import { panelTrackLeft, RIBBON_SECTION_COUNT, RIBBON_VISIBLE_RENDER_WIDTH_PX } from '$lib/ribbon';
	import TitlePanel from '$lib/title/TitlePanel.svelte';
	import { NAME_INTRO_MS, NAME_INTRO_SHIFT_PX } from '$lib/title/nameShutter';
	import { syncSectionShutters } from '$lib/title/sectionShutter';
	import ExperiencesPanel from '$lib/experiences/ExperiencesPanel.svelte';
	import EducationPanel from '$lib/education/EducationPanel.svelte';
	import ProjectsPanel from '$lib/projects/ProjectsPanel.svelte';
	import AwardsPanel from '$lib/awards/AwardsPanel.svelte';

	type Panel = {
		id: string;
		title: string;
		navTitle?: string;
	};

	const panels: Panel[] = [
		{
			id: 'greeting',
			title: 'Daxton Gutekunst',
			navTitle: 'Title'
		},
		{
			id: 'experiences',
			title: 'Experiences'
		},
		{
			id: 'education',
			title: 'Education'
		},
		{
			id: 'projects',
			title: 'Projects'
		},
		{
			id: 'awards',
			title: 'Awards'
		}
	];

	let scroller: HTMLElement | null = null;
	let scrollTrackEl: HTMLElement | null = null;
	/** Opening pan still applied to the track. Not reactive — updated imperatively. */
	const introShift = { px: NAME_INTRO_SHIFT_PX };
	let titleCmp: { syncShutter: (scrollLeft: number, introShiftPx: number) => void } | null = null;
	let eduSpreadAnim: number | null = null;
	let panelOffsets: number[] = [];
	let panelW = 0;
	let experiencesPanelEl: HTMLElement | null = null;
	let educationPanelEl: HTMLElement | null = null;
	/** Ribbon — layout + scroll are fully imperative (no reactive props → no full-page invalidation on resize). */
	let ribbonCmp: {
		syncRevealScroll: (scrollLeft: number) => void;
		syncLayout: (trackWidthPx: number) => void;
	} | null = null;

	// Decorative line from `static/background.svg` — panels anchored along the ribbon track.
	/** Horizontal scroll extent (panel strip width); wash uses this so `scrollWidth` is not inflated. */
	let scrollTrackW = RIBBON_VISIBLE_RENDER_WIDTH_PX;

	let greetingScrollLocked = true;
	let syncScrollState: (() => void) | undefined;

	// Contact links
	const linkedinHref = 'https://www.linkedin.com/in/daxton-gutekunst/';
	const githubHref = 'https://github.com/DaxGute';
	const sourceCodeHref = 'https://github.com/DaxGute/personal-website';

	function prefersReducedMotion() {
		return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	function clamp01(n: number) {
		return Math.max(0, Math.min(1, n));
	}

	function clamp(n: number, min: number, max: number) {
		return Math.max(min, Math.min(max, n));
	}

	function easeOutCubic(t: number) {
		return 1 - Math.pow(1 - t, 3);
	}

	/** Zero velocity and acceleration at both ends — the ease Apple uses between chapters. */
	function smootherstep(t: number) {
		const x = clamp01(t);
		return x * x * x * (x * (x * 6 - 15) + 10);
	}

	function getMaxScrollLeft() {
		if (!scroller) return 0;
		const maxByTrack = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
		const lastPanelStart = panelOffsets[panelOffsets.length - 1];
		if (lastPanelStart == null) return maxByTrack;
		// Last panel is 100vw wide — don't scroll into empty track past its left edge.
		return Math.min(maxByTrack, lastPanelStart);
	}

	onMount(() => {
		if (!scroller) return;

		// Prevent the browser from restoring a previous horizontal scroll position on reload.
		// (Some browsers restore after initial JS runs, so we also force-reset via rAF below.)
		try {
			if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
		} catch {
			// ignore
		}

		experiencesPanelEl = document.getElementById('experiences');
		educationPanelEl = document.getElementById('education');
		const expIdx = panels.findIndex((p) => p.id === 'experiences');
		const eduIdx = panels.findIndex((p) => p.id === 'education');
		const EDU_SPREAD_MS = 1000;
		let eduSpreadT = 0;
		let eduSpreadTarget = 0;
		let eduSpreadStartTime: number | null = null;

		const setEduT = (t: number) => {
			eduSpreadT = clamp01(t);
			educationPanelEl?.style.setProperty('--edu-t', `${easeOutCubic(eduSpreadT)}`);
		};

		const cancelEduSpreadAnim = () => {
			if (eduSpreadAnim != null) cancelAnimationFrame(eduSpreadAnim);
			eduSpreadAnim = null;
			eduSpreadStartTime = null;
		};

		const animateEduSpreadTo = (target: number) => {
			target = clamp01(target);
			if (prefersReducedMotion()) {
				cancelEduSpreadAnim();
				eduSpreadTarget = target;
				setEduT(target);
				return;
			}
			if (eduSpreadTarget === target && eduSpreadStartTime === null) return;
			if (eduSpreadTarget === target && eduSpreadStartTime !== null) return;

			cancelEduSpreadAnim();
			const from = eduSpreadT;
			if (from === target) {
				eduSpreadTarget = target;
				setEduT(target);
				return;
			}

			eduSpreadTarget = target;
			const startTime = performance.now();
			eduSpreadStartTime = startTime;

			const tick = (tNow: number) => {
				const linearT = clamp01((tNow - startTime) / EDU_SPREAD_MS);
				setEduT(from + (target - from) * linearT);
				if (linearT < 1) eduSpreadAnim = requestAnimationFrame(tick);
				else {
					eduSpreadAnim = null;
					eduSpreadStartTime = null;
				}
			};

			eduSpreadAnim = requestAnimationFrame(tick);
		};

		const eduSpreadThreshold = (eduStart: number) => {
			const w = panelW || window.innerWidth;
			const visibleStart = eduStart - w;
			const span = (eduStart + w) - visibleStart;
			return visibleStart + span * 0.48;
		};

		/**
		 * Wheel pixels not yet turned into movement. Released on a short exponential
		 * so a gesture keeps up with the finger and still has a little follow-through.
		 */
		let pendingInput = 0;
		/** Integrator position. Kept separate so a touch scroll can be detected and adopted. */
		let scrollPos = 0;
		let scrollRaf = 0;
		let scrollTickAt = 0;

		const clampScroller = () => {
			if (!scroller) return;
			const maxScroll = getMaxScrollLeft();
			const left = clamp(scroller.scrollLeft, 0, maxScroll);
			if (scroller.scrollLeft !== left) scroller.scrollLeft = left;
			scrollPos = clamp(scrollPos, 0, maxScroll);
		};

		const measure = () => {
			if (!scroller) return;
			panelW = scroller.clientWidth || window.innerWidth;
			panelOffsets = panels.map((_, i) => panelTrackLeft(i, RIBBON_SECTION_COUNT));
			scrollTrackW = Math.max(
				RIBBON_VISIBLE_RENDER_WIDTH_PX,
				(panelOffsets[panelOffsets.length - 1] ?? 0) + panelW
			);
			ribbonCmp?.syncLayout(scrollTrackW);

			clampScroller();
		};

		const updateProgress = () => {
			if (!scroller) return;
			clampScroller();
			const x = layoutScrollLeft();
			ribbonCmp?.syncRevealScroll(x);
			titleCmp?.syncShutter(x, introShift.px);
			syncSectionShutters(x, introShift.px);
			if (panelOffsets.length === 0) return;

			// Per-panel animation progress (used for Experiences card fan-in).
			// Mobile uses a static 2×2 grid — skip the scroll-driven fan.
			if (expIdx !== -1 && panelOffsets[expIdx] != null) {
				if (prefersMobileCardFade()) {
					experiencesPanelEl?.style.setProperty('--exp-t', '1');
				} else {
					const expStart = panelOffsets[expIdx];
					const expEnd = panelOffsets[Math.min(expIdx + 1, panelOffsets.length - 1)] ?? expStart;
					const denom = expEnd - expStart;
					// Start the Experiences animation earlier (before the slide is fully reached).
					// The panel is clipped (see CSS) so the cards won't visually bleed into the previous slide.
					const shiftPx = (panelW || denom || window.innerWidth) * 0.95;
					const start = expStart - shiftPx;
					// Let the animation "finish" a bit later than the panel boundary.
					const tailPx = (panelW || denom || window.innerWidth) * 0.75;
					const end = expEnd - shiftPx + tailPx;
					const linearT = end === start ? 1 : clamp01((x - start) / (end - start));
					experiencesPanelEl?.style.setProperty('--exp-t', `${easeOutCubic(linearT)}`);
				}
			}

			// Education: fan / stack over ~1s once scroll crosses threshold (either direction).
			// Mobile stays permanently splayed — skip the scroll-driven stack.
			if (eduIdx !== -1 && panelOffsets[eduIdx] != null) {
				if (prefersMobileCardFade()) {
					cancelEduSpreadAnim();
					eduSpreadTarget = 1;
					setEduT(1);
				} else {
					const threshold = eduSpreadThreshold(panelOffsets[eduIdx]!);
					animateEduSpreadTo(x >= threshold ? 1 : 0);
				}
			} else {
				cancelEduSpreadAnim();
				eduSpreadTarget = 0;
				setEduT(0);
			}

		};

		let ticking = false;

		/** Screen px per wheel px while a section is held. */
		const SECTION_DWELL_GAIN = 0.55;
		/** Screen px per wheel px at the midpoint of the gap. Crest, not a flat cruise. */
		const SECTION_GLIDE_GAIN = 3.2;
		/** Fraction of the gap that stays at dwell speed — a short flat hold, not a peak on the letters. */
		const SECTION_DWELL_FRACTION = 0.08;
		/**
		 * Fraction of the gap where glide speed is reached. 0.5 crests exactly between
		 * sections; smootherstep's flat end keeps that crest smooth when the nearest
		 * section flips.
		 */
		const SECTION_GLIDE_FRACTION = 0.5;
		/**
		 * How fast queued wheel input is released. Short on purpose: a Mac trackpad
		 * already coasts, and a long blend would swim. This only gives the speed
		 * change a body so it eases instead of shifting gears.
		 */
		const SCROLL_INPUT_TAU_MS = 64;

		/**
		 * Apple chapter curve. Flat dwell on a section, smootherstep up into a faster
		 * glide across the gap, then the mirror image as the next section arrives.
		 * Tuned so a full section crossing costs about the same wheel travel as before;
		 * what changes is the shape (hold, ease out, glide, ease in).
		 */
		const scrollGain = (scrollLeft: number) => {
			if (prefersReducedMotion() || panelOffsets.length === 0) return 1;
			let nearest = Infinity;
			let pitch = panelW || window.innerWidth;
			for (let i = 0; i < panelOffsets.length; i++) {
				const anchor = panelOffsets[i] ?? 0;
				const dist = Math.abs(scrollLeft - anchor);
				if (dist < nearest) {
					nearest = dist;
					const prev = i > 0 ? panelOffsets[i - 1] : null;
					const next = i < panelOffsets.length - 1 ? panelOffsets[i + 1] : null;
					const gap =
						prev != null && next != null
							? Math.min(anchor - prev, next - anchor)
							: prev != null
								? anchor - prev
								: next != null
									? next - anchor
									: pitch;
					pitch = Math.max(1, gap);
				}
			}
			const dwell = pitch * SECTION_DWELL_FRACTION;
			const glideAt = pitch * SECTION_GLIDE_FRACTION;
			const u = smootherstep((nearest - dwell) / Math.max(1, glideAt - dwell));
			return SECTION_DWELL_GAIN + (SECTION_GLIDE_GAIN - SECTION_DWELL_GAIN) * u;
		};

		const stopScrollGlide = () => {
			if (scrollRaf !== 0) cancelAnimationFrame(scrollRaf);
			scrollRaf = 0;
		};

		const tickScroll = (now: number) => {
			scrollRaf = 0;
			if (!scroller) return;
			if (isCardModalOpen()) {
				pendingInput = 0;
				scrollPos = scroller.scrollLeft;
				return;
			}
			// Touch or a modal pin moved the scroller; don't drag it back.
			if (Math.abs(scroller.scrollLeft - scrollPos) > 2) {
				pendingInput = 0;
				scrollPos = scroller.scrollLeft;
				return;
			}

			const dt = Math.min(50, Math.max(0, now - scrollTickAt));
			scrollTickAt = now;
			const release = 1 - Math.exp(-dt / SCROLL_INPUT_TAU_MS);
			let take = pendingInput * release;
			if (Math.abs(pendingInput - take) < 0.35) take = pendingInput;

			const maxScroll = getMaxScrollLeft();
			let remaining = take;
			let consumed = 0;
			let blocked = false;
			const step = 8;
			while (Math.abs(remaining) > 0.01) {
				const bite = Math.abs(remaining) > step ? Math.sign(remaining) * step : remaining;
				const next = clamp(scrollPos + bite * scrollGain(scrollPos), 0, maxScroll);
				if (next === scrollPos) {
					blocked = true;
					break;
				}
				scrollPos = next;
				remaining -= bite;
				consumed += bite;
			}
			pendingInput = blocked ? 0 : pendingInput - consumed;

			if (scroller.scrollLeft !== scrollPos) scroller.scrollLeft = scrollPos;
			if (Math.abs(pendingInput) > 0.05) scrollRaf = requestAnimationFrame(tickScroll);
			else pendingInput = 0;
		};

		const queueScrollInput = (delta: number) => {
			if (!scroller || delta === 0) return;
			if (Math.abs(scroller.scrollLeft - scrollPos) > 2) {
				pendingInput = 0;
				scrollPos = scroller.scrollLeft;
			}
			if (prefersReducedMotion()) {
				const maxScroll = getMaxScrollLeft();
				scrollPos = clamp(scrollPos + delta, 0, maxScroll);
				pendingInput = 0;
				scroller.scrollLeft = scrollPos;
				return;
			}
			pendingInput += delta;
			if (scrollRaf === 0) {
				scrollTickAt = performance.now();
				scrollRaf = requestAnimationFrame(tickScroll);
			}
		};

		const onScroll = () => {
			if (ticking) return;
			ticking = true;
			requestAnimationFrame(() => {
				updateProgress();
				ticking = false;
			});
		};

		const wheel = (e: WheelEvent) => {
			if (isCardModalOpen()) {
				e.preventDefault();
				return;
			}
			if (greetingScrollLocked) {
				e.preventDefault();
				return;
			}
			// Awards and the project reel call stopPropagation only after the pointer
			// has moved on them. Otherwise this handler keeps scrolling the page.

			if (!scroller) return;
			const absX = Math.abs(e.deltaX);
			const absY = Math.abs(e.deltaY);
			let delta = absX > absY ? e.deltaX : e.deltaY;
			if (e.deltaMode === 1) delta *= 16;
			else if (e.deltaMode === 2) delta *= scroller.clientWidth || window.innerWidth;
			if (delta === 0) return;
			e.preventDefault();
			queueScrollInput(delta);
		};

		const onScrollLock = () => {
			if (!greetingScrollLocked) return;
			if (!scroller) return;
			pendingInput = 0;
			scrollPos = 0;
			if (scroller.scrollLeft !== 0) scroller.scrollLeft = 0;
		};

		const keyLock = (e: KeyboardEvent) => {
			// Only block scroll-triggering keys — never blanket-preventDefault while a
			// card modal is open, or Cmd/Ctrl shortcuts (copy, etc.) break on the back.
			if (!isCardModalOpen() && !greetingScrollLocked) return;
			const keys = [
				'ArrowLeft',
				'ArrowRight',
				'ArrowUp',
				'ArrowDown',
				'PageUp',
				'PageDown',
				'Home',
				'End',
				' ',
				'Spacebar'
			];
			if (keys.includes(e.key)) e.preventDefault();
		};

		measure();
		if (scroller) registerScrollContainer(scroller);
		// Always start on the title (first) panel.
		// Use scrollTo(...behavior:'auto') to avoid smooth scrolling, and re-apply after rAF/timeout
		// in case the browser restores scroll position after mount.
		const resetToTitle = () => {
			pendingInput = 0;
			scrollPos = 0;
			stopScrollGlide();
			scroller?.scrollTo({ left: 0, top: 0, behavior: 'auto' });
		};
		resetToTitle();
		requestAnimationFrame(resetToTitle);
		setTimeout(resetToTitle, 50);
		updateProgress();
		syncScrollState = updateProgress;

		let introRaf: number | null = null;
		const setIntroShift = (px: number) => {
			introShift.px = px;
			scrollTrackEl?.style.setProperty('--intro-shift', `${px}px`);
		};
		const playNameIntro = () => {
			if (prefersReducedMotion()) {
				setIntroShift(0);
				greetingScrollLocked = false;
				updateProgress();
				return;
			}
			const start = performance.now();
			const from = NAME_INTRO_SHIFT_PX;
			const tick = (now: number) => {
				const t = Math.min(1, (now - start) / NAME_INTRO_MS);
				const shift = t >= 1 ? 0 : Math.round(from * (1 - easeOutCubic(t)) * 10) / 10;
				setIntroShift(shift);
				updateProgress();
				if (t < 1) introRaf = requestAnimationFrame(tick);
				else {
					introRaf = null;
					greetingScrollLocked = false;
					// Re-apply after the unlock render so the pan cannot spring back right.
					requestAnimationFrame(() => setIntroShift(0));
				}
			};
			setIntroShift(from);
			introRaf = requestAnimationFrame(tick);
		};

		scroller.addEventListener('wheel', wheel, { passive: false });
		scroller.addEventListener('scroll', onScroll, { passive: true });
		scroller.addEventListener('scroll', onScrollLock, { passive: true });
		window.addEventListener('keydown', keyLock);
		window.addEventListener('resize', () => {
			measure();
			updateProgress();
		});
		playNameIntro();

		return () => {
			scroller?.removeEventListener('wheel', wheel as EventListener);
			scroller?.removeEventListener('scroll', onScroll);
			scroller?.removeEventListener('scroll', onScrollLock);
			window.removeEventListener('keydown', keyLock);
			cancelEduSpreadAnim();
			stopScrollGlide();
			if (introRaf != null) cancelAnimationFrame(introRaf);
			syncScrollState = undefined;
		};
	});

</script>

<div class="stage">
	<!-- Fixed to the stage (not the zooming scroll-track) so blobs don't clip/flicker on modal zoom. -->
	<div class="scroller-wash" aria-hidden="true"></div>
	<main
		class="scroller"
		bind:this={scroller}
		aria-label="Horizontally scrolling panels"
	>
		<div class="scroll-track" bind:this={scrollTrackEl} style:width={`${scrollTrackW}px`}>
			<!-- Scrolls natively with the strip (no JS pan); sits above wash, below panels. -->
			<Ribbon bind:this={ribbonCmp} />

			{#each panels as panel, i}
				<section
					id={panel.id}
					class="panel"
					aria-label={panel.title}
					style:left={`${panelTrackLeft(i, RIBBON_SECTION_COUNT)}px`}
				>
				{#if panel.id === 'greeting'}
					<TitlePanel title={panel.title} {linkedinHref} {githubHref} bind:this={titleCmp} />
				{:else}
					<div class="panel-inner">
						{#if panel.id === 'experiences'}
							<ExperiencesPanel title={panel.title} />
						{:else if panel.id === 'education'}
							<EducationPanel title={panel.title} />
						{:else if panel.id === 'projects'}
							<ProjectsPanel title={panel.title} />
						{:else if panel.id === 'awards'}
							<AwardsPanel title={panel.title} />
							<div class="page-end">
								<div class="repo-note">
									<span>Like my website? The code can be found </span>
									<a class="repo-note__link" href={sourceCodeHref} target="_blank" rel="noreferrer">here</a><span>.</span>
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</section>
		{/each}
		</div>
	</main>
</div>

<style>
	.stage {
		position: relative;
		height: 100vh;
		width: 100vw;
		overflow: hidden;
		overscroll-behavior: none;
		/* Shared sizing vars for panel padding */
		--menu-pad: 8px;
		--menu-control-h: 34px;
		/* 30% more than the previous 18px side inset. */
		--slide-pad-x: calc(18px * 1.3);
	}

	.scroller {
		position: relative;
		z-index: 1;
		height: 100vh;
		width: 100vw;
		overflow-x: auto;
		overflow-y: hidden;
		display: flex;
		background: transparent;
		overflow-anchor: none;
		/* Must stay `auto`: wheel handler sets scrollLeft every tick; `smooth` stacks animations and feels broken. */
		scroll-behavior: auto;
		overscroll-behavior: none;
		-webkit-overflow-scrolling: touch;
		touch-action: pan-x;
	}

	.scroll-track {
		position: relative;
		flex: 0 0 auto;
		height: 100vh;
		/* Opening pose. Keep in sync with NAME_INTRO_SHIFT_PX. Inline style takes over. */
		--intro-shift: 120px;
	}

	@media (prefers-reduced-motion: reduce) {
		.scroll-track {
			--intro-shift: 0px;
		}
	}

	.scroller-wash {
		position: absolute;
		inset: 0;
		z-index: 0;
		pointer-events: none;
		background:
			radial-gradient(70vmax 42vmax at 20% 20%, rgba(124, 58, 237, 0.14), transparent 58%),
			radial-gradient(62vmax 40vmax at 80% 30%, rgba(34, 211, 238, 0.12), transparent 60%),
			radial-gradient(62vmax 52vmax at 50% 90%, rgba(16, 185, 129, 0.1), transparent 62%),
			var(--bg);
		background-repeat: no-repeat;
		/* Own compositor layer — sibling track transforms won't resample the gradients. */
		transform: translateZ(0);
		backface-visibility: hidden;
	}

	/* hide scrollbars without disabling scrolling */
	.scroller {
		scrollbar-width: none; /* Firefox */
	}
	.scroller::-webkit-scrollbar {
		display: none; /* Chrome/Safari */
	}

	.panel {
		position: absolute;
		top: 0;
		width: 100vw;
		height: 100vh;
		display: grid;
		place-items: start center;
		padding: calc(18px + (var(--menu-control-h) + (var(--menu-pad) * 2)) + 110px) var(--slide-pad-x) 24px;
		z-index: 3;
	}

	#experiences.panel {
		padding-top: calc(18px + (var(--menu-control-h) + (var(--menu-pad) * 2)) + 70px);
	}

	#projects.panel {
		z-index: 6;
	}

	#education.panel {
		z-index: 7;
		overflow: visible;
	}

	#projects.panel .panel-inner {
		--projects-lift: 0px;
		bottom: var(--projects-lift);
		border: 0;
		background: transparent;
		backdrop-filter: none;
		-webkit-backdrop-filter: none;
		box-shadow: none;
		overflow: visible;
	}

	@media (max-width: 900px) {
		#greeting.panel {
			padding-top: calc(18px + (var(--menu-control-h) + (var(--menu-pad) * 2)) + 24px);
		}

		#education.panel {
			padding-top: calc(18px + (var(--menu-control-h) + (var(--menu-pad) * 2)) + 10px);
		}

		#projects.panel .panel-inner {
			--projects-lift: calc(130px + 15vh);
		}
	}

	/* Flipped phone: drop the desktop top inset and center each section in the short viewport. */
	@media (max-height: 520px) and (min-aspect-ratio: 1) {
		.panel,
		#greeting.panel,
		#experiences.panel,
		#education.panel,
		#projects.panel {
			padding: 10px 16px 8px;
			place-items: center;
		}

		#education.panel .panel-inner,
		#experiences.panel .panel-inner,
		#projects.panel .panel-inner {
			padding: 0;
			height: auto;
		}

		#education.panel .panel-inner,
		#projects.panel .panel-inner {
			display: flex;
			flex-direction: column;
			align-items: center;
		}

		#projects.panel .panel-inner {
			--projects-lift: 0px;
			position: relative;
			bottom: auto;
		}

		#experiences.panel .panel-inner {
			--panel-max: 100%;
			width: 100%;
		}
	}

	.panel-inner {
		/* 30% wider than before, still inset by the larger side padding. */
		--panel-max: calc(860px * 1.3);
		width: min(100%, var(--panel-max));
		border: 1px solid var(--card-border);
		background: var(--card-strong);
		backdrop-filter: blur(calc(var(--glass-blur) + 4px));
		border-radius: 24px;
		padding: 28px calc(28px * 1.3);
		box-shadow: var(--shadow);
		position: relative;
		z-index: 4;
	}

	#experiences.panel .panel-inner {
		/* Fan is absolutely placed against this width; growing it shoves cards off the left. */
		--panel-max: 1200px;
		border: 0;
		background: transparent;
		backdrop-filter: none;
		box-shadow: none;
		padding: 0;
	}

	#education.panel .panel-inner {
		--panel-max: calc(980px * 1.3);
		border: 0;
		background: transparent;
		backdrop-filter: none;
		box-shadow: none;
		padding: 28px calc(28px * 1.3);
		overflow: visible;
	}

	#awards.panel .panel-inner {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		border: 0;
		background: transparent;
		backdrop-filter: none;
		box-shadow: none;
		padding: 0;
	}

	#interests.panel .panel-inner {
		border: 0;
		background: transparent;
		backdrop-filter: none;
		box-shadow: none;
		padding: 0;
	}

	#greeting.panel :global(.greeting-layout) {
		width: min(100%, calc(980px * 1.3));
	}

	#interests.panel {
		place-items: start end;
		padding-inline: var(--slide-pad-x);
	}

	#interests.panel .panel-inner {
		position: absolute;
		top: 0;
		bottom: 0;
		left: var(--slide-pad-x);
		right: var(--slide-pad-x);
		width: auto;
		height: 100%;
		padding: 0;
		border: 0;
		background: transparent;
		backdrop-filter: none;
		box-shadow: none;
		transform: none;
	}

	#awards.panel {
		place-items: center;
		padding: 0;
	}

	.page-end {
		position: absolute;
		right: 5px;
		bottom: 5px;
		z-index: 4;
		pointer-events: none;
	}

	.repo-note {
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

	@media (max-width: 900px) {
		.repo-note {
			display: none;
		}
	}
</style>
