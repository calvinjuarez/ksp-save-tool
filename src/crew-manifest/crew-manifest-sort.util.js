/**
 * @typedef {'asc' | 'desc' | null} CrewManifestSortDir
 */

/**
 * @typedef {import('./crew-manifest-mark.const.js').CrewManifestMarkKind | null} CrewManifestMarkKindOrNull
 */

/**
 * @typedef {import('./crew-manifest.util.js').CrewManifestRow} CrewManifestRow
 */

/**
 * @typedef {Object} CrewManifestSortSpec
 * @property {CrewManifestSortColumn | null} key
 * @property {CrewManifestSortDir} dir
 */

/**
 * @typedef {'name'|'mark'|'role'|'vessel'|'situation'|'body'|'suit'|'build'|'color'} CrewManifestSortColumn
 */

/** @type {readonly CrewManifestSortColumn[]} */
export const CREW_MANIFEST_SORT_COLUMNS = [
	'name',
	'mark',
	'role',
	'vessel',
	'situation',
	'body',
	'suit',
	'build',
	'color',
]

/** Distance-from-Kerbin / solar order; unknown and em dash sort after Home. */
export const CREW_MANIFEST_BODY_RANK = [
	'Kerbin',
	'Mun',
	'Minmus',
	'Sun',
	'Moho',
	'Eve',
	'Gilly',
	'Duna',
	'Ike',
	'Dres',
	'Jool',
	'Laythe',
	'Vall',
	'Tylo',
	'Bop',
	'Pol',
	'Eeloo',
	'Home',
]

/** @type {Record<string, number>} */
const bodyRankByName = Object.fromEntries(
	CREW_MANIFEST_BODY_RANK.map((name, i) => [name, i]),
)

/** @type {readonly (import('./crew-manifest-mark.const.js').CrewManifestMarkKind | null)[]} */
export const CREW_MANIFEST_MARK_SORT_ORDER = ['openRescue', 'tourist', 'rescued', null]

/** @type {Map<import('./crew-manifest-mark.const.js').CrewManifestMarkKind | null, number>} */
const markSortIndex = new Map(
	CREW_MANIFEST_MARK_SORT_ORDER.map((k, i) => [k, i]),
)

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
 * @param {CrewManifestRow} row
 * @returns {string}
 */
function buildAbbrForSort(row) {
	if (row.build !== null) return row.build.abbr
	return '—'
}

/**
 * @param {CrewManifestRow} row
 * @returns {number}
 */
function bodyRank(row) {
	const b = row.body
	if (b === '—' || b === '') return Number.POSITIVE_INFINITY
	const idx = bodyRankByName[b]
	return idx !== undefined ? idx : Number.POSITIVE_INFINITY
}

/**
 * @param {CrewManifestRow} row
 * @returns {number}
 */
function markSortRank(row) {
	const k = row.markKind
	const idx = markSortIndex.get(k)
	return idx !== undefined ? idx : Number.POSITIVE_INFINITY
}

/**
 * @param {CrewManifestSortColumn} key
 * @param {CrewManifestRow} a
 * @param {CrewManifestRow} b
 * @returns {number}
 */
function compareByColumn(key, a, b) {
	switch (key) {
		case 'name':
			return compareLocaleText(a.name, b.name)
		case 'mark':
			return markSortRank(a) - markSortRank(b)
		case 'role':
			return compareLocaleText(a.role, b.role)
		case 'vessel':
			return compareLocaleText(a.vessel, b.vessel)
		case 'situation':
			return compareLocaleText(a.situation, b.situation)
		case 'body':
			return bodyRank(a) - bodyRank(b) || compareLocaleText(a.body, b.body)
		case 'suit':
			return compareLocaleText(a.suit, b.suit)
		case 'build':
			return compareLocaleText(buildAbbrForSort(a), buildAbbrForSort(b))
		case 'color':
			return compareLocaleText(a.color, b.color)
		default:
			return 0
	}
}

/**
 * @param {CrewManifestSortSpec} spec
 * @returns {boolean}
 */
export function crewManifestSortSpecIsActive(spec) {
	return spec.key !== null && spec.dir !== null
}

/**
 * @param {CrewManifestSortDir} dir
 * @param {number} cmp
 * @returns {number}
 */
function applyDir(dir, cmp) {
	if (dir === 'desc') return -cmp
	return cmp
}

/**
 * Stable sort: primary column dominates; secondary breaks ties.
 *
 * @param {CrewManifestRow[]} rows
 * @param {CrewManifestSortSpec} primary
 * @param {CrewManifestSortSpec} secondary
 * @returns {CrewManifestRow[]}
 */
export function sortCrewManifestRows(rows, primary, secondary) {
	const pActive = crewManifestSortSpecIsActive(primary)
	const sActive = crewManifestSortSpecIsActive(secondary)
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
		return 0
	})
	return out
}

/**
 * @param {CrewManifestSortDir} dir
 * @returns {CrewManifestSortDir}
 */
export function cycleCrewManifestSortDir(dir) {
	if (dir === 'asc') return 'desc'
	if (dir === 'desc') return null
	return 'asc'
}
