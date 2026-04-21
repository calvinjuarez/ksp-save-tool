import { getActivePinia } from 'pinia'
import { isRef, toRaw } from 'vue'

/**
 * Apply persisted fields to a setup store by writing `ref.value` on the raw Pinia state object.
 * Avoids `$patch` object merge (which replaces refs) and the `$patch` function callback (which sees a proxy that unwraps refs).
 *
 * @param {import('pinia').StoreGeneric} store
 * @param {Record<string, unknown>} patch
 */
function applyPrefsPatch(store, patch) {
	const pinia = getActivePinia() ?? /** @type {{ _p?: import('pinia').Pinia }} */ (store)._p
	const id = /** @type {{ $id: string }} */ (store).$id
	if (!pinia || !id) {
		return
	}
	const rawState = toRaw(pinia.state.value[id])
	for (const key of Object.keys(patch)) {
		if (!(key in rawState)) {
			continue
		}
		const val = patch[key]
		const node = /** @type {Record<string, unknown>} */ (rawState)[key]
		if (isRef(node)) {
			/** @type {import('vue').Ref<unknown>} */ (node).value = val
		} else {
			/** @type {Record<string, unknown>} */ (rawState)[key] = val
		}
	}
}

/**
 * Pinia plugin: persist selected store state slices to `localStorage` with a versioned
 * envelope, optional migrate/validate, and cross-tab sync via the `storage` event.
 *
 * **Key namespace:** `ksp-explorer:save:<feature-slug>` — see ADR-006. One key per store
 * (whole persisted blob), not per field.
 *
 * **Pinia installs queued plugins when the app calls `app.use(pinia)`** — not when `createPinia()` returns.
 * Tests that only use `setActivePinia(pinia)` must also `createApp(...).use(pinia)` (or an equivalent install), or plugins never run.
 *
 * Opt in on `defineStore` (setup syntax) via the third argument:
 *
 * ```js
 * defineStore('myPrefs', () => ({ ... }), {
 *   persist: {
 *     key: 'ksp-explorer:save:my-feature',
 *     version: 1,
 *     paths: ['a', 'b'],
 *     validate: (data) => data,
 *     migrate: (old, oldVersion) => ({ ...old, newField: 0 }),
 *   },
 * })
 * ```
 *
 * @typedef {Object} PersistUiPrefsConfig
 * @property {string} key - `localStorage` key (full string, including prefix).
 * @property {number} version - Current schema version written under envelope `v`.
 * @property {readonly string[]} paths - State keys to persist (must exist on the store).
 * @property {(data: unknown) => unknown | null} [validate] - Return repaired payload or `null` to reject.
 * @property {(oldData: unknown, oldVersion: number) => unknown | null} [migrate] - When stored `v !== version`, run before validate. Return new-shape data or `null`.
 */

/** @type {Map<string, { pinia: import('pinia').Pinia, storeId: string, version: number, paths: readonly string[], migrate?: PersistUiPrefsConfig['migrate'], validate?: PersistUiPrefsConfig['validate'] }>} */
const registryByStorageKey = new Map()

let storageListenerAttached = false

/**
 * @param {import('pinia').StoreGeneric} store
 * @param {readonly string[]} paths
 * @returns {Record<string, unknown>}
 */
function pickFromStore(store, paths) {
	/** @type {Record<string, unknown>} */
	const data = {}
	for (const p of paths) {
		if (p in store) {
			data[p] = store[p]
		}
	}
	return data
}

/**
 * @param {unknown} value
 * @returns {value is { v: number, data: unknown }}
 */
function isPersistEnvelope(value) {
	return (
		value !== null &&
		typeof value === 'object' &&
		'v' in value &&
		'data' in value &&
		typeof /** @type {{ v: unknown }} */ (value).v === 'number'
	)
}

/**
 * @param {{ store: import('pinia').StoreGeneric, pinia: import('pinia').Pinia, options: object }} context
 */
