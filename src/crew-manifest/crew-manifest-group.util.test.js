import { describe, expect, it } from 'vitest'
import {
	formatCrewManifestGroupSummary,
	formatCrewManifestMarksEmojiSuffix,
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
	})

	it('leads location summaries with vessel count, then kerbals → roles → rank', () => {
		const s = summarizeCrewManifestGroup([
			row({ role: 'Pilot', vessel: 'A', body: 'Kerbin', rank: 2 }),
			row({ role: 'Scientist', vessel: 'B', body: 'Kerbin', rank: 1 }),
		])
		expect(formatCrewManifestGroupSummary(s, 'location')).toBe(
			'2 vessels · 2 kerbals · 1 pilot · 1 scientist · avg 1.5★',
		)
	})

	it('leads vessel summaries with locations count when the vessel spans bodies', () => {
		const s = summarizeCrewManifestGroup([
			row({ role: 'Pilot', body: 'Kerbin', rank: 2 }),
			row({ role: 'Pilot', body: 'Mun', rank: 2 }),
		])
		expect(formatCrewManifestGroupSummary(s, 'vessel')).toBe(
			'2 locations · 2 kerbals · 2 pilots · avg 2★',
		)
	})

	it('prefers situation + location over the locations count for vessel summaries', () => {
		const s = summarizeCrewManifestGroup([
			row({ situation: 'ORBITING', body: 'Kerbin', rank: 1 }),
			row({ situation: 'ORBITING', body: 'Kerbin', rank: 1 }),
		])
		expect(formatCrewManifestGroupSummary(s, 'vessel').startsWith('Orbiting Kerbin · 2 kerbals')).toBe(true)
	})

	it('falls back to leading with kerbal count when no context is available', () => {
		const s = summarizeCrewManifestGroup([
			row({ vessel: '—', body: '—', situation: '—', rank: 1 }),
		])
		expect(formatCrewManifestGroupSummary(s, 'location').startsWith('1 kerbal · ')).toBe(true)
	})

	it('omits rescue/tourist counts from the summary line (shown as emoji suffix on vessel name instead)', () => {
		const s = summarizeCrewManifestGroup([
			row({ markKind: 'openRescue' }),
			row({ markKind: 'tourist' }),
			row({ markKind: 'rescued' }),
		])
		const line = formatCrewManifestGroupSummary(s, 'vessel')
		expect(line).not.toMatch(/rescue/i)
		expect(line).not.toMatch(/tourist/i)
	})

	it('mentions multiple locations when grouped by vessel and bodies differ', () => {
		const s = summarizeCrewManifestGroup([
			row({ body: 'Kerbin' }),
			row({ body: 'Mun' }),
		])
		const line = formatCrewManifestGroupSummary(s, 'vessel')
		expect(line).toContain('2 locations')
	})

	it('leads vessel summaries with situation + location and no preposition for orbital states', () => {
		const s = summarizeCrewManifestGroup([
			row({ role: 'Pilot', situation: 'ORBITING', body: 'Kerbin' }),
			row({ role: 'Engineer', situation: 'ORBITING', body: 'Kerbin' }),
		])
		const line = formatCrewManifestGroupSummary(s, 'vessel')
		expect(line.startsWith('Orbiting Kerbin · ')).toBe(true)
		expect(line).toContain('2 kerbals')
	})

	it('uses "on" for surface states when composing the lead', () => {
		const landed = summarizeCrewManifestGroup([row({ situation: 'LANDED', body: 'Minmus' })])
		expect(formatCrewManifestGroupSummary(landed, 'vessel').startsWith('Landed on Minmus · ')).toBe(true)

		const splashed = summarizeCrewManifestGroup([row({ situation: 'SPLASHED', body: 'Kerbin' })])
		expect(formatCrewManifestGroupSummary(splashed, 'vessel').startsWith('Splashed on Kerbin · ')).toBe(true)
	})

	it('uses "over" for atmospheric flight and "at" for docked states', () => {
		const flying = summarizeCrewManifestGroup([row({ situation: 'FLYING', body: 'Eve' })])
		expect(formatCrewManifestGroupSummary(flying, 'vessel').startsWith('Flying over Eve · ')).toBe(true)

		const docked = summarizeCrewManifestGroup([row({ situation: 'DOCKED', body: 'Kerbin' })])
		expect(formatCrewManifestGroupSummary(docked, 'vessel').startsWith('Docked at Kerbin · ')).toBe(true)
	})

	it('humanizes compound situation tokens (SUB_ORBITAL → Sub-orbital over …)', () => {
		const s = summarizeCrewManifestGroup([
			row({ situation: 'SUB_ORBITAL', body: 'Mun' }),
		])
		const line = formatCrewManifestGroupSummary(s, 'vessel')
		expect(line.startsWith('Sub-orbital over Mun · ')).toBe(true)
	})

	it('omits the situation + location lead when rows disagree', () => {
		const mixedSituations = summarizeCrewManifestGroup([
			row({ situation: 'ORBITING', body: 'Kerbin' }),
			row({ situation: 'LANDED', body: 'Kerbin' }),
		])
		expect(formatCrewManifestGroupSummary(mixedSituations, 'vessel')).not.toMatch(/Kerbin · \d/)

		const mixedBodies = summarizeCrewManifestGroup([
			row({ situation: 'ORBITING', body: 'Kerbin' }),
			row({ situation: 'ORBITING', body: 'Mun' }),
		])
		const line = formatCrewManifestGroupSummary(mixedBodies, 'vessel')
		expect(line.startsWith('Orbiting')).toBe(false)
	})

	it('omits the situation + location lead for non-vessel groupings', () => {
		const s = summarizeCrewManifestGroup([
			row({ situation: 'ORBITING', body: 'Kerbin' }),
		])
		const line = formatCrewManifestGroupSummary(s, 'location')
		expect(line.startsWith('Orbiting')).toBe(false)
	})
})

describe('formatCrewManifestMarksEmojiSuffix', () => {
	it('returns an empty string when no marks are present', () => {
		const s = summarizeCrewManifestGroup([row({}), row({})])
		expect(formatCrewManifestMarksEmojiSuffix(s)).toBe('')
	})

	it('lists openRescue then tourist once, urgency first', () => {
		const s = summarizeCrewManifestGroup([
			row({ markKind: 'openRescue' }),
			row({ markKind: 'tourist' }),
			row({ markKind: 'openRescue' }),
		])
		expect(formatCrewManifestMarksEmojiSuffix(s)).toBe('🆘 🗺️')
	})

	it('shows a single emoji when only one mark kind is present', () => {
		const s = summarizeCrewManifestGroup([row({ markKind: 'tourist' })])
		expect(formatCrewManifestMarksEmojiSuffix(s)).toBe('🗺️')
	})

	it('does not lift already-rescued (🛟) crew onto the heading', () => {
		const s = summarizeCrewManifestGroup([row({ markKind: 'rescued' })])
		expect(formatCrewManifestMarksEmojiSuffix(s)).toBe('')
	})
})
