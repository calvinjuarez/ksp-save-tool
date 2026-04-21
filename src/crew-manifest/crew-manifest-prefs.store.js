import { defineStore } from 'pinia'
import { ref } from 'vue'
import { CREW_MANIFEST_FILTER_COLUMNS } from './crew-manifest-filter.const.js'
import { CREW_MANIFEST_SORT_COLUMNS } from './crew-manifest-sort.util.js'

/** @typedef {import('./crew-manifest-group.util.js').CrewManifestGroupBy} CrewManifestGroupBy */
/** @typedef {import('./crew-manifest-sort.util.js').CrewManifestSortSpec} CrewManifestSortSpec */
/** @typedef {import('../shared/table-filter.util.js').TableFilter} TableFilter */

/** @type {readonly CrewManifestGroupBy[]} */
const CREW_MANIFEST_GROUP_BY_VALUES = ['ungrouped', 'location', 'vessel']

/** @type {ReadonlySet<string>} */
const SORT_COLUMN_SET = new Set(CREW_MANIFEST_SORT_COLUMNS)

/** @type {ReadonlySet<string>} */
const FILTER_COLUMN_KEY_SET = new Set(CREW_MANIFEST_FILTER_COLUMNS.map((c) => c.key))

/**
 * @param {unknown} spec
 * @returns {spec is CrewManifestSortSpec}
 */
function isValidCrewManifestSortSpec(spec) {
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
 * Drop filter rows whose column no longer exists. Keeps the rest of each row intact.
 *
 * @param {unknown} data - Persisted payload (`data` field of the envelope).
 * @returns {Record<string, unknown> | null}
 */
export function validateCrewManifestPrefsPayload(data) {
	if (data === null || typeof data !== 'object') {
		return null
	}
	const o = /** @type {Record<string, unknown>} */ (data)
	/** @type {Record<string, unknown>} */
	const out = {}

	if (typeof o.groupBy === 'string' && CREW_MANIFEST_GROUP_BY_VALUES.includes(/** @type {CrewManifestGroupBy} */ (o.groupBy))) {
		out.groupBy = o.groupBy
	}

	if (isValidCrewManifestSortSpec(o.primarySort)) {
		out.primarySort = o.primarySort
	}
	if (isValidCrewManifestSortSpec(o.secondarySort)) {
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

export const useCrewManifestPrefsStore = defineStore(
	'crewManifestPrefs',
	() => {
		/** @type {import('vue').Ref<CrewManifestGroupBy>} */
		const groupBy = ref('ungrouped')

		/** @type {import('vue').Ref<CrewManifestSortSpec>} */
		const primarySort = ref({ key: 'body', dir: 'asc' })

		/** @type {import('vue').Ref<CrewManifestSortSpec>} */
		const secondarySort = ref({ key: 'vessel', dir: 'asc' })

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
			key: 'ksp-explorer:save:crew-manifest',
			version: 1,
			paths: ['groupBy', 'primarySort', 'secondarySort', 'filters'],
			validate: validateCrewManifestPrefsPayload,
		},
	},
)
