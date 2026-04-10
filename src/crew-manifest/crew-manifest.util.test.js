import { describe, expect, it } from 'vitest'
import {
	buildCrewManifestRows,
	collectCrewNamesFromVessel,
	formatCrewManifestMarkdown,
	formatTotalXpDisplay,
	rankToStars,
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
							experienceLevel: '3',
						},
						{
							name: 'Bob Kerman',
							trait: 'Engineer',
							state: 'Available',
							type: 'Crew',
							tour: 'False',
							suit: 'Default',
							comboId: 'default_male_0',
							experienceLevel: 2,
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
			rank: 3,
			totalXp: 0,
			vessel: 'My Ship',
			situation: 'ORBITING',
			body: 'Kerbin',
			suit: 'Slim',
			build: { abbr: 'F', title: 'Feminine' },
			color: '2',
			mark: null,
			markKind: null,
		})
		const bob = rows.find(r => r.name === 'Bob Kerman')
		expect(bob).toMatchObject({
			rank: 2,
			totalXp: 0,
			vessel: '—',
			situation: '—',
			body: 'Home',
			suit: 'Default',
			build: { abbr: 'M', title: 'Masculine' },
			color: '0',
			mark: null,
			markKind: null,
		})
	})

	it('derives rank from cumulative experience when experienceLevel is missing', () => {
		const tree = {
			GAME: {
				ROSTER: {
					KERBAL: {
						name: 'Veteran Kerman',
						trait: 'Pilot',
						state: 'Available',
						type: 'Crew',
						tour: 'False',
						suit: 'Default',
						comboId: 'default_male_0',
						experience: '50',
					},
				},
			},
		}
		const rows = buildCrewManifestRows(tree)
		expect(rows).toHaveLength(1)
		expect(rows[0].rank).toBe(4)
		expect(rows[0].totalXp).toBe(50)
	})

	it('excludes applicants from the manifest', () => {
		const tree = {
			GAME: {
				ROSTER: {
					KERBAL: [
						{
							name: 'Hired Kerman',
							trait: 'Pilot',
							state: 'Available',
							type: 'Crew',
							tour: 'False',
							suit: 'Default',
							comboId: 'default_male_0',
							experienceLevel: '0',
						},
						{
							name: 'Applicant Kerman',
							trait: 'Scientist',
							state: 'Available',
							type: 'Applicant',
							tour: 'False',
							suit: 'Default',
							comboId: 'default_male_0',
						},
					],
				},
			},
		}
		const rows = buildCrewManifestRows(tree)
		expect(rows).toHaveLength(1)
		expect(rows[0].name).toBe('Hired Kerman')
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
						experienceLevel: '1',
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
		expect(rows[0].markKind).toBe('tourist')
		expect(rows[0].role).toBe('Tourist')
	})
})

describe('formatCrewManifestMarkdown', () => {
	it('includes header and table row', () => {
		const md = formatCrewManifestMarkdown([
			{
				name: 'Test Kerman',
				role: 'Pilot',
				rank: 3,
				totalXp: 11.25,
				vessel: '—',
				situation: '—',
				body: 'Home',
				suit: 'Default',
				build: { abbr: 'M', title: 'Masculine' },
				color: '0',
				mark: null,
				markKind: null,
			},
		])
		expect(md).toContain('# KSP Crew Manifest Report')
		expect(md).toContain(
			'| Name | Mark | Role | Rank | Vessel | Situation | At | Suit | Build | Color |',
		)
		expect(md).toContain('| Test | — | Pilot | ★★★ |')
		expect(md).toContain('| Default | M | 0 |')
	})

	it('includes view state when provided', () => {
		const md = formatCrewManifestMarkdown(
			[
				{
					name: 'Test Kerman',
					role: 'Pilot',
					rank: 3,
					totalXp: 11.25,
					vessel: '—',
					situation: '—',
					body: 'Home',
					suit: 'Default',
					build: { abbr: 'M', title: 'Masculine' },
					color: '0',
					mark: null,
					markKind: null,
				},
			],
			{
				primary: { key: 'body', dir: 'asc' },
				secondary: { key: null, dir: null },
				filters: [],
			},
		)
		expect(md).toContain('## View state')
		expect(md).toContain('Primary: At (ascending)')
		expect(md).toContain('Secondary: —')
		expect(md).toContain('- **Filters:** None')
	})

	it('lists filters in view state when provided', () => {
		const md = formatCrewManifestMarkdown(
			[
				{
					name: 'Test Kerman',
					role: 'Pilot',
					rank: 3,
					totalXp: 11.25,
					vessel: '—',
					situation: '—',
					body: 'Home',
					suit: 'Default',
					build: { abbr: 'M', title: 'Masculine' },
					color: '0',
					mark: null,
					markKind: null,
				},
			],
			{
				primary: { key: 'name', dir: 'asc' },
				secondary: { key: 'vessel', dir: 'asc' },
				filters: [
					{
						id: 'tf-test',
						columnKey: 'role',
						operator: 'enumSet',
						value: ['Pilot'],
					},
				],
			},
		)
		expect(md).toContain('- **Filters:**')
		expect(md).toContain('Role: Pilot')
	})
})

describe('formatTotalXpDisplay', () => {
	it('rounds to one decimal when needed', () => {
		expect(formatTotalXpDisplay(11.25)).toBe('11.3')
		expect(formatTotalXpDisplay(64)).toBe('64')
		expect(formatTotalXpDisplay(0)).toBe('0')
	})
})

describe('rankToStars', () => {
	it('returns empty star for rank 0 and filled stars for 1–5', () => {
		expect(rankToStars(0)).toBe('☆')
		expect(rankToStars(1)).toBe('★')
		expect(rankToStars(3)).toBe('★★★')
		expect(rankToStars(5)).toBe('★★★★★')
	})

	it('clamps out-of-range values', () => {
		expect(rankToStars(-1)).toBe('☆')
		expect(rankToStars(99)).toBe('★★★★★')
	})
})