export function persistUiPrefsPlugin(context) {
	const { store, pinia, options } = context
	const persist = /** @type {{ persist?: PersistUiPrefsConfig } | undefined} */ (options)?.persist
	if (!persist) {
		return
	}

	const { key, version, paths, validate, migrate } = persist

	if (typeof key !== 'string' || !key.length) {
		console.warn('[persist-ui-prefs] Missing persist.key on store', store.$id)
		return
	}
	if (typeof version !== 'number' || !Number.isFinite(version)) {
		console.warn('[persist-ui-prefs] Missing persist.version on store', store.$id)
		return
	}
	if (!Array.isArray(paths) || paths.length === 0) {
		console.warn('[persist-ui-prefs] Missing persist.paths on store', store.$id)
		return
	}

	const existing = registryByStorageKey.get(key)
	if (existing && existing.storeId !== store.$id) {
		console.warn(
			`[persist-ui-prefs] Duplicate localStorage key "${key}" for stores "${existing.storeId}" and "${store.$id}"`,
		)
	}
	registryByStorageKey.set(key, { pinia, storeId: store.$id, version, paths, migrate, validate })

	if (typeof window !== 'undefined' && !storageListenerAttached) {
		storageListenerAttached = true
		window.addEventListener('storage', (event) => {
			if (event.key === null || event.newValue === null) {
				return
			}
			const rec = registryByStorageKey.get(event.key)
			if (!rec) {
				return
			}
			const targetStore = rec.pinia._s.get(rec.storeId)
			if (!targetStore) {
				return
			}
			try {
				const parsed = JSON.parse(event.newValue)
				if (!isPersistEnvelope(parsed)) {
					return
				}
				let data = parsed.data
				let fileVersion = parsed.v
				if (fileVersion !== rec.version && typeof rec.migrate === 'function') {
					const migrated = rec.migrate(data, fileVersion)
					if (migrated == null) {
						return
					}
					data = migrated
					fileVersion = rec.version
				}
				if (fileVersion !== rec.version) {
					return
				}
				const validated = rec.validate ? rec.validate(data) : data
				if (validated == null || typeof validated !== 'object') {
					return
				}
				/** @type {Record<string, unknown>} */
				const patch = {}
				for (const p of rec.paths) {
					if (p in /** @type {object} */ (validated)) {
						patch[p] = /** @type {Record<string, unknown>} */ (validated)[p]
					}
				}
				applyPrefsPatch(targetStore, patch)
			} catch (err) {
				console.warn('[persist-ui-prefs] storage event parse/hydrate failed', event.key, err)
			}
		})
	}

	if (typeof localStorage !== 'undefined') {
		try {
			const raw = localStorage.getItem(key)
			if (raw) {
				const parsed = JSON.parse(raw)
				if (isPersistEnvelope(parsed)) {
					let data = parsed.data
					let fileVersion = parsed.v
					if (fileVersion !== version && typeof migrate === 'function') {
						const migrated = migrate(data, fileVersion)
						if (migrated != null) {
							data = migrated
							fileVersion = version
						}
					}
					if (fileVersion === version) {
						const validated = validate ? validate(data) : data
						if (validated != null && typeof validated === 'object') {
							/** @type {Record<string, unknown>} */
							const patch = {}
							for (const p of paths) {
								if (p in /** @type {object} */ (validated)) {
									patch[p] = /** @type {Record<string, unknown>} */ (validated)[p]
								}
							}
							applyPrefsPatch(store, patch)
						}
					}
				}
			}
		} catch (err) {
			console.warn('[persist-ui-prefs] hydrate failed', key, err)
		}
	}

	store.$subscribe(() => {
		if (typeof localStorage === 'undefined') {
			return
		}
		try {
			const data = pickFromStore(store, paths)
			localStorage.setItem(key, JSON.stringify({ v: version, data }))
		} catch (err) {
			console.warn('[persist-ui-prefs] write failed', key, err)
		}
	})

	// If hydration wrote nothing, still persist defaults once so the key exists (optional).
	// Skip to avoid overwriting a concurrent tab's data before first user edit — omit initial write.

	// Re-hydrate from same-tab programmatic setItem (not fired by storage API); tests may need this.
	// Cross-tab uses `storage` only. Same-tab external changes are rare; omit.

	return {}
}
