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
 * @param {unknown[]} rows
 * @param {(row: unknown) => unknown} accessor
 * @returns {{ value: string, label: string }[]}
 */
export function tableFilterEnumOptions(rows, accessor) {
	/** @type {Set<string>} */
	const set = new Set()
	for (const row of rows) {
		const raw = accessor(row)
		const s = raw === null || raw === undefined ? TABLE_FILTER_NONE_VALUE : String(raw)
		set.add(s)
	}
	const arr = [...set]
	arr.sort((a, b) => {
		const da = a === TABLE_FILTER_NONE_VALUE ? 1 : 0
		const db = b === TABLE_FILTER_NONE_VALUE ? 1 : 0
		if (da !== db) return da - db
		return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
	})
	return arr.map((value) => ({
		value,
		label: value === TABLE_FILTER_NONE_VALUE ? TABLE_FILTER_NONE_LABEL : value,
	}))
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
				if (!Array.isArray(v) || v.length !== 2) return false
				const a = asNumber(v[0])
				const b = asNumber(v[1])
				if (!Number.isFinite(n) || !Number.isFinite(a) || !Number.isFinite(b)) return false
				const lo = Math.min(a, b)
				const hi = Math.max(a, b)
				return n >= lo && n <= hi
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
		const parts = selected.map((v) =>
			String(v) === TABLE_FILTER_NONE_VALUE ? TABLE_FILTER_NONE_LABEL : String(v),
		)
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
		if (op === 'between' && Array.isArray(v) && v.length === 2) {
			return `${label} ${ol} ${asString(v[0])} … ${asString(v[1])}`
		}
		return `${label} ${ol} ${asString(v)}`
	}

	return `${label}`
}
