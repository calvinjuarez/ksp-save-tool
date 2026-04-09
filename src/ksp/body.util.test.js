import { describe, expect, it } from 'vitest'
import { bodyNameFromOrbitRef } from './body.util.js'

describe('body.util', () => {
	it('maps stock REF to names', () => {
		expect(bodyNameFromOrbitRef('1')).toBe('Kerbin')
		expect(bodyNameFromOrbitRef(2)).toBe('Mun')
	})

	it('falls back for unknown REF', () => {
		expect(bodyNameFromOrbitRef(99)).toBe('Unknown (REF 99)')
	})
})
