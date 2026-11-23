<script lang="ts">
	import AwardsArc from '$lib/awards/AwardsArc.svelte';
	import { awards } from '$lib/awards/awards';

	export let title: string;
</script>

<AwardsArc {title} {awards} repeatFactor={3} />
