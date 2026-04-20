/**
 * @typedef {'string'|'number'|'enum'} TableFilterColumnType
 */

/**
 * @typedef {Object} TableFilterColumnDef
 * @property {string} key
 * @property {string} label
 * @property {TableFilterColumnType} type
 * @property {(row: unknown) => unknown} accessor
 * @property {(storedValue: string) => string} [enumOptionLabel]
 *   For `type: 'enum'`, maps stored accessor values to checkbox / summary labels (e.g. emoji + title).
 * @property {readonly string[]} [enumValueUniverse]
 *   When set, enum options are exactly these values (plus labels), not only values present in rows.
 * @property {(a: string, b: string) => number} [enumOptionCompare]
 *   For `type: 'enum'`, overrides the default alphabetical sort used to order checkbox options.
 * @property {string} [numberStep]
 *   For `type: 'number'`, HTML `step` on value inputs (e.g. `0.1` for decimal XP).
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
