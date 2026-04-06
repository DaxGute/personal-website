<svelte:options runes={false} />

<script lang="ts">
	import { onMount } from 'svelte';
	import ContactFanout from '$lib/ContactFanout.svelte';
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
	let activeId: string = panels[0]?.id ?? 'home';
	let scrollAnim: number | null = null;
	let panelEls: HTMLElement[] = [];
	let panelOffsets: number[] = [];
	let progressIndex = 0;
	let panelW = 0;
	let experiencesPanelEl: HTMLElement | null = null;
	let educationPanelEl: HTMLElement | null = null;

	// Decorative line from `static/background.svg` (viewBox 0 0 3200 300), scaled to the scroll area.
	/** Horizontal scroll extent (panel strip width); wash uses this so `scrollWidth` is not inflated. */
	let ribbonScrollTrackW = 1;
	/** Painted ribbon width = scroll track + 60px (30px bleed past each viewport edge). */
	let ribbonWidth = 1;
	let ribbonHeight = 1;
	/** Drives `transform` on the viewport-fixed ribbon (matches scrollLeft so edges stay pinned when scroll is clamped). */
	let ribbonScrollLeft = 0;

	// Greeting (title slide) intro timeline
	let greetingTimelineOn = false;
	let greetingDotsOn = false;
	let greetingDotsTimer: number | null = null;
	let greetingScrollLocked = true;


	// Contact links
	const linkedinHref = 'https://www.linkedin.com/in/daxton-gutekunst/';
	const githubHref = 'https://github.com/DaxGute';
	const emailHref = 'mailto:daxton@gutekunst.com';

	function prefersReducedMotion() {
		return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

	/** `static/background.svg` — path in viewBox 0 0 3200 300 */
	const RIBBON_VIEWBOX_W = 3200;
	const RIBBON_VIEWBOX_H = 300;
	/** Ribbon extends this far past each viewport edge (total +60px vs scroll track). */
	const RIBBON_SIDE_BLEED_PX = 30;
	const RIBBON_PATH_D =
		'm -12.914181,111.40442 c 590.857891,-0.62626 143.701551,103.81272 282.481281,80.44502 86.94196,-14.63927 92.43184,-84.44327 34.74779,-45.56945 -110.24799,74.29716 111.69439,9.92858 129.58722,-3.31676 18.30719,-13.55208 -34.95776,-14.26853 -79.79039,46.93158 -14.63959,19.9842 64.74964,-15.98568 64.74964,-15.98568 0,0 5.34627,6.47487 -20.4468,23.8173 -62.06536,41.73075 -63.74974,152.47679 85.06848,34.83426 173.31068,-137.004109 389.59544,-125.31322 432.39345,-124.95271 28.71572,0.24189 25.61363,-23.184702 25.45812,-41.241642 -0.0901,-10.46198 -19.13995,-19.511717 -43.78868,-19.511717 -26.72535,0 -51.04783,4.08019 -50.82093,18.37206 0.0648,4.08065 19.95517,21.62226 91.92951,0.54052 7.79074,-2.28196 24.97896,2.23571 24.97896,12.18953 0,15.99737 0.69239,38.915039 0.10005,53.502339 -0.82645,20.35281 -11.39545,19.56432 -27.86198,20.03815 -41.4397,1.19245 -52.19109,1.54534 -76.35443,0.59983 -24.16334,-0.9455 -42.09036,4.30987 -40.59794,-15.71555 1.24481,-16.70291 1.33659,-42.973249 1.33659,-59.082379 0,-7.64016 5.29566,-11.671529 23.97462,-12.10887 128.08727,-2.99898 243.08752,96.296669 380.64162,107.332739 137.5541,11.03607 30.5571,70.25212 107.2486,69.92756 76.6916,-0.32455 -16.6336,-21.40533 -46.4866,-32.47007 -8.4961,-2.08473 -8.3613,-7.48661 -1.9659,-10.16374 11.9584,-5.00586 19.464,-7.7785 34.4289,-13.68073 14.965,-5.90223 21.1368,-5.73995 32.8048,0.0966 11.668,5.83657 24.427,12.17776 30.0241,15.61324 5.5971,3.43548 5.3442,6.33512 0.4744,8.1921 -16.387,6.24883 -65.9392,-6.06203 -49.1374,-6.3776 65.7042,-1.23405 44.2886,71.24002 46.6522,85.09903 0,0 209.7418,-226.591175 291.2449,-162.38755 81.5031,64.20362 91.5819,72.92109 120.5784,98.25797 5.1885,4.53365 13.2354,20.72681 12.8695,21.02603 -0.4737,0.38741 -13.6585,-1.23737 -22.7355,-7.28722 -24.6101,-16.40273 -89.4174,-66.45412 -117.502,-89.20891 -10.7189,-8.68466 -6.1218,-13.31021 -1.3383,-17.51679 9.0044,-7.91843 20.4871,4.36347 12.9381,5.02917 -4.6881,0.41342 -10.5068,5.12676 -8.6145,10.46865 2.6844,7.57779 171.8412,131.42977 202.7858,129.75844 46.8074,-2.52811 37.8146,-32.7113 61.59,-40.43437 35.8333,-11.63991 16.976,117.5622 91.4932,-1.24948 132.6328,-211.472315 292.2986,3.89055 282.3923,16.75118 -9.9063,12.86063 -67.2951,-14.47013 -121.7691,-30.58036 -54.474,-16.11022 60.9163,-29.44165 114.0783,-39.62421 53.162,-10.18256 -124.384,128.0261 -92.342,56.42455 32.042,-71.60155 -13.9634,-166.396561 538.0936,-150.186567 338.0187,9.925208 149.1456,98.051147 78.4522,112.014567 0,0 -98.0235,-210.142931 30.7525,-126.221477 128.776,83.921457 -166.3845,82.588727 -87.1505,145.443827 79.2339,62.85511 505.3109,-2.19859 505.3109,-2.19859';

	function easeOutCubic(t: number) {
		return 1 - Math.pow(1 - t, 3);
	}

	function cancelScrollAnim() {
		if (scrollAnim != null) cancelAnimationFrame(scrollAnim);
		scrollAnim = null;
	}

	function smoothScrollTo(left: number, durationMs?: number) {
		if (!scroller) return;
		cancelScrollAnim();

		const maxScroll = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
		const target = clamp(left, 0, maxScroll);

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
				maxScroll
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

		panelEls = panels
			.map((p) => document.getElementById(p.id))
			.filter((el): el is HTMLElement => el instanceof HTMLElement);

		experiencesPanelEl = document.getElementById('experiences');
		educationPanelEl = document.getElementById('education');
		const expIdx = panels.findIndex((p) => p.id === 'experiences');
		const eduIdx = panels.findIndex((p) => p.id === 'education');

		const clampScroller = () => {
			if (!scroller) return;
			const max = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
			scroller.scrollLeft = clamp(scroller.scrollLeft, 0, max);
		};

		const measure = () => {
			if (!scroller) return;
			panelOffsets = panelEls.map((el) => el.offsetLeft);

			panelW = scroller.clientWidth || window.innerWidth;
			const h = scroller.clientHeight || window.innerHeight;
			const totalW = (panelOffsets[panelOffsets.length - 1] ?? 0) + panelW;

			ribbonScrollTrackW = Math.max(1, totalW);
			ribbonWidth = Math.max(1, totalW + RIBBON_SIDE_BLEED_PX * 2);
			ribbonHeight = Math.max(1, h);

			clampScroller();
			ribbonScrollLeft = scroller.scrollLeft;
		};

		const updateProgress = () => {
			if (!scroller) return;
			clampScroller();
			const x = scroller!.scrollLeft;
			ribbonScrollLeft = x;
			if (panelOffsets.length === 0) return;

			let i = 0;
			while (i < panelOffsets.length - 1 && x >= panelOffsets[i + 1]) i++;
			const next = Math.min(i + 1, panelOffsets.length - 1);
			const start = panelOffsets[i];
			const end = panelOffsets[next];
			const t = end === start ? 0 : Math.max(0, Math.min(1, (x - start) / (end - start)));

			progressIndex = i + t;
			const nextActiveId = panels[Math.round(progressIndex)]?.id ?? activeId;
			if (nextActiveId !== activeId) activeId = nextActiveId;

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
			const maxScroll = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
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
				return;
			}
			greetingDotsTimer = window.setTimeout(() => {
				greetingDotsOn = true;
				greetingScrollLocked = false;
			}, 1750);
		});

		scroller.addEventListener('wheel', wheel, { passive: false });
		scroller.addEventListener('scroll', onScroll, { passive: true });
		scroller.addEventListener('scroll', onScrollLock, { passive: true });
		window.addEventListener('keydown', keyLock);
		window.addEventListener('resize', () => {
			measure();
			updateProgress();
		});

		return () => {
			scroller?.removeEventListener('wheel', wheel as EventListener);
			scroller?.removeEventListener('scroll', onScroll);
			scroller?.removeEventListener('scroll', onScrollLock);
			window.removeEventListener('keydown', keyLock);
			cancelScrollAnim();
			if (greetingDotsTimer != null) window.clearTimeout(greetingDotsTimer);
			greetingDotsTimer = null;
		};
	});

