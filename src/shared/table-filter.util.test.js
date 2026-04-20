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

	it('uses enumOptionLabel when provided', () => {
		const rows = [{ tag: 'A' }]
		const opts = tableFilterEnumOptions(
			rows,
			(r) => /** @type {{ tag: string }} */ (r).tag,
			(v) => `Label ${v}`,
		)
		expect(opts.find((o) => o.value === 'A')?.label).toBe('Label A')
	})

	it('uses enumValueUniverse when provided (not row-derived only)', () => {
		const rows = [{ tag: 'onlyA' }]
		const opts = tableFilterEnumOptions(rows, (r) => /** @type {{ tag: string }} */ (r).tag, {
			enumValueUniverse: ['2', '1'],
			enumOptionLabel: (v) => `L${v}`,
		})
		expect(opts.map((o) => o.value)).toEqual(['1', '2'])
		expect(opts.map((o) => o.label)).toEqual(['L1', 'L2'])
	})

	it('respects enumOptionCompare for ordering (row-derived)', () => {
		const rows = [{ tag: 'c' }, { tag: 'a' }, { tag: 'b' }]
		const opts = tableFilterEnumOptions(
			rows,
			(r) => /** @type {{ tag: string }} */ (r).tag,
			{ enumOptionCompare: (a, b) => b.localeCompare(a) },
		)
		expect(opts.map((o) => o.value)).toEqual(['c', 'b', 'a'])
	})

	it('respects enumOptionCompare for ordering (universe)', () => {
		const opts = tableFilterEnumOptions([], () => '', {
			enumValueUniverse: ['a', 'c', 'b'],
			enumOptionCompare: (a, b) => b.localeCompare(a),
		})
		expect(opts.map((o) => o.value)).toEqual(['c', 'b', 'a'])
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

	it('between (legacy array, inclusive both ends)', () => {
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

	it('between [lo, hi] object — all four bracket combinations', () => {
		const f = (value) =>
			matchesTableFilter(row, { id: '1', columnKey: 'n', operator: 'between', value }, testColumns)
		// [1, 5]
		expect(f({ lo: 1, hi: 5, loInclusive: true, hiInclusive: true })).toBe(true)
		expect(
			matchesTableFilter({ n: 1 }, { id: '1', columnKey: 'n', operator: 'between', value: { lo: 1, hi: 5, loInclusive: true, hiInclusive: true } }, testColumns),
		).toBe(true)
		expect(
			matchesTableFilter({ n: 5 }, { id: '1', columnKey: 'n', operator: 'between', value: { lo: 1, hi: 5, loInclusive: true, hiInclusive: true } }, testColumns),
		).toBe(true)
		// (1, 5)
		expect(
			matchesTableFilter({ n: 1 }, { id: '1', columnKey: 'n', operator: 'between', value: { lo: 1, hi: 5, loInclusive: false, hiInclusive: false } }, testColumns),
		).toBe(false)
		expect(
			matchesTableFilter({ n: 5 }, { id: '1', columnKey: 'n', operator: 'between', value: { lo: 1, hi: 5, loInclusive: false, hiInclusive: false } }, testColumns),
		).toBe(false)
		expect(f({ lo: 1, hi: 5, loInclusive: false, hiInclusive: false })).toBe(true)
		// [1, 5)
		expect(
			matchesTableFilter({ n: 5 }, { id: '1', columnKey: 'n', operator: 'between', value: { lo: 1, hi: 5, loInclusive: true, hiInclusive: false } }, testColumns),
		).toBe(false)
		expect(
			matchesTableFilter({ n: 1 }, { id: '1', columnKey: 'n', operator: 'between', value: { lo: 1, hi: 5, loInclusive: true, hiInclusive: false } }, testColumns),
		).toBe(true)
		// (1, 5]
		expect(
			matchesTableFilter({ n: 1 }, { id: '1', columnKey: 'n', operator: 'between', value: { lo: 1, hi: 5, loInclusive: false, hiInclusive: true } }, testColumns),
		).toBe(false)
		expect(
			matchesTableFilter({ n: 5 }, { id: '1', columnKey: 'n', operator: 'between', value: { lo: 1, hi: 5, loInclusive: false, hiInclusive: true } }, testColumns),
		).toBe(true)
	})

	it('between swaps bounds and maps inclusivity to sorted endpoints', () => {
		// Min field 5, Max field 1: interval (1, 5] when lower (hi) exclusive, upper (lo) inclusive
		expect(
			matchesTableFilter(
				{ n: 1 },
				{
					id: '1',
					columnKey: 'n',
					operator: 'between',
					value: { lo: 5, hi: 1, loInclusive: true, hiInclusive: false },
				},
				testColumns,
			),
		).toBe(false)
		expect(
			matchesTableFilter(
				{ n: 5 },
				{
					id: '1',
					columnKey: 'n',
					operator: 'between',
					value: { lo: 5, hi: 1, loInclusive: true, hiInclusive: false },
				},
				testColumns,
			),
		).toBe(true)
		expect(
			matchesTableFilter(
				{ n: 3 },
				{
					id: '1',
					columnKey: 'n',
					operator: 'between',
					value: { lo: 5, hi: 1, loInclusive: true, hiInclusive: false },
				},
				testColumns,
			),
		).toBe(true)
	})

	it('between equal lo and hi requires both inclusive for a match at that point', () => {
		expect(
			matchesTableFilter(
				{ n: 3 },
				{ id: '1', columnKey: 'n', operator: 'between', value: { lo: 3, hi: 3, loInclusive: true, hiInclusive: true } },
				testColumns,
			),
		).toBe(true)
		expect(
			matchesTableFilter(
				{ n: 3 },
				{ id: '1', columnKey: 'n', operator: 'between', value: { lo: 3, hi: 3, loInclusive: true, hiInclusive: false } },
				testColumns,
			),
		).toBe(false)
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
		).toBe('N between [1 … 2]')
		expect(
			formatTableFilterSummary(
				{
					id: '1',
					columnKey: 'n',
					operator: 'between',
					value: { lo: 1, hi: 2, loInclusive: false, hiInclusive: false },
				},
				testColumns,
			),
		).toBe('N between (1 … 2)')
		expect(
			formatTableFilterSummary(
				{
					id: '1',
					columnKey: 'n',
					operator: 'between',
					value: { lo: 1, hi: 2, loInclusive: true, hiInclusive: false },
				},
				testColumns,
			),
		).toBe('N between [1 … 2)')
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

	it('uses enumOptionLabel in enum summaries when set on the column', () => {
		const columns = /** @type {import('./table-filter.const.js').TableFilterColumnDef[]} */ ([
			{
				key: 'tag',
				label: 'Tag',
				type: 'enum',
				accessor: (row) => /** @type {{ tag: string }} */ (row).tag,
				enumOptionLabel: (v) => (v === 'a' ? 'Alpha' : v),
			},
		])
		expect(
			formatTableFilterSummary(
				{ id: '1', columnKey: 'tag', operator: TABLE_FILTER_ENUM_OP, value: ['a'] },
				columns,
			),
		).toBe('Tag: Alpha')
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
