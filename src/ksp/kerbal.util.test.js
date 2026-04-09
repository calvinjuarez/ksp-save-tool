import { describe, expect, it } from 'vitest'
import { parseBuild } from './kerbal.util.js'

describe('kerbal.util', () => {
	it('parses slim and default comboIds', () => {
		expect(parseBuild('slim_male_3')).toEqual({
			abbr: 'M',
			title: 'Masculine',
			colorVariant: '3',
		})
		expect(parseBuild('slim_female_2')).toEqual({
			abbr: 'F',
			title: 'Feminine',
			colorVariant: '2',
		})
		expect(parseBuild('default_male_0')).toEqual({
			abbr: 'M',
			title: 'Masculine',
			colorVariant: '0',
		})
		expect(parseBuild('default_female_0')).toEqual({
			abbr: 'F',
			title: 'Feminine',
			colorVariant: '0',
		})
	})

	it('returns null for unparseable comboId', () => {
		expect(parseBuild('')).toBeNull()
		expect(parseBuild(undefined)).toBeNull()
		expect(parseBuild('weird')).toBeNull()
	})
})
