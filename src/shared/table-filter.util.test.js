import { describe, expect, it } from 'vitest'
import {
	TABLE_FILTER_ENUM_OP,
	TABLE_FILTER_NONE_VALUE,
} from './table-filter.const.js'
import {
	applyTableFilters,
	formatTableFilterSummary,
	matchesTableFilter,
	parseCommaSeparatedList,
	tableFilterEnumOptions,
	tableFilterNextId,
} from './table-filter.util.js'

/** @type {import('./table-filter.const.js').TableFilterColumnDef[]} */
const testColumns = [
	{
		key: 'name',
		label: 'Name',
		type: 'string',
		accessor: (row) => /** @type {{ name: string }} */ (row).name,
	},
	{
		key: 'n',
		label: 'N',
		type: 'number',
		accessor: (row) => /** @type {{ n: number }} */ (row).n,
	},
	{
		key: 'tag',
		label: 'Tag',
		type: 'enum',
		accessor: (row) => /** @type {{ tag: string }} */ (row).tag,
	},
]

describe('parseCommaSeparatedList', () => {
	it('splits and trims', () => {
		expect(parseCommaSeparatedList('a, b, c')).toEqual(['a', 'b', 'c'])
		expect(parseCommaSeparatedList('  x  ')).toEqual(['x'])
		expect(parseCommaSeparatedList('')).toEqual([])
	})
})

describe('tableFilterEnumOptions', () => {
	it('collects unique values with none label', () => {
		const rows = [{ tag: 'A' }, { tag: TABLE_FILTER_NONE_VALUE }, { tag: 'A' }]
		const opts = tableFilterEnumOptions(rows, (r) => /** @type {{ tag: string }} */ (r).tag)
		expect(opts.map((o) => o.value)).toContain('A')
		expect(opts.map((o) => o.value)).toContain(TABLE_FILTER_NONE_VALUE)
		const none = opts.find((o) => o.value === TABLE_FILTER_NONE_VALUE)
		expect(none?.label).toBe('(none)')
	})
})

describe('matchesTableFilter — string', () => {
	const row = { name: 'Jebediah Kerman' }

	it('is (case-insensitive)', () => {
		expect(
			matchesTableFilter(
				row,
				{ id: '1', columnKey: 'name', operator: 'is', value: 'jebediah kerman' },
				testColumns,
			),
		).toBe(true)
		expect(
			matchesTableFilter(
				row,
				{ id: '1', columnKey: 'name', operator: 'is', value: 'Val' },
				testColumns,
			),
		).toBe(false)
	})

	it('contains', () => {
		expect(
			matchesTableFilter(
				row,
				{ id: '1', columnKey: 'name', operator: 'contains', value: 'bed' },
				testColumns,
			),
		).toBe(true)
	})

	it('isAny', () => {
		expect(
			matchesTableFilter(
				row,
				{ id: '1', columnKey: 'name', operator: 'isAny', value: ['Val', 'Jebediah Kerman'] },
				testColumns,
			),
		).toBe(true)
	})

	it('containsAny', () => {
		expect(
			matchesTableFilter(
				row,
				{
					id: '1',
					columnKey: 'name',
					operator: 'containsAny',
					value: ['zzz', 'bed'],
				},
				testColumns,
			),
		).toBe(true)
	})
})

