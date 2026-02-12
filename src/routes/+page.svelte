<svelte:options runes={false} />

<script lang="ts">
	import { onMount } from 'svelte';
	import ContactFanout from '$lib/ContactFanout.svelte';
	import InfoCard from '$lib/InfoCard.svelte';
	import ProjectSelect from '$lib/ProjectSelect.svelte';
	import type { Project } from '$lib/projects';

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
			dates: 'June 2025 - Present',
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
			school: 'The Bishops School',
			location: 'San Diego CA',
			degree: 'HS Diploma',
			dates: 'August 2017 - June 2023',
			details: [
				'Graduated Cum Laude; Coursework in advanced mathematics, computer science, and economics. [GPA: 4.82]'
			]
		},
		{
			school: 'Stanford University',
			location: 'Stanford CA',
			degree: 'Data Science [BS]',
			dates: 'September 2023 - Present',
			details: [
				'Coursework in probability, statistics, computer science, and data-driven decision making. Focused on applied machine learning and data analysis.'
			]
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
			body: 'These are honestly the most impressive parts of my resume.'
		},
		{
			id: 'education',
			kicker: 'Coursework and Focus Areas',
			title: 'Education',
			body: 'Coursework and focus areas.'
		},
		{
			id: 'projects',
			kicker: 'Projects',
			title: 'Projects',
			body: 'Pick a project to see details (description, highlights, tech, and links).'
		},
		{
			id: 'awards',
			kicker: 'Recognition',
			title: 'Awards',
			body: 'Add awards, honors, scholarships, and notable recognition here.'
		},
		{
			id: 'skills',
			kicker: 'Toolbox',
			title: 'Skills',
			body: 'Add your skills, technologies, and strengths here.'
		}
	];

	const projects: Project[] = [
		{
			id: 'project-1',
			name: 'Project One',
			blurb: 'One-line summary of what this does.',
			description:
				'Longer description goes here. Explain the problem, your approach, and the impact in 2–4 sentences.',
			highlights: ['Key result or metric', 'What you built / shipped', 'Interesting technical challenge'],
			tech: ['SvelteKit', 'TypeScript', 'Vite'],
			links: [
				{ label: 'GitHub', href: 'https://github.com/' },
				{ label: 'Live', href: 'https://example.com' }
			]
		},
		{
			id: 'project-2',
			name: 'Project Two',
			blurb: 'Another short summary.',
			description:
				'Describe this project. Keep it impact-focused: what changed, what improved, what you learned.',
			highlights: ['Highlight A', 'Highlight B'],
			tech: ['Python', 'Pandas', 'Scikit-learn'],
			links: [{ label: 'Writeup', href: 'https://example.com' }]
		},
		{
			id: 'project-3',
			name: 'Project Three',
			blurb: 'Third project summary.',
			description: 'Description for the third project.',
			tech: ['React', 'Node.js'],
			links: [{ label: 'GitHub', href: 'https://github.com/' }]
		}
	];

	let scroller: HTMLElement | null = null;
	let activeId: string = panels[0]?.id ?? 'home';
	let scrollAnim: number | null = null;
	let panelEls: HTMLElement[] = [];
	let panelOffsets: number[] = [];
	let progressIndex = 0;
	let experiencesT = 0; // 0..1 progress across the Experiences panel
	let educationT = 0; // 0..1 progress for the Education carousel swap (first 25% of the slide)
	let educationSwap = false;
	let panelW = 0;

	// Decorative "ribbon" line that loops/winds through all panels.
	let ribbonD = '';
	let ribbonWidth = 1;
	let ribbonHeight = 1;
	let ribbonLen = 0;
	let ribbonPathAnimated: SVGPathElement | null = null;

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

	function buildRibbonPathRightToLeft(panelOffsetsPx: number[], panelW: number, h: number) {
		if (panelOffsetsPx.length === 0) return '';
		const totalW = panelOffsetsPx[panelOffsetsPx.length - 1] + panelW;

		// Ellipse loop approximation constant for cubic Béziers.
		const k = 0.5522847498;
		const rx = Math.max(80, panelW * 0.18);
		const ry = Math.max(70, h * 0.18);

		const startX = totalW + 140;
		const startY = h * 0.28;
		let d = `M ${startX} ${startY}`;
		let curX = startX;
		let curY = startY;

		for (let i = panelOffsetsPx.length - 1; i >= 0; i--) {
			const panelStart = panelOffsetsPx[i];
			const cx = panelStart + panelW * 0.55;
			const cy = h * (i % 2 === 0 ? 0.32 : 0.72);

			// Approach the loop start (right-most point of ellipse).
			const loopStartX = cx + rx;
			const loopStartY = cy;
			d += ` C ${curX - panelW * 0.25} ${curY}, ${loopStartX + panelW * 0.06} ${loopStartY}, ${loopStartX} ${loopStartY}`;
			curX = loopStartX;
			curY = loopStartY;

			// One full loop (4 cubics) around (cx, cy).
			d += ` C ${cx + rx} ${cy - ry * k}, ${cx + rx * k} ${cy - ry}, ${cx} ${cy - ry}`;
			d += ` C ${cx - rx * k} ${cy - ry}, ${cx - rx} ${cy - ry * k}, ${cx - rx} ${cy}`;
			d += ` C ${cx - rx} ${cy + ry * k}, ${cx - rx * k} ${cy + ry}, ${cx} ${cy + ry}`;
			d += ` C ${cx + rx * k} ${cy + ry}, ${cx + rx} ${cy + ry * k}, ${cx + rx} ${cy}`;

			// Exit towards the next panel with a smooth curve.
			const nextX = panelStart - panelW * 0.35;
			const nextY = h * (i % 2 === 0 ? 0.62 : 0.38);
			d += ` C ${cx + rx * 0.75} ${cy + (nextY - cy) * 0.45}, ${nextX + panelW * 0.15} ${nextY}, ${nextX} ${nextY}`;
			curX = nextX;
			curY = nextY;
		}

		// Tail off-screen to the left.
		d += ` C ${-120} ${h * 0.18}, ${-160} ${h * 0.86}, ${-220} ${h * 0.72}`;
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

	function smoothScrollTo(left: number, durationMs = 750) {
		if (!scroller) return;
		cancelScrollAnim();

		if (prefersReducedMotion()) {
			scroller.scrollLeft = left;
			return;
		}

		const startLeft = scroller.scrollLeft;
		const delta = left - startLeft;
		const start = performance.now();

		const tick = (now: number) => {
			const t = Math.min(1, (now - start) / durationMs);
			scroller!.scrollLeft = startLeft + delta * easeOutCubic(t);
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

		panelEls = panels
			.map((p) => document.getElementById(p.id))
			.filter((el): el is HTMLElement => el instanceof HTMLElement);

		const measure = () => {
			if (!scroller) return;
			panelOffsets = panelEls.map((el) => el.offsetLeft);

			panelW = scroller.clientWidth || window.innerWidth;
			const h = scroller.clientHeight || window.innerHeight;
			const totalW = (panelOffsets[panelOffsets.length - 1] ?? 0) + panelW;

			ribbonWidth = Math.max(1, totalW);
			ribbonHeight = Math.max(1, h);
			ribbonD = buildRibbonPathRightToLeft(panelOffsets, panelW, h);

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
				const shiftPx = (panelW || denom || window.innerWidth) * 0.5;
				const start = expStart - shiftPx;
				const end = expEnd - shiftPx;
				experiencesT = end === start ? 1 : clamp01((x - start) / (end - start));
			}

			// Education carousel: swap over the first quarter of the slide scroll distance.
			const eduIdx = panels.findIndex((p) => p.id === 'education');
			if (eduIdx !== -1 && panelOffsets[eduIdx] != null) {
				const eduStart = panelOffsets[eduIdx];
				const eduEnd = panelOffsets[Math.min(eduIdx + 1, panelOffsets.length - 1)] ?? eduStart;
				const denom = eduEnd - eduStart;
				// Make the swap happen early in the slide (smaller = earlier).
				const swapDistance = denom * 0.08;
				educationT = swapDistance <= 0 ? 1 : clamp01((x - eduStart) / swapDistance);
				// Flip stacking slightly before midpoint so the handoff feels earlier.
				educationSwap = educationT > 0.22;
			} else {
				educationT = 0;
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
							? `--edu-t:${educationT};`
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

						{#if panel.kicker}
							<p class="kicker">{panel.kicker}</p>
						{/if}
						<h1 class="title">{panel.title}</h1>

						<p class="body">{panel.body}</p>

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
									<article class="education-card">
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

					{#if panel.id !== 'experiences' && panel.id !== 'education' && panel.id !== 'projects'}
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
		stroke-width: 3;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.ribbon-anim {
		fill: none;
		stroke: url(#ribbonStroke);
		stroke-width: 4;
		stroke-linecap: round;
		stroke-linejoin: round;
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
		width: min(560px, 100%);
		margin: 18px auto 0;
		top: -100px;
		left: 30px;
		min-height: 210px;
		perspective: 900px;
		/* 0..1 from scroll (set on #education.panel) */
		--t: var(--edu-t, 0);
	}

	.education-card {
		position: absolute;
		inset: 0;
		margin: 0;
		border-radius: 16px;
		border: 1px solid rgba(11, 18, 32, 0.14);
		background:
			linear-gradient(135deg, rgba(124, 58, 237, 0.12), rgba(34, 211, 238, 0.08)),
			rgba(255, 255, 255, 0.28);
		backdrop-filter: blur(var(--glass-blur)) saturate(1.25);
		-webkit-backdrop-filter: blur(var(--glass-blur)) saturate(1.25);
		box-shadow: 0 18px 50px rgba(11, 18, 32, 0.12);
		padding: 14px 14px;
		transform-origin: 40% 25%;
		will-change: transform, opacity, filter;
	}

	/* card 1: front -> back as --t goes 0 -> 1 */
	.education-card:nth-child(1) {
		z-index: 2;
		transform: translate3d(calc(34px * var(--t)), calc(22px * var(--t)), 0)
			rotate(calc(-7deg + (16deg * var(--t))))
			scale(calc(1 - (0.03 * var(--t))));
		opacity: calc(1 - (0.65 * var(--t)));
		filter: blur(calc(0.4px * var(--t))) saturate(calc(1 - (0.05 * var(--t))));
	}

	/* card 2: back -> front as --t goes 0 -> 1 */
	.education-card:nth-child(2) {
		z-index: 1;
		transform: translate3d(calc(34px * (1 - var(--t))), calc(22px * (1 - var(--t))), 0)
			rotate(calc(9deg - (16deg * var(--t))))
			scale(calc(0.97 + (0.03 * var(--t))));
		opacity: calc(0.35 + (0.65 * var(--t)));
		filter: blur(calc(0.4px * (1 - var(--t))))
			saturate(calc(0.95 + (0.05 * var(--t))));
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
			min-height: unset;
			perspective: none;
			display: grid;
			gap: 16px;
			--t: 0;
		}

		.education-card {
			position: relative;
			transform: none;
			opacity: 1;
			filter: none;
		}
	}

	@media (hover: hover) and (pointer: fine) {
		.education-card:hover {
			border-color: rgba(11, 18, 32, 0.18);
			background:
				linear-gradient(135deg, rgba(124, 58, 237, 0.18), rgba(34, 211, 238, 0.14)),
				rgba(255, 255, 255, 0.34);
			backdrop-filter: blur(calc(var(--glass-blur) + 2px)) saturate(1.35);
			-webkit-backdrop-filter: blur(calc(var(--glass-blur) + 2px)) saturate(1.35);
			box-shadow: 0 26px 70px rgba(11, 18, 32, 0.16);
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
		/* Scroll-driven "fan-in" (0 = entering, 1 = leaving) */
		--t: var(--exp-t, 1);
		--spread-x: 0px;
		--spread-y: 0px;
		--hover-y: 0px;

		border-radius: 16px;
		border: 1px solid rgba(11, 18, 32, 0.14);
		background:
			linear-gradient(135deg, rgba(124, 58, 237, 0.12), rgba(34, 211, 238, 0.08)),
			rgba(255, 255, 255, 0.28);
		backdrop-filter: blur(var(--glass-blur)) saturate(1.25);
		-webkit-backdrop-filter: blur(var(--glass-blur)) saturate(1.25);
		box-shadow: 0 18px 50px rgba(11, 18, 32, 0.12);
		padding: 14px 14px;
		width: 100%;
		transform: translate3d(
			calc(var(--spread-x) * (1 - var(--t))),
			calc((var(--spread-y) * (1 - var(--t))) + var(--hover-y)),
			0
		);
		transition:
			transform 160ms ease,
			box-shadow 160ms ease,
			border-color 160ms ease,
			background 160ms ease;
	}

	/* Hover interaction (avoid on touch devices) */
	@media (hover: hover) and (pointer: fine) {
		.experience-item:hover {
			--hover-y: -3px;
			border-color: rgba(11, 18, 32, 0.18);
			background:
				linear-gradient(135deg, rgba(124, 58, 237, 0.18), rgba(34, 211, 238, 0.14)),
				rgba(255, 255, 255, 0.34);
			backdrop-filter: blur(calc(var(--glass-blur) + 2px)) saturate(1.35);
			-webkit-backdrop-filter: blur(calc(var(--glass-blur) + 2px)) saturate(1.35);
			box-shadow: 0 26px 70px rgba(11, 18, 32, 0.16);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.experience-item {
			transition: none;
		}
		@media (hover: hover) and (pointer: fine) {
			.experience-item:hover {
				transform: none;
			}
		}
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
			right: 0;
			z-index: 5;
		}

		/* Castle Creek — middle */
		#experiences .experience-item:nth-child(2) {
			--spread-x: -220px;
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
			right: 60px;
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
