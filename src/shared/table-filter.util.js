import {
	TABLE_FILTER_ENUM_OP,
	TABLE_FILTER_NONE_LABEL,
	TABLE_FILTER_NONE_VALUE,
	TABLE_FILTER_NUMBER_OPS,
	TABLE_FILTER_STRING_OPS,
} from './table-filter.const.js'

let _tableFilterIdSeq = 0

/**
 * @returns {string}
 */
export function tableFilterNextId() {
	_tableFilterIdSeq += 1
	return `tf-${_tableFilterIdSeq}`
}

/**
 * @typedef {import('./table-filter.const.js').TableFilterColumnDef} TableFilterColumnDef
 */

/**
 * @typedef {Object} TableFilter
 * @property {string} id
 * @property {string} columnKey
 * @property {string} operator
 * @property {unknown} value
 */

/**
 * @param {TableFilterColumnDef[]} columnDefs
 * @param {string} key
 * @returns {TableFilterColumnDef | undefined}
 */
export function tableFilterColumnDefByKey(columnDefs, key) {
	return columnDefs.find((c) => c.key === key)
}

/**
 * @param {string} opKey
 * @returns {string}
 */
function stringOpLabel(opKey) {
	const op = TABLE_FILTER_STRING_OPS.find((o) => o.key === opKey)
	return op ? op.label : opKey
}

/**
 * @param {string} opKey
 * @returns {string}
 */
function numberOpLabel(opKey) {
	const op = TABLE_FILTER_NUMBER_OPS.find((o) => o.key === opKey)
	return op ? op.label : opKey
}

/**
 * @param {unknown} v
 * @returns {string}
 */
function asString(v) {
	if (v === null || v === undefined) return ''
	return String(v)
}

/**
 * @param {unknown} v
 * @returns {number}
 */
function asNumber(v) {
	const n = Number(v)
	return Number.isFinite(n) ? n : Number.NaN
}

/**
 * Normalizes a `between` filter value (object or legacy `[lo, hi]` array) to sorted
 * numeric endpoints and per-end inclusivity.
 * @param {unknown} v
 * @returns {{ loNum: number, hiNum: number, inclLow: boolean, inclHigh: boolean } | null}
 */
function numberBetweenBounds(v) {
	if (Array.isArray(v) && v.length === 2) {
		const a = asNumber(v[0])
		const b = asNumber(v[1])
		if (!Number.isFinite(a) || !Number.isFinite(b)) return null
		const loNum = Math.min(a, b)
		const hiNum = Math.max(a, b)
		return { loNum, hiNum, inclLow: true, inclHigh: true }
	}
	if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
		const o = /** @type {{ lo?: unknown, hi?: unknown, loInclusive?: unknown, hiInclusive?: unknown }} */ (v)
		const lo = asNumber(o.lo)
		const hi = asNumber(o.hi)
		if (!Number.isFinite(lo) || !Number.isFinite(hi)) return null
		const loInclusive = o.loInclusive !== false
		const hiInclusive = o.hiInclusive !== false
		if (lo < hi) {
			return { loNum: lo, hiNum: hi, inclLow: loInclusive, inclHigh: hiInclusive }
		}
		if (lo > hi) {
			return { loNum: hi, hiNum: lo, inclLow: hiInclusive, inclHigh: loInclusive }
		}
		return {
			loNum: lo,
			hiNum: hi,
			inclLow: loInclusive && hiInclusive,
			inclHigh: loInclusive && hiInclusive,
		}
	}
	return null
}

/**
 * @param {string} s
 * @returns {string[]}
 */
export function parseCommaSeparatedList(s) {
	return s
		.split(',')
		.map((p) => p.trim())
		.filter((p) => p.length > 0)
}

/**
 * @param {{
 *   enumOptionLabel?: (storedValue: string) => string
 *   enumValueUniverse?: readonly string[]
 *   enumOptionCompare?: (a: string, b: string) => number
 * }} [options]
 */
