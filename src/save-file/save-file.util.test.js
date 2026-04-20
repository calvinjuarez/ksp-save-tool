import { describe, expect, it } from 'vitest'
import {
	asArray,
	crewCountFromTree,
	fundsFromTree,
	gameTitleFromTree,
	reputationFromTree,
	scienceFromTree,
	vesselCountFromTree,
} from './save-file.util.js'

describe('save-file.util', () => {
	it('asArray normalizes single or array nodes', () => {
		expect(asArray({ a: { x: 1 } }, 'a')).toEqual([{ x: 1 }])
		expect(asArray({ a: [{ x: 1 }, { x: 2 }] }, 'a')).toEqual([{ x: 1 }, { x: 2 }])
		expect(asArray({}, 'a')).toEqual([])
	})

	it('reads title, vessel count, crew count (CREW)', () => {
		const data = {
			GAME: {
				Title: 'Career',
				FLIGHTSTATE: {
					VESSEL: [{ name: 'a' }, { name: 'b' }],
				},
				ROSTER: {
					CREW: { name: 'Jeb' },
				},
			},
		}
		expect(gameTitleFromTree(data)).toBe('Career')
		expect(vesselCountFromTree(data)).toBe(2)
		expect(crewCountFromTree(data)).toBe(1)
	})

	it('prefers KERBAL roster when present', () => {
		const data = {
			GAME: {
				ROSTER: {
					KERBAL: [{ name: 'a' }, { name: 'b' }],
					CREW: { name: 'Jeb' },
				},
			},
		}
		expect(crewCountFromTree(data)).toBe(2)
	})

	const careerScenarios = [
		{ name: 'Funding', funds: '1234567.5' },
		{ name: 'ResearchAndDevelopment', sci: '42.25' },
		{ name: 'Reputation', rep: '12.34' },
	]

	it('reads science, reputation, funds from SCENARIO array (career)', () => {
		const data = { GAME: { SCENARIO: careerScenarios } }
		expect(scienceFromTree(data)).toBe(42.25)
		expect(reputationFromTree(data)).toBe(12.34)
		expect(fundsFromTree(data)).toBe(1234567.5)
	})

	it('reads science, reputation, funds from a single SCENARIO object', () => {
		const data = { GAME: { SCENARIO: { name: 'ResearchAndDevelopment', sci: '10' } } }
		expect(scienceFromTree(data)).toBe(10)
		expect(reputationFromTree(data)).toBeNull()
		expect(fundsFromTree(data)).toBeNull()
	})

	it('returns null when SCENARIO or field is absent', () => {
		expect(scienceFromTree(undefined)).toBeNull()
		expect(scienceFromTree({})).toBeNull()
		expect(scienceFromTree({ GAME: {} })).toBeNull()
		expect(scienceFromTree({ GAME: { SCENARIO: { name: 'Reputation', rep: '1' } } })).toBeNull()
	})

	it('returns null when scenario exists but value is missing or non-numeric', () => {
		const noSci = { GAME: { SCENARIO: { name: 'ResearchAndDevelopment' } } }
		expect(scienceFromTree(noSci)).toBeNull()
		const badSci = { GAME: { SCENARIO: { name: 'ResearchAndDevelopment', sci: 'nope' } } }
		expect(scienceFromTree(badSci)).toBeNull()
	})
})
