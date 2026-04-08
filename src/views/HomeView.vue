<script setup>
import { APP_DESCRIPTION, APP_NAME } from '../app.meta.js'
</script>

<template>
	<div class="v-home">
		<h1>{{ APP_NAME }}</h1>
		<p class="lead">
			{{ APP_DESCRIPTION }} Crew manifests, contract summaries, and more are on the roadmap; upload and
			parsing are next.
		</p>
	</div>
</template>

<style scoped>
.v-home {
	max-width: var(--house--page--max_width);
}
</style>
