/**
 * @typedef {'string'|'number'|'enum'} TableFilterColumnType
 */

/**
 * @typedef {Object} TableFilterColumnDef
 * @property {string} key
 * @property {string} label
 * @property {TableFilterColumnType} type
 * @property {(row: unknown) => unknown} accessor
 */

/**
 * String filter operators (keys used in stored filter objects).
 * @type {readonly { key: string, label: string }[]}
 */
export const TABLE_FILTER_STRING_OPS = Object.freeze([
	{ key: 'is', label: 'is' },
	{ key: 'contains', label: 'contains' },
	{ key: 'isAny', label: 'is any' },
	{ key: 'containsAny', label: 'contains any' },
])

/**
 * Number filter operators.
 * @type {readonly { key: string, label: string }[]}
 */
export const TABLE_FILTER_NUMBER_OPS = Object.freeze([
	{ key: 'eq', label: '=' },
	{ key: 'neq', label: '≠' },
	{ key: 'gt', label: '>' },
	{ key: 'gte', label: '≥' },
	{ key: 'lt', label: '<' },
	{ key: 'lte', label: '≤' },
	{ key: 'eqAny', label: '= any' },
	{ key: 'between', label: 'between' },
])

/** Internal operator for enum columns (checkbox selection). */
export const TABLE_FILTER_ENUM_OP = 'enumSet'

/** Display label for em-dash / missing enum values in the builder. */
export const TABLE_FILTER_NONE_LABEL = '(none)'

/** Sentinel value stored for “none” in filters (matches accessor output for missing cells). */
export const TABLE_FILTER_NONE_VALUE = '—'
