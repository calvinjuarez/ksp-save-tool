import { defineStore } from 'pinia'
import { ref } from 'vue'
import { SCIENCE_REPORT_FILTER_COLUMNS } from './science-report-filter.const.js'
import { SCIENCE_REPORT_SORT_COLUMNS } from './science-report-sort.util.js'

/** @typedef {'ungrouped' | 'location' | 'experiment'} ScienceReportGroupBy */
/** @typedef {import('./science-report-sort.util.js').ScienceReportSortSpec} ScienceReportSortSpec */
/** @typedef {import('../shared/table-filter.util.js').TableFilter} TableFilter */

/** @type {readonly ScienceReportGroupBy[]} */
const SCIENCE_REPORT_GROUP_BY_VALUES = ['ungrouped', 'location', 'experiment']

/** @type {ReadonlySet<string>} */
const SORT_COLUMN_SET = new Set(SCIENCE_REPORT_SORT_COLUMNS)

/** @type {ReadonlySet<string>} */
const FILTER_COLUMN_KEY_SET = new Set(SCIENCE_REPORT_FILTER_COLUMNS.map((c) => c.key))

/**
 * @param {unknown} spec
 * @returns {spec is ScienceReportSortSpec}
 */
function isValidScienceReportSortSpec(spec) {
	if (spec === null || typeof spec !== 'object') {
		return false
	}
	const key = /** @type {{ key?: unknown, dir?: unknown }} */ (spec).key
	const dir = /** @type {{ key?: unknown, dir?: unknown }} */ (spec).dir
	if (!(key === null || (typeof key === 'string' && SORT_COLUMN_SET.has(key)))) {
		return false
	}
	if (!(dir === null || dir === 'asc' || dir === 'desc')) {
		return false
	}
	return true
}

/**
 * @param {unknown} data
 * @returns {Record<string, unknown> | null}
 */
export function validateScienceReportPrefsPayload(data) {
	if (data === null || typeof data !== 'object') {
		return null
	}
	const o = /** @type {Record<string, unknown>} */ (data)
	/** @type {Record<string, unknown>} */
	const out = {}

	if (typeof o.groupBy === 'string' && SCIENCE_REPORT_GROUP_BY_VALUES.includes(/** @type {ScienceReportGroupBy} */ (o.groupBy))) {
		out.groupBy = o.groupBy
	}

	if (isValidScienceReportSortSpec(o.primarySort)) {
		out.primarySort = o.primarySort
	}
	if (isValidScienceReportSortSpec(o.secondarySort)) {
		out.secondarySort = o.secondarySort
	}

	if (Array.isArray(o.filters)) {
		/** @type {TableFilter[]} */
		const repaired = []
		for (const row of o.filters) {
			if (row !== null && typeof row === 'object' && 'columnKey' in row) {
				const columnKey = /** @type {{ columnKey?: unknown }} */ (row).columnKey
				if (typeof columnKey === 'string' && FILTER_COLUMN_KEY_SET.has(columnKey)) {
					repaired.push(/** @type {TableFilter} */ (row))
				}
			}
		}
		out.filters = repaired
	}

	return out
}

export const useScienceReportPrefsStore = defineStore(
	'scienceReportPrefs',
	() => {
		/** @type {import('vue').Ref<ScienceReportGroupBy>} */
		const groupBy = ref('location')

		/** @type {import('vue').Ref<ScienceReportSortSpec>} */
		const primarySort = ref({ key: 'science', dir: 'asc' })

		/** @type {import('vue').Ref<ScienceReportSortSpec>} */
		const secondarySort = ref({ key: null, dir: null })

		/** @type {import('vue').Ref<TableFilter[]>} */
		const filters = ref([])

		return {
			groupBy,
			primarySort,
			secondarySort,
			filters,
		}
	},
	{
		persist: {
			key: 'ksp-explorer:save:science-report',
			version: 1,
			paths: ['groupBy', 'primarySort', 'secondarySort', 'filters'],
			validate: validateScienceReportPrefsPayload,
		},
	},
)
