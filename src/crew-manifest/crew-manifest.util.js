import { bodyNameFromOrbitRef } from '../ksp/body.util.js'
import { recoverAssetMarkByKerbalName } from '../ksp/contract-rescue.util.js'
import {
	kerbalDisplayName,
	kerbalRankFromKerbal,
	kerbalTotalXpFromKerbal,
	parseBodyModel,
} from '../ksp/kerbal.util.js'
import { formatTableFilterSummary } from '../shared/table-filter.util.js'
import { asArray } from '../save-file/save-file.util.js'
import { CREW_MANIFEST_FILTER_COLUMNS } from './crew-manifest-filter.const.js'
import { crewManifestMark } from './crew-manifest-mark.const.js'
import { rankToStars } from './crew-manifest-rank.util.js'
import { formatCrewManifestSortSpecForMarkdown } from './crew-manifest-sort.util.js'

export { rankToStars }

/**
 * @typedef {Object} CrewManifestBodyModel
 * @property {'M'|'F'} abbr
 * @property {'Masculine'|'Feminine'} title
 */

/**
 * @typedef {import('./crew-manifest-mark.const.js').CrewManifestMark} CrewManifestMark
 */

/**
 * @typedef {import('./crew-manifest-mark.const.js').CrewManifestMarkKind} CrewManifestMarkKind
 */

/**
 * @typedef {Object} CrewManifestRow
 * @property {string} name
 * @property {string} role
 * @property {number} rank
 * @property {number} totalXp
 * @property {string} vessel
 * @property {string} situation
 * @property {string} body
 * @property {string} suit
 * @property {CrewManifestBodyModel | null} bodyModel
 * @property {string} color
 * @property {CrewManifestMark | null} mark
 * @property {CrewManifestMarkKind | null} markKind
 */

/**
 * Collect kerbal full names assigned to a vessel (walks PART trees; `crew` may be string or string[]).
 *
 * @param {unknown} vessel
 * @returns {string[]}
 */
export function collectCrewNamesFromVessel(vessel) {
	/** @type {Set<string>} */
	const names = new Set()
	/**
	 * @param {unknown} node
	 */
	function walk(node) {
		if (node === undefined || node === null) return
		if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') return
		if (Array.isArray(node)) {
			for (const item of node) walk(item)
			return
		}
		if (typeof node !== 'object') return
		for (const [k, v] of Object.entries(node)) {
			if (k === 'crew') {
				if (typeof v === 'string' && v.trim()) names.add(v.trim())
				else if (Array.isArray(v)) {
					for (const item of v) {
						if (typeof item === 'string' && item.trim()) names.add(item.trim())
					}
				}
			} else {
				walk(v)
			}
		}
	}
	walk(vessel)
	return [...names]
}

/**
 * @param {Record<string, unknown> | null | undefined} tree
 * @returns {Map<string, { vesselName: string, sit: string, orbitRef: string | undefined }>}
 */
function kerbalAssignmentsFromVessels(tree) {
	/** @type {Map<string, { vesselName: string, sit: string, orbitRef: string | undefined }>} */
	const map = new Map()
	const vessels = asArray(tree?.GAME?.FLIGHTSTATE, 'VESSEL')
	for (const vessel of vessels) {
		if (!vessel || typeof vessel !== 'object') continue
		const vesselName = typeof vessel.name === 'string' ? vessel.name : '—'
		const sit = typeof vessel.sit === 'string' ? vessel.sit : '—'
		const orbit = vessel.ORBIT
		const orbitRef =
			orbit && typeof orbit === 'object' && orbit.REF !== undefined && orbit.REF !== null
				? String(orbit.REF)
				: undefined
		for (const name of collectCrewNamesFromVessel(vessel)) {
			if (!map.has(name)) {
				map.set(name, { vesselName, sit, orbitRef })
			}
		}
	}
	return map
}

/**
 * @param {Record<string, unknown>} kerbal
 * @returns {string}
 */
function roleFromKerbal(kerbal) {
	const t = kerbal.type
	if (t === 'Tourist') return 'Tourist'
	const trait = kerbal.trait
	return typeof trait === 'string' && trait.length > 0 ? trait : '—'
}

/**
 * @param {number} totalXp
 * @returns {string}
 */
export function formatTotalXpDisplay(totalXp) {
	if (!Number.isFinite(totalXp)) return '—'
	const rounded = Math.round(totalXp * 10) / 10
	if (Number.isInteger(rounded)) return String(rounded)
	return rounded.toFixed(1)
}

/**
 * @param {string} name
 * @param {Record<string, unknown>} kerbal
 * @param {Map<string, 'openRescue'|'rescued'>} rescueMap
 * @returns {{ mark: CrewManifestMark | null, markKind: CrewManifestMarkKind | null }}
 */
function markFromKerbal(name, kerbal, rescueMap) {
	const rescue = rescueMap.get(name)
	if (rescue === 'openRescue') {
		return { mark: crewManifestMark('openRescue'), markKind: 'openRescue' }
	}
	if (rescue === 'rescued') {
		return { mark: crewManifestMark('rescued'), markKind: 'rescued' }
	}
	if (kerbal.type === 'Tourist' || kerbal.tour === 'True') {
		return { mark: crewManifestMark('tourist'), markKind: 'tourist' }
	}
	return { mark: null, markKind: null }
}

