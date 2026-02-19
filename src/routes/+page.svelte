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
	};

	type Education = {
		school: string;
		location: string;
		degree: string;
		dates: string;
		details: string[];
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
			]
		},
		{
			company: 'Castle Creek Capital',
			location: 'San Diego, CA',
			title: 'Investment Analytics',
			dates: 'June 2024 - September 2024',
			highlights: [
				'Assisted with financial modeling and analysis in small community banks across the U.S. for eventual presentation to management.'
			]
		},
		{
			company: 'City of San Diego',
			location: 'San Diego, CA',
			title: 'Youth Commissioner',
			dates: 'October 2021 - June 2023',
			highlights: [
				'Represented District 3 on the city’s Youth Commission, advising on programs and policies affecting young people in San Diego.'
			]
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
			]
		},
		{
			school: 'The Bishops School',
			location: 'San Diego CA',
			degree: 'HS Diploma',
			dates: 'August 2017 - June 2023',
			details: [
				'Graduated Cum Laude; Coursework in advanced mathematics, computer science, and economics. [GPA: 4.82]'
			]
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

	const interests: { caption: string }[] = [
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
	let experiencesT = 0; // 0..1 progress across the Experiences panel
	let educationT = 0; // 0..1 progress for Education card rotation (enter -> exit visibility)
	let educationFadeT = 0; // 0..1 progress for Education fade (kept early in the slide)
	let educationSwap = false;
	let panelW = 0;

	// Decorative "ribbon" line that loops/winds through all panels.
	let ribbonD = '';
	let ribbonWidth = 1;
	let ribbonHeight = 1;
	let ribbonLen = 0;
	let ribbonPathAnimated: SVGPathElement | null = null;
	let ribbonPanelIds: string[] = [];


	// Contact links
	const linkedinHref = 'https://www.linkedin.com/in/daxton-gutekunst/';
	const githubHref = 'https://github.com/DaxGute';
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

	function hash32(str: string) {
		// FNV-1a (32-bit)
		let h = 2166136261;
		for (let i = 0; i < str.length; i++) {
			h ^= str.charCodeAt(i);
			h = Math.imul(h, 16777619);
		}
		return h >>> 0;
	}

	function rand01(seed: number) {
		// xorshift32 -> [0, 1)
		let x = seed >>> 0;
		x ^= x << 13;
		x ^= x >>> 17;
		x ^= x << 5;
		return ((x >>> 0) & 0xffffffff) / 4294967296;
	}

	function clamp(n: number, min: number, max: number) {
		return Math.max(min, Math.min(max, n));
	}

	function buildRibbonPathRightToLeft(panelOffsetsPx: number[], panelIds: string[], panelW: number, h: number) {
		if (panelOffsetsPx.length === 0) return '';
		const totalW = panelOffsetsPx[panelOffsetsPx.length - 1] + panelW;

		// “Cursive” ribbon: generate multiple swoopy control points per panel, then
		// convert them to a smooth spline (Catmull–Rom -> cubic Béziers).
		type Pt = { x: number; y: number };
		const TAU = Math.PI * 2;

		const clampY = (y: number) => clamp(y, h * 0.10, h * 0.90);

		const pushLoop = (
			pts: Pt[],
			cx: number,
			cy: number,
			rx: number,
			ry: number,
			tiltRad: number,
			dir: 1 | -1,
			seed: number
		) => {
			// Near-full loop (avoid closing exactly on the start point to prevent a cusp).
			const steps = 24;
			const start = rand01(seed ^ 0x68e31da4) * TAU;
			const sweep = TAU * (0.985 + 0.01 * rand01(seed ^ 0xb5297a4d));
			const ct = Math.cos(tiltRad);
			const st = Math.sin(tiltRad);

			for (let s = 0; s < steps; s++) {
				const t = steps <= 1 ? 0 : s / (steps - 1);
				const a = start + dir * sweep * t;
				const x = Math.cos(a) * rx;
				const y = Math.sin(a) * ry;
				const xr = x * ct - y * st;
				const yr = x * st + y * ct;
				pts.push({ x: cx + xr, y: clampY(cy + yr) });
			}
		};

		const points: Pt[] = [];
		points.push({ x: totalW + 180, y: clampY(h * 0.34) });

		// Build points from right -> left (matches scroll direction).
		for (let i = panelOffsetsPx.length - 1; i >= 0; i--) {
			const panelStart = panelOffsetsPx[i] ?? 0;
			const id = panelIds[i] ?? `panel-${i}`;
			const seed = hash32(id);

			const rA = rand01(seed ^ 0x9e3779b9);
			const rB = rand01(seed ^ 0x85ebca6b);
			const rC = rand01(seed ^ 0xc2b2ae35);
			const rD = rand01(seed ^ 0x27d4eb2f);

			// Big vertical movement (huge swoops), alternating per panel.
			const dir = i % 2 === 0 ? 1 : -1;
			const baseY = clampY(h * (0.52 + (rA - 0.5) * 0.14));
			const amp = h * clamp(0.22 + 0.16 * rB, 0.18, 0.42);

			// Slight horizontal jitter so each slide is distinct.
			const jx = (rC - 0.5) * panelW * 0.05;

			const x1 = panelStart + panelW * (0.86 + (rD - 0.5) * 0.06) + jx;
			const x2 = panelStart + panelW * (0.66 + (rC - 0.5) * 0.08) + jx;
			const x3 = panelStart + panelW * (0.40 + (rB - 0.5) * 0.06) + jx;
			const x4 = panelStart + panelW * (0.20 + (rA - 0.5) * 0.05) + jx;

			// “Handwriting” feel: downstroke -> upstroke -> downstroke -> flick.
			const y1 = clampY(baseY + dir * amp * (0.22 + 0.18 * rD));
			const y2 = clampY(baseY - dir * amp * (1.05 + 0.15 * rC));
			const y3 = clampY(baseY + dir * amp * (0.95 + 0.10 * rB));
			const y4 = clampY(baseY + dir * amp * (0.08 + 0.20 * rA));

			points.push({ x: x1, y: y1 });
			points.push({ x: x2, y: y2 });
			// Add 1–2 cursive loops per panel so the stroke actually loops around itself.
			const loops = 1 + Math.floor(rand01(seed ^ 0x1f123bb5) * 2);
			for (let l = 0; l < loops; l++) {
				const ls = seed ^ ((l + 1) * 0x5bd1e995);
				const lr1 = rand01(ls ^ 0x6c2e2c6f);
				const lr2 = rand01(ls ^ 0xbb67ae85);
				const lr3 = rand01(ls ^ 0x9b05688c);

				const cx = panelStart + panelW * (0.58 - l * 0.13 + (lr1 - 0.5) * 0.05) + jx;
				const cy = clampY(baseY + dir * amp * (0.12 + 0.22 * lr2) * (l % 2 === 0 ? 1 : -1));
				const rx = clamp(panelW * (0.09 + 0.07 * lr2), 44, panelW * 0.22);
				const ry = clamp(h * (0.10 + 0.10 * lr1), 36, h * 0.26);
				const tilt = (lr3 - 0.5) * 1.0;
				const loopDir: 1 | -1 = rand01(ls ^ 0x27d4eb2d) > 0.5 ? 1 : -1;

				const sizeBoost = clamp(0.95 + (amp / h) * 0.40, 0.95, 1.28);
				pushLoop(points, cx, cy, rx * sizeBoost, ry * sizeBoost, tilt, loopDir, ls ^ 0x2e1b2138);
			}
			points.push({ x: x3, y: y3 });
			points.push({ x: x4, y: y4 });
		}

		points.push({ x: -260, y: clampY(h * 0.66) });

		// Use a centripetal Catmull–Rom conversion (smoother for uneven point spacing),
		// and slightly damp tangents to reduce “snappiness” near loop stitching.
		const alpha = 0.5;
		const tangScale = 0.72;
		const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);
		const tInc = (a: Pt, b: Pt) => Math.pow(dist(a, b), alpha);
		let d = `M ${points[0]!.x} ${points[0]!.y}`;

		for (let i = 0; i < points.length - 1; i++) {
			const p0 = points[i - 1] ?? points[i]!;
			const p1 = points[i]!;
			const p2 = points[i + 1]!;
			const p3 = points[i + 2] ?? p2;

			const t0 = 0;
			const t1 = t0 + tInc(p0, p1);
			const t2 = t1 + tInc(p1, p2);
			const t3 = t2 + tInc(p2, p3);

			const dt = t2 - t1;
			const denom1 = t2 - t0;
			const denom2 = t3 - t1;

			const m1x = denom1 > 1e-6 ? ((p2.x - p0.x) / denom1) * tangScale : 0;
			const m1y = denom1 > 1e-6 ? ((p2.y - p0.y) / denom1) * tangScale : 0;
			const m2x = denom2 > 1e-6 ? ((p3.x - p1.x) / denom2) * tangScale : 0;
			const m2y = denom2 > 1e-6 ? ((p3.y - p1.y) / denom2) * tangScale : 0;

			const c1x = p1.x + (m1x * dt) / 3;
			const c1y = p1.y + (m1y * dt) / 3;
			const c2x = p2.x - (m2x * dt) / 3;
			const c2y = p2.y - (m2y * dt) / 3;

			d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
		}

		return d;
	}

	function setRibbonDrawProgress(t: number) {
		if (!ribbonPathAnimated || ribbonLen <= 0) return;
		const p = clamp01(t);
		ribbonPathAnimated.style.strokeDashoffset = `${ribbonLen * (1 - p)}`;
	}

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

		if (prefersReducedMotion()) {
			scroller.scrollLeft = left;
			return;
		}

		const startLeft = scroller.scrollLeft;
		const delta = left - startLeft;
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
			scroller!.scrollLeft = startLeft + delta * easeInOutPow(t, 3);
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

		const measure = () => {
			if (!scroller) return;
			panelOffsets = panelEls.map((el) => el.offsetLeft);
			ribbonPanelIds = panelEls.map((el) => el.id);

			panelW = scroller.clientWidth || window.innerWidth;
			const h = scroller.clientHeight || window.innerHeight;
			const totalW = (panelOffsets[panelOffsets.length - 1] ?? 0) + panelW;

			ribbonWidth = Math.max(1, totalW);
			ribbonHeight = Math.max(1, h);
			ribbonD = buildRibbonPathRightToLeft(panelOffsets, ribbonPanelIds, panelW, h);

			// Recompute path length after DOM updates.
			requestAnimationFrame(() => {
				if (!ribbonPathAnimated) return;
				ribbonLen = ribbonPathAnimated.getTotalLength();
				if (!Number.isFinite(ribbonLen) || ribbonLen <= 0) return;
				ribbonPathAnimated.style.strokeDasharray = `${ribbonLen}`;
				// Default: fully visible (we can animate later if desired).
				setRibbonDrawProgress(1);
			});
		};

		const updateProgress = () => {
			if (!scroller) return;
			const x = scroller!.scrollLeft;
			if (panelOffsets.length === 0) return;

			let i = 0;
			while (i < panelOffsets.length - 1 && x >= panelOffsets[i + 1]) i++;
			const next = Math.min(i + 1, panelOffsets.length - 1);
			const start = panelOffsets[i];
			const end = panelOffsets[next];
			const t = end === start ? 0 : Math.max(0, Math.min(1, (x - start) / (end - start)));

			progressIndex = i + t;
			activeId = panels[Math.round(progressIndex)]?.id ?? activeId;

			// Per-panel animation progress (used for Experiences card fan-in)
			const expIdx = panels.findIndex((p) => p.id === 'experiences');
			if (expIdx !== -1 && panelOffsets[expIdx] != null) {
				const expStart = panelOffsets[expIdx];
				const expEnd = panelOffsets[Math.min(expIdx + 1, panelOffsets.length - 1)] ?? expStart;
				const denom = expEnd - expStart;
				// Start the Experiences animation earlier (before the slide is fully reached).
				// The panel is clipped (see CSS) so the cards won't visually bleed into the previous slide.
				const shiftPx = (panelW || denom || window.innerWidth) * 0.78;
				const start = expStart - shiftPx;
				const end = expEnd - shiftPx;
				experiencesT = end === start ? 1 : clamp01((x - start) / (end - start));
			}

			// Education carousel: swap early in the slide scroll distance.
			const eduIdx = panels.findIndex((p) => p.id === 'education');
			if (eduIdx !== -1 && panelOffsets[eduIdx] != null) {
				const eduStart = panelOffsets[eduIdx];
				const eduEnd = panelOffsets[Math.min(eduIdx + 1, panelOffsets.length - 1)] ?? eduStart;

				// Drive rotation for the entire time the Education panel is visible:
				// from when its left edge first enters the viewport (x = eduStart - panelW)
				// until its right edge leaves the viewport (x = eduStart + panelW).
				//
				// That gives a slower, "rotates with scroll the whole time it's on-screen" feel.
				const w = panelW || window.innerWidth;
				const visibleStart = eduStart - w;
				const visibleEnd = eduStart + w;
				const span = visibleEnd - visibleStart;
				const eduLinearT = span <= 0 ? 0 : clamp01((x - visibleStart) / span);
				educationT = eduLinearT;

				// Keep fade + stacking swap on the previous (early) timing so the cards
				// don't stay semi-transparent for the whole panel duration.
				const denom = eduEnd - eduStart;
				// Swap timing (stacking order) stays the same as before.
				const swapDistance = denom * 0.18;
				const swapLinearT = swapDistance <= 0 ? 1 : clamp01((x - eduStart) / swapDistance);
				educationSwap = swapLinearT > 0.22;

				// Fade earlier than the swap by using a shorter distance.
				const fadeDistance = denom * 0.11;
				const fadeLinearT = fadeDistance <= 0 ? 1 : clamp01((x - eduStart) / fadeDistance);
				educationFadeT = easeInOutPow(fadeLinearT, 5);
			} else {
				educationT = 0;
				educationFadeT = 0;
				educationSwap = false;
			}

			// Keep the ribbon visible across all slides.
			// NOTE: avoid writing to strokeDashoffset on every scroll frame — the ribbon
			// has a drop-shadow filter and can be expensive to repaint, which makes
			// slide-to-slide motion feel “stuck”/janky. We already set it to fully drawn
			// after measuring in `measure()`.
		};

		let ticking = false;
		const onScroll = () => {
			if (ticking) return;
			ticking = true;
			requestAnimationFrame(() => {
				updateProgress();
				ticking = false;
			});
		};

		const wheel = (e: WheelEvent) => {
			// Convert vertical wheel to horizontal scroll (best for mouse wheels).
			// Trackpads often emit deltaX already, so we only intercept when deltaY dominates.
			const absX = Math.abs(e.deltaX);
			const absY = Math.abs(e.deltaY);
			if (absY > absX) {
				e.preventDefault();
				cancelScrollAnim();
				scroller!.scrollLeft += e.deltaY;
			}
		};

		measure();
		// Always start on the title (first) panel.
		// Use scrollTo(...behavior:'auto') to avoid smooth scrolling, and re-apply after rAF/timeout
		// in case the browser restores scroll position after mount.
		const resetToTitle = () => scroller?.scrollTo({ left: 0, top: 0, behavior: 'auto' });
		resetToTitle();
		requestAnimationFrame(resetToTitle);
		setTimeout(resetToTitle, 50);
		updateProgress();

		scroller.addEventListener('wheel', wheel, { passive: false });
		scroller.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', () => {
			measure();
			updateProgress();
		});

		return () => {
			scroller?.removeEventListener('wheel', wheel as EventListener);
			scroller?.removeEventListener('scroll', onScroll);
			cancelScrollAnim();
		};
	});

