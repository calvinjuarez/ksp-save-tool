import { describe, expect, it } from 'vitest'
import {
	formatCrewManifestGroupSummary,
	groupCrewManifestRows,
	summarizeCrewManifestGroup,
} from './crew-manifest-group.util.js'

/** @returns {import('./crew-manifest.util.js').CrewManifestRow} */
function row(partial) {
	return {
		name: 'X',
		role: 'Pilot',
		rank: 1,
		totalXp: 0,
		vessel: '—',
		situation: '—',
		body: 'Home',
		suit: 'Default',
		bodyModel: null,
		color: '—',
		mark: null,
		markKind: null,
		...partial,
	}
}

describe('groupCrewManifestRows', () => {
	it('ungrouped returns a single group containing all rows in order', () => {
		const rows = [
			row({ name: 'A', body: 'Duna' }),
			row({ name: 'B', body: 'Kerbin' }),
		]
		const g = groupCrewManifestRows(rows, 'ungrouped')
		expect(g).toHaveLength(1)
		expect(g[0].key).toBe('')
		expect(g[0].rows).toEqual(rows)
	})

	it('ungrouped with empty rows still returns one empty group', () => {
		const g = groupCrewManifestRows([], 'ungrouped')
		expect(g).toEqual([{ key: '', title: '', rows: [] }])
	})

	it('location groups stock bodies in STOCK_BODY_ORDER then others alphabetically; Unassigned last', () => {
		const rows = [
			row({ name: 'u', body: '—' }),
			row({ name: 'z', body: 'ZooBody' }),
			row({ name: 'd', body: 'Duna' }),
			row({ name: 'k', body: 'Kerbin' }),
			row({ name: 'm', body: 'Mun' }),
		]
		const g = groupCrewManifestRows(rows, 'location')
		expect(g.map(x => x.title)).toEqual(['Kerbin', 'Mun', 'Duna', 'ZooBody', 'Unassigned'])
		expect(g.find(x => x.title === 'Mun')?.caption).toBe('Moon of Kerbin')
		expect(g.find(x => x.title === 'Unassigned')?.isUnassigned).toBe(true)
	})

	it('location with no rows returns no groups', () => {
		expect(groupCrewManifestRows([], 'location')).toEqual([])
	})

	it('vessel groups alphabetically with Unassigned last', () => {
		const rows = [
			row({ name: 'a', vessel: '—' }),
			row({ name: 'b', vessel: 'Beta' }),
			row({ name: 'c', vessel: 'Alpha' }),
		]
		const g = groupCrewManifestRows(rows, 'vessel')
		expect(g.map(x => x.title)).toEqual(['Alpha', 'Beta', 'Unassigned'])
		expect(g[2].isUnassigned).toBe(true)
	})

	it('vessel with no rows returns no groups', () => {
		expect(groupCrewManifestRows([], 'vessel')).toEqual([])
	})
})

describe('summarizeCrewManifestGroup', () => {
	it('tallies roles, distinct vessels/bodies, marks, and rank stats', () => {
		const summary = summarizeCrewManifestGroup([
			row({ role: 'Pilot', vessel: 'V1', body: 'Kerbin', rank: 2, markKind: 'openRescue' }),
			row({ role: 'Pilot', vessel: 'V1', body: 'Kerbin', rank: 2 }),
			row({ role: 'Engineer', vessel: 'V2', body: 'Mun', rank: 0, markKind: 'tourist' }),
		])
		expect(summary.kerbalCount).toBe(3)
		expect(summary.byRole).toEqual({ Pilot: 2, Engineer: 1 })
		expect(summary.vesselCount).toBe(2)
		expect(summary.bodyCount).toBe(2)
		expect(summary.marks).toEqual({ openRescue: 1, rescued: 0, tourist: 1 })
		expect(summary.avgRank).toBeCloseTo(4 / 3, 5)
		expect(summary.maxRank).toBe(2)
	})
})

describe('formatCrewManifestGroupSummary', () => {
	it('joins kerbal count, roles, avg rank, and contextual extras', () => {
		const s = summarizeCrewManifestGroup([
			row({ role: 'Pilot', vessel: 'A', body: 'Kerbin', rank: 2 }),
			row({ role: 'Scientist', vessel: 'B', body: 'Kerbin', rank: 1, markKind: 'openRescue' }),
		])
		const line = formatCrewManifestGroupSummary(s, 'location')
		expect(line).toContain('2 kerbals')
		expect(line).toContain('1 pilot')
		expect(line).toContain('1 scientist')
		expect(line).toMatch(/avg 1\.5★/)
		expect(line).toContain('2 vessels')
		expect(line).toContain('1 rescue')
	})

	it('mentions multiple locations when grouped by vessel and bodies differ', () => {
		const s = summarizeCrewManifestGroup([
			row({ body: 'Kerbin' }),
			row({ body: 'Mun' }),
		])
		const line = formatCrewManifestGroupSummary(s, 'vessel')
		expect(line).toContain('2 locations')
	})
})
