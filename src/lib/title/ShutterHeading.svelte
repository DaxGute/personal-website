<script lang="ts">
	import { onMount } from 'svelte';
	import { headerDisplayInsets, nameShutterInsets, SHUTTER_EXIT_FRACTION } from '$lib/title/nameShutter';
	import { bindSectionShutter } from '$lib/title/sectionShutter';

	export let title: string;
	/** Awards sits between the arrow buttons, so the heading has no extra margin. */
	export let flush = false;

	let titleEl: HTMLHeadingElement | null = null;
	/** Scroll distance over which the leave shutter runs. Measured from the docked pose. */
	let cachedExitSpan = 0;

	function charsOf(text: string): string[] {
		return [...(text ?? '')];
	}

	function prefersReducedMotion() {
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	/** 0 at the previous section, 0.5 while this one is docked, 1 at the next. */
	function displayProgress(section: HTMLElement, scrollLeft: number, introShiftPx: number) {
		const track = section.closest('.scroll-track');
		const panels = track ? [...track.querySelectorAll(':scope > section')] : [section];
		const index = Math.max(0, panels.indexOf(section));
		const here = section.offsetLeft;
		const prev = index > 0 ? (panels[index - 1] as HTMLElement).offsetLeft : null;
		const next = index < panels.length - 1 ? (panels[index + 1] as HTMLElement).offsetLeft : null;
		const before = prev != null ? here - prev : next != null ? next - here : window.innerWidth;
		const after = next != null ? next - here : before;
		const start = here - before;
		const span = before + after;
		if (!(span > 0)) return 0.5;
		return (scrollLeft - introShiftPx - start) / span;
	}

	function applyClip(left: number, right: number) {
		if (!titleEl) return;
		if (left < 0.004 && right < 0.004) {
			titleEl.style.setProperty('--char-clip', 'none');
			return;
		}
		titleEl.style.setProperty(
			'--char-clip',
			`inset(0 ${(right * 100).toFixed(2)}% 0 ${(left * 100).toFixed(2)}%)`
		);
	}

	/**
	 * Distance from the docked section to the scroll position where this heading's
	 * right edge hits the left of the viewport. `pastDock + box.right` stays constant
	 * as the page scrolls.
	 */
	function exitTravel(pastDock: number) {
		if (!titleEl) return 0;
		if (document.documentElement.classList.contains('card-modal-open')) return 0;
		const box = titleEl.getBoundingClientRect();
		if (!(box.width > 40)) return 0;
		return pastDock + box.right;
	}

	function syncShutter(scrollLeft: number, introShiftPx: number) {
		if (!titleEl) return;
		if (prefersReducedMotion()) {
			titleEl.style.setProperty('--char-clip', 'none');
			return;
		}
		const section = titleEl.closest('section') as HTMLElement | null;
		if (!section) return;

		const pastDock = scrollLeft - introShiftPx - section.offsetLeft;
		if (pastDock > 0) {
			const travel = exitTravel(pastDock);
			if (travel > 80) cachedExitSpan = Math.round(travel * SHUTTER_EXIT_FRACTION);
			if (cachedExitSpan > 0) {
				const { left, right } = nameShutterInsets(pastDock, cachedExitSpan);
				applyClip(left, right);
				return;
			}
		}

		const { left, right } = headerDisplayInsets(displayProgress(section, scrollLeft, introShiftPx));
		applyClip(left, right);
	}

	onMount(() => bindSectionShutter(syncShutter));
</script>

<h1 class="title shutter-title" class:shutter-title--flush={flush} bind:this={titleEl} aria-label={title}>
	<span class="shutter-chars" aria-hidden="true">{#each charsOf(title) as ch, i (i)}<span class="char">{ch === ' ' ? '\u00A0' : ch}</span>{/each}</span>
</h1>

<style>
	.title.shutter-title {
		display: inline-flex;
		width: max-content;
		max-width: 100%;
		margin: 0 0 10px;
		font-size: var(--heading-size);
		line-height: 1.05;
		letter-spacing: 0;
		/* Covered until scroll places this heading in its display window. */
		--shutter-left: 48%;
		--shutter-right: 54%;
	}

	.shutter-title--flush {
		margin: 0;
	}

	.shutter-chars {
		display: inline-flex;
	}

	.char {
		display: block;
		flex: 0 0 auto;
		letter-spacing: -0.03em;
		text-shadow: inherit;
		clip-path: var(--char-clip, inset(0 var(--shutter-right) 0 var(--shutter-left)));
	}

	@media (prefers-reduced-motion: reduce) {
		.title.shutter-title {
			--shutter-left: 0%;
			--shutter-right: 0%;
		}
	}
</style>
