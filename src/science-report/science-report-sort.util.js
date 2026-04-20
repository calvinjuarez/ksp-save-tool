/**
 * @typedef {'asc' | 'desc' | null} ScienceReportSortDir
 */

/**
 * @typedef {Object} ScienceReportSortSpec
 * @property {ScienceReportSortColumn | null} key
 * @property {ScienceReportSortDir} dir
 */

/**
 * @typedef {'experiment'|'body'|'situation'|'biome'|'science'|'onboard'} ScienceReportSortColumn
 */

/** @type {readonly ScienceReportSortColumn[]} */
export const SCIENCE_REPORT_SORT_COLUMNS = [
	'experiment',
	'body',
	'situation',
	'biome',
	'science',
	'onboard',
]

/** @type {Readonly<Record<ScienceReportSortColumn, string>>} */
export const SCIENCE_REPORT_SORT_COLUMN_LABELS = Object.freeze({
	experiment: 'Experiment',
	body: 'Body',
	situation: 'Situation',
	biome: 'Biome',
	science: 'Science',
	onboard: 'Onboard',
})

const DASH_LAST = '\uffff'

/**
 * @param {string} s
 * @returns {string}
 */
function textSortKey(s) {
	return s === '—' ? DASH_LAST : s
}

/**
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function compareLocaleText(a, b) {
	return textSortKey(a).localeCompare(textSortKey(b), undefined, {
		numeric: true,
		sensitivity: 'base',
	})
}

/**
 * @param {import('./science-report.util.js').ScienceReportRow} a
 * @param {import('./science-report.util.js').ScienceReportRow} b
 * @param {ScienceReportSortColumn} key
 * @returns {number}
 */
function compareByColumn(key, a, b) {
	switch (key) {
		case 'experiment':
			return compareLocaleText(a.experimentTitle, b.experimentTitle)
		case 'body':
			return compareLocaleText(a.body, b.body)
		case 'situation':
			return compareLocaleText(a.situation, b.situation)
		case 'biome':
			return compareLocaleText(a.biome, b.biome)
		case 'science':
			return a.earned - b.earned
		case 'onboard':
			return a.onboardData - b.onboardData
		default:
			return 0
	}
}

/**
 * @param {ScienceReportSortSpec} spec
 * @returns {boolean}
 */
export function scienceReportSortSpecIsActive(spec) {
	return spec.key !== null && spec.dir !== null
}

/**
 * @param {ScienceReportSortDir} dir
 * @param {number} cmp
 * @returns {number}
 */
function applyDir(dir, cmp) {
	if (dir === 'desc') return -cmp
	return cmp
}

/**
 * @param {import('./science-report.util.js').ScienceReportRow[]} rows
 * @param {ScienceReportSortSpec} primary
 * @param {ScienceReportSortSpec} secondary
 * @returns {import('./science-report.util.js').ScienceReportRow[]}
 */
export function sortScienceReportRows(rows, primary, secondary) {
	const pActive = scienceReportSortSpecIsActive(primary)
	const sActive = scienceReportSortSpecIsActive(secondary)
	if (!pActive && !sActive) return [...rows]

	const out = rows.slice()
	out.sort((a, b) => {
		if (pActive && primary.key) {
			const c = compareByColumn(primary.key, a, b)
			if (c !== 0) return applyDir(/** @type {'asc'|'desc'} */ (primary.dir), c)
		}
		if (sActive && secondary.key) {
			const c = compareByColumn(secondary.key, a, b)
			if (c !== 0) return applyDir(/** @type {'asc'|'desc'} */ (secondary.dir), c)
		}
		return compareByColumn('experiment', a, b)
	})
	return out
}

/**
 * @param {ScienceReportSortDir} dir
 * @returns {ScienceReportSortDir}
 */
export function cycleScienceReportSortDir(dir) {
	if (dir === 'asc') return 'desc'
	if (dir === 'desc') return null
	return 'asc'
}

/**
 * @param {ScienceReportSortColumn} key
 * @param {ScienceReportSortDir} dir
 * @returns {ScienceReportSortDir}
 */
export function cycleScienceReportSortDirForColumn(key, dir) {
	if (key === 'science' || key === 'onboard') {
		if (dir === 'asc') return 'desc'
		if (dir === 'desc') return null
		return 'asc'
	}
	return cycleScienceReportSortDir(dir)
}

/**
 * @param {ScienceReportSortColumn} key
 * @returns {'asc'|'desc'}
 */
export function initialScienceReportSortDirForColumn(key) {
	if (key === 'science' || key === 'onboard') return 'asc'
	return 'asc'
}
