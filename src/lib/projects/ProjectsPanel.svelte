<script lang="ts">
	import ProjectSelect from '$lib/projects/ProjectSelect.svelte';
	import { projects } from '$lib/projects/projects';
	import ShutterHeading from '$lib/title/ShutterHeading.svelte';

	export let title: string;
</script>

<ShutterHeading {title} />

<div class="projects-select projects-select--top">
	<ProjectSelect {projects} initialId={projects[0]?.id ?? null} />
</div>

<style>
	.projects-select {
		margin: 12px 0 14px;
	}

	.projects-select--top {
		display: flex;
		justify-content: center;
		margin: 0 0 16px;
	}
</style>
