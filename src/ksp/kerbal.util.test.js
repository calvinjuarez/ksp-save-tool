import { describe, expect, it } from 'vitest'
import {
	kerbalDisplayName,
	kerbalRankFromKerbal,
	kerbalTotalXpFromKerbal,
	parseBodyModel,
	rankFromTotalExperience,
} from './kerbal.util.js'

describe('kerbal.util', () => {
	it('parseBodyModel reads gender and comboId color segment', () => {
		expect(
			parseBodyModel({ gender: 'Male', comboId: 'default_male_0' }),
		).toEqual({
			abbr: 'M',
			title: 'Masculine',
			colorVariant: '0',
		})
		expect(
			parseBodyModel({ gender: 'Female', comboId: 'slim_female_2' }),
		).toEqual({
			abbr: 'F',
			title: 'Feminine',
			colorVariant: '2',
		})
		expect(parseBodyModel({ gender: 'Male', comboId: 'slim_male_3' })).toEqual({
			abbr: 'M',
			title: 'Masculine',
			colorVariant: '3',
		})
	})

	it('parseBodyModel returns null when gender missing or unknown', () => {
		expect(parseBodyModel({ comboId: 'default_male_0' })).toBeNull()
		expect(parseBodyModel({ gender: 'alien', comboId: 'x' })).toBeNull()
	})

	it('parseBodyModel uses null colorVariant when comboId missing or unparseable', () => {
		expect(parseBodyModel({ gender: 'Male' })).toEqual({
			abbr: 'M',
			title: 'Masculine',
			colorVariant: null,
		})
		expect(parseBodyModel({ gender: 'Female', comboId: 'weird' })).toEqual({
			abbr: 'F',
			title: 'Feminine',
			colorVariant: null,
		})
	})

	it('kerbalDisplayName strips Kerman surname', () => {
		expect(kerbalDisplayName('Jebediah Kerman')).toBe('Jebediah')
		expect(kerbalDisplayName('Bob Kerman')).toBe('Bob')
		expect(kerbalDisplayName('Val')).toBe('Val')
		expect(kerbalDisplayName('Kerman')).toBe('Kerman')
		expect(kerbalDisplayName('')).toBe('—')
	})

	it('rankFromTotalExperience maps cumulative XP to 0–5 stars', () => {
		expect(rankFromTotalExperience(0)).toBe(0)
		expect(rankFromTotalExperience(1.9)).toBe(0)
		expect(rankFromTotalExperience(2)).toBe(1)
		expect(rankFromTotalExperience(7.9)).toBe(1)
		expect(rankFromTotalExperience(32)).toBe(4)
		expect(rankFromTotalExperience(64)).toBe(5)
		expect(rankFromTotalExperience(100)).toBe(5)
	})

	it('kerbalRankFromKerbal uses experience when experienceLevel is absent', () => {
		expect(
			kerbalRankFromKerbal({
				experience: '32',
			}),
		).toBe(4)
		expect(
			kerbalRankFromKerbal({
				experience: '8',
				extraXP: '8',
			}),
		).toBe(3)
	})

	it('kerbalTotalXpFromKerbal sums cached XP or uses CAREER_LOG', () => {
		expect(
			kerbalTotalXpFromKerbal({
				experience: '10',
				extraXP: '5',
			}),
		).toBe(15)
		expect(
			kerbalTotalXpFromKerbal({
				experience: '0',
				extraXP: '0',
			}),
		).toBe(0)
	})

	it('kerbalRankFromKerbal takes max of level and XP-derived rank', () => {
		expect(
			kerbalRankFromKerbal({
				experienceLevel: '0',
				experience: '64',
			}),
		).toBe(5)
		expect(
			kerbalRankFromKerbal({
				experienceLevel: '3',
				experience: '0',
			}),
		).toBe(3)
	})
})
