import { copyFileSync } from 'fs'
import { join } from 'path'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import {
	APP_BACKGROUND_COLOR,
	APP_DESCRIPTION,
	APP_DISPLAY,
	APP_LANG,
	APP_MANIFEST_ICONS,
	APP_NAME,
	APP_SHORT_NAME,
	APP_START_URL,
	APP_THEME_COLOR,
} from './src/app/app.const.js'

function appHtmlMetaPlugin(base) {
	const baseNorm = base.endsWith('/') ? base : `${base}/`
	const iconHref = `${baseNorm}app/icon.svg`
	const appleHref = `${baseNorm}app/apple-touch-icon.png`

	return {
		name: 'app-html-meta',
		transformIndexHtml(html) {
			return html
				.replaceAll('%APP_NAME%', APP_NAME)
				.replaceAll('%APP_SHORT_NAME%', APP_SHORT_NAME)
				.replaceAll('%APP_DESCRIPTION%', APP_DESCRIPTION)
				.replaceAll('%APP_LANG%', APP_LANG)
				.replaceAll('%APP_THEME_COLOR%', APP_THEME_COLOR)
				.replaceAll('%APP_ICON_HREF%', iconHref)
				.replaceAll('%APP_APPLE_TOUCH_ICON_HREF%', appleHref)
		},
	}
}

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode ?? 'development', process.cwd(), 'VITE_')
	const base = env.VITE_BASE_PATH ?? '/'

	return {
		base,
		plugins: [
			vue(),
			appHtmlMetaPlugin(base),
			VitePWA({
				manifest: {
					name: APP_NAME,
					short_name: APP_SHORT_NAME,
					description: APP_DESCRIPTION,
					lang: APP_LANG,
					theme_color: APP_THEME_COLOR,
					background_color: APP_BACKGROUND_COLOR,
					display: APP_DISPLAY,
					start_url: APP_START_URL,
					icons: APP_MANIFEST_ICONS,
				},
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
			include: ['src/**/*.test.js', 'packages/**/*.test.js'],
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