function normalizeEnumOptionsArg(options) {
	if (typeof options === 'function') return { enumOptionLabel: options }
	return options ?? {}
}

/**
 * @param {unknown[]} rows
 * @param {(row: unknown) => unknown} accessor
 * @param {((storedValue: string) => string) | {
 *   enumOptionLabel?: (storedValue: string) => string
 *   enumValueUniverse?: readonly string[]
 *   enumOptionCompare?: (a: string, b: string) => number
 * }} [optionsOrLabel]
 * @returns {{ value: string, label: string }[]}
 */
export function tableFilterEnumOptions(rows, accessor, optionsOrLabel) {
	const { enumOptionLabel, enumValueUniverse, enumOptionCompare } =
		normalizeEnumOptionsArg(optionsOrLabel)

	if (enumValueUniverse !== undefined && enumValueUniverse.length > 0) {
		const arr = [...enumValueUniverse]
		arr.sort(enumOptionCompare ?? defaultEnumOptionCompare)
		return arr.map((value) => ({
			value,
			label:
				value === TABLE_FILTER_NONE_VALUE
					? TABLE_FILTER_NONE_LABEL
					: enumOptionLabel
						? enumOptionLabel(value)
						: value,
		}))
	}

	/** @type {Set<string>} */
	const set = new Set()
	for (const row of rows) {
		const raw = accessor(row)
		const s = raw === null || raw === undefined ? TABLE_FILTER_NONE_VALUE : String(raw)
		set.add(s)
	}
	const arr = [...set]
	arr.sort(enumOptionCompare ?? defaultEnumOptionCompare)
	return arr.map((value) => ({
		value,
		label:
			value === TABLE_FILTER_NONE_VALUE
				? TABLE_FILTER_NONE_LABEL
				: enumOptionLabel
					? enumOptionLabel(value)
					: value,
	}))
}

/**
 * Default enum builder ordering: em-dash / "none" last, then numeric-first alphabetical.
 *
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function defaultEnumOptionCompare(a, b) {
	const da = a === TABLE_FILTER_NONE_VALUE ? 1 : 0
	const db = b === TABLE_FILTER_NONE_VALUE ? 1 : 0
	if (da !== db) return da - db
	const na = Number.parseFloat(a)
	const nb = Number.parseFloat(b)
	if (Number.isFinite(na) && Number.isFinite(nb) && String(na) === a && String(nb) === b) {
		return na - nb
	}
	return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
}

/**
 * @param {unknown} row
 * @param {TableFilter} filter
 * @param {TableFilterColumnDef[]} columnDefs
 * @returns {boolean}
 */
