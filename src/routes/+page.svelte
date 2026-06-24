<svelte:options runes={false} />

<script lang="ts">
	import { onMount } from 'svelte';
	import ContactFanout from '$lib/ContactFanout.svelte';
	import Ribbon from '$lib/Ribbon.svelte';
	import SectionNav from '$lib/SectionNav.svelte';
	import { GREETING_SCROLL_UNLOCK_MS, panelTrackLeft, RIBBON_RENDER_WIDTH_PX } from '$lib/ribbon';
	import InfoCard from '$lib/InfoCard.svelte';
	import AwardsArc from '$lib/AwardsArc.svelte';
	import ProjectSelect from '$lib/ProjectSelect.svelte';
	import Polaroid from '$lib/Polaroid.svelte';
	import type { Project } from '$lib/projects';
	import chessPhoto from '$lib/assets/chess.jpg';
	import billiardsPhoto from '$lib/assets/billiards.png';
	import skiingPhoto from '$lib/assets/skiing.jpg';
	import scubaPhoto from '$lib/assets/scuba.jpg';
	import tableTennisPhoto from '$lib/assets/table_tennis.jpg';
	import baiLogo from '$lib/assets/experience/bai_logo.jpg';
	import cestaLogo from '$lib/assets/experience/CESTA_logo.jpg';
	import ccLogo from '$lib/assets/experience/cc_logo.jpg';
	import sdLogo from '$lib/assets/experience/sd_logo.jpg';
	import bishopsLogo from '$lib/assets/education/bishops_logo.png';
	import stanfordLogo from '$lib/assets/education/stanford_logo.png';

	type Panel = {
		id: string;
		title: string;
		navTitle?: string;
		kicker?: string;
		body: string;
	};

	type Experience = {
		company: string;
		location: string;
		title: string;
		dates: string;
		highlights: string[];
		logoSrc: string;
		logoAlt: string;
	};

	type Education = {
		school: string;
		location: string;
		degree: string;
		dates: string;
		details: string[];
		logoSrc: string;
		logoAlt: string;
	};

	const MONTH_ABBREV: Record<string, string> = {
		January: 'Jan',
		February: 'Feb',
		March: 'Mar',
		April: 'Apr',
		May: 'May',
		June: 'Jun',
		July: 'Jul',
		August: 'Aug',
		September: 'Sep',
		October: 'Oct',
		November: 'Nov',
		December: 'Dec'
	};

	function abbreviateMonths(input: string) {
		return input.replace(
			/\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/g,
			(m) => MONTH_ABBREV[m] ?? m
		);
	}

	const experiences: Experience[] = [
		{
			company: 'CESTA',
			location: 'Stanford, CA',
			title: 'Undergraduate Researcher',
			dates: 'June 2026 - Aug 2026',
			highlights: [
				'Researching AI-human coauthorship through computational discourse analysis while developing policy frameworks for hybrid writing.'
			],
			logoSrc: cestaLogo,
			logoAlt: 'CESTA logo'
		},
		{
			company: 'Benevolent AI',
			location: 'London, England',
			title: 'Research Intern',
			dates: 'June 2025 - Aug 2025',
			highlights: [
				'Working on AI and biotech research, analyzing product-fit within the evolving biotech landscape and potential areas for innovation.'
			],
			logoSrc: baiLogo,
			logoAlt: 'Benevolent AI logo'
		},
		{
			company: 'Castle Creek Capital',
			location: 'San Diego, CA',
			title: 'Investment Analytics',
			dates: 'June 2024 - September 2024',
			highlights: [
				'Assisted with financial modeling and analysis in small community banks across the U.S. for eventual presentation to management.'
			],
			logoSrc: ccLogo,
			logoAlt: 'Castle Creek Capital logo'
		},
		{
			company: 'City of San Diego',
			location: 'San Diego, CA',
			title: 'Youth Commissioner',
			dates: 'October 2021 - June 2023',
			highlights: [
				'Represented District 3 on the city’s Youth Commission, advising on programs and policies affecting young people in San Diego.'
			],
			logoSrc: sdLogo,
			logoAlt: 'City of San Diego logo'
		}
	];

	const educations: Education[] = [
		{
			school: 'Stanford University',
			location: 'Stanford CA',
			degree: 'Data Science [BS]',
			dates: 'September 2023 - Present',
			details: [
				'Coursework in probability, statistics, computer science, and data-driven decision making. Focused on applied machine learning and data analysis.'
			],
			logoSrc: stanfordLogo,
			logoAlt: 'Stanford logo'
		},
		{
			school: 'The Bishops School',
			location: 'San Diego CA',
			degree: 'HS Diploma',
			dates: 'August 2017 - June 2023',
			details: [
				'Graduated Cum Laude; Coursework in advanced mathematics, computer science, and economics. [GPA: 4.82]'
			],
			logoSrc: bishopsLogo,
			logoAlt: "The Bishop's School logo"
		}
	];

	type AwardItem = {
		heading: string;
		subheading: string;
		items: string[];
	};

	const awards: AwardItem[] = [
		{
			heading: 'Oracle Java 8 SE Programmer',
			subheading: 'Certification',
			items: ['Certified Professional for Proficiency in Java']
		},
		{
			heading: 'International Youth Leader of the Year',
			subheading: 'Recognition',
			items: ['Honored by the IRC for founding Kid By Kid']
		},
		{
			heading: 'Daily Point of Light Honoree',
			subheading: 'National recognition',
			items: ['National recognition for volunteer leadership']
		},
		{
			heading: 'National Merit Scholarship Finalist',
			subheading: 'Academic honor',
			items: ['Top 1% of 1.5M PSAT/NMSQT takers globally']
		}
	];

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

	const projects: Project[] = [
		{
			id: 'project-1',
			name: 'Kid By Kid',
			blurb: 'Paired Hundreds of Tutors and Learners through 13,000+ Hours of 1-on-1 Tutoring',
			description:
				'Through free online one-on-one tutoring, Kid By Kid Middle and High School student Mentors work with under-served Elementary and Middle School-aged immigrant, refugee, and ESL Learners to provide life-changing academic opportunity, and support.',
			highlights: ['13,000+ hours of 1-on-1 tutoring', 'Hundreds of tutor/learner matches', 'Free online tutoring for underserved students'],
			tech: ['Nonprofit leadership', 'Program design', 'Volunteer operations'],
			links: [
				{ label: 'Website', href: 'https://kidbykid.org' }
			]
		},
		{
			id: 'project-2',
			name: 'ConfCap',
			blurb: 'Designed and Built a Conference Bounty App from Ground Up',
			description:
				'ConfCap is a media capturing software that distributes real bounties to conference attendees who submit papers and presentations. ⚠️ WIP ⚠️'
		},
		{
			id: 'project-3',
			name: 'Rise South City',
			blurb: 'Redesigning the AQI Data Pipeline for SSF',
			description:
				'As part of an ongoing partnership with Rise South City, I have recently built a ground-up pipeline of gathering air quality information from the San Francisco PurpleAir sensors. ⚠️ WIP ⚠️'
		}
	];

	const interests: { caption: string; subtitle?: string }[] = [
		{
			caption: 'PADI Certified Diver'
		},
		{ caption: 'Skiing' },
		{ caption: 'Chess' },
		{ caption: 'Table Tennis' },
		{ caption: 'Billiards' }
	];

	let scroller: HTMLElement | null = null;
	/** Non-reactive: panel switches must not re-render the whole page (see setNavAriaCurrent). */
	const activePanelRef = { id: panels[0]?.id ?? 'home' };
	let scrollAnim: number | null = null;
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
	let ribbonScrollTrackW = RIBBON_RENDER_WIDTH_PX;
	let scrollTrackW = RIBBON_RENDER_WIDTH_PX;

	// Greeting (title slide) intro timeline
	let greetingTimelineOn = false;
	let greetingDotsOn = false;
	let greetingDotsTimer: number | null = null;
	let greetingScrollLocked = true;

	// Contact links
	const linkedinHref = 'https://www.linkedin.com/in/daxton-gutekunst/';
	const githubHref = 'https://github.com/DaxGute';
	const sourceCodeHref = 'https://github.com/DaxGute/personal-website';
	const emailHref = 'mailto:daxton@gutekunst.com';

	function prefersReducedMotion() {
		return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	// Experience cards: subtle magnetic pull toward the cursor (panel-level tracking).
	const EXP_MAGNET_RADIUS = 280;
	const EXP_MAGNET_STRENGTH = 0.22;
	const EXP_MAGNET_MAX_PX = 24;

	function updateExperienceMagnet(panel: HTMLElement, clientX: number, clientY: number) {
		const cards = panel.querySelectorAll<HTMLElement>('.experience-item .info-card');
		for (const card of cards) {
			const r = card.getBoundingClientRect();
			const cx = r.left + r.width * 0.5;
			const cy = r.top + r.height * 0.5;
			const dx = clientX - cx;
			const dy = clientY - cy;
			const dist = Math.hypot(dx, dy);

			if (dist > EXP_MAGNET_RADIUS) {
				card.style.setProperty('--mag-x', '0px');
				card.style.setProperty('--mag-y', '0px');
				continue;
			}

			const t = 1 - dist / EXP_MAGNET_RADIUS;
			const pull = t * t * EXP_MAGNET_STRENGTH;
			let mx = dx * pull;
			let my = dy * pull;
			const mag = Math.hypot(mx, my);
			if (mag > EXP_MAGNET_MAX_PX) {
				const s = EXP_MAGNET_MAX_PX / mag;
				mx *= s;
				my *= s;
			}

			card.style.setProperty('--mag-x', `${mx.toFixed(2)}px`);
			card.style.setProperty('--mag-y', `${my.toFixed(2)}px`);
		}
	}

	function resetExperienceMagnet(panel: HTMLElement | null) {
		panel?.querySelectorAll<HTMLElement>('.experience-item .info-card').forEach((card) => {
			card.style.setProperty('--mag-x', '0px');
			card.style.setProperty('--mag-y', '0px');
		});
	}

	function splitTitle(title: string): { first: string; last: string } {
		const parts = (title ?? '')
			.trim()
			.split(/\s+/g)
			.filter(Boolean);
		if (parts.length <= 1) return { first: parts[0] ?? title ?? '', last: '' };
		return { first: parts[0] ?? '', last: parts.slice(1).join(' ') };
	}

	function splitSuffixFade(text: string, suffix: string): { prefix: string; fade: string } {
		const t = (text ?? '').trim();
		const s = (suffix ?? '').trim();
		if (!t || !s) return { prefix: t, fade: '' };
		if (t.toLowerCase().endsWith(s.toLowerCase())) {
			return { prefix: t.slice(0, -s.length), fade: t.slice(-s.length) };
		}
		return { prefix: t, fade: '' };
	}

	function splitHeadFadeRest(text: string, headChars = 1): { head: string; fade: string } {
		const t = (text ?? '').trim();
		const n = Math.max(0, Math.min(t.length, Math.floor(headChars)));
		return { head: t.slice(0, n), fade: t.slice(n) };
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
			if (t < 1) scrollAnim = requestAnimationFrame(tick);
			else scrollAnim = null;
		};

		scrollAnim = requestAnimationFrame(tick);
	}

	function scrollToPanel(id: string) {
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
			ribbonScrollTrackW = scrollTrackW;
			ribbonCmp?.syncLayout(scrollTrackW);

			clampScroller();
		};

		const updateProgress = () => {
			if (!scroller) return;
			clampScroller();
			const x = scroller!.scrollLeft;
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
				const shiftPx = (panelW || denom || window.innerWidth) * 0.78;
				const start = expStart - shiftPx;
				// Let the animation "finish" a bit later than the panel boundary.
				const tailPx = (panelW || denom || window.innerWidth) * 0.5;
				const end = expEnd - shiftPx + tailPx;
				const linearT = end === start ? 1 : clamp01((x - start) / (end - start));
				experiencesPanelEl?.style.setProperty('--exp-t', `${easeOutCubic(linearT)}`);
			}

			// Education: stacked -> pull apart (Stanford left, Bishops right).
			if (eduIdx !== -1 && panelOffsets[eduIdx] != null) {
				const eduStart = panelOffsets[eduIdx];

				// Drive the animation for the entire time the Education panel is visible:
				// from when its left edge first enters the viewport (x = eduStart - panelW)
				// until its right edge leaves the viewport (x = eduStart + panelW).
				const w = panelW || window.innerWidth;
				const visibleStart = eduStart - w;
				const visibleEnd = eduStart + w;
				const span = visibleEnd - visibleStart;
				const eduLinearT = span <= 0 ? 0 : clamp01((x - visibleStart) / span);
				educationPanelEl?.style.setProperty('--edu-t', `${easeInOutPow(eduLinearT, 3)}`);
			} else {
				educationPanelEl?.style.setProperty('--edu-t', `0`);
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

		const onScrollLock = () => {
			if (!greetingScrollLocked) return;
			if (!scroller) return;
			if (scroller.scrollLeft !== 0) scroller.scrollLeft = 0;
		};

		const keyLock = (e: KeyboardEvent) => {
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

		// Greeting slide staged animations:
		// - last name fades/slides in
		// - kicker fades/slides
		// - "scroll to continue" fades/slides
		// - dots start jumping after everything else (~1.75s)
		requestAnimationFrame(() => {
			greetingTimelineOn = true;
			if (prefersReducedMotion()) {
				greetingDotsOn = true;
				greetingScrollLocked = false;
				updateProgress();
				return;
			}
			greetingDotsTimer = window.setTimeout(() => {
				greetingDotsOn = true;
				greetingScrollLocked = false;
				updateProgress();
			}, GREETING_SCROLL_UNLOCK_MS);
		});

		scroller.addEventListener('wheel', wheel, { passive: false });
		scroller.addEventListener('scroll', onScroll, { passive: true });
		scroller.addEventListener('scroll', onScrollLock, { passive: true });
		window.addEventListener('keydown', keyLock);
		window.addEventListener('resize', () => {
			measure();
			updateProgress();
		});

		const hoverCapable =
			typeof window !== 'undefined' &&
			window.matchMedia('(hover: hover) and (pointer: fine)').matches;
		let magnetRaf: number | null = null;
		let magnetX = 0;
		let magnetY = 0;

		const onExpPointerMove = (e: PointerEvent) => {
			if (!experiencesPanelEl || !hoverCapable || prefersReducedMotion()) return;
			magnetX = e.clientX;
			magnetY = e.clientY;
			if (magnetRaf != null) return;
			magnetRaf = requestAnimationFrame(() => {
				magnetRaf = null;
				if (experiencesPanelEl) updateExperienceMagnet(experiencesPanelEl, magnetX, magnetY);
			});
		};

		const onExpPointerLeave = () => {
			if (magnetRaf != null) {
				cancelAnimationFrame(magnetRaf);
				magnetRaf = null;
			}
			resetExperienceMagnet(experiencesPanelEl);
		};

		if (experiencesPanelEl && hoverCapable && !prefersReducedMotion()) {
			experiencesPanelEl.addEventListener('pointermove', onExpPointerMove, { passive: true });
			experiencesPanelEl.addEventListener('pointerleave', onExpPointerLeave, { passive: true });
		}

		return () => {
			scroller?.removeEventListener('wheel', wheel as EventListener);
			scroller?.removeEventListener('scroll', onScroll);
			scroller?.removeEventListener('scroll', onScrollLock);
			window.removeEventListener('keydown', keyLock);
			cancelScrollAnim();
			if (greetingDotsTimer != null) window.clearTimeout(greetingDotsTimer);
			greetingDotsTimer = null;
			if (magnetRaf != null) cancelAnimationFrame(magnetRaf);
			experiencesPanelEl?.removeEventListener('pointermove', onExpPointerMove as EventListener);
			experiencesPanelEl?.removeEventListener('pointerleave', onExpPointerLeave as EventListener);
			resetExperienceMagnet(experiencesPanelEl);
		};
	});

