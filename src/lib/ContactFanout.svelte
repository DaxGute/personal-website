<script lang="ts">
	import { onMount } from 'svelte';
	import signature from '$lib/assets/signature.svg';

	export let linkedinHref: string;
	export let githubHref: string;
	export let emailHref: string;

	let open = false;
	let root: HTMLDivElement | null = null;

	function toggle(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		open = !open;
	}

	function close() {
		open = false;
	}

	onMount(() => {
		const onPointerDown = (e: PointerEvent) => {
			if (!open) return;
			const t = e.target as Node | null;
			if (!root || !t) return;
			if (!root.contains(t)) close();
		};

		const onKeyDown = (e: KeyboardEvent) => {
			if (!open) return;
			if (e.key === 'Escape') close();
		};

		document.addEventListener('pointerdown', onPointerDown, { capture: true });
		window.addEventListener('keydown', onKeyDown);
		return () => {
			document.removeEventListener('pointerdown', onPointerDown, { capture: true } as any);
			window.removeEventListener('keydown', onKeyDown);
		};
	});
</script>

<div class="contact-menu" bind:this={root} data-open={open ? 'true' : 'false'}>
	<button
		class="contact-btn"
		type="button"
		aria-label="Contact links"
		title="Contact"
		aria-haspopup="true"
		aria-expanded={open}
		aria-controls="contact-fanout"
		onclick={toggle}
	>
		<span class="icon-swap" aria-hidden="true">
			<img class="swap-icon swap-mail" src={signature} alt="" aria-hidden="true" />

			<svg
				class="swap-icon swap-x"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M18 6 6 18"></path>
				<path d="M6 6l12 12"></path>
			</svg>
		</span>
	</button>

	<div id="contact-fanout" class="fanout" aria-hidden={!open}>
		<a
			class="bubble bubble-linkedin"
			href={linkedinHref}
			target="_blank"
			rel="noreferrer"
			aria-label="LinkedIn"
			title="LinkedIn"
		>
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path
					fill="currentColor"
					d="M20.45 20.45h-3.55v-5.56c0-1.33-.03-3.04-1.86-3.04-1.86 0-2.15 1.45-2.15 2.95v5.65H9.34V9h3.4v1.56h.05c.47-.89 1.62-1.83 3.33-1.83 3.56 0 4.22 2.34 4.22 5.38v6.34ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM3.56 20.45h3.56V9H3.56v11.45Z"
				/>
			</svg>
		</a>

		<a
			class="bubble bubble-github"
			href={githubHref}
			target="_blank"
			rel="noreferrer"
			aria-label="GitHub"
			title="GitHub"
		>
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path
					fill="currentColor"
					d="M12 .5a11.5 11.5 0 0 0-3.64 22.42c.58.1.8-.25.8-.56v-2.1c-3.26.7-3.95-1.38-3.95-1.38-.54-1.36-1.32-1.72-1.32-1.72-1.08-.74.08-.73.08-.73 1.2.08 1.83 1.23 1.83 1.23 1.06 1.82 2.78 1.3 3.46 1 .11-.78.42-1.3.76-1.6-2.6-.3-5.34-1.3-5.34-5.78 0-1.28.46-2.32 1.22-3.14-.12-.3-.53-1.52.12-3.17 0 0 1-.32 3.28 1.2a11.3 11.3 0 0 1 5.98 0c2.28-1.52 3.28-1.2 3.28-1.2.65 1.65.24 2.87.12 3.17.76.82 1.22 1.86 1.22 3.14 0 4.5-2.75 5.48-5.37 5.77.43.37.82 1.1.82 2.22v3.3c0 .31.22.67.8.56A11.5 11.5 0 0 0 12 .5Z"
				/>
			</svg>
		</a>

		<a class="bubble bubble-email" href={emailHref} aria-label="Email" title="Email">
			<!-- Outline mail icon (previously used as the main contact icon) -->
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M4 6h16v12H4z"></path>
				<path d="m4 7 8 6 8-6"></path>
			</svg>
		</a>
	</div>
