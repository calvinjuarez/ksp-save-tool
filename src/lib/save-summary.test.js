import { describe, expect, it } from 'vitest'
import { crewCountFromTree, gameTitleFromTree, vesselCountFromTree } from './save-summary.js'

describe('save-summary', () => {
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
