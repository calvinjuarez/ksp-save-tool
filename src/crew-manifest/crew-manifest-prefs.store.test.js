import { describe, expect, it } from 'vitest'
import { validateCrewManifestPrefsPayload } from './crew-manifest-prefs.store.js'

describe('validateCrewManifestPrefsPayload', () => {
	it('repairs filters with unknown column keys', () => {
		const out = validateCrewManifestPrefsPayload({
			groupBy: 'location',
			primarySort: { key: 'body', dir: 'asc' },
			filters: [
				{ id: '1', columnKey: 'body', operator: 'enumSet', value: [] },
				{ id: '2', columnKey: 'removedColumn', operator: 'is', value: 'x' },
			],
		})
		expect(out).not.toBeNull()
		expect(/** @type {unknown[]} */ (/** @type {Record<string, unknown>} */ (out).filters)).toHaveLength(1)
	})

	it('returns null for non-object', () => {
		expect(validateCrewManifestPrefsPayload(null)).toBeNull()
	})
})
