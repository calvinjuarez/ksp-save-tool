import { describe, expect, it } from 'vitest'
import {
	CREW_MANIFEST_MARK_SORT_ORDER,
	sortCrewManifestRows,
	cycleCrewManifestSortDir,
	crewManifestSortSpecIsActive,
} from './crew-manifest-sort.util.js'

/** @returns {import('./crew-manifest.util.js').CrewManifestRow} */
function row(partial) {
	return {
		name: '—',
		role: '—',
		vessel: '—',
		situation: '—',
		body: '—',
		suit: '—',
		build: null,
		color: '—',
		mark: null,
		markKind: null,
		...partial,
	}
}

describe('crewManifestSortSpecIsActive', () => {
	it('is false when key or dir is null', () => {
		expect(crewManifestSortSpecIsActive({ key: null, dir: null })).toBe(false)
		expect(crewManifestSortSpecIsActive({ key: 'name', dir: null })).toBe(false)
		expect(crewManifestSortSpecIsActive({ key: null, dir: 'asc' })).toBe(false)
	})

	it('is true when both key and dir are set', () => {
		expect(crewManifestSortSpecIsActive({ key: 'name', dir: 'asc' })).toBe(true)
	})
})

describe('cycleCrewManifestSortDir', () => {
	it('cycles asc -> desc -> null -> asc', () => {
		expect(cycleCrewManifestSortDir('asc')).toBe('desc')
		expect(cycleCrewManifestSortDir('desc')).toBe(null)
		expect(cycleCrewManifestSortDir(null)).toBe('asc')
	})
})

describe('sortCrewManifestRows', () => {
	it('returns a copy in natural order when no sort is active', () => {
		const a = row({ name: 'B' })
		const b = row({ name: 'A' })
		const input = [a, b]
		const out = sortCrewManifestRows(input, { key: null, dir: null }, { key: null, dir: null })
		expect(out).toEqual([a, b])
		expect(out).not.toBe(input)
	})

	it('sorts by name asc', () => {
		const rows = [
			row({ name: 'Zoe' }),
			row({ name: 'Amy' }),
		]
		const out = sortCrewManifestRows(rows, { key: 'name', dir: 'asc' }, { key: null, dir: null })
		expect(out.map(r => r.name)).toEqual(['Amy', 'Zoe'])
	})

	it('sorts by mark kind order', () => {
		const rows = [
			row({ name: 'r', markKind: 'rescued' }),
			row({ name: 'o', markKind: 'openRescue' }),
			row({ name: 't', markKind: 'tourist' }),
			row({ name: 'n', markKind: null }),
		]
		const out = sortCrewManifestRows(rows, { key: 'mark', dir: 'asc' }, { key: null, dir: null })
		expect(out.map(r => r.markKind)).toEqual(
			CREW_MANIFEST_MARK_SORT_ORDER.filter(k => k !== null).concat([null]),
		)
	})

	it('uses secondary sort as tiebreaker', () => {
		const rows = [
			row({ name: 'B', vessel: 'Z' }),
			row({ name: 'A', vessel: 'Z' }),
			row({ name: 'A', vessel: 'A' }),
		]
		const out = sortCrewManifestRows(
			rows,
			{ key: 'name', dir: 'asc' },
			{ key: 'vessel', dir: 'asc' },
		)
		expect(out.map(r => `${r.name}:${r.vessel}`)).toEqual(['A:A', 'A:Z', 'B:Z'])
	})

	it('breaks ties by name ascending after primary and secondary', () => {
		const rows = [
			row({ name: 'Zoe Kerman', body: 'Kerbin', vessel: 'Ship' }),
			row({ name: 'Amy Kerman', body: 'Kerbin', vessel: 'Ship' }),
		]
		const out = sortCrewManifestRows(
			rows,
			{ key: 'body', dir: 'asc' },
			{ key: 'vessel', dir: 'asc' },
		)
		expect(out.map(r => r.name)).toEqual(['Amy Kerman', 'Zoe Kerman'])
	})

	it('sorts body by rank', () => {
		const rows = [
			row({ name: 'a', body: 'Eeloo' }),
			row({ name: 'b', body: 'Kerbin' }),
			row({ name: 'c', body: 'Unknown' }),
		]
		const out = sortCrewManifestRows(rows, { key: 'body', dir: 'asc' }, { key: null, dir: null })
		expect(out.map(r => r.body)).toEqual(['Kerbin', 'Eeloo', 'Unknown'])
	})

	it('places em dash last for text columns', () => {
		const rows = [
			row({ name: 'a', role: '—' }),
			row({ name: 'b', role: 'Pilot' }),
		]
		const out = sortCrewManifestRows(rows, { key: 'role', dir: 'asc' }, { key: null, dir: null })
		expect(out.map(r => r.role)).toEqual(['Pilot', '—'])
	})
})
