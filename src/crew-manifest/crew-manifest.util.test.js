import { describe, expect, it } from 'vitest'
import {
    buildCrewManifestRows,
    collectCrewNamesFromVessel,
    formatCrewManifestMarkdown,
} from './crew-manifest.util.js'

describe('collectCrewNamesFromVessel', () => {
	it('collects string crew and array crew', () => {
		const vessel = {
			name: 'Test Ship',
			PART: [
				{ crew: 'Alice Kerman' },
				{ crew: ['Bob Kerman', 'Carol Kerman'] },
			],
		}
		const names = collectCrewNamesFromVessel(vessel).sort()
		expect(names).toEqual(['Alice Kerman', 'Bob Kerman', 'Carol Kerman'])
	})
})

describe('buildCrewManifestRows', () => {
	it('builds rows from roster and vessel crew', () => {
		const tree = {
			GAME: {
				ROSTER: {
					KERBAL: [
						{
							name: 'Alice Kerman',
							trait: 'Pilot',
							state: 'Assigned',
							type: 'Crew',
							tour: 'False',
							suit: 'Slim',
							comboId: 'slim_female_2',
						},
						{
							name: 'Bob Kerman',
							trait: 'Engineer',
							state: 'Available',
							type: 'Crew',
							tour: 'False',
							suit: 'Default',
							comboId: 'default_male_0',
						},
					],
				},
				FLIGHTSTATE: {
					VESSEL: {
						name: 'My Ship',
						sit: 'ORBITING',
						ORBIT: { REF: '1' },
						PART: { crew: 'Alice Kerman' },
					},
				},
			},
		}
		const rows = buildCrewManifestRows(tree)
		expect(rows).toHaveLength(2)
		const alice = rows.find(r => r.name === 'Alice Kerman')
		expect(alice).toMatchObject({
			role: 'Pilot',
			vessel: 'My Ship',
			situation: 'ORBITING',
			body: 'Kerbin',
			suit: 'Slim',
			build: { abbr: 'F', title: 'Feminine' },
			color: '2',
			mark: null,
		})
		const bob = rows.find(r => r.name === 'Bob Kerman')
		expect(bob).toMatchObject({
			vessel: '—',
			situation: '—',
			body: 'Home',
			suit: 'Default',
			build: { abbr: 'M', title: 'Masculine' },
			color: '0',
			mark: null,
		})
	})

	it('marks tourists', () => {
		const tree = {
			GAME: {
				ROSTER: {
					KERBAL: {
						name: 'Tourist Kerman',
						trait: 'Pilot',
						state: 'Assigned',
						type: 'Tourist',
						tour: 'True',
						suit: 'Default',
						comboId: 'default_male_0',
					},
				},
				FLIGHTSTATE: {
					VESSEL: {
						name: 'Bus',
						sit: 'ORBITING',
						ORBIT: { REF: '2' },
						PART: { crew: 'Tourist Kerman' },
					},
				},
			},
		}
		const rows = buildCrewManifestRows(tree)
		expect(rows[0].mark).toEqual({
			emoji: '🗺️',
			title: 'Tourist',
		})
		expect(rows[0].role).toBe('Tourist')
	})
})

describe('formatCrewManifestMarkdown', () => {
	it('includes header and table row', () => {
		const md = formatCrewManifestMarkdown([
			{
				name: 'Test Kerman',
				role: 'Pilot',
				vessel: '—',
				situation: '—',
				body: 'Home',
				suit: 'Default',
				build: { abbr: 'M', title: 'Masculine' },
				color: '0',
				mark: null,
			},
		])
		expect(md).toContain('# KSP Crew Manifest Report')
		expect(md).toContain(
			'| Kerbal | Mark | Role | Vessel | Situation | At | Suit | Build | Color |',
		)
		expect(md).toContain('| Test | — | Pilot |')
		expect(md).toContain('| Default | M | 0 |')
	})
})