/**
 * @param {Record<string, unknown> | null | undefined} tree
 * @returns {CrewManifestRow[]}
 */
export function buildCrewManifestRows(tree) {
	const roster = tree?.GAME?.ROSTER
	let kerbals = asArray(roster, 'KERBAL')
	if (kerbals.length === 0) kerbals = asArray(roster, 'CREW')

	const assignments = kerbalAssignmentsFromVessels(tree)
	const rescueMap = recoverAssetMarkByKerbalName(tree)

	/** @type {CrewManifestRow[]} */
	const rows = []
	for (const k of kerbals) {
		if (!k || typeof k !== 'object') continue
		const kerbal = /** @type {Record<string, unknown>} */ (k)
		if (kerbal.type === 'Applicant') continue
		const name = typeof k.name === 'string' ? k.name : '—'
		const assign = assignments.get(name)
		const vessel = assign ? assign.vesselName : '—'
		const situation = assign ? assign.sit : '—'
		let body = '—'
		if (assign?.orbitRef !== undefined) {
			body = bodyNameFromOrbitRef(assign.orbitRef)
		} else if (kerbal.state === 'Available') {
			body = 'Home'
		}
		const suit = typeof kerbal.suit === 'string' && kerbal.suit.length > 0 ? kerbal.suit : '—'
		const model = parseBodyModel(kerbal)
		const bodyModel = model !== null ? { abbr: model.abbr, title: model.title } : null
		const color = model?.colorVariant ?? '—'
		const { mark, markKind } = markFromKerbal(name, kerbal, rescueMap)
		const rank = kerbalRankFromKerbal(kerbal)
		const totalXp = kerbalTotalXpFromKerbal(kerbal)
		rows.push({
			name,
			role: roleFromKerbal(kerbal),
			rank,
			totalXp,
			vessel,
			situation,
			body,
			suit,
			bodyModel,
			color,
			mark,
			markKind,
		})
	}

	rows.sort((a, b) => {
		const va = sortKeyVessel(a.vessel)
		const vb = sortKeyVessel(b.vessel)
		if (va !== vb) return va.localeCompare(vb)
		return a.name.localeCompare(b.name)
	})
	return rows
}

/**
 * @param {string} vessel
 * @returns {string}
 */
function sortKeyVessel(vessel) {
	if (vessel === '—') return '\uffff'
	return vessel
}

/**
 * @param {import('./crew-manifest-sort.util.js').CrewManifestSortSpec} primary
 * @param {import('./crew-manifest-sort.util.js').CrewManifestSortSpec} secondary
 * @param {import('../shared/table-filter.util.js').TableFilter[]} filters
 * @returns {string[]}
 */
function crewManifestMarkdownViewStateLines(primary, secondary, filters) {
	const lines = [
		'## View state',
		'',
		`- **Sort:** Primary: ${formatCrewManifestSortSpecForMarkdown(primary)}; Secondary: ${formatCrewManifestSortSpecForMarkdown(secondary)}`,
	]
	if (filters.length === 0) {
		lines.push('- **Filters:** None')
	} else {
		lines.push('- **Filters:**')
		for (const f of filters) {
			lines.push(`  - ${formatTableFilterSummary(f, CREW_MANIFEST_FILTER_COLUMNS)}`)
		}
	}
	return lines
}

/**
 * @param {CrewManifestRow[]} rows
 * @param {{
 *   primary: import('./crew-manifest-sort.util.js').CrewManifestSortSpec
 *   secondary: import('./crew-manifest-sort.util.js').CrewManifestSortSpec
 *   filters: import('../shared/table-filter.util.js').TableFilter[]
 * }} [viewState]
 * @returns {string}
 */
export function formatCrewManifestMarkdown(rows, viewState) {
	const lines = [
		'# KSP Krew Manifest Report',
		'',
	]
	if (viewState) {
		lines.push(...crewManifestMarkdownViewStateLines(
			viewState.primary,
			viewState.secondary,
			viewState.filters,
		))
		lines.push('')
	}
	lines.push(
		'Legend:',
		'',
		'- 🆘 = Needs Rescue',
		'- 🛟 = Rescued',
		'- 🗺️ = Tourist',
		'',
		'',
		'## Full Crew Table',
		'',
		'| Name | Mark | Role | Rank | Vessel | Situation | At | Suit | Model | Color |',
		'| ---    | ---  | ---  | ---  | ---    | ---       | -- | ---  | ---   | ---   |',
	)
	for (const r of rows) {
		const modelMd = r.bodyModel !== null ? r.bodyModel.abbr : '—'
		const markMd = r.mark !== null ? r.mark.emoji : '—'
		const rankMd = rankToStars(r.rank)
		const cells = [
			kerbalDisplayName(r.name),
			markMd,
			r.role,
			rankMd,
			r.vessel,
			r.situation,
			r.body,
			r.suit,
			modelMd,
			r.color,
		].map(escapeCell)
		lines.push(`| ${cells.join(' | ')} |`)
	}
	lines.push('')
	return lines.join('\n')
}

/**
 * @param {string} s
 * @returns {string}
 */
function escapeCell(s) {
	return s.replace(/\|/g, '\\|').replace(/\n/g, ' ')
}