export function matchesTableFilter(row, filter, columnDefs) {
	const def = tableFilterColumnDefByKey(columnDefs, filter.columnKey)
	if (!def) return true
	const raw = def.accessor(row)
	const op = filter.operator

	if (def.type === 'enum') {
		if (op !== TABLE_FILTER_ENUM_OP) return true
		const selected = /** @type {unknown} */ (filter.value)
		if (!Array.isArray(selected) || selected.length === 0) return false
		const cell =
			raw === null || raw === undefined ? TABLE_FILTER_NONE_VALUE : String(raw)
		const set = new Set(selected.map((x) => String(x)))
		return set.has(cell)
	}

	if (def.type === 'string') {
		const cell = asString(raw)
		const cellLc = cell.toLocaleLowerCase()
		const v = filter.value
		switch (op) {
			case 'is': {
				const want = asString(v).toLocaleLowerCase()
				return cellLc === want
			}
			case 'contains': {
				const needle = asString(v).toLocaleLowerCase()
				if (!needle) return true
				return cellLc.includes(needle)
			}
			case 'isAny': {
				if (!Array.isArray(v) || v.length === 0) return false
				const set = new Set(v.map((x) => asString(x).toLocaleLowerCase()))
				return set.has(cellLc)
			}
			case 'containsAny': {
				if (!Array.isArray(v) || v.length === 0) return false
				return v.some((needle) => {
					const n = asString(needle).toLocaleLowerCase()
					return n.length > 0 && cellLc.includes(n)
				})
			}
			default:
				return true
		}
	}

	if (def.type === 'number') {
		const n = asNumber(raw)
		const v = filter.value
		switch (op) {
			case 'eq': {
				const want = asNumber(v)
				return Number.isFinite(n) && Number.isFinite(want) && n === want
			}
			case 'neq': {
				const want = asNumber(v)
				return Number.isFinite(n) && Number.isFinite(want) && n !== want
			}
			case 'gt': {
				const want = asNumber(v)
				return Number.isFinite(n) && Number.isFinite(want) && n > want
			}
			case 'gte': {
				const want = asNumber(v)
				return Number.isFinite(n) && Number.isFinite(want) && n >= want
			}
			case 'lt': {
				const want = asNumber(v)
				return Number.isFinite(n) && Number.isFinite(want) && n < want
			}
			case 'lte': {
				const want = asNumber(v)
				return Number.isFinite(n) && Number.isFinite(want) && n <= want
			}
			case 'eqAny': {
				if (!Array.isArray(v) || v.length === 0) return false
				if (!Number.isFinite(n)) return false
				return v.some((x) => Number.isFinite(asNumber(x)) && asNumber(x) === n)
			}
			case 'between': {
				const bounds = numberBetweenBounds(v)
				if (!bounds) return false
				if (!Number.isFinite(n)) return false
				const { loNum, hiNum, inclLow, inclHigh } = bounds
				const okLow = inclLow ? n >= loNum : n > loNum
				const okHigh = inclHigh ? n <= hiNum : n < hiNum
				return okLow && okHigh
			}
			default:
				return true
		}
	}

	return true
}

/**
 * @param {unknown[]} rows
 * @param {TableFilter[]} filters
 * @param {TableFilterColumnDef[]} columnDefs
 * @returns {unknown[]}
 */
export function applyTableFilters(rows, filters, columnDefs) {
	if (filters.length === 0) return [...rows]
	return rows.filter((row) => filters.every((f) => matchesTableFilter(row, f, columnDefs)))
}

/**
 * @param {TableFilter} filter
 * @param {TableFilterColumnDef[]} columnDefs
 * @returns {string}
 */
export function formatTableFilterSummary(filter, columnDefs) {
	const def = tableFilterColumnDefByKey(columnDefs, filter.columnKey)
	const label = def ? def.label : filter.columnKey
	const op = filter.operator

	if (!def || def.type === 'enum') {
		const selected = /** @type {unknown} */ (filter.value)
		if (!Array.isArray(selected) || selected.length === 0) return `${label}: …`
		const parts = selected.map((v) => {
			const s = String(v)
			if (s === TABLE_FILTER_NONE_VALUE) return TABLE_FILTER_NONE_LABEL
			if (def?.type === 'enum' && def.enumOptionLabel) return def.enumOptionLabel(s)
			return s
		})
		return `${label}: ${parts.join(', ')}`
	}

	if (def.type === 'string') {
		const ol = stringOpLabel(op)
		const v = filter.value
		if (op === 'isAny' || op === 'containsAny') {
			const arr = Array.isArray(v) ? v : []
			return `${label} ${ol} ${arr.join(' · ')}`
		}
		return `${label} ${ol} ${asString(v)}`
	}

	if (def.type === 'number') {
		const ol = numberOpLabel(op)
		const v = filter.value
		if (op === 'eqAny') {
			const arr = Array.isArray(v) ? v : []
			return `${label} ${ol} ${arr.join(' · ')}`
		}
		if (op === 'between') {
			const bounds = numberBetweenBounds(v)
			if (bounds) {
				const left = bounds.inclLow ? '[' : '('
				const right = bounds.inclHigh ? ']' : ')'
				return `${label} ${ol} ${left}${asString(bounds.loNum)} … ${asString(bounds.hiNum)}${right}`
			}
		}
		return `${label} ${ol} ${asString(v)}`
	}

	return `${label}`
}
