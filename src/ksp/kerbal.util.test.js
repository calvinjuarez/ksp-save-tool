import { describe, expect, it } from 'vitest'
import {
	kerbalDisplayName,
	kerbalRankFromKerbal,
	kerbalTotalXpFromKerbal,
	parseBuild,
	rankFromTotalExperience,
} from './kerbal.util.js'

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
