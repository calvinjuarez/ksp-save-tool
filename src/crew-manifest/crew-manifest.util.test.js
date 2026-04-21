import { describe, expect, it } from 'vitest'
import {
	buildCrewManifestRows,
	formatCrewManifestMarkdown,
	formatCrewManifestRankTooltipLabel,
	formatTotalXpDisplay,
} from './crew-manifest.util.js'

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
							gender: 'Female',
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
							gender: 'Male',
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
			bodyModel: { abbr: 'F', title: 'Feminine' },
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
			bodyModel: { abbr: 'M', title: 'Masculine' },
			color: '0',
			mark: null,
			markKind: null,
		})
	})

	it('uses roster gender for bodyModel; without gender both model and color are empty', () => {
		const tree = {
			GAME: {
				ROSTER: {
					KERBAL: {
						name: 'No Gender Kerman',
						trait: 'Pilot',
						state: 'Available',
						type: 'Crew',
						tour: 'False',
						suit: 'Default',
						comboId: 'default_male_0',
						experienceLevel: '0',
					},
				},
			},
		}
		const rows = buildCrewManifestRows(tree)
		expect(rows[0].bodyModel).toBeNull()
		expect(rows[0].color).toBe('—')
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
						gender: 'Male',
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
							gender: 'Male',
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
							gender: 'Male',
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
						gender: 'Male',
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
				bodyModel: { abbr: 'M', title: 'Masculine' },
				color: '0',
				mark: null,
				markKind: null,
			},
		])
		expect(md).toContain('# KSP Krew Manifest Report')
		expect(md).toContain(
			'| Name | Mark | Role | Rank | Vessel | Situation | Location | Suit | Model | Color |',
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
					bodyModel: { abbr: 'M', title: 'Masculine' },
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
		expect(md).toContain('Primary: Location (ascending)')
		expect(md).toContain('Secondary: —')
		expect(md).toContain('- **Group by:** Ungrouped')
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
					bodyModel: { abbr: 'M', title: 'Masculine' },
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
		expect(md).toContain('- **Group by:** Ungrouped')
		expect(md).toContain('- **Filters:**')
		expect(md).toContain('Role: Pilot')
	})

	it('groups markdown by location with per-section tables and hides Location column', () => {
		const rowKerbin = {
			name: 'A Kerman',
			role: 'Pilot',
			rank: 1,
			totalXp: 0,
			vessel: 'Ship',
			situation: 'ORBITING',
			body: 'Kerbin',
			suit: 'Default',
			bodyModel: { abbr: 'M', title: 'Masculine' },
			color: '0',
			mark: null,
			markKind: null,
		}
		const rowDuna = {
			...rowKerbin,
			name: 'B Kerman',
			body: 'Duna',
			vessel: 'Rover',
		}
		const md = formatCrewManifestMarkdown([rowDuna, rowKerbin], {
			primary: { key: 'body', dir: 'asc' },
			secondary: { key: null, dir: null },
			filters: [],
			groupBy: 'location',
		})
		expect(md).toContain('- **Group by:** Location')
		expect(md).toContain('### Kerbin')
		expect(md).toContain('### Duna')
		expect(md).not.toContain('## Full Crew Table')
		expect(md).toContain('| Name | Mark | Role | Rank | Vessel | Situation | Suit | Model | Color |')
		expect(md).not.toContain('| Location |')
	})

	it('groups markdown by vessel and hides Vessel column', () => {
		const r = {
			name: 'A Kerman',
			role: 'Pilot',
			rank: 1,
			totalXp: 0,
			vessel: 'Alpha',
			situation: 'Landed',
			body: 'Kerbin',
			suit: 'Default',
			bodyModel: null,
			color: '—',
			mark: null,
			markKind: null,
		}
		const md = formatCrewManifestMarkdown([r], {
			primary: { key: 'vessel', dir: 'asc' },
			secondary: { key: null, dir: null },
			filters: [],
			groupBy: 'vessel',
		})
		expect(md).toContain('- **Group by:** Vessel')
		expect(md).toContain('### Alpha')
		expect(md).toContain('| Name | Mark | Role | Rank | Situation | Location | Suit | Model | Color |')
		expect(md).not.toContain('| Vessel |')
	})

	it('humanizes the Situation cell in the ungrouped markdown table', () => {
		const md = formatCrewManifestMarkdown([
			{
				name: 'Bob Kerman',
				role: 'Pilot',
				rank: 1,
				totalXp: 0,
				vessel: 'Alpha',
				situation: 'ORBITING',
				body: 'Kerbin',
				suit: 'Default',
				bodyModel: null,
				color: '—',
				mark: null,
				markKind: null,
			},
		])
		expect(md).toContain('| Bob | — | Pilot | ★ | Alpha | Orbiting | Kerbin |')
	})

	it('suffixes vessel headings with mark emoji when rescue/tourist kerbals are on board', () => {
		const base = {
			role: 'Pilot',
			rank: 1,
			totalXp: 0,
			situation: 'ORBITING',
			body: 'Kerbin',
			suit: 'Default',
			bodyModel: null,
			color: '—',
		}
		const rows = [
			{ ...base, name: 'A Kerman', vessel: 'Alpha', mark: null, markKind: null },
			{
				...base,
				name: 'B Kerman',
				vessel: 'Bravo',
				mark: { emoji: '🆘', title: 'Needs Rescue' },
				markKind: 'openRescue',
			},
			{
				...base,
				name: 'C Kerman',
				vessel: 'Bravo',
				mark: { emoji: '🗺️', title: 'Tourist' },
				markKind: 'tourist',
			},
		]
		const md = formatCrewManifestMarkdown(rows, {
			primary: { key: 'vessel', dir: 'asc' },
			secondary: { key: null, dir: null },
			filters: [],
			groupBy: 'vessel',
		})
		expect(md).toContain('### Alpha\n')
		expect(md).toContain('### Bravo 🆘 🗺️')
	})

	it('suffixes location headings with mark emoji when rescue/tourist kerbals are in that location', () => {
		const base = {
			role: 'Pilot',
			rank: 1,
			totalXp: 0,
			vessel: 'Ship',
			situation: 'ORBITING',
			suit: 'Default',
			bodyModel: null,
			color: '—',
		}
		const rows = [
			{ ...base, name: 'A Kerman', body: 'Kerbin', mark: null, markKind: null },
			{
				...base,
				name: 'B Kerman',
				body: 'Mun',
				mark: { emoji: '🆘', title: 'Needs Rescue' },
				markKind: 'openRescue',
			},
		]
		const md = formatCrewManifestMarkdown(rows, {
			primary: { key: 'body', dir: 'asc' },
			secondary: { key: null, dir: null },
			filters: [],
			groupBy: 'location',
		})
		expect(md).toContain('### Kerbin\n')
		expect(md).toContain('### Mun 🆘')
	})
})

describe('formatTotalXpDisplay', () => {
	it('rounds to one decimal when needed', () => {
		expect(formatTotalXpDisplay(11.25)).toBe('11.3')
		expect(formatTotalXpDisplay(64)).toBe('64')
		expect(formatTotalXpDisplay(0)).toBe('0')
	})
})

describe('formatCrewManifestRankTooltipLabel', () => {
	it('uses natural phrasing for star count and XP', () => {
		expect(formatCrewManifestRankTooltipLabel(0, 0)).toBe('No stars (0 XP)')
		expect(formatCrewManifestRankTooltipLabel(1, 7)).toBe('1 star (7 XP)')
		expect(formatCrewManifestRankTooltipLabel(3, 64)).toBe('3 stars (64 XP)')
		expect(formatCrewManifestRankTooltipLabel(5, 11.25)).toBe('5 stars (11.3 XP)')
	})

	it('clamps rank like star display', () => {
		expect(formatCrewManifestRankTooltipLabel(99, 100)).toBe('5 stars (100 XP)')
		expect(formatCrewManifestRankTooltipLabel(-3, 0)).toBe('No stars (0 XP)')
	})
})