</script>

<div class="stage" class:intro-locked={greetingScrollLocked}>
	<!-- Fixed ribbon lives outside `.scroller` so it never participates in the horizontal flex row / scrollWidth. -->
	<!-- Viewport clip: the SVG is as wide as the scroll track; clipping avoids compositing that full width every frame. -->
	<div class="ribbon-clip" aria-hidden="true">
		<svg
			class="ribbon"
			focusable="false"
			width={ribbonWidth}
			height={ribbonHeight}
			viewBox={`0 0 ${RIBBON_VIEWBOX_W} ${RIBBON_VIEWBOX_H}`}
			preserveAspectRatio="none"
			style={`left:-${RIBBON_SIDE_BLEED_PX}px;width:${ribbonWidth}px;height:${ribbonHeight}px;transform:translate3d(-${ribbonScrollLeft}px,0,0);`}
		>
			<defs>
				<linearGradient
					id="ribbonStroke"
					gradientUnits="objectBoundingBox"
					x1="0"
					y1="0"
					x2="1"
					y2="0"
				>
					<stop offset="0%" stop-color="rgb(124 58 237)" stop-opacity="1" />
					<stop offset="45%" stop-color="rgb(34 211 238)" stop-opacity="1" />
					<stop offset="100%" stop-color="rgb(16 185 129)" stop-opacity="1" />
				</linearGradient>
			</defs>

			<path class="ribbon-path" d={RIBBON_PATH_D} />
		</svg>
	</div>

	<main
		class="scroller"
		bind:this={scroller}
		aria-label="Horizontally scrolling panels"
	>
		<!-- Full-width wash scrolls with panels; scroller bg is transparent so fixed ribbon can sit above wash, below panels. -->
		<div class="scroller-wash" aria-hidden="true" style={`width:${ribbonScrollTrackW}px`}></div>

		{#each panels as panel}
			<section
				id={panel.id}
				class="panel"
				aria-label={panel.title}
			>
				{#if panel.id === 'greeting'}
					{@const parts = splitTitle(panel.title)}
					{@const firstParts = splitSuffixFade(parts.first, 'ton')}
					{@const lastParts = splitHeadFadeRest(parts.last, 1)}
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
				{:else}
					<div class="panel-inner">
						{#if panel.id === 'projects'}
							<div class="projects-select projects-select--top">
								<ProjectSelect projects={projects} initialId={projects[0]?.id ?? null} />
							</div>
						{/if}

						{#if panel.id !== 'awards'}
							{#if panel.kicker}
								<p class="kicker">{panel.kicker}</p>
							{/if}
							<h1 class="title">{panel.title}</h1>

							<p class="body">{panel.body}</p>
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
			</section>
		{/each}
	</main>

	<header class="chrome">
		<ContactFanout {linkedinHref} {githubHref} {emailHref} />
	</header>

	<nav class="dots" aria-label="Panel navigation dots">
		{#each panels as p, i}
			<button
				type="button"
				class="dot-btn"
				aria-label={`Go to ${p.navTitle ?? p.title}`}
				aria-current={activeId === p.id ? 'true' : undefined}
				disabled={greetingScrollLocked}
				onclick={() => scrollToPanel(p.id)}
			>
				<span
					class="nav-dot"
					style={`--dist:${Math.abs(progressIndex - i)};`}
					aria-hidden="true"
				></span>
				<span class="dot-label" aria-hidden="true">{p.navTitle ?? p.title}</span>
			</button>
		{/each}
	</nav>
</div>

<style>
	.stage {
		position: relative;
		height: 100vh;
		width: 100vw;
		overflow: hidden;
		overscroll-behavior: none;
		/* Shared sizing vars for the chrome + ContactFanout + panel padding */
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
		/* `auto` allows native momentum rubber-band at the x ends; keep y contained to this strip */
		overscroll-behavior-x: auto;
		overscroll-behavior-y: none;
		-webkit-overflow-scrolling: touch;
		touch-action: pan-x;
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
		background-attachment: local, local, local;
	}

	.ribbon-clip {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		overflow: hidden;
		z-index: 2;
		pointer-events: none;
	}

	.ribbon {
		position: absolute;
		top: 0;
		overflow: visible;
		will-change: transform;
	}

	.ribbon-path {
		fill: none;
		stroke: url(#ribbonStroke);
		stroke-width: 4;
		stroke-linecap: butt;
		stroke-linejoin: miter;
		stroke-miterlimit: 10;
		shape-rendering: auto;
	}

	/* hide scrollbars without disabling scrolling */
	.scroller {
		scrollbar-width: none; /* Firefox */
	}
	.scroller::-webkit-scrollbar {
		display: none; /* Chrome/Safari */
	}

	.chrome {
		position: absolute;
		inset: 0 0 auto 0;
		z-index: 10;
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 12px;
		padding: 18px 18px 0 18px;
		pointer-events: none; /* allow drag/scroll anywhere */
		opacity: 1;
		transform: translateY(0);
		transition:
			opacity 1200ms cubic-bezier(0.16, 1, 0.3, 1),
			transform 1200ms cubic-bezier(0.16, 1, 0.3, 1);
	}

	.dots {
		position: absolute;
		left: 50%;
		bottom: 15vh; /* ~15% up from bottom */
		transform: translateX(-50%);
		z-index: 10;
		display: inline-flex;
		gap: 12px;
		opacity: 1;
		transition: opacity 1200ms cubic-bezier(0.16, 1, 0.3, 1);
	}

	/* During the greeting intro, keep UI chrome invisible */
	.intro-locked .chrome {
		opacity: 0;
		transform: translateY(-10px);
	}

	.intro-locked .dots {
		opacity: 0;
	}

	.dot-btn {
		appearance: none;
		border: 0;
		background: transparent;
		padding: 10px; /* bigger hit target, tiny visual */
		border-radius: 999px;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
	}

	.dot-btn:disabled {
		cursor: default;
		opacity: 0.45;
	}

	.dot-btn:focus-visible {
		outline: 3px solid rgba(124, 58, 237, 0.25);
		outline-offset: 2px;
	}

	.nav-dot {
		display: block;
		width: 7px;
		height: 7px;
		border-radius: 999px;
		/* Fade "falloff" relative to the active dot (higher multiplier = faster fade) */
		--a: clamp(0.12, calc(0.88 - var(--dist) * 0.48), 0.88);
		background: rgb(11 18 32 / var(--a));
		transform: scale(clamp(0.88, calc(1.32 - var(--dist) * 0.22), 1.32));
		/* These values are driven continuously by scroll position; transitions here can
		   “stutter” because they restart every scroll frame. Let them track directly. */
		transition: none;
		will-change: transform;
	}

	.dot-btn:hover .nav-dot {
		background: rgb(11 18 32 / 0.55);
	}

	.dot-label {
		font-size: 10px;
		line-height: 1;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--muted);
		white-space: nowrap;
		transform: rotate(45deg);
		transform-origin: top center;
		pointer-events: none;
		user-select: none;
	}

	@media (max-width: 640px) {
		.dot-label {
			display: none;
		}
	}

	.panel {
		flex: 0 0 100vw;
		height: 100vh;
		display: grid;
		/* Keep content below the top-right diagonal contact bubbles */
		place-items: start center;
		padding: calc(18px + (var(--menu-control-h) + (var(--menu-pad) * 2)) + 110px) 18px 24px;
		position: relative;
		z-index: 3;
	}

	/* Move the Experiences box up a bit (slightly less top clearance than other panels). */
	#experiences.panel {
		padding-top: calc(18px + (var(--menu-control-h) + (var(--menu-pad) * 2)) + 70px);
	}

	/* Projects: move the whole glass box up via a bottom offset (instead of changing slide padding). */
	#projects.panel {
		/* Lift Projects above other panel content/decoration layers (but keep below chrome/dots at z=10). */
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
		place-items: stretch;
	}

	#interests.panel .panel-inner {
		/* Fill the entire slide for absolute positioning */
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		/* keep the Interests copy comfortably lower in the slide */
		padding: clamp(110px, 14vh, 170px) 18px 24px;
		border: 0;
		background: transparent;
		backdrop-filter: none;
		box-shadow: none;
		text-align: right;
		transform: none;
	}

	.interests-content {
		/* take up the entire slide */
		position: absolute;
		inset: 0;
		z-index: 1;

		/* size should be a percent (with min/max guardrails) */
		--float-card-w: clamp(180px, 22%, 260px);
	}

	/* Keep slide copy above the floating polaroids */
	#interests.panel .kicker,
	#interests.panel .title,
	#interests.panel .body {
		position: relative;
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
		#interests.panel .panel-inner {
			text-align: center;
			padding-top: clamp(90px, 12vh, 140px);
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
		min-height: clamp(380px, 56vh, 560px);
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
		z-index: 30;
	}
	#experiences .experience-item:nth-child(2) {
		z-index: 20;
	}
	#experiences .experience-item:nth-child(3) {
		z-index: 10;
	}
	#experiences .experience-item:hover {
		z-index: 40;
	}

	@media (prefers-reduced-motion: reduce) {
		/* (hover + motion handled inside InfoCard) */
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

		/* Benevolent AI — top right */
		#experiences .experience-item:nth-child(1) {
			--spread-x: 180px;
			--spread-y: -80px;
			/* Lift it above the Experiences title */
			top: -90px;
			/* Always finish next to Castle Creek (which is anchored at left: 0) */
			left: calc(var(--exp-card-w) + 100px);
			right: auto;
			z-index: 5;
		}

		/* Castle Creek — middle */
		#experiences .experience-item:nth-child(2) {
			/* Keep this non-negative so it can't visually bleed into the previous slide */
			--spread-x: 0px;
			--spread-y: 120px;
			top: 0;
			left: 0;
			right: auto;
			bottom: auto;
		}

		/* City of San Diego — bottom right */
		#experiences .experience-item:nth-child(3) {
			--spread-x: 240px;
			--spread-y: 140px;
			/* Move it up: slightly below Castle Creek's height, while keeping Benevolent's right alignment */
			top: 44px;
			/* Always finish next to Castle Creek (which is anchored at left: 0) */
			left: calc(var(--exp-card-w) + 28px);
			right: auto;
			bottom: auto;
		}
	}

	.greeting {
		width: min(860px, 100%);
		padding: 6px;
	}

	.title--greeting {
		white-space: nowrap;
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
