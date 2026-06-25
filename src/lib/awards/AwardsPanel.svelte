<script lang="ts">
	import AwardsArc from '$lib/awards/AwardsArc.svelte';
	import { awards } from '$lib/awards/awards';

	export let kicker: string | undefined = undefined;
	export let title: string;
	export let body: string;
</script>

<AwardsArc {kicker} {title} {body} {awards} repeatFactor={3} />
