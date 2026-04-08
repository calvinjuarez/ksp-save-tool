import { createRouter, createWebHistory } from 'vue-router'

const routes = [
	{
		path: '/',
		name: 'home',
		component: () => import('./views/HomeView.vue'),
		meta: { title: 'Home' },
	},
	{
		path: '/settings',
		name: 'settings',
		component: () => import('./views/SettingsView.vue'),
		meta: { title: 'Settings' },
	},
	{
		path: '/:pathMatch(.*)*',
		name: 'not-found',
		component: () => import('./views/NotFoundView.vue'),
		meta: { title: 'Not Found' },
	},
]

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes,
})

router.afterEach((to) => {
	const suffix = 'cj-vite-vue-pwa-template'
	document.title = to.meta?.title ? `${to.meta.title} | ${suffix}` : suffix
})

export default router
