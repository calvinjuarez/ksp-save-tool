import { bodyNameFromOrbitRef } from '../ksp/body.util.js'
import { recoverAssetMarkByKerbalName } from '../ksp/contract-rescue.util.js'
import {
	kerbalDisplayName,
	kerbalRankFromKerbal,
	kerbalTotalXpFromKerbal,
	parseBodyModel,
} from '../ksp/kerbal.util.js'
import { humanizeVesselSituation } from '../ksp/vessel-situation.util.js'
import { formatTableFilterSummary } from '../shared/table-filter.util.js'
import { buildSaveDerived } from '../save-file/save-derived.util.js'
import { asArray } from '../save-file/save-file.util.js'
import { CREW_MANIFEST_FILTER_COLUMNS } from './crew-manifest-filter.const.js'
import {
	CREW_MANIFEST_GROUP_BY_LABELS,
	formatCrewManifestGroupSummary,
	formatCrewManifestMarksEmojiSuffix,
	groupCrewManifestRows,
	summarizeCrewManifestGroup,
} from './crew-manifest-group.util.js'
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
 * Natural-language label for career rank + XP (tooltip and aria-label).
 * Omits a "Rank" prefix when the table column already supplies that heading.
 * Star count matches {@link rankToStars} tiers (0–5).
 *
 * @param {number} rank
 * @param {number} totalXp
 * @returns {string}
 */
export function formatCrewManifestRankTooltipLabel(rank, totalXp) {
	const n = Number(rank)
	const r = Number.isFinite(n) ? Math.min(5, Math.max(0, Math.trunc(n))) : 0
	const xpStr = formatTotalXpDisplay(totalXp)
	if (r === 0) {
		return `No stars (${xpStr} XP)`
	}
	if (r === 1) {
		return `1 star (${xpStr} XP)`
	}
	return `${r} stars (${xpStr} XP)`
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
 * @param {import('../save-file/save-derived.util.js').SaveDerived | null | undefined} [derived] from {@link buildSaveDerived}; omit to run a local walk (tests)
 * @returns {CrewManifestRow[]}
 */
export function buildCrewManifestRows(tree, derived) {
	const roster = tree?.GAME?.ROSTER
	let kerbals = asArray(roster, 'KERBAL')
	if (kerbals.length === 0) kerbals = asArray(roster, 'CREW')

	const d = derived ?? buildSaveDerived(tree)
	const assignments = d.kerbalAssignmentsByName
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
 * @param {import('./crew-manifest-group.util.js').CrewManifestGroupBy} [groupBy]
 * @returns {string[]}
 */
function crewManifestMarkdownViewStateLines(primary, secondary, filters, groupBy = 'ungrouped') {
	const lines = [
		'## View state',
		'',
		`- **Sort:** Primary: ${formatCrewManifestSortSpecForMarkdown(primary)}; Secondary: ${formatCrewManifestSortSpecForMarkdown(secondary)}`,
		`- **Group by:** ${CREW_MANIFEST_GROUP_BY_LABELS[groupBy]}`,
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
 * @param {CrewManifestRow} r
 * @param {boolean} hideVessel
 * @param {boolean} hideSituation
 * @param {boolean} hideBody
 * @returns {string}
 */
function crewManifestMarkdownTableRow(r, hideVessel, hideSituation, hideBody) {
	const modelMd = r.bodyModel !== null ? r.bodyModel.abbr : '—'
	const markMd = r.mark !== null ? r.mark.emoji : '—'
	const rankMd = rankToStars(r.rank)
	/** @type {string[]} */
	const cells = [
		kerbalDisplayName(r.name),
		markMd,
		r.role,
		rankMd,
	]
	if (!hideVessel) cells.push(r.vessel)
	if (!hideSituation) cells.push(humanizeVesselSituation(r.situation))
	if (!hideBody) cells.push(r.body)
	cells.push(r.suit, modelMd, r.color)
	return `| ${cells.map(escapeCell).join(' | ')} |`
}

/**
 * @param {CrewManifestRow[]} rows
 * @param {boolean} hideVessel
 * @param {boolean} hideSituation
 * @param {boolean} hideBody
 * @returns {string[]}
 */
function crewManifestMarkdownTableLines(rows, hideVessel, hideSituation, hideBody) {
	/** @type {string[]} */
	const head = ['Name', 'Mark', 'Role', 'Rank']
	if (!hideVessel) head.push('Vessel')
	if (!hideSituation) head.push('Situation')
	if (!hideBody) head.push('Location')
	head.push('Suit', 'Model', 'Color')

	const sep = head.map(() => '---')
	const lines = [
		`| ${head.join(' | ')} |`,
		`| ${sep.join(' | ')} |`,
	]
	for (const r of rows) {
		lines.push(crewManifestMarkdownTableRow(r, hideVessel, hideSituation, hideBody))
	}
	return lines
}

/**
 * @param {CrewManifestRow[]} rows
 * @param {{
 *   primary: import('./crew-manifest-sort.util.js').CrewManifestSortSpec
 *   secondary: import('./crew-manifest-sort.util.js').CrewManifestSortSpec
 *   filters: import('../shared/table-filter.util.js').TableFilter[]
 *   groupBy?: import('./crew-manifest-group.util.js').CrewManifestGroupBy
 * }} [viewState]
 * @returns {string}
 */
export function formatCrewManifestMarkdown(rows, viewState) {
	const lines = [
		'# KSP Krew Manifest Report',
		'',
	]
	const groupBy = viewState?.groupBy ?? 'ungrouped'
	if (viewState) {
		lines.push(...crewManifestMarkdownViewStateLines(
			viewState.primary,
			viewState.secondary,
			viewState.filters,
			groupBy,
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
	)

	if (groupBy !== 'ungrouped') {
		const groups = groupCrewManifestRows(rows, groupBy)
		const hideVessel = groupBy === 'vessel'
		const hideSituation = groupBy === 'vessel'
		const hideBody = groupBy === 'location' || groupBy === 'vessel'
		for (const g of groups) {
			const summaryObj = summarizeCrewManifestGroup(g.rows)
			const suffix = g.isUnassigned
				? ''
				: formatCrewManifestMarksEmojiSuffix(summaryObj)
			const heading = suffix ? `${escapeCell(g.title)} ${suffix}` : escapeCell(g.title)
			lines.push(`### ${heading}`, '')
			if (g.caption) {
				lines.push(`*${escapeCell(g.caption)}*`, '')
			}
			const summary = formatCrewManifestGroupSummary(summaryObj, groupBy)
			if (summary) lines.push(summary, '')
			lines.push(...crewManifestMarkdownTableLines(g.rows, hideVessel, hideSituation, hideBody), '')
		}
		return lines.join('\n')
	}

	lines.push('## Full Crew Table', '', ...crewManifestMarkdownTableLines(rows, false, false, false), '')
	return lines.join('\n')
}

/**
 * @param {string} s
 * @returns {string}
 */
function escapeCell(s) {
	return s.replace(/\|/g, '\\|').replace(/\n/g, ' ')
}
