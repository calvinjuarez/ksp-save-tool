<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
	<div class="v-not-found">
		<h1>Page not found</h1>
		<p class="lead">That route doesn't exist. Head back to get started.</p>
		<RouterLink to="/" class="btn btn-primary">Home</RouterLink>
	</div>
</template>

<style scoped>
.v-not-found {
	max-width: var(--house--page--max_width);
}
</style>
