<script setup>
import { RouterLink, RouterView } from 'vue-router';
</script>

<template>
	<div class="app">
		<nav class="nav">
			<RouterLink :to="{ name: 'save-explorer' }">Save Explorer</RouterLink>
			<RouterLink :to="{ name: 'settings' }">Settings</RouterLink>
		</nav>
		<main class="main">
			<RouterView />
		</main>
	</div>
</template>

<style scoped>
.app {
	min-height: 100vh;
}
.nav {
	position: sticky;
	top: 0;
	display: flex;
	gap: 1rem;
	padding: 0.75rem 1rem;
	border-bottom: 1px solid var(--house--border_color-interactive);
	background-color: white;

	@media (min-width: 600px) {
		padding: 1rem 2rem;
	}
}
.nav a {
	color: var(--house--color--ink);
	text-decoration: none;
	font-weight: 500;
}
.nav a.router-link-active {
	color: var(--house--color--primary);
}
.main {
	max-width: var(--house--page--max_width);
	margin: 0 auto;
	padding-bottom: 1rem;
	padding-left: 1rem;
	padding-right: 1rem;

	@media (min-width: 600px) {
		padding-bottom: 1.75rem;
		padding-left: 1.75rem;
		padding-right: 1.75rem;
	}
}
</style>