</div>

<style>
	.contact-menu {
		position: relative;
		pointer-events: auto;
		/* Scale the entire control (button + fanout bubbles) */
		--contact-scale: 1.35;
		transform: scale(var(--contact-scale));
		transform-origin: top right;
	}

	/* Match existing button look (the parent page defines these classes too). */
	.contact-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: calc(var(--menu-control-h) + (var(--menu-pad) * 2));
		height: calc(var(--menu-control-h) + (var(--menu-pad) * 2));
		padding: var(--menu-pad);
		border-radius: 999px;
		border: 1px solid var(--card-border);
		background: var(--card);
		backdrop-filter: blur(var(--glass-blur));
		color: var(--muted);
		box-shadow: var(--shadow);
		cursor: pointer;
	}

	.contact-btn:hover {
		color: var(--fg);
		background: var(--card-hover);
	}

	.contact-btn:focus-visible {
		outline: 3px solid rgba(124, 58, 237, 0.25);
		outline-offset: 2px;
	}

	.icon-swap {
		position: relative;
		width: 28px;
		height: 28px;
		display: block;
	}

	.swap-icon {
		position: absolute;
		inset: 0;
		width: 28px;
		height: 28px;
		display: block;
		transform-origin: 50% 50%;
		transition:
			transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1),
			opacity 160ms cubic-bezier(0.2, 0.8, 0.2, 1);
	}

	/* Ensure the signature image scales nicely */
	.swap-icon.swap-mail {
		object-fit: contain;
	}

	/* Closed state */
	.swap-mail {
		opacity: 1;
		transform: rotate(0deg) scale(1);
	}
	.swap-x {
		opacity: 0;
		transform: rotate(-90deg) scale(0.85);
	}

	/* Open state: rotate mail out, rotate X in */
	.contact-menu[data-open='true'] .swap-mail {
		opacity: 0;
		transform: rotate(90deg) scale(0.85);
	}
	.contact-menu[data-open='true'] .swap-x {
		opacity: 1;
		transform: rotate(0deg) scale(1);
	}

	.fanout {
		position: absolute;
		top: 0;
		right: 0;
		width: 0;
		height: 0;
	}

	.bubble {
		position: absolute;
		top: 0;
		right: 0;
		width: calc(var(--menu-control-h) + (var(--menu-pad) * 2));
		height: calc(var(--menu-control-h) + (var(--menu-pad) * 2));
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 999px;
		border: 1px solid var(--card-border);
		background: var(--card-strong);
		backdrop-filter: blur(var(--glass-blur));
		color: var(--fg);
		box-shadow: var(--shadow);
		text-decoration: none;

		opacity: 0;
		transform: translate(0px, 0px) scale(0.75);
		pointer-events: none;
		transition:
			transform 320ms cubic-bezier(0.2, 0.8, 0.2, 1),
			opacity 180ms cubic-bezier(0.2, 0.8, 0.2, 1),
			background 140ms ease;
	}

	.bubble svg {
		width: 18px;
		height: 18px;
		display: block;
	}

	/* Fan-out positions (top-right button, so we arc down-left) */
	.bubble-linkedin {
		--tx: -96px;
		--ty: 12px;
		transition-delay: 0ms;
	}
	.bubble-github {
		--tx: -74px;
		--ty: 74px;
		transition-delay: 40ms;
	}
	.bubble-email {
		--tx: -12px;
		--ty: 96px;
		transition-delay: 80ms;
	}

	.contact-menu[data-open='true'] .bubble {
		opacity: 1;
		transform: translate(var(--tx), var(--ty)) scale(1);
		pointer-events: auto;
	}

	.bubble:hover {
		background: var(--card-hover);
	}

	.bubble:focus-visible {
		outline: 3px solid rgba(124, 58, 237, 0.25);
		outline-offset: 2px;
	}

	@media (prefers-reduced-motion: reduce) {
		.swap-icon {
			transition: none;
		}
		.bubble {
			transition: none;
		}
	}
</style>

