import { describe, expect, it } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEnvStore } from './env.store.js'

describe('useEnvStore', () => {
	it('exposes appMode', () => {
		setActivePinia(createPinia())
		const store = useEnvStore()
		expect(['browser', 'embedded', 'standalone', 'fullscreen', 'minimal-ui']).toContain(store.appMode)
	})
})
