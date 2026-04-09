import { describe, expect, it } from 'vitest'
import {
	careerXpForSituationBody,
	careerSituationToXpColumn,
	flattenCareerLogStrings,
	normalizeCareerXpBody,
	xpFromCareerLog,
} from './kerbal-career-xp.util.js'

describe('normalizeCareerXpBody', () => {
	it('maps Sun to Kerbol', () => {
		expect(normalizeCareerXpBody('Sun')).toBe('Kerbol')
		expect(normalizeCareerXpBody('Mun')).toBe('Mun')
	})
})

describe('careerSituationToXpColumn', () => {
	it('maps stock situation strings', () => {
		expect(careerSituationToXpColumn('PlantFlag')).toBe('plantFlag')
		expect(careerSituationToXpColumn('Suborbit')).toBe('flight')
		expect(careerSituationToXpColumn('Escape')).toBe('orbit')
		expect(careerSituationToXpColumn('Recover')).toBe(null)
	})
})

describe('careerXpForSituationBody', () => {
	it('returns wiki table XP for Mun orbit', () => {
		expect(careerXpForSituationBody('Orbit', 'Mun')).toBe(3)
	})
	it('returns 0 for Kerbin plant flag', () => {
		expect(careerXpForSituationBody('PlantFlag', 'Kerbin')).toBe(0)
	})
})

describe('flattenCareerLogStrings', () => {
	it('collects strings from numeric flight keys', () => {
		const out = flattenCareerLogStrings({
			0: ['Flight,Kerbin', 'Recover'],
			1: 'Orbit,Mun',
		})
		expect(out).toEqual(['Flight,Kerbin', 'Recover', 'Orbit,Mun'])
	})
})

describe('xpFromCareerLog', () => {
	it('sums per-body max only', () => {
		const xp = xpFromCareerLog({
			a: ['Orbit,Mun', 'Flyby,Mun', 'PlantFlag,Mun'],
		})
		expect(xp).toBe(5)
	})

	it('ignores non-comma lines', () => {
		expect(xpFromCareerLog({ 0: ['Recover', '52'] })).toBe(0)
	})
})