</script>

<div class="stage" class:intro-locked={greetingScrollLocked}>
	<main
		class="scroller"
		bind:this={scroller}
		aria-label="Horizontally scrolling panels"
	>
		<div class="scroll-track" style:width={`${scrollTrackW}px`}>
			<!-- Scrolls natively with the strip (no JS pan); sits above wash, below panels. -->
			<Ribbon bind:this={ribbonCmp} />
			<!-- Full-width wash scrolls with panels; scroller bg is transparent so ribbon can sit above wash, below panels. -->
			<div class="scroller-wash" aria-hidden="true" style:width={`${ribbonScrollTrackW}px`}></div>

			{#each panels as panel, i}
				<section
					id={panel.id}
					class="panel"
					aria-label={panel.title}
					style:left={`${panelTrackLeft(i, panels.length)}px`}
				>
				{#if panel.id === 'greeting'}
					{@const parts = splitTitle(panel.title)}
					{@const firstParts = splitSuffixFade(parts.first, 'ton')}
					{@const lastParts = splitHeadFadeRest(parts.last, 1)}
					<div class="greeting-layout">
						<div class="greeting-contact">
							<ContactFanout {linkedinHref} {githubHref} {emailHref} />
						</div>
						<div class="greeting" class:greeting--animate={greetingTimelineOn}>
							{#if panel.kicker}
								<p class="kicker greeting-kicker">{panel.kicker}</p>
							{/if}
							<h1 class="title title--greeting">
								<span class="title-first"
									><span class="first-static">{firstParts.prefix}</span
									>{#if firstParts.fade}<span class="first-fade">{firstParts.fade}</span>{/if}</span
								>{#if parts.last}<span class="title-last"><span class="last-g">{lastParts.head}</span><span class="last-fade">{lastParts.fade}</span></span>{/if}
							</h1>
							<p class="body greeting-body">
								{panel.body}<span class="jump-dots" class:jump-dots--on={greetingDotsOn} aria-hidden="true"
									><span>.</span><span>.</span><span>.</span></span
								>
							</p>
						</div>
					</div>
				{:else}
					<div class="panel-inner">
						{#if panel.id === 'projects'}
							<div class="projects-select projects-select--top">
								<ProjectSelect projects={projects} initialId={projects[0]?.id ?? null} />
							</div>
						{/if}

						{#if panel.id !== 'awards'}
							{#if panel.id === 'interests'}
								<div class="interests-copy">
									{#if panel.kicker}
										<p class="kicker">{panel.kicker}</p>
									{/if}
									<h1 class="title">{panel.title}</h1>
									<p class="body">{panel.body}</p>
								</div>
							{:else}
								{#if panel.kicker}
									<p class="kicker">{panel.kicker}</p>
								{/if}
								<h1 class="title">{panel.title}</h1>

								<p class="body">{panel.body}</p>
							{/if}
						{/if}

						{#if panel.id === 'experiences'}
							<ul class="experience-list" aria-label="Jobs and internships list">
								{#each experiences as exp}
									<li class="experience-item">
										<InfoCard
											variant="experience"
											heading={exp.company}
											subheading={`${exp.title} · ${exp.location}`}
											dates={abbreviateMonths(exp.dates)}
											items={exp.highlights}
											logoSrc={exp.logoSrc}
											logoAlt={exp.logoAlt}
										/>
									</li>
								{/each}
							</ul>
						{/if}

						{#if panel.id === 'education'}
							<div
								class="education-carousel"
								aria-label="Education carousel"
							>
								{#each educations.slice(0, 2) as edu (edu.school)}
									<article
										class="education-card"
										class:is-stanford={edu.school === 'Stanford University'}
									>
										<InfoCard
											variant="education"
											heading={edu.school}
											subheading={`${edu.degree} · ${edu.location}`}
											dates={abbreviateMonths(edu.dates)}
											items={edu.details}
											logoSrc={edu.logoSrc}
											logoAlt={edu.logoAlt}
										/>
									</article>
								{/each}
							</div>
						{/if}

						{#if panel.id === 'awards'}
							<AwardsArc
								kicker={panel.kicker}
								title={panel.title}
								body={panel.body}
								awards={awards}
								repeatFactor={3}
							/>
						{/if}

						{#if panel.id === 'interests'}
							<div class="interests-content" aria-label="Interests">
								<div class="interest-ski" aria-label="Skiing">
									<Polaroid
										src={skiingPhoto}
										alt="Skiing"
										caption={interests[1]?.caption ?? 'Skiing'}
										subtitle={interests[1]?.subtitle ?? null}
									/>
								</div>

								<div class="interest-chess" aria-label="Chess">
									<Polaroid
										src={chessPhoto}
										alt="Chess"
										caption={interests[2]?.caption ?? 'Chess'}
										subtitle={interests[2]?.subtitle ?? null}
									/>
								</div>

								<div class="interest-padi" aria-label="PADI Certified Diver">
									<Polaroid
										src={scubaPhoto}
										alt="PADI Certified Diver"
										revealRootMargin="0px -15% 0px -15%"
										revealThreshold={0}
										caption={interests[0]?.caption ?? 'PADI Certified Diver'}
										subtitle={interests[0]?.subtitle ?? null}
									/>
								</div>

								<div class="interest-tt" aria-label="Table Tennis">
									<Polaroid
										src={tableTennisPhoto}
										alt="Table Tennis"
										caption={interests[3]?.caption ?? 'Table Tennis'}
										subtitle={interests[3]?.subtitle ?? null}
									/>
								</div>

								<div class="interest-billiards" aria-label="Billiards">
									<Polaroid
										src={billiardsPhoto}
										alt="Billiards"
										caption={interests[4]?.caption ?? 'Billiards'}
										subtitle={interests[4]?.subtitle ?? null}
									/>
								</div>

								{#if interests.length > 5}
									<div class="interests-grid" aria-label="Interests grid">
										{#each interests.slice(5) as item (item.caption)}
											<Polaroid src={null} caption={item.caption} subtitle={item.subtitle ?? null} />
										{/each}
									</div>
								{/if}
							</div>
						{/if}

					{#if panel.id !== 'experiences' && panel.id !== 'education' && panel.id !== 'projects' && panel.id !== 'awards' && panel.id !== 'interests'}
							<div class="card">
								<p class="card-title">Edit me:</p>
								<p class="card-body">
									Open <code>src/routes/+page.svelte</code> and replace the placeholder copy with your real
									content.
								</p>
							</div>
						{/if}
					</div>
				{/if}
				{#if panel.id === 'interests'}
					<div class="repo-note">
						<span>Like my website? The code can be found </span>
						<a class="repo-note__link" href={sourceCodeHref} target="_blank" rel="noreferrer">here</a>
						<span>.</span>
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
		height: 100vh;
		width: 100vw;
		overflow-x: auto;
		overflow-y: hidden;
		display: flex;
		background: transparent;
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

	.scroller-wash {
		position: absolute;
		left: 0;
		top: 0;
		height: 100%;
		min-height: 100%;
		z-index: 0;
		pointer-events: none;
		background:
			radial-gradient(1000px 520px at 20% 20%, rgba(124, 58, 237, 0.14), transparent 58%),
			radial-gradient(900px 500px at 80% 30%, rgba(34, 211, 238, 0.12), transparent 60%),
			radial-gradient(900px 700px at 50% 90%, rgba(16, 185, 129, 0.1), transparent 62%),
			var(--bg);
		background-repeat: no-repeat;
	}

	/* hide scrollbars without disabling scrolling */
	.scroller {
		scrollbar-width: none; /* Firefox */
	}
	.scroller::-webkit-scrollbar {
		display: none; /* Chrome/Safari */
	}

	/* During the greeting intro, keep contact invisible */
	.intro-locked .greeting-contact {
		opacity: 0;
		transform: translateY(-10px);
	}

	.greeting-contact {
		flex: 0 0 auto;
		align-self: center;
		pointer-events: auto;
		opacity: 1;
		transform: translateY(0);
		transition:
			opacity 1200ms cubic-bezier(0.16, 1, 0.3, 1),
			transform 1200ms cubic-bezier(0.16, 1, 0.3, 1);
	}

	.greeting-contact :global(.contact-menu) {
		transform-origin: center left;
	}

	.panel {
		position: absolute;
		top: 0;
		width: 100vw;
		height: 100vh;
		display: grid;
		/* Keep content below the top-right diagonal contact bubbles */
		place-items: start center;
		padding: calc(18px + (var(--menu-control-h) + (var(--menu-pad) * 2)) + 110px) 18px 24px;
		z-index: 3;
	}

	/* Move the Experiences box up a bit (slightly less top clearance than other panels). */
	#experiences.panel {
		padding-top: calc(18px + (var(--menu-control-h) + (var(--menu-pad) * 2)) + 70px);
	}

	/* Projects: move the whole glass box up via a bottom offset (instead of changing slide padding). */
	#projects.panel {
		/* Lift Projects above other panel content/decoration layers (but keep below dots at z=10). */
		z-index: 6;
	}

	/* Education cards can visually spill into Projects; keep them hoverable */
	#education.panel {
		z-index: 7;
		/* Prevent the education cards from rendering into the Projects panel. */
		overflow: hidden; /* fallback */
		overflow: clip;
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

	/* Flatten the Experiences slide (no glass box) */
	#experiences.panel .panel-inner {
		/* allow the absolute-positioned boxes to spread out */
		width: min(1200px, 100%);
		border: 0;
		background: transparent;
		backdrop-filter: none;
		box-shadow: none;
		padding: 0;
	}

	/* Education slide: no outer glass box (only the two cards) */
	#education.panel .panel-inner {
		width: min(980px, 100%);
		border: 0;
		background: transparent;
		backdrop-filter: none;
		box-shadow: none;
		padding: 28px;
	}

	/* Awards slide: no outer glass box */
	#awards.panel .panel-inner {
		/* Fill the entire slide so AwardsArc can position relative to the viewport. */
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

	/* Interests slide: no outer glass box */
	#interests.panel .panel-inner {
		border: 0;
		background: transparent;
		backdrop-filter: none;
		box-shadow: none;
		padding: 0;
	}

	/* Interests slide: right-align and anchor to the right edge */
	#interests.panel {
		place-items: start end;
		padding-right: 0;
	}

	#interests.panel .panel-inner {
		/* Fill the entire slide for absolute positioning */
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
		/* take up the entire slide */
		position: absolute;
		inset: 0;
		z-index: 1;

		/* size should be a percent (with min/max guardrails) */
		--float-card-w: clamp(180px, 22%, 260px);
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

	@media (max-width: 1100px) {
		.interests-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}

	@media (max-width: 720px) {
		.interests-copy {
			right: auto;
			left: 50%;
			transform: translateX(-50%);
			top: clamp(90px, 12vh, 140px);
			text-align: center;
		}
		.interests-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 460px) {
		.interests-grid {
			grid-template-columns: 1fr;
		}
	}

	/* Awards slide: center content block in the middle of the panel */
	#awards.panel {
		place-items: center;
		/* Override the global top-heavy padding so this slide can actually center vertically. */
		padding: 0;
	}

	.kicker {
		margin: 0 0 10px;
		color: var(--muted);
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		font-size: 12px;
	}

	/* Nudge only the greeting kicker (“Stanford ’27”) down slightly */
	.greeting .kicker {
		margin-top: 20px;
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

	.card {
		border-radius: 16px;
		border: 1px solid var(--card-border);
		background: var(--card);
		padding: 14px 14px;
	}

	/* Experiences */
	.experience-list {
		list-style: none;
		margin: 0 0 18px;
		padding: 0;
		display: grid;
		gap: 16px;
	}

	/* Education: stacked cards that pull apart on scroll */
	.education-carousel {
		position: relative;
		isolation: isolate;
		/* Keep cards square while staying responsive */
		--edu-card-size: clamp(260px, 46vw, 420px);
		/* How far the cards separate at t=1 */
		--edu-split: clamp(180px, 22vw, 380px);
		/* Base offset so the stacked start sits further left */
		--edu-base-x: clamp(-240px, -11vw, -110px);
		/* Small vertical separation while stacked */
		--edu-stack-sep: 16px;
		width: min(980px, 100%);
		height: var(--edu-card-size);
		margin: 18px auto 0;
		top: -100px;
		left: 0;
		/* 0..1 from scroll (set on #education.panel) */
		--t: var(--edu-t, 0);
	}

	.education-card {
		position: absolute;
		top: 0;
		left: 50%;
		width: var(--edu-card-size);
		height: var(--edu-card-size);
		margin: 0;
		transform: translate3d(-50%, 0, 0);
		will-change: transform;
	}

	/* Stanford starts visually on top */
	.education-card.is-stanford {
		z-index: 2;
		transform: translate3d(-50%, 0, 0)
			/* both move right; Stanford moves farther */
			translateX(calc(var(--edu-base-x) + (var(--edu-split) * var(--t) * 1.9)))
			translateY(calc(-1 * var(--edu-stack-sep) * (1 - var(--t))))
			translateZ(0);
	}

	/* Bishops starts underneath, then separates right */
	.education-card:not(.is-stanford) {
		z-index: 1;
		transform: translate3d(-50%, 0, 0)
			translateX(calc(var(--edu-base-x) + (var(--edu-split) * var(--t) * 0.75)))
			translateY(calc(var(--edu-stack-sep) * (1 - var(--t))))
			translateZ(0);
	}

	/* On hover, bring the hovered school above the other card */
	.education-card:hover {
		z-index: 5;
	}

	@media (prefers-reduced-motion: reduce) {
		.education-carousel {
			width: min(980px, 100%);
			height: auto;
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 18px;
			top: 0;
			left: 0;
		}

		.education-card {
			position: relative;
			left: auto;
			width: 100%;
			aspect-ratio: 1 / 1;
			transform: none;
			height: auto;
		}
	}

	/* Experiences slide: absolute-positioned boxes (should not push the title around) */
	#experiences .experience-list {
		display: block; /* override grid since children are positioned */
		position: relative;
		margin-bottom: 0;
		margin-top: 18px;
		min-height: clamp(420px, 62vh, 620px);
	}

	.experience-item {
		/* Scroll-driven "fan-in" (0..1 progress across the slide) */
		/* All cards use the exact same start/end scroll values via --exp-t. */
		--t: var(--exp-t, 1);
		--spread-x: 0px;
		--spread-y: 0px;
		position: relative;
		z-index: 1;
		width: 100%;
		min-height: clamp(180px, 20vh, 240px);
		/* Use 2D transforms to keep backdrop-filter reliable on some browsers. */
		transform: translate3d(
			calc(var(--spread-x) * (1 - var(--t))),
			calc(var(--spread-y) * (1 - var(--t))),
			0
		);
		will-change: transform;
	}

	/* Explicit stacking order so overlapping cards don't steal hover */
	#experiences .experience-item:nth-child(1) {
		z-index: 40;
	}
	#experiences .experience-item:nth-child(2) {
		z-index: 30;
	}
	#experiences .experience-item:nth-child(3) {
		z-index: 20;
	}
	#experiences .experience-item:nth-child(4) {
		z-index: 10;
	}
	#experiences .experience-item:hover {
		z-index: 40;
	}

	/* Magnetic pull toward cursor (translate on inner card; fan-in stays on .experience-item) */
	#experiences .experience-item :global(.hover-polaroid-scale) {
		--mag-x: 0px;
		--mag-y: 0px;
		transform: translate3d(var(--mag-x), var(--mag-y), 0) scale(var(--scale, 1));
		transition: none;
	}

	@media (min-width: 720px) {
		#experiences .experience-list {
			--exp-card-w: min(520px, 46vw);
		}

		.experience-item {
			width: 50%;
			margin-inline: auto;
		}

		/* Experiences slide positions */
		#experiences .experience-item {
			position: absolute;
			width: var(--exp-card-w);
			margin: 0;
		}

		/* CESTA — bottom middle, below Castle Creek */
		#experiences .experience-item:nth-child(1) {
			--spread-x: 140px;
			--spread-y: 90px;
			top: 150px;
			left: -60px;
			right: auto;
			z-index: 5;
		}

		/* Benevolent AI — top right */
		#experiences .experience-item:nth-child(2) {
			--spread-x: -180px;
			--spread-y: -150px;
			top: -90px;
			left: calc(var(--exp-card-w) + 100px);
			right: auto;
			z-index: 5;
		}

		/* Castle Creek — middle */
		#experiences .experience-item:nth-child(3) {
			--spread-x: 0px;
			--spread-y: 120px;
			top: 0;
			left: 0;
			right: auto;
			bottom: auto;
		}

		/* City of San Diego — bottom right */
		#experiences .experience-item:nth-child(4) {
			--spread-x: 40px;
			--spread-y: 240px;
			top: 44px;
			left: calc(var(--exp-card-w) + 28px);
			right: auto;
			bottom: auto;
		}
	}

	.greeting-layout {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: clamp(28px, 4vw, 56px);
		width: min(980px, 100%);
		margin-top: 170px;
	}

	.greeting {
		width: min(860px, 100%);
		padding: 6px;
		flex: 1 1 auto;
		min-width: 0;
		--title-outer-glow:
			0 0 18px rgba(255, 255, 255, 0.9),
			0 0 36px rgba(255, 255, 255, 0.6),
			0 0 64px rgba(255, 255, 255, 0.35);
		--greeting-sub-glow:
			0 0 28px rgba(255, 255, 255, 1),
			0 0 56px rgba(255, 255, 255, 1),
			0 0 100px rgba(255, 255, 255, 0.98),
			0 0 160px rgba(255, 255, 255, 0.6);
	}

	.title--greeting {
		white-space: nowrap;
	}

	.title--greeting .first-static,
	.title--greeting .first-fade,
	.title--greeting .last-g,
	.title--greeting .last-fade {
		text-shadow: var(--title-outer-glow);
	}

	.title-first {
		display: inline-block;
	}

	.first-static {
		display: inline-block;
	}

	.first-fade {
		display: inline-block;
		opacity: 0;
		will-change: opacity;
	}

	.title-last {
		display: inline-flex;
		margin-left: 0.22em;
	}

	.last-g {
		display: inline-block;
		opacity: 0;
		transform: translateX(-14px);
		will-change: transform, opacity;
	}

	.last-fade {
		display: inline-block;
		opacity: 0;
		transform: translateX(-14px);
		will-change: transform, opacity;
	}

	.greeting-kicker,
	.greeting-body {
		opacity: 0;
		transform: translateY(10px);
		will-change: transform, opacity;
		text-shadow: var(--greeting-sub-glow);
	}

	.greeting-kicker {
		transform: translateY(-10px);
	}

	.greeting--animate .first-fade {
		animation: greetTonIn 1200ms ease-out 0ms forwards;
	}

	.greeting--animate .last-g {
		animation: greetGIn 650ms cubic-bezier(0.16, 1, 0.3, 1) 0ms forwards;
	}

	.greeting--animate .last-fade {
		animation:
			greetTonIn 1200ms ease-out 0ms forwards,
			greetSlideXIn 650ms cubic-bezier(0.16, 1, 0.3, 1) 0ms forwards;
	}

	.greeting--animate .greeting-kicker {
		animation: greetTopTextIn 420ms cubic-bezier(0.16, 1, 0.3, 1) 560ms forwards;
	}

	.greeting--animate .greeting-body {
		animation: greetContinueIn 420ms cubic-bezier(0.16, 1, 0.3, 1) 1080ms forwards;
	}

	.jump-dots {
		display: inline-flex;
		gap: 3px;
		margin-left: 4px;
	}

	.jump-dots > span {
		display: inline-block;
		transform: translateY(0);
		animation: none;
		opacity: 0.65;
	}

	.jump-dots.jump-dots--on > span {
		animation: dotJump 1s infinite ease-in-out;
	}

	.jump-dots.jump-dots--on > span:nth-child(2) {
		animation-delay: 0.12s;
	}
	.jump-dots.jump-dots--on > span:nth-child(3) {
		animation-delay: 0.24s;
	}

	@keyframes greetTonIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes greetGIn {
		from {
			opacity: 0;
			transform: translateX(-14px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	@keyframes greetSlideXIn {
		from {
			transform: translateX(-14px);
		}
		to {
			transform: translateX(0);
		}
	}

	@keyframes greetTopTextIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes greetContinueIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes dotJump {
		0%,
		80%,
		100% {
			transform: translateY(0);
			opacity: 0.65;
		}
		40% {
			transform: translateY(-6px);
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.title-first,
		.title-last,
		.greeting-kicker,
		.greeting-body {
			animation: none !important;
			opacity: 1 !important;
			transform: none !important;
		}

		.first-fade {
			opacity: 1 !important;
		}

		.last-g,
		.last-fade {
			opacity: 1 !important;
			transform: none !important;
		}

		.jump-dots > span {
			animation: none !important;
		}
	}

	.card-title {
		margin: 0 0 6px;
		font-weight: 700;
	}

	.card-body {
		margin: 0;
		color: var(--muted);
		line-height: 1.6;
	}

	.projects-select {
		margin: 12px 0 14px;
	}

	.projects-select--top {
		margin: 0 0 16px;
	}

	code {
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
			'Courier New', monospace;
		font-size: 0.95em;
		color: rgba(11, 18, 32, 0.9);
	}
</style>
