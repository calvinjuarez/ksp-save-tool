import { ref } from 'vue'
import { applyTableFilters, tableFilterNextId } from './table-filter.util.js'

/**
 * @typedef {import('./table-filter.const.js').TableFilterColumnDef} TableFilterColumnDef
 * @typedef {import('./table-filter.util.js').TableFilter} TableFilter
 */

/**
 * @typedef {Object} UseTableFilterOptions
 * @property {import('vue').Ref<TableFilter[]>} [filters] - Shared filters ref (e.g. from a Pinia prefs store).
 */

/**
 * @param {readonly TableFilterColumnDef[]} columnDefs
 * @param {UseTableFilterOptions} [options]
 */
export function useTableFilter(columnDefs, options = {}) {
	/** @type {import('vue').Ref<TableFilter[]>} */
	const filters = options.filters ?? ref([])

	/**
	 * @param {Omit<TableFilter, 'id'>} partial
	 */
	function addFilter(partial) {
		filters.value = [...filters.value, { ...partial, id: tableFilterNextId() }]
	}

	/**
	 * @param {string} id
	 */
	function removeFilter(id) {
		filters.value = filters.value.filter((f) => f.id !== id)
	}

	function clearFilters() {
		filters.value = []
	}

	/**
	 * @param {unknown[]} rows
	 * @returns {unknown[]}
	 */
	function applyTo(rows) {
		return applyTableFilters(rows, filters.value, /** @type {TableFilterColumnDef[]} */ (columnDefs))
	}

	return {
		filters,
		addFilter,
		removeFilter,
		clearFilters,
		applyTo,
	}
}
