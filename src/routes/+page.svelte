<svelte:options runes={false} />

<script lang="ts">
	import { onMount } from 'svelte';
	import Ribbon from '$lib/Ribbon.svelte';
	import SectionNav from '$lib/SectionNav.svelte';
	import { isCardModalOpen, layoutScrollLeft, registerScrollContainer } from '$lib/cardModal';
	import { panelTrackLeft, RIBBON_RENDER_WIDTH_PX } from '$lib/ribbon';
	import TitlePanel from '$lib/title/TitlePanel.svelte';
	import ExperiencesPanel from '$lib/experiences/ExperiencesPanel.svelte';
	import EducationPanel from '$lib/education/EducationPanel.svelte';
	import ProjectsPanel from '$lib/projects/ProjectsPanel.svelte';
	import AwardsPanel from '$lib/awards/AwardsPanel.svelte';
	import InterestsPanel from '$lib/interests/InterestsPanel.svelte';

	type Panel = {
		id: string;
		title: string;
		navTitle?: string;
		kicker?: string;
		body: string;
	};

	const panels: Panel[] = [
		{
			id: 'greeting',
			kicker: "Stanford '27",
			title: 'Daxton Gutekunst',
			navTitle: 'Title',
			body: 'Scroll to continue'
		},
		{
			id: 'experiences',
			kicker: 'Jobs and Internships',
			title: 'Experiences',
			body: 'These are the roles that defined my professional growth.'
		},
		{
			id: 'education',
			kicker: 'Coursework and Focus Areas',
			title: 'Education',
			body: 'What I’m building expertise in.'
		},
		{
			id: 'projects',
			kicker: 'Applied Expertise',
			title: 'Projects',
			body: 'Pick a project to see details.'
		},
		{
			id: 'awards',
			kicker: 'Honors and Accomplishments',
			title: 'Awards',
			body: 'For my dedication, I have been recognized with the following awards.'
		},
		{
			id: 'interests',
			kicker: 'Hobbies and extracurriculars',
			title: 'Interests',
			body: 'What do I get up to in my spare time'
		}
	];

	let scroller: HTMLElement | null = null;
	/** Non-reactive: panel switches must not re-render the whole page (see setNavAriaCurrent). */
	const activePanelRef = { id: panels[0]?.id ?? 'home' };
	let scrollAnim: number | null = null;
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

	/** Bottom section nav — scroll progress + reveal updated imperatively (same as ribbon). */
	let sectionNavCmp: {
		syncScrollRevealed: (scrollLeft: number) => void;
		setProgressIndex: (progressIndex: number) => void;
		setActiveId: (activeId: string) => void;
	} | null = null;

	// Decorative line from `static/background.svg` — panels anchored along the ribbon track.
	/** Horizontal scroll extent (panel strip width); wash uses this so `scrollWidth` is not inflated. */
	let scrollTrackW = RIBBON_RENDER_WIDTH_PX;

	let greetingScrollLocked = true;
	let syncScrollState: (() => void) | undefined;

	// Contact links
	const linkedinHref = 'https://www.linkedin.com/in/daxton-gutekunst/';
	const githubHref = 'https://github.com/DaxGute';
	const sourceCodeHref = 'https://github.com/DaxGute/personal-website';
	const emailHref = 'mailto:daxton@gutekunst.com';

	function prefersReducedMotion() {
		return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	function clamp01(n: number) {
		return Math.max(0, Math.min(1, n));
	}

	function easeInOutPow(t: number, power = 0.5) {
		// Ease-in-out with adjustable "tail" length.
		// Higher `power` = slower near the start/end, faster in the middle.
		const x = clamp01(t);
		if (x === 0 || x === 1) return x;
		if (x < 0.5) return 0.5 * Math.pow(2 * x, power);
		return 1 - 0.5 * Math.pow(2 * (1 - x), power);
	}

	function clamp(n: number, min: number, max: number) {
		return Math.max(min, Math.min(max, n));
	}

	function easeOutCubic(t: number) {
		return 1 - Math.pow(1 - t, 3);
	}

	function cancelScrollAnim() {
		if (scrollAnim != null) cancelAnimationFrame(scrollAnim);
		scrollAnim = null;
	}

	function getMaxScrollLeft() {
		if (!scroller) return 0;
		const maxByTrack = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
		const lastPanelStart = panelOffsets[panelOffsets.length - 1];
		if (lastPanelStart == null) return maxByTrack;
		// Last panel is 100vw wide — don't scroll into empty track past its left edge.
		return Math.min(maxByTrack, lastPanelStart);
	}

	function smoothScrollTo(left: number, durationMs?: number) {
		if (!scroller) return;
		cancelScrollAnim();

		const target = clamp(left, 0, getMaxScrollLeft());

		if (prefersReducedMotion()) {
			scroller.scrollLeft = target;
			syncScrollState?.();
			return;
		}

		const startLeft = scroller.scrollLeft;
		const delta = target - startLeft;
		const start = performance.now();
		const dist = Math.abs(delta);
		const dur =
			durationMs ??
			// Slow, distance-aware duration so the nav feels consistent across jumps.
			// (Tune these values to taste.)
			clamp(1000 + dist * 0.35, 1100, 2600);

		const tick = (now: number) => {
			const t = Math.min(1, (now - start) / dur);
			// Use an ease-in-out so it doesn't "snap" at the beginning.
			scroller!.scrollLeft = clamp(
				startLeft + delta * easeInOutPow(t, 3),
				0,
				getMaxScrollLeft()
			);
			syncScrollState?.();
			if (t < 1) scrollAnim = requestAnimationFrame(tick);
			else scrollAnim = null;
		};

		scrollAnim = requestAnimationFrame(tick);
	}

	function scrollToPanel(id: string) {
		if (isCardModalOpen()) return;
		if (!scroller) return;
		const el = document.getElementById(id);
		if (!el) return;
		smoothScrollTo(el.offsetLeft);
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

		const clampScroller = () => {
			if (!scroller) return;
			scroller.scrollLeft = clamp(scroller.scrollLeft, 0, getMaxScrollLeft());
		};

		const measure = () => {
			if (!scroller) return;
			panelW = scroller.clientWidth || window.innerWidth;
			panelOffsets = panels.map((_, i) => panelTrackLeft(i, panels.length));
			scrollTrackW = Math.max(
				RIBBON_RENDER_WIDTH_PX,
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
			sectionNavCmp?.syncScrollRevealed(x);
			if (panelOffsets.length === 0) return;

			let i = 0;
			while (i < panelOffsets.length - 1 && x >= panelOffsets[i + 1]) i++;
			const next = Math.min(i + 1, panelOffsets.length - 1);
			const start = panelOffsets[i];
			const end = panelOffsets[next];
			const t = end === start ? 0 : Math.max(0, Math.min(1, (x - start) / (end - start)));

			const progressIndex = i + t;
			sectionNavCmp?.setProgressIndex(progressIndex);
			const nextActiveId = panels[Math.round(progressIndex)]?.id ?? activePanelRef.id;
			sectionNavCmp?.setActiveId(nextActiveId);
			if (nextActiveId !== activePanelRef.id) activePanelRef.id = nextActiveId;

			// Per-panel animation progress (used for Experiences card fan-in)
			if (expIdx !== -1 && panelOffsets[expIdx] != null) {
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

			// Education: fan / stack over ~1s once scroll crosses threshold (either direction).
			if (eduIdx !== -1 && panelOffsets[eduIdx] != null) {
				const threshold = eduSpreadThreshold(panelOffsets[eduIdx]!);
				animateEduSpreadTo(x >= threshold ? 1 : 0);
			} else {
				cancelEduSpreadAnim();
				eduSpreadTarget = 0;
				setEduT(0);
			}

		};

		let lastX = 0;
		let lastT = performance.now();
		let ticking = false;
		const onScroll = () => {
			if (ticking) return;
			ticking = true;
			requestAnimationFrame(() => {
				const now = performance.now();
				lastX = scroller!.scrollLeft;
				lastT = now;
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
			// Allow Awards arc to handle wheel only when hovering a card.
			const target = e.target as HTMLElement | null;
			if (target?.closest?.('.award-card-surface')) return;

			if (!scroller) return;
			const maxScroll = getMaxScrollLeft();
			const cur = scroller.scrollLeft;

			const absX = Math.abs(e.deltaX);
			const absY = Math.abs(e.deltaY);

			// Horizontal trackpad / shifted-axis: let the browser scroll (enables momentum + rubber-band at ends).
			if (absX > 0 && absX >= absY) {
				cancelScrollAnim();
				return;
			}

			// Vertical wheel → horizontal (must intercept so the page doesn’t scroll vertically).
			e.preventDefault();
			cancelScrollAnim();
			const next = clamp(cur + e.deltaY, 0, maxScroll);
			scroller.scrollTo({ left: next, top: 0, behavior: 'auto' });
		};

		const onModalScrollLock = () => {
			if (!isCardModalOpen() || !scroller) return;
			if (scroller.scrollLeft !== 0) scroller.scrollLeft = 0;
		};

		const onScrollLock = () => {
			if (!greetingScrollLocked) return;
			if (!scroller) return;
			if (scroller.scrollLeft !== 0) scroller.scrollLeft = 0;
		};

		const keyLock = (e: KeyboardEvent) => {
			if (isCardModalOpen()) {
				e.preventDefault();
				return;
			}
			if (!greetingScrollLocked) return;
			// Prevent keys that can trigger scroll.
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
		const resetToTitle = () => scroller?.scrollTo({ left: 0, top: 0, behavior: 'auto' });
		resetToTitle();
		requestAnimationFrame(resetToTitle);
		setTimeout(resetToTitle, 50);
		lastX = scroller.scrollLeft;
		lastT = performance.now();
		updateProgress();
		sectionNavCmp?.setActiveId(activePanelRef.id);
		syncScrollState = updateProgress;

		scroller.addEventListener('wheel', wheel, { passive: false });
		scroller.addEventListener('scroll', onScroll, { passive: true });
		scroller.addEventListener('scroll', onScrollLock, { passive: true });
		scroller.addEventListener('scroll', onModalScrollLock, { passive: true });
		window.addEventListener('keydown', keyLock);
		window.addEventListener('resize', () => {
			measure();
			updateProgress();
		});

		return () => {
			scroller?.removeEventListener('wheel', wheel as EventListener);
			scroller?.removeEventListener('scroll', onScroll);
			scroller?.removeEventListener('scroll', onScrollLock);
			scroller?.removeEventListener('scroll', onModalScrollLock);
			window.removeEventListener('keydown', keyLock);
			cancelScrollAnim();
			cancelEduSpreadAnim();
			syncScrollState = undefined;
		};
	});

</script>

<div class="stage" class:intro-locked={greetingScrollLocked}>
	<!-- Fixed to the stage (not the zooming scroll-track) so blobs don't clip/flicker on modal zoom. -->
	<div class="scroller-wash" aria-hidden="true"></div>
	<main
		class="scroller"
		bind:this={scroller}
		aria-label="Horizontally scrolling panels"
	>
		<div class="scroll-track" style:width={`${scrollTrackW}px`}>
			<!-- Scrolls natively with the strip (no JS pan); sits above wash, below panels. -->
			<Ribbon bind:this={ribbonCmp} />

			{#each panels as panel, i}
				<section
					id={panel.id}
					class="panel"
					aria-label={panel.title}
					style:left={`${panelTrackLeft(i, panels.length)}px`}
				>
				{#if panel.id === 'greeting'}
					<TitlePanel
						kicker={panel.kicker}
						title={panel.title}
						body={panel.body}
						{linkedinHref}
						{githubHref}
						{emailHref}
						bind:scrollLocked={greetingScrollLocked}
						onUnlock={() => syncScrollState?.()}
					/>
				{:else}
					<div class="panel-inner">
						{#if panel.id === 'experiences'}
							<ExperiencesPanel kicker={panel.kicker} title={panel.title} body={panel.body} />
						{:else if panel.id === 'education'}
							<EducationPanel kicker={panel.kicker} title={panel.title} body={panel.body} />
						{:else if panel.id === 'projects'}
							<ProjectsPanel kicker={panel.kicker} title={panel.title} body={panel.body} />
						{:else if panel.id === 'awards'}
							<AwardsPanel kicker={panel.kicker} title={panel.title} body={panel.body} />
						{:else if panel.id === 'interests'}
							<InterestsPanel
								kicker={panel.kicker}
								title={panel.title}
								body={panel.body}
								{sourceCodeHref}
							/>
						{/if}
					</div>
				{/if}
			</section>
		{/each}
		</div>
	</main>

	<SectionNav
		bind:this={sectionNavCmp}
		{panels}
		scrollLocked={greetingScrollLocked}
		onSelect={scrollToPanel}
	/>
</div>

<style>
	.stage {
		position: relative;
		height: 100vh;
		width: 100vw;
		overflow: hidden;
		overscroll-behavior: none;
		/* Shared sizing vars for ContactFanout + panel padding */
		--menu-pad: 8px;
		--menu-control-h: 34px;
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
	}

	/* During the greeting intro, keep contact invisible */
	.intro-locked :global(.greeting-contact) {
		opacity: 0;
		transform: translateY(-10px);
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
		padding: calc(18px + (var(--menu-control-h) + (var(--menu-pad) * 2)) + 110px) 18px 24px;
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
		--projects-lift: 130px;
		bottom: var(--projects-lift);
	}

	.panel-inner {
		width: min(860px, 100%);
		border: 1px solid var(--card-border);
		background: var(--card-strong);
		backdrop-filter: blur(calc(var(--glass-blur) + 4px));
		border-radius: 24px;
		padding: 28px;
		box-shadow: var(--shadow);
		position: relative;
		z-index: 4;
	}

	#experiences.panel .panel-inner {
		width: min(1200px, 100%);
		border: 0;
		background: transparent;
		backdrop-filter: none;
		box-shadow: none;
		padding: 0;
	}

	#education.panel .panel-inner {
		width: min(980px, 100%);
		border: 0;
		background: transparent;
		backdrop-filter: none;
		box-shadow: none;
		padding: 28px;
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

	#interests.panel {
		place-items: start end;
		padding-right: 0;
	}

	#interests.panel .panel-inner {
		position: absolute;
		inset: 0;
		width: 100%;
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
</style>
