import { describe, expect, it } from 'vitest'
import {
	buildScienceReportRows,
	formatSciDisplay,
	groupFullyStudiedNoOnboard,
	groupScienceReportRows,
	isFullyStudiedNumerically,
	parseScienceSubjectId,
	summarizeScienceReportGroup,
	TRACE_UNCOLLECTED_THRESHOLD,
} from './science-report.util.js'

describe('parseScienceSubjectId', () => {
	it('parses stock Mun landed biome', () => {
		const p = parseScienceSubjectId('barometerScan@MunSrfLandedMidlands')
		expect(p).toEqual({
			experiment: 'barometerScan',
			body: 'Mun',
			situation: 'SrfLanded',
			biome: 'Midlands',
		})
	})

	it('returns null for invalid ids', () => {
		expect(parseScienceSubjectId('')).toBeNull()
		expect(parseScienceSubjectId('nope')).toBeNull()
	})
})

describe('buildScienceReportRows', () => {
	it('returns empty array for empty tree', () => {
		expect(buildScienceReportRows(undefined)).toEqual([])
		expect(buildScienceReportRows({})).toEqual([])
	})

	it('merges RnD Science with vessel ScienceData', () => {
		const tree = {
			GAME: {
				SCENARIO: {
					name: 'ResearchAndDevelopment',
					Science: {
						id: 'foo@MunSrfLandedMidlands',
						title: 'Foo Reading',
						sci: '2',
						cap: '8',
					},
				},
				FLIGHTSTATE: {
					VESSEL: {
						name: 'Lander',
						PART: {
							MODULE: {
								ScienceData: {
									subjectID: 'foo@MunSrfLandedMidlands',
									data: '1',
									xmit: '0.5',
									title: 'Foo Reading',
								},
							},
						},
					},
				},
			},
		}
		const rows = buildScienceReportRows(tree)
		expect(rows).toHaveLength(1)
		const r = rows[0]
		expect(r.subjectId).toBe('foo@MunSrfLandedMidlands')
		expect(r.earned).toBe(2)
		expect(r.cap).toBe(8)
		expect(r.remaining).toBe(6)
		expect(r.onboardData).toBe(1)
		expect(r.onboardDataTransmissible).toBe(0.5)
		expect(r.onboardDataReturnOnly).toBe(0.5)
		expect(r.vessels).toEqual([{ vesselName: 'Lander', data: 1, xmit: 0.5 }])
		expect(r.completionRatio).toBe(2 / 8)
	})

	it('creates row from vessel-only subject when no RnD node', () => {
		const tree = {
			GAME: {
				SCENARIO: { name: 'ResearchAndDevelopment' },
				FLIGHTSTATE: {
					VESSEL: {
						name: 'Probe',
						ScienceData: {
							subjectID: 'goo@KerbinSrfLanded',
							data: '3',
							xmit: '1',
						},
					},
				},
			},
		}
		const rows = buildScienceReportRows(tree)
		expect(rows).toHaveLength(1)
		expect(rows[0].earned).toBe(0)
		expect(rows[0].cap).toBe(0)
		expect(rows[0].onboardData).toBe(3)
	})
})

describe('groupScienceReportRows', () => {
	const rows = buildScienceReportRows({
		GAME: {
			SCENARIO: {
				name: 'ResearchAndDevelopment',
				Science: [
					{ id: 'a@MunSrfLandedX', title: 'A', sci: '1', cap: '2' },
					{ id: 'b@KerbinSrfLanded', title: 'B', sci: '0', cap: '1' },
				],
			},
		},
	})

	it('ungrouped returns single group', () => {
		const g = groupScienceReportRows(rows, 'ungrouped')
		expect(g).toHaveLength(1)
		expect(g[0].rows).toHaveLength(2)
	})

	it('groups by location', () => {
		const g = groupScienceReportRows(rows, 'location')
		expect(g.length).toBeGreaterThanOrEqual(2)
		const titles = g.map((x) => x.title)
		expect(titles).toContain('Kerbin')
		expect(titles).toContain('Mun')
	})

	it('groups by experiment', () => {
		const g = groupScienceReportRows(rows, 'experiment')
		expect(g.length).toBe(2)
	})
})

describe('summarizeScienceReportGroup', () => {
	it('aggregates sums and vessel count', () => {
		const rows = buildScienceReportRows({
			GAME: {
				SCENARIO: {
					name: 'ResearchAndDevelopment',
					Science: [
						{ id: 'a@MunSrfLandedX', title: 'A', sci: '1', cap: '2' },
						{ id: 'b@MunSrfLandedY', title: 'B', sci: '1', cap: '2' },
					],
				},
				FLIGHTSTATE: {
					VESSEL: [
						{
							name: 'V1',
							ScienceData: { subjectID: 'a@MunSrfLandedX', data: '1', xmit: '1' },
						},
						{
							name: 'V2',
							ScienceData: { subjectID: 'b@MunSrfLandedY', data: '1', xmit: '1' },
						},
					],
				},
			},
		})
		const sum = summarizeScienceReportGroup(rows)
		expect(sum.subjectCount).toBe(2)
		expect(sum.earnedSum).toBe(2)
		expect(sum.distinctVesselCount).toBe(2)
	})
})

describe('groupFullyStudiedNoOnboard', () => {
	it('is true when all capped rows are earned and nothing onboard', () => {
		const rows = [
			{
				cap: 2,
				earned: 2,
				remaining: 0,
				onboardData: 0,
				vessels: [],
			},
		]
		expect(groupFullyStudiedNoOnboard(/** @type {any} */ (rows))).toBe(true)
	})

	it('is false when onboard data remains', () => {
		const rows = [{ cap: 2, earned: 2, remaining: 0, onboardData: 1, vessels: [] }]
		expect(groupFullyStudiedNoOnboard(/** @type {any} */ (rows))).toBe(false)
	})

	it('is false when a row has no RnD cap', () => {
		const rows = [{ cap: 0, earned: 0, remaining: 0, onboardData: 0, vessels: [] }]
		expect(groupFullyStudiedNoOnboard(/** @type {any} */ (rows))).toBe(false)
	})
})

describe('formatSciDisplay', () => {
	it('formats numbers', () => {
		expect(formatSciDisplay(8)).toBe('8')
		expect(formatSciDisplay(1.234)).toBe('1.23')
	})
})

describe('isFullyStudiedNumerically', () => {
	/** @param {number} earned @param {number} cap */
	function row(earned, cap) {
		const remaining = Math.max(0, cap - earned)
		return {
			subjectId: 'x',
			experiment: 'e',
			experimentTitle: 'E',
			body: 'Kerbin',
			situation: 'SrfLanded',
			biome: 't',
			earned,
			cap,
			remaining,
			completionRatio: cap > 0 ? earned / cap : 0,
			onboardData: 0,
			onboardDataTransmissible: 0,
			onboardDataReturnOnly: 0,
			vessels: [],
		}
	}

	it('is false for KSP float residual (~0.005 sci) — not reported as complete', () => {
		const r = row(6.59504175, 6.60000038)
		expect(isFullyStudiedNumerically(r)).toBe(false)
		expect(r.remaining).toBeLessThan(TRACE_UNCOLLECTED_THRESHOLD)
	})

	it('is true only for numerical dust', () => {
		expect(isFullyStudiedNumerically(row(8 - 1e-7, 8))).toBe(true)
	})

	it('is false when a meaningful amount remains', () => {
		expect(isFullyStudiedNumerically(row(3, 8))).toBe(false)
	})
})
