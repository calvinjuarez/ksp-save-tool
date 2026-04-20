import { describe, expect, it } from 'vitest'
import { sortScienceReportRows } from './science-report-sort.util.js'

describe('sortScienceReportRows', () => {
	const rows = [
		{
			subjectId: 'a',
			experiment: 'e1',
			experimentTitle: 'B',
			body: 'Mun',
			situation: 'SrfLanded',
			biome: 'x',
			earned: 1,
			cap: 2,
			remaining: 1,
			completionRatio: 0.5,
			onboardData: 0,
			onboardDataTransmissible: 0,
			onboardDataReturnOnly: 0,
			vessels: [],
		},
		{
			subjectId: 'b',
			experiment: 'e2',
			experimentTitle: 'A',
			body: 'Mun',
			situation: 'SrfLanded',
			biome: 'y',
			earned: 0,
			cap: 2,
			remaining: 2,
			completionRatio: 0,
			onboardData: 3,
			onboardDataTransmissible: 2,
			onboardDataReturnOnly: 1,
			vessels: [{ vesselName: 'V', data: 3, xmit: 0.66 }],
		},
	]

	it('sorts by earned ascending', () => {
		const out = sortScienceReportRows(rows, { key: 'science', dir: 'asc' }, { key: null, dir: null })
		expect(out[0].earned).toBe(0)
		expect(out[1].earned).toBe(1)
	})

	it('sorts by onboard ascending', () => {
		const out = sortScienceReportRows(rows, { key: 'onboard', dir: 'asc' }, { key: null, dir: null })
		expect(out[0].onboardData).toBe(0)
		expect(out[1].onboardData).toBe(3)
	})
})
