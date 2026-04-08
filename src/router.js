import { createRouter, createWebHistory } from 'vue-router'
import { APP_NAME } from './app.meta.js'

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
	document.title = to.meta?.title
		? `${to.meta.title} | ${APP_NAME}`
		: APP_NAME
})

export default router
