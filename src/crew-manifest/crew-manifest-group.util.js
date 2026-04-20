import { MOON_PARENT_BODY, STOCK_BODY_ORDER } from '../ksp/body-rank.const.js'
import { bodySortKey } from '../ksp/body-rank.util.js'

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
	let openRescue = 0
	let rescued = 0
	let tourist = 0
	let rankSum = 0
	let maxRank = 0

	for (const r of rows) {
		byRole[r.role] = (byRole[r.role] ?? 0) + 1
		if (r.vessel !== '—') vessels.add(r.vessel)
		if (r.body !== '—') bodies.add(r.body)
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

	const parts = [
		`${summary.kerbalCount} kerbal${summary.kerbalCount === 1 ? '' : 's'}`,
	]

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

	if (summary.marks.openRescue > 0) {
		const n = summary.marks.openRescue
		parts.push(`${n} rescue${n === 1 ? '' : 's'}`)
	}

	if (summary.marks.tourist > 0) {
		parts.push(
			`${summary.marks.tourist} tourist${summary.marks.tourist === 1 ? '' : 's'}`,
		)
	}

	return parts.join(' · ')
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
