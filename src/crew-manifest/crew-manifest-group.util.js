import { MOON_PARENT_BODY, STOCK_BODY_ORDER } from '../ksp/body-rank.const.js'
import { bodySortKey } from '../ksp/body-rank.util.js'
import { humanizeVesselSituation } from '../ksp/vessel-situation.util.js'
import { CREW_MANIFEST_MARKS } from './crew-manifest-mark.const.js'

/**
 * @typedef {import('./crew-manifest.util.js').CrewManifestRow} CrewManifestRow
 */

/**
 * @typedef {'ungrouped' | 'location' | 'vessel'} CrewManifestGroupBy
 */

/**
 * @typedef {Object} CrewManifestGroup
 * @property {string} key
 * @property {string} title
 * @property {string} [caption]
 * @property {boolean} [isMoon]
 * @property {boolean} [isUnassigned]
 * @property {CrewManifestRow[]} rows
 */

/**
 * @typedef {Object} CrewManifestGroupSummary
 * @property {number} kerbalCount
 * @property {Record<string, number>} byRole
 * @property {number} vesselCount
 * @property {number} bodyCount
 * @property {number} situationCount
 * @property {string | null} uniqueBody body shared by every non-unassigned row, else `null`
 * @property {string | null} uniqueSituation situation shared by every non-unassigned row, else `null`
 * @property {{ openRescue: number, rescued: number, tourist: number }} marks
 * @property {number} avgRank
 * @property {number} maxRank
 */

/** @type {Readonly<Record<CrewManifestGroupBy, string>>} */
export const CREW_MANIFEST_GROUP_BY_LABELS = Object.freeze({
	ungrouped: 'Ungrouped',
	location: 'Location',
	vessel: 'Vessel',
})

const DASH_LAST = '\uffff'

/**
 * Order used when a vessel has multiple mark kinds present. Most urgent
 * (open rescue) first, ending with already-rescued.
 *
 * @type {import('./crew-manifest-mark.const.js').CrewManifestMarkKind[]}
 */
const MARK_SUFFIX_ORDER = ['openRescue', 'tourist', 'rescued']

/**
 * @param {string} s
 * @returns {string}
 */
function vesselSortKey(s) {
	return s === '—' ? DASH_LAST : s
}

/**
 * @param {string} role
 * @param {number} count
 * @returns {string}
 */
function roleCountPhrase(role, count) {
	const lower = role.toLowerCase()
	const noun = count === 1 ? lower : `${lower}s`
	return `${count} ${noun}`
}

/**
 * @param {CrewManifestRow[]} rows
 * @returns {CrewManifestGroupSummary}
 */
export function summarizeCrewManifestGroup(rows) {
	/** @type {Record<string, number>} */
	const byRole = {}
	/** @type {Set<string>} */
	const vessels = new Set()
	/** @type {Set<string>} */
	const bodies = new Set()
	/** @type {Set<string>} */
	const situations = new Set()
	let openRescue = 0
	let rescued = 0
	let tourist = 0
	let rankSum = 0
	let maxRank = 0

	for (const r of rows) {
		byRole[r.role] = (byRole[r.role] ?? 0) + 1
		if (r.vessel !== '—') vessels.add(r.vessel)
		if (r.body !== '—') bodies.add(r.body)
		if (r.situation !== '—') situations.add(r.situation)
		if (r.markKind === 'openRescue') openRescue++
		else if (r.markKind === 'rescued') rescued++
		else if (r.markKind === 'tourist') tourist++
		rankSum += r.rank
		maxRank = Math.max(maxRank, r.rank)
	}

	return {
		kerbalCount: rows.length,
		byRole,
		vesselCount: vessels.size,
		bodyCount: bodies.size,
		situationCount: situations.size,
		uniqueBody: bodies.size === 1 ? /** @type {string} */ ([...bodies][0]) : null,
		uniqueSituation: situations.size === 1 ? /** @type {string} */ ([...situations][0]) : null,
		marks: { openRescue, rescued, tourist },
		avgRank: rows.length > 0 ? rankSum / rows.length : 0,
		maxRank,
	}
}

/**
 * @param {CrewManifestGroupSummary} summary
 * @param {CrewManifestGroupBy} groupBy
 * @returns {string}
 */
