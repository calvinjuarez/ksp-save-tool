import { describe, expect, it } from 'vitest'
import { crewManifestMarkEnumOptionLabel } from './crew-manifest-mark.const.js'

describe('crewManifestMarkEnumOptionLabel', () => {
	it('returns emoji and title for known mark kinds', () => {
		expect(crewManifestMarkEnumOptionLabel('openRescue')).toBe('🆘 Needs Rescue')
		expect(crewManifestMarkEnumOptionLabel('rescued')).toBe('🛟 Rescued')
		expect(crewManifestMarkEnumOptionLabel('tourist')).toBe('🗺️ Tourist')
	})

	it('returns the stored value when unknown', () => {
		expect(crewManifestMarkEnumOptionLabel('futureKind')).toBe('futureKind')
	})
})
