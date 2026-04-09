/** Single source for PWA manifest, HTML tokens (via Vite), and in-app copy. Paths are relative to site root / `public/`. */

export const APP_NAME = 'KSP Save File Explorer'

export const APP_SHORT_NAME = 'KSP Saves'

export const APP_DESCRIPTION =
	'Upload and explore Kerbal Space Program save files in the browser.'

export const APP_LANG = 'en'

export const APP_THEME_COLOR = '#333'

export const APP_BACKGROUND_COLOR = '#ffffff'

export const APP_DISPLAY = 'standalone'

export const APP_START_URL = './'

/** Default favicon / manifest SVG under `public/app/` (populated by `npm run icons`). */
export const APP_ICON_PATH = './app/icon.svg'

export const APP_APPLE_TOUCH_ICON_PATH = './app/apple-touch-icon.png'

export const APP_MANIFEST_ICONS = [
	{
		src: APP_ICON_PATH,
		sizes: 'any',
		type: 'image/svg+xml',
		purpose: 'any',
	},
	{
		src: './app/icon-192.png',
		sizes: '192x192',
		type: 'image/png',
		purpose: 'any',
	},
	{
		src: './app/icon-512.png',
		sizes: '512x512',
		type: 'image/png',
		purpose: 'any',
	},
]