export function formatCrewManifestGroupSummary(summary, groupBy) {
	if (summary.kerbalCount === 0) return ''

	/** @type {string[]} */
	const parts = []

	if (groupBy === 'vessel' && summary.uniqueSituation && summary.uniqueBody) {
		parts.push(`${humanizeVesselSituation(summary.uniqueSituation)} ${summary.uniqueBody}`)
	}

	parts.push(
		`${summary.kerbalCount} kerbal${summary.kerbalCount === 1 ? '' : 's'}`,
	)

	const roleEntries = Object.entries(summary.byRole).sort((a, b) => {
		const d = b[1] - a[1]
		if (d !== 0) return d
		return a[0].localeCompare(b[0], undefined, { sensitivity: 'base' })
	})
	for (const [role, count] of roleEntries) {
		parts.push(roleCountPhrase(role, count))
	}

	const avgRounded = Math.round(summary.avgRank * 10) / 10
	const avgStr = Number.isInteger(avgRounded) ? String(avgRounded) : avgRounded.toFixed(1)
	parts.push(`avg ${avgStr}★`)

	if (groupBy === 'location' && summary.vesselCount > 0) {
		parts.push(
			`${summary.vesselCount} vessel${summary.vesselCount === 1 ? '' : 's'}`,
		)
	}
	if (groupBy === 'vessel' && summary.bodyCount > 1) {
		parts.push(
			`${summary.bodyCount} locations`,
		)
	}

	return parts.join(' · ')
}

/**
 * Emoji suffix string for a group heading, surfacing any rescue/tourist marks
 * present on its crew. Emojis are space-separated and ordered by urgency.
 * Returns an empty string when no marks are present.
 *
 * @param {CrewManifestGroupSummary} summary
 * @returns {string}
 */
export function formatCrewManifestMarksEmojiSuffix(summary) {
	/** @type {string[]} */
	const emojis = []
	for (const kind of MARK_SUFFIX_ORDER) {
		if (summary.marks[kind] > 0) emojis.push(CREW_MANIFEST_MARKS[kind].emoji)
	}
	return emojis.join(' ')
}

/**
 * @param {CrewManifestRow[]} rows
 * @param {CrewManifestGroupBy} groupBy
 * @returns {CrewManifestGroup[]}
 */
export function groupCrewManifestRows(rows, groupBy) {
	if (groupBy === 'ungrouped') {
		return [{ key: '', title: '', rows: [...rows] }]
	}

	if (groupBy === 'location') {
		/** @type {Map<string, CrewManifestRow[]>} */
		const byBody = new Map()
		for (const r of rows) {
			const k = r.body
			const list = byBody.get(k) ?? []
			list.push(r)
			byBody.set(k, list)
		}

		/** @type {string[]} */
		const order = []
		for (const name of STOCK_BODY_ORDER) {
			if (byBody.has(name)) order.push(name)
		}
		for (const k of byBody.keys()) {
			if (!order.includes(k)) order.push(k)
		}
		order.sort((a, b) => {
			const ua = a === '—'
			const ub = b === '—'
			if (ua && !ub) return 1
			if (!ua && ub) return -1
			if (ua && ub) return 0
			return bodySortKey(a) - bodySortKey(b) || a.localeCompare(b)
		})

		return order.map((body) => {
			const groupRows = byBody.get(body) ?? []
			const isUnassigned = body === '—'
			if (isUnassigned) {
				return {
					key: body,
					title: 'Unassigned',
					isUnassigned: true,
					rows: groupRows,
				}
			}
			const parent = MOON_PARENT_BODY[/** @type {keyof typeof MOON_PARENT_BODY} */ (body)]
			return {
				key: body,
				title: body,
				caption: parent ? `Moon of ${parent}` : undefined,
				isMoon: Boolean(parent),
				rows: groupRows,
			}
		})
	}

	// vessel
	/** @type {Map<string, CrewManifestRow[]>} */
	const byVessel = new Map()
	for (const r of rows) {
		const k = r.vessel
		const list = byVessel.get(k) ?? []
		list.push(r)
		byVessel.set(k, list)
	}

	const keys = [...byVessel.keys()].sort((a, b) =>
		vesselSortKey(a).localeCompare(vesselSortKey(b), undefined, {
			numeric: true,
			sensitivity: 'base',
		}),
	)

	return keys.map((vessel) => {
		const groupRows = byVessel.get(vessel) ?? []
		const isUnassigned = vessel === '—'
		return {
			key: vessel,
			title: isUnassigned ? 'Unassigned' : vessel,
			isUnassigned,
			rows: groupRows,
		}
	})
}