</script>

<div class="stage">
	<main
		class="scroller"
		bind:this={scroller}
		aria-label="Horizontally scrolling panels"
	>
		<svg
			class="ribbon"
			aria-hidden="true"
			focusable="false"
			width={ribbonWidth}
			height={ribbonHeight}
			viewBox={`0 0 ${ribbonWidth} ${ribbonHeight}`}
			style={`width:${ribbonWidth}px;height:${ribbonHeight}px;`}
		>
			<defs>
				<linearGradient
					id="ribbonStroke"
					gradientUnits="userSpaceOnUse"
					x1="0"
					y1="0"
					x2={ribbonWidth}
					y2="0"
				>
					<stop offset="0%" stop-color="rgb(124 58 237)" stop-opacity="0.9" />
					<stop offset="45%" stop-color="rgb(34 211 238)" stop-opacity="0.85" />
					<stop offset="100%" stop-color="rgb(16 185 129)" stop-opacity="0.85" />
				</linearGradient>
			</defs>

			<!-- faint full ribbon (always visible) -->
			<path class="ribbon-base" d={ribbonD} />
			<!-- animated ribbon "draw" layer -->
			<path class="ribbon-anim" bind:this={ribbonPathAnimated} d={ribbonD} />
		</svg>

		{#each panels as panel}
			<section
				id={panel.id}
				class="panel"
				aria-label={panel.title}
				style={
					panel.id === 'experiences'
						? `--exp-t:${experiencesT};`
						: panel.id === 'education'
							? `--edu-t:${educationT};--edu-fade-t:${educationFadeT};`
							: undefined
				}
			>
				{#if panel.id === 'greeting'}
					<div class="greeting">
						{#if panel.kicker}
							<p class="kicker">{panel.kicker}</p>
						{/if}
						<h1 class="title">{panel.title}</h1>
						<p class="body">
							{panel.body}<span class="jump-dots" aria-hidden="true"><span>.</span><span>.</span><span>.</span></span>
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
										/>
									</li>
								{/each}
							</ul>
						{/if}

						{#if panel.id === 'education'}
							<div
								class="education-carousel"
								class:is-swapped={educationSwap}
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
								repeatFactor={1}
							/>
						{/if}

						{#if panel.id === 'interests'}
							<div class="interests-content" aria-label="Interests">
								<div class="interest-ski" aria-label="Skiing">
									<Polaroid src={skiingPhoto} alt="Skiing" caption={interests[1]?.caption ?? 'Skiing'} />
								</div>

								<div class="interest-chess" aria-label="Chess">
									<Polaroid src={chessPhoto} alt="Chess" caption={interests[2]?.caption ?? 'Chess'} />
								</div>

								<div class="interest-padi" aria-label="PADI Certified Diver">
									<Polaroid
										src={scubaPhoto}
										alt="PADI Certified Diver"
										revealRootMargin="0px -15% 0px -15%"
										revealThreshold={0}
										caption={interests[0]?.caption ?? 'PADI Certified Diver'}
									/>
								</div>

								<div class="interest-tt" aria-label="Table Tennis">
									<Polaroid
										src={tableTennisPhoto}
										alt="Table Tennis"
										caption={interests[3]?.caption ?? 'Table Tennis'}
									/>
								</div>

								<div class="interest-billiards" aria-label="Billiards">
									<Polaroid
										src={billiardsPhoto}
										alt="Billiards"
										caption={interests[4]?.caption ?? 'Billiards'}
									/>
								</div>

								{#if interests.length > 5}
									<div class="interests-grid" aria-label="Interests grid">
										{#each interests.slice(5) as item (item.caption)}
											<Polaroid src={null} caption={item.caption} />
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
		background:
			radial-gradient(1000px 520px at 20% 20%, rgba(124, 58, 237, 0.14), transparent 58%),
			radial-gradient(900px 500px at 80% 30%, rgba(34, 211, 238, 0.12), transparent 60%),
			radial-gradient(900px 700px at 50% 90%, rgba(16, 185, 129, 0.1), transparent 62%),
			var(--bg);
		background-repeat: no-repeat;
		/* Crucial: tie background movement to the scroller's scroll position (no "fixed" feel). */
		background-attachment: local;
		scroll-behavior: smooth;
		-webkit-overflow-scrolling: touch;
		touch-action: pan-x;
	}

	.ribbon {
		position: absolute;
		inset: 0 auto auto 0;
		z-index: 2;
		pointer-events: none;
		overflow: visible;
	}

	.ribbon-base {
		fill: none;
		stroke: rgba(11, 18, 32, 0.22);
		stroke-width: 4;
		stroke-linecap: butt;
		stroke-linejoin: miter;
		stroke-miterlimit: 10;
		shape-rendering: geometricPrecision;
	}

	.ribbon-anim {
		fill: none;
		stroke: url(#ribbonStroke);
		stroke-width: 6;
		stroke-linecap: butt;
		stroke-linejoin: miter;
		stroke-miterlimit: 10;
		shape-rendering: geometricPrecision;
		filter: drop-shadow(0 8px 18px rgba(11, 18, 32, 0.16));
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
	}

	.dots {
		position: absolute;
		left: 50%;
		bottom: 15vh; /* ~15% up from bottom */
		transform: translateX(-50%);
		z-index: 10;
		display: inline-flex;
		gap: 12px;
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
		z-index: 5;
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

	/* Education: 2-card diagonal carousel */
	.education-carousel {
		position: relative;
		isolation: isolate;
		/* Keep cards square while staying responsive */
		--edu-card-size: clamp(260px, 46vw, 420px);
		width: min(var(--edu-card-size), 100%);
		aspect-ratio: 1 / 1;
		margin: 18px auto 0;
		top: -100px;
		left: 70px;
		perspective: 900px;
		/* 0..1 from scroll (set on #education.panel) */
		--t: var(--edu-t, 0);
		/* independent fade progress (kept early) */
		--fade: var(--edu-fade-t, 0);
	}

	.education-card {
		position: absolute;
		inset: 0;
		margin: 0;
		--x-nudge: 0px;
		/* inert wrapper: keep it out of compositing */
		transform: none;
		opacity: 1;
		will-change: auto;
	}

	/* Nudge Stanford card further right */
	.education-card.is-stanford {
		--x-nudge: 80px;
	}

	/* card 1: front -> back as --t goes 0 -> 1 */
	.education-card:nth-child(1) {
		z-index: 2;
	}

	/* card 2: back -> front as --t goes 0 -> 1 */
	.education-card:nth-child(2) {
		z-index: 1;
	}

	/* Apply carousel transforms to the blur element itself (InfoCard root) */
	.education-card:nth-child(1) :global(.info-card) {
		transform: translate(calc((34px * var(--t)) + var(--x-nudge)), calc(22px * var(--t)))
			rotate(calc(-14deg + (40deg * var(--t))))
			scale(calc(1 - (0.03 * var(--t))))
			translateZ(0);
		opacity: calc(1 - (0.65 * var(--fade)));
		will-change: transform, opacity;
		transform-origin: 40% 25%;
		transform-style: preserve-3d;
	}

	.education-card:nth-child(2) :global(.info-card) {
		transform: translate(calc((34px * (1 - var(--t))) + var(--x-nudge)), calc(22px * (1 - var(--t))))
			rotate(calc(16deg - (40deg * var(--t))))
			scale(calc(0.97 + (0.03 * var(--t))))
			translateZ(0);
		opacity: calc(0.35 + (0.65 * var(--fade)));
		will-change: transform, opacity;
		transform-origin: 40% 25%;
		transform-style: preserve-3d;
	}

	/* hard swap stacking so the “front” card is actually on top */
	.education-carousel.is-swapped .education-card:nth-child(1) {
		z-index: 1;
	}
	.education-carousel.is-swapped .education-card:nth-child(2) {
		z-index: 2;
	}

	@media (prefers-reduced-motion: reduce) {
		.education-carousel {
			/* In reduced motion we show both cards at once; don't constrain the container. */
			width: min(560px, 100%);
			aspect-ratio: auto;
			perspective: none;
			display: grid;
			gap: 16px;
			--t: 0;
		}

		.education-card {
			position: relative;
			aspect-ratio: 1 / 1;
			transform: none;
			opacity: 1;
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
		/* Per-card offset lets one card animate slightly earlier/later. */
		/* Multiply shift by --exp-t so nothing protrudes before the slide starts animating. */
		--t: clamp(0, calc(var(--exp-t, 1) + (var(--t-shift, 0) * var(--exp-t, 1))), 1);
		--spread-x: 0px;
		--spread-y: 0px;
		width: 100%;
		/* Use 2D transforms to keep backdrop-filter reliable on some browsers. */
		transform: translate(calc(var(--spread-x) * (1 - var(--t))), calc(var(--spread-y) * (1 - var(--t))));
	}

	@media (prefers-reduced-motion: reduce) {
		/* (hover + motion handled inside InfoCard) */
	}

	@media (min-width: 720px) {
		.experience-item {
			width: 50%;
			margin-inline: auto;
		}

		/* Experiences slide positions */
		#experiences .experience-item {
			position: absolute;
			width: min(420px, 42vw);
			margin: 0;
		}

		/* Benevolent AI — top right */
		#experiences .experience-item:nth-child(1) {
			--spread-x: 180px;
			--spread-y: -80px;
			/* Lift it above the Experiences title */
			top: -90px;
			/* Always finish next to Castle Creek (which is anchored at left: 0) */
			left: calc(min(420px, 42vw) + 100px);
			right: auto;
			z-index: 5;
		}

		/* Castle Creek — middle */
		#experiences .experience-item:nth-child(2) {
			/* Castle Creek should start animating slightly earlier than the others */
			--t-shift: 0.18;
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
			left: calc(min(420px, 42vw) + 28px);
			right: auto;
			bottom: auto;
		}
	}

	.greeting {
		width: min(860px, 100%);
		padding: 6px;
	}

	.jump-dots {
		display: inline-flex;
		gap: 3px;
		margin-left: 4px;
	}

	.jump-dots > span {
		display: inline-block;
		transform: translateY(0);
		animation: dotJump 1s infinite ease-in-out;
	}

	.jump-dots > span:nth-child(2) {
		animation-delay: 0.12s;
	}
	.jump-dots > span:nth-child(3) {
		animation-delay: 0.24s;
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
