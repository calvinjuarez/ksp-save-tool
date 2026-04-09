import { createRouter, createWebHistory } from 'vue-router'
import { APP_NAME } from './app/app.const.js'

const routes = [
	{
		path: '/',
		name: 'home',
		component: () => import('./app/HomeView.vue'),
		meta: { title: 'Home' },
	},
	{
		path: '/settings',
		name: 'settings',
		component: () => import('./settings/SettingsView.vue'),
		meta: { title: 'Settings' },
	},
	{
		path: '/crew-manifest',
		name: 'crew-manifest',
		component: () => import('./crew-manifest/CrewManifestView.vue'),
		meta: { title: 'Crew manifest' },
	},
	{
		path: '/:pathMatch(.*)*',
		name: 'not-found',
		component: () => import('./app/NotFoundView.vue'),
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
