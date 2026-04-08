<script setup>
import { RouterLink, RouterView } from 'vue-router';
</script>

<template>
	<div class="app">
		<nav class="nav">
			<RouterLink to="/">Home</RouterLink>
			<RouterLink to="/settings">Settings</RouterLink>
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
	display: flex;
	gap: 1rem;
	padding: 0.75rem 1rem;
	border-bottom: 1px solid var(--house--border_color-interactive);

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
	padding: 1rem;

	@media (min-width: 600px) {
		padding: 1.75rem;
	}
}
</style>
