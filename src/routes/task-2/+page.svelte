<script lang="ts">
    import EngagementAnalysis from "$lib/components/engagementAnalysis.svelte";
import type { PageData } from "./$types";
    let { data }: { data: PageData } = $props();
</script>

<div class="flex flex-col items-center justify-center">
    <EngagementAnalysis events={data.data} />
</div>