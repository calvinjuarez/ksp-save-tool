import { describe, expect, it } from 'vitest'
import { asArray, crewCountFromTree, gameTitleFromTree, vesselCountFromTree } from './save-file.util.js'

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
})
