import { createPinia, defineStore, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp, nextTick, ref } from 'vue'
import { persistUiPrefsPlugin } from './persist-ui-prefs.plugin.js'

const useTestPersistStore = defineStore(
	'testPersistPluginStore',
	() => {
		const n = ref(0)
		const label = ref('init')
		return { n, label }
	},
	{
		persist: {
			key: 'ksp-explorer:save:test-plugin-persist',
			version: 1,
			paths: ['n', 'label'],
			validate: (data) => {
				if (data == null || typeof data !== 'object') {
					return null
				}
				const o = /** @type {Record<string, unknown>} */ (data)
				/** @type {Record<string, unknown>} */
				const out = {}
				if (typeof o.n === 'number') {
					out.n = o.n
				}
				if (typeof o.label === 'string') {
					out.label = o.label
				}
				return Object.keys(out).length ? out : null
			},
		},
	},
)

const useTestMigrateStore = defineStore(
	'testMigratePersistStore',
	() => {
		const n = ref(0)
		return { n }
	},
	{
		persist: {
			key: 'ksp-explorer:save:test-migrate-persist',
			version: 2,
			paths: ['n'],
			migrate: (old, oldV) => {
				if (oldV === 1 && old && typeof old === 'object' && 'oldN' in old) {
					return { n: Number(/** @type {{ oldN: unknown }} */ (old).oldN) }
				}
				return null
			},
			validate: (data) => {
				if (data == null || typeof data !== 'object') {
					return null
				}
				const o = /** @type {Record<string, unknown>} */ (data)
				if (typeof o.n !== 'number') {
					return null
				}
				return { n: o.n }
			},
		},
	},
)

beforeEach(() => {
	localStorage.clear()
	const pinia = createPinia()
	pinia.use(persistUiPrefsPlugin)
	const app = createApp({ template: '<div />' })
	app.use(pinia)
	setActivePinia(pinia)
})

describe('persistUiPrefsPlugin', () => {
	it('hydrates from localStorage', () => {
		localStorage.setItem(
			'ksp-explorer:save:test-plugin-persist',
			JSON.stringify({ v: 1, data: { n: 9, label: 'from disk' } }),
		)
		const s = useTestPersistStore()
		expect(s.n).toBe(9)
		expect(s.label).toBe('from disk')
	})

	it('persists mutations', async () => {
		const s = useTestPersistStore()
		s.n = 3
		await nextTick()
		const raw = localStorage.getItem('ksp-explorer:save:test-plugin-persist')
		expect(raw).toBeTruthy()
		const parsed = JSON.parse(/** @type {string} */ (raw))
		expect(parsed.v).toBe(1)
		expect(parsed.data.n).toBe(3)
	})

	it('applies storage event from another tab', () => {
		const s = useTestPersistStore()
		expect(s.n).toBe(0)
		window.dispatchEvent(
			new StorageEvent('storage', {
				key: 'ksp-explorer:save:test-plugin-persist',
				newValue: JSON.stringify({ v: 1, data: { n: 44, label: 'x' } }),
			}),
		)
		expect(s.n).toBe(44)
		expect(s.label).toBe('x')
	})

	it('runs migrate when file version differs', () => {
		localStorage.setItem(
			'ksp-explorer:save:test-migrate-persist',
			JSON.stringify({ v: 1, data: { oldN: 12 } }),
		)
		const s = useTestMigrateStore()
		expect(s.n).toBe(12)
	})

	it('skips hydrate when validate returns null', () => {
		localStorage.setItem(
			'ksp-explorer:save:test-plugin-persist',
			JSON.stringify({ v: 1, data: { n: 'not-a-number' } }),
		)
		const s = useTestPersistStore()
		expect(s.n).toBe(0)
		expect(s.label).toBe('init')
	})

	it('ignores malformed localStorage payload', () => {
		localStorage.setItem('ksp-explorer:save:test-plugin-persist', 'not-json{')
		const s = useTestPersistStore()
		expect(s.n).toBe(0)
	})
})
