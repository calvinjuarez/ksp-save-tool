import { defineStore } from 'pinia'
import { ref } from 'vue'

function detectAppMode() {
	if (typeof window === 'undefined') return 'browser'
	if (window.self !== window.top) return 'embedded'
	if (window.matchMedia('(display-mode: standalone)').matches) return 'standalone'
	if (window.matchMedia('(display-mode: fullscreen)').matches) return 'fullscreen'
	if (window.matchMedia('(display-mode: minimal-ui)').matches) return 'minimal-ui'
	if (window.navigator.standalone) return 'standalone'
	return 'browser'
}

function updateBodyClass(mode) {
	// Remove all app_mode-* classes
	const classes = Array.from(document.body.classList).filter(c => c.startsWith('app_mode-'))
	classes.forEach(c => document.body.classList.remove(c))
	// Add the current one
	document.body.classList.add(`app_mode-${mode}`)
}

export const useEnvStore = defineStore('env', () => {
	const appMode = ref(detectAppMode())

	// Initialize body class
	updateBodyClass(appMode.value)

	// Set up listeners for display-mode changes
	// Note: iOS Safari doesn't support display-mode media query, so these listeners
	// won't fire there. iOS uses navigator.standalone (static, doesn't change during session).
	if (typeof window !== 'undefined') {
		const queries = [
			window.matchMedia('(display-mode: standalone)'),
			window.matchMedia('(display-mode: fullscreen)'),
			window.matchMedia('(display-mode: minimal-ui)'),
		]

		function handleChange() {
			const newMode = detectAppMode()
			if (newMode !== appMode.value) {
				appMode.value = newMode
				updateBodyClass(newMode)
			}
		}

		queries.forEach(query => {
			if (query.addEventListener) {
				query.addEventListener('change', handleChange)
			} else {
				// Fallback for older browsers
				query.addListener(handleChange)
			}
		})
	}

	return {
		appMode,
	}
})