describe('matchesTableFilter — number', () => {
	const row = { n: 3 }

	it('eq, neq, gt, gte, lt, lte', () => {
		expect(
			matchesTableFilter(row, { id: '1', columnKey: 'n', operator: 'eq', value: 3 }, testColumns),
		).toBe(true)
		expect(
			matchesTableFilter(row, { id: '1', columnKey: 'n', operator: 'neq', value: 2 }, testColumns),
		).toBe(true)
		expect(
			matchesTableFilter(row, { id: '1', columnKey: 'n', operator: 'gt', value: 2 }, testColumns),
		).toBe(true)
		expect(
			matchesTableFilter(row, { id: '1', columnKey: 'n', operator: 'gte', value: 3 }, testColumns),
		).toBe(true)
		expect(
			matchesTableFilter(row, { id: '1', columnKey: 'n', operator: 'lt', value: 4 }, testColumns),
		).toBe(true)
		expect(
			matchesTableFilter(row, { id: '1', columnKey: 'n', operator: 'lte', value: 3 }, testColumns),
		).toBe(true)
	})

	it('eqAny', () => {
		expect(
			matchesTableFilter(
				row,
				{ id: '1', columnKey: 'n', operator: 'eqAny', value: [1, 3, 5] },
				testColumns,
			),
		).toBe(true)
		expect(
			matchesTableFilter(
				row,
				{ id: '1', columnKey: 'n', operator: 'eqAny', value: [1, 2] },
				testColumns,
			),
		).toBe(false)
	})

	it('between', () => {
		expect(
			matchesTableFilter(
				row,
				{ id: '1', columnKey: 'n', operator: 'between', value: [2, 4] },
				testColumns,
			),
		).toBe(true)
		expect(
			matchesTableFilter(
				row,
				{ id: '1', columnKey: 'n', operator: 'between', value: [4, 2] },
				testColumns,
			),
		).toBe(true)
	})
})

describe('matchesTableFilter — enum', () => {
	it('enumSet', () => {
		const row = { tag: 'Pilot' }
		expect(
			matchesTableFilter(
				row,
				{ id: '1', columnKey: 'tag', operator: TABLE_FILTER_ENUM_OP, value: ['Pilot'] },
				testColumns,
			),
		).toBe(true)
		expect(
			matchesTableFilter(
				row,
				{ id: '1', columnKey: 'tag', operator: TABLE_FILTER_ENUM_OP, value: [TABLE_FILTER_NONE_VALUE] },
				testColumns,
			),
		).toBe(false)
	})

	it('treats null accessor as none value', () => {
		const cols = /** @type {import('./table-filter.const.js').TableFilterColumnDef[]} */ ([
			{
				key: 'tag',
				label: 'Tag',
				type: 'enum',
				accessor: () => null,
			},
		])
		const row = {}
		expect(
			matchesTableFilter(
				row,
				{ id: '1', columnKey: 'tag', operator: TABLE_FILTER_ENUM_OP, value: [TABLE_FILTER_NONE_VALUE] },
				cols,
			),
		).toBe(true)
	})
})

describe('applyTableFilters', () => {
	const rows = [
		{ name: 'A', n: 1, tag: 'x' },
		{ name: 'B', n: 2, tag: 'y' },
	]

	it('AND-combines filters', () => {
		const out = applyTableFilters(
			rows,
			[
				{ id: '1', columnKey: 'name', operator: 'isAny', value: ['A', 'B'] },
				{ id: '2', columnKey: 'n', operator: 'eq', value: 2 },
			],
			testColumns,
		)
		expect(out).toEqual([{ name: 'B', n: 2, tag: 'y' }])
		const out2 = applyTableFilters(
			rows,
			[
				{ id: '1', columnKey: 'name', operator: 'is', value: 'B' },
				{ id: '2', columnKey: 'n', operator: 'eq', value: 2 },
			],
			testColumns,
		)
		expect(out2).toEqual([{ name: 'B', n: 2, tag: 'y' }])
	})
})

describe('formatTableFilterSummary', () => {
	it('formats string, number, enum', () => {
		expect(
			formatTableFilterSummary(
				{ id: '1', columnKey: 'name', operator: 'contains', value: 'foo' },
				testColumns,
			),
		).toBe('Name contains foo')
		expect(
			formatTableFilterSummary(
				{ id: '1', columnKey: 'n', operator: 'between', value: [1, 2] },
				testColumns,
			),
		).toBe('N between 1 … 2')
		expect(
			formatTableFilterSummary(
				{
					id: '1',
					columnKey: 'tag',
					operator: TABLE_FILTER_ENUM_OP,
					value: [TABLE_FILTER_NONE_VALUE, 'A'],
				},
				testColumns,
			),
		).toContain('(none)')
	})
})

describe('tableFilterNextId', () => {
	it('returns unique ids', () => {
		const a = tableFilterNextId()
		const b = tableFilterNextId()
		expect(a).not.toBe(b)
		expect(a.startsWith('tf-')).toBe(true)
	})
})
