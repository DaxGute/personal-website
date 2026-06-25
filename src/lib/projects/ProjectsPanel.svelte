<script lang="ts">
	import ProjectSelect from '$lib/projects/ProjectSelect.svelte';
	import { projects } from '$lib/projects/projects';

	export let kicker: string | undefined = undefined;
	export let title: string;
	export let body: string;
</script>

<div class="projects-select projects-select--top">
	<ProjectSelect {projects} initialId={projects[0]?.id ?? null} />
</div>

{#if kicker}
	<p class="kicker">{kicker}</p>
{/if}
<h1 class="title">{title}</h1>
<p class="body">{body}</p>

<style>
	.kicker {
		margin: 0 0 10px;
		color: var(--muted);
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		font-size: 12px;
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

	.projects-select {
		margin: 12px 0 14px;
	}

	.projects-select--top {
		margin: 0 0 16px;
	}
</style>
