import { copyFileSync } from 'fs'
import { join } from 'path'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode ?? 'development', process.cwd(), 'VITE_')
	const base = env.VITE_BASE_PATH ?? '/'

	return {
		base,
		plugins: [
			vue(),
			VitePWA({
				manifest: false,
				workbox: {
					globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
					maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
					navigateFallback: base.endsWith('/') ? `${base}index.html` : `${base}/index.html`,
					navigateFallbackAllowlist: [/./],
					navigateFallbackDenylist: [],
				},
				registerType: 'autoUpdate',
			}),
			{
				name: 'github-pages-404',
				closeBundle() {
					const outDir = join(process.cwd(), 'dist')
					copyFileSync(join(outDir, 'index.html'), join(outDir, '404.html'))
				},
			},
		],
		test: {
			include: ['src/**/*.test.js'],
			environment: 'happy-dom',
		},
		server: {
			port: 7566,
			watch: {
				usePolling: true,
			},
		},
	}
})
