import { createRouter, createWebHistory } from 'vue-router'
import { APP_NAME } from './app/app.const.js'

const routes = [
	{
		path: '/',
		redirect: { name: 'save-explorer' },
	},
	{
		path: '/save-explorer',
		name: 'save-explorer',
		component: () => import('./save-file/SaveFileExplorerView.vue'),
		meta: { title: 'Save Explorer' },
		children: [
			{
				path: 'crew-manifest',
				name: 'crew-manifest',
				component: () => import('./crew-manifest/CrewManifestView.vue'),
				meta: { title: 'Crew Manifest' },
			},
		],
	},
	{
		path: '/crew-manifest',
		redirect: { name: 'crew-manifest' },
	},
	{
		path: '/settings',
		name: 'settings',
		component: () => import('./settings/SettingsView.vue'),
		meta: { title: 'Settings' },
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
