<script lang="ts">
	type SectionNavPanel = {
		id: string;
		title: string;
		navTitle?: string;
	};

	export let panels: SectionNavPanel[] = [];
	export let scrollLocked = false;
	export let onSelect: (id: string) => void = () => {};

	const REVEAL_SCROLL_PX = 50;

	let scrollRevealed = false;
	let navEl: HTMLElement | null = null;

	/** Show the bar after horizontal scroll passes the reveal threshold. */
	export function syncScrollRevealed(scrollLeft: number) {
		const revealed = scrollLeft >= REVEAL_SCROLL_PX;
		if (revealed !== scrollRevealed) scrollRevealed = revealed;
	}

	/** One `--progress-index` write per frame (avoids binding active panel in the template). */
	export function setProgressIndex(progressIndex: number) {
		navEl?.style.setProperty('--progress-index', String(progressIndex));
	}

	/** Keep aria-current + active styling in sync without reactive props (avoids full-page re-renders). */
	export function setActiveId(activeId: string) {
		if (!navEl) return;
		const buttons = navEl.querySelectorAll<HTMLButtonElement>('.section-nav__btn');
		for (let i = 0; i < buttons.length; i++) {
			const id = panels[i]?.id;
			const active = id === activeId;
			const btn = buttons[i]!;
			if (active) btn.setAttribute('aria-current', 'true');
			else btn.removeAttribute('aria-current');
			btn.classList.toggle('section-nav__btn--active', active);
		}
	}
</script>

<nav
	class="section-nav"
	class:section-nav--revealed={!scrollLocked && scrollRevealed}
	bind:this={navEl}
	aria-label="Panel navigation"
>
	{#each panels as p, i}
		<button
			type="button"
			class="section-nav__btn"
			aria-label={`Go to ${p.navTitle ?? p.title}`}
			disabled={scrollLocked}
			style:--dot-idx={i}
			onclick={() => onSelect(p.id)}
		>
			<span class="section-nav__dot" aria-hidden="true"></span>
			<span class="section-nav__label" aria-hidden="true">{p.navTitle ?? p.title}</span>
		</button>
	{/each}
</nav>

<style>
	.section-nav {
		position: absolute;
		left: 50%;
		bottom: 15vh;
		transform: translateX(-50%);
		z-index: 10;
		display: inline-flex;
		gap: 12px;
		opacity: 0;
		pointer-events: none;
		transition: opacity 1200ms cubic-bezier(0.16, 1, 0.3, 1);
		--progress-index: 0;
	}

	.section-nav--revealed {
		opacity: 1;
		pointer-events: auto;
	}

	.section-nav__btn {
		appearance: none;
		border: 0;
		background: transparent;
		padding: 10px;
		border-radius: 999px;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
	}

	.section-nav__btn:disabled {
		cursor: default;
		opacity: 0.45;
	}

	.section-nav__btn:focus-visible {
		outline: 3px solid rgba(124, 58, 237, 0.25);
		outline-offset: 2px;
	}

	.section-nav__dot {
		display: block;
		width: 7px;
		height: 7px;
		border-radius: 999px;
		--dist: max(
			var(--progress-index) - var(--dot-idx),
			var(--dot-idx) - var(--progress-index)
		);
		--a: clamp(0.12, calc(0.88 - var(--dist, 0) * 0.48), 0.88);
		background: rgb(11 18 32 / var(--a));
		transform: scale(clamp(0.88, calc(1.32 - var(--dist, 0) * 0.22), 1.32));
		transition: none;
	}

	.section-nav__btn:hover .section-nav__dot {
		background: rgb(11 18 32 / 0.55);
	}

	.section-nav__label {
		position: relative;
		display: inline-block;
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
		transition: color 420ms cubic-bezier(0.16, 1, 0.3, 1);
	}

	.section-nav__label::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: -3px;
		height: 1px;
		background: rgba(11, 18, 32, 0.92);
		transform: scaleX(0);
		transform-origin: left center;
		transition: transform 420ms cubic-bezier(0.16, 1, 0.3, 1);
	}

	/* :global — class is toggled imperatively in setActiveId (same as aria-current). */
	:global(.section-nav__btn--active) .section-nav__label {
		color: rgba(11, 18, 32, 0.92);
	}

	:global(.section-nav__btn--active) .section-nav__label::after {
		transform: scaleX(1);
	}

	@media (prefers-reduced-motion: reduce) {
		.section-nav__label,
		.section-nav__label::after {
			transition: none;
		}
	}

	@media (max-width: 900px) {
		.section-nav {
			display: none;
		}
	}
</style>
