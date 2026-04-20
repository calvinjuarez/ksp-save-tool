/**
 * Parse KSP science subject IDs and build science report rows from a ConfigNode save tree.
 */

import { CREW_MANIFEST_BODY_RANK, MOON_PARENT_BODY } from '../ksp/body-rank.const.js'
import {
	humanizeBiome,
	humanizeExperimentId,
	humanizeSituation,
	unknownProceduralObjectLabel,
} from '../ksp/science-taxonomy.util.js'
import { buildSaveDerived } from '../save-file/save-derived.util.js'
import { asArray } from '../save-file/save-file.util.js'

/** Longest-first so SrfLanded wins over Landed. */
const SCIENCE_SITUATION_TOKENS = Object.freeze(
	[
		'SrfLanded',
		'SrfSplashed',
		'InSpaceHigh',
		'InSpaceLow',
		'FlyingHigh',
		'FlyingLow',
		'Landed',
		'Splashed',
	].sort((a, b) => b.length - a.length),
)

/** Stock + common body names for prefix matching (longest first). */
const BODY_PREFIXES = Object.freeze(
	[...CREW_MANIFEST_BODY_RANK.filter((b) => b !== 'Home')]
		.slice()
		.sort((a, b) => b.length - a.length),
)

/**
 * @typedef {Object} ParsedScienceSubjectId
 * @property {string} experiment
 * @property {string} body
 * @property {string} situation
 * @property {string} biome
 */

/**
 * @param {string} id
 * @returns {ParsedScienceSubjectId | null}
 */
export function parseScienceSubjectId(id) {
	if (typeof id !== 'string' || !id.includes('@')) return null
	const at = id.indexOf('@')
	const experiment = id.slice(0, at).trim()
	const tail = id.slice(at + 1)
	if (!experiment || !tail) return null

	let rest = tail
	let body = ''
	for (const b of BODY_PREFIXES) {
		if (rest.startsWith(b)) {
			body = b
			rest = rest.slice(b.length)
			break
		}
	}
	if (!body) {
		// Unknown / mod body: take leading run of letters as best-effort
		const m = /^([A-Za-z0-9]+)/.exec(rest)
		if (!m) return null
		body = m[1]
		rest = rest.slice(body.length)
	}

	let situation = ''
	let biome = ''
	for (const sit of SCIENCE_SITUATION_TOKENS) {
		if (rest.startsWith(sit)) {
			situation = sit
			biome = rest.slice(sit.length)
			break
		}
	}
	if (!situation) {
		situation = '—'
		biome = rest
	}

	return { experiment, body, situation, biome }
}

/**
 * @param {unknown} v
 * @returns {number}
 */
function num(v) {
	if (v === undefined || v === null || v === '') return 0
	const n = Number.parseFloat(String(v))
	return Number.isFinite(n) ? n : 0
}

/**
 * @param {string} biome raw biome token from subject id (may be `—`)
 * @param {Map<string, { kind: 'asteroid' | 'comet', name?: string }>} asteroidNameByUid
 * @returns {string}
 */
export function resolveBiomeLabel(biome, asteroidNameByUid) {
	if (typeof biome !== 'string' || biome.length === 0 || biome === '—') {
		return humanizeBiome('')
	}
	const m = /^_(PotatoRoid|PotatoComet)(\d+)$/.exec(biome)
	if (m) {
		const prefix = m[1]
		const uid = m[2]
		const kindFromSubject = prefix === 'PotatoComet' ? 'comet' : 'asteroid'
		const entry = asteroidNameByUid.get(uid)
		if (entry?.name) return entry.name
		const kind = entry?.kind ?? kindFromSubject
		return kind === 'comet' ? 'Unknown comet' : 'Unknown asteroid'
	}
	if (biome.startsWith('_')) {
		return unknownProceduralObjectLabel(biome)
	}
	return humanizeBiome(biome)
}

/**
 * @typedef {Object} ScienceReportVesselRow
 * @property {string} vesselName
 * @property {number} data
 * @property {number} xmit
 */

/**
 * All numeric fields are raw IEEE-754 values from the save (or derived without rounding).
 * Use {@link formatSciDisplay} (or other formatters) only at display time.
 *
 * @typedef {Object} ScienceReportRow
 * @property {string} subjectId
 * @property {string} experiment
 * @property {string} experimentLabel short display name from experiment id
 * @property {string} experimentTitle long KSP title from save (metadata)
 * @property {string} body
 * @property {string} situation raw situation token from subject id
 * @property {string} situationLabel
 * @property {string} biome raw biome token from subject id
 * @property {string} biomeLabel
 * @property {number} earned
 * @property {number} cap
 * @property {number} remaining
 * @property {number} completionRatio `earned / cap` when cap > 0, else 0 (0..1, unrounded)
 * @property {number} onboardData
 * @property {number} onboardDataTransmissible
 * @property {number} onboardDataReturnOnly
 * @property {ScienceReportVesselRow[]} vessels
 */

/**
 * @param {Record<string, unknown> | null | undefined} tree
 * @param {import('../save-file/save-derived.util.js').SaveDerived | null | undefined} [derived] from {@link buildSaveDerived}; omit to run a local walk (tests)
 * @returns {ScienceReportRow[]}
 */
export function buildScienceReportRows(tree, derived) {
	/** @type {Map<string, { title: string, earned: number, cap: number }>} */
	const rnd = new Map()

	const scenarios = asArray(tree?.GAME, 'SCENARIO')
	for (const s of scenarios) {
		if (!s || typeof s !== 'object') continue
		if (/** @type {Record<string, unknown>} */ (s).name !== 'ResearchAndDevelopment') continue
		for (const sci of asArray(s, 'Science')) {
			if (!sci || typeof sci !== 'object') continue
			const node = /** @type {Record<string, unknown>} */ (sci)
			const id = typeof node.id === 'string' ? node.id : ''
			if (!id) continue
			rnd.set(id, {
				title: typeof node.title === 'string' ? node.title : id,
				earned: num(node.sci),
				cap: num(node.cap),
			})
		}
	}

	const d = derived ?? buildSaveDerived(tree)
	const vesselAgg = d.scienceDataBySubjectId
	const asteroidNameByUid = d.asteroidNameByUid

	/** @type {Set<string>} */
	const allIds = new Set([...rnd.keys(), ...vesselAgg.keys()])

	/** @type {ScienceReportRow[]} */
	const rows = []
	for (const subjectId of allIds) {
		const r = rnd.get(subjectId)
		const v = vesselAgg.get(subjectId)
		const earned = r?.earned ?? 0
		const cap = r?.cap ?? 0
		const remaining = cap > 0 ? Math.max(0, cap - earned) : 0
		const completionRatio = cap > 0 ? earned / cap : 0

		const parsed = parseScienceSubjectId(subjectId)
		const experiment = parsed?.experiment ?? '—'
		const body = parsed?.body ?? '—'
		const situation = parsed?.situation ?? '—'
		const biome = parsed?.biome ?? '—'

		const experimentLabel = humanizeExperimentId(experiment === '—' ? '' : experiment)
		const situationLabel = humanizeSituation(situation)
		const biomeLabel = resolveBiomeLabel(biome, asteroidNameByUid)

		let experimentTitle = r?.title ?? v?.title ?? experiment

		const onboardData = v?.data ?? 0
		const onboardDataTransmissible = v?.trans ?? 0
		const onboardDataReturnOnly = onboardData - onboardDataTransmissible

		/** @type {ScienceReportVesselRow[]} */
		const vesselRows = []
		if (v) {
			for (const [vesselName, { data, xmit }] of v.vessels) {
				vesselRows.push({ vesselName, data, xmit })
			}
			vesselRows.sort((a, b) => a.vesselName.localeCompare(b.vesselName))
		}

		rows.push({
			subjectId,
			experiment,
			experimentLabel,
			experimentTitle,
			body,
			situation,
			situationLabel,
			biome,
			biomeLabel,
			earned,
			cap,
			remaining,
			completionRatio,
			onboardData,
			onboardDataTransmissible,
			onboardDataReturnOnly,
			vessels: vesselRows,
		})
	}

	rows.sort((a, b) => {
		const ba = bodySortKey(a.body)
		const bb = bodySortKey(b.body)
		if (ba !== bb) return ba - bb
		const ea = a.experimentLabel.localeCompare(b.experimentLabel)
		if (ea !== 0) return ea
		return a.subjectId.localeCompare(b.subjectId)
	})

	return rows
}

/**
 * @param {string} body
 * @returns {number}
 */
function bodySortKey(body) {
	if (body === '—' || body === '') return Number.POSITIVE_INFINITY
	const idx = CREW_MANIFEST_BODY_RANK.indexOf(/** @type {never} */ (body))
	return idx >= 0 ? idx : Number.POSITIVE_INFINITY - 1
}

/**
 * @typedef {'ungrouped' | 'location' | 'experiment'} ScienceReportGroupBy
 */

/**
 * @typedef {Object} ScienceReportGroup
 * @property {string} key
 * @property {string} title
 * @property {string} [caption]
 * @property {boolean} [isMoon]
 * @property {ScienceReportRow[]} rows
 */

/**
 * @param {ScienceReportRow[]} rows
 * @param {ScienceReportGroupBy} groupBy
 * @returns {ScienceReportGroup[]}
 */
export function groupScienceReportRows(rows, groupBy) {
	if (groupBy === 'ungrouped') {
		return [{ key: '', title: '', rows: [...rows] }]
	}

	if (groupBy === 'location') {
		/** @type {Map<string, ScienceReportRow[]>} */
		const byBody = new Map()
		for (const r of rows) {
			const k = r.body
			const list = byBody.get(k) ?? []
			list.push(r)
			byBody.set(k, list)
		}

		/** @type {string[]} */
		const order = []
		for (const name of CREW_MANIFEST_BODY_RANK) {
			if (byBody.has(name)) order.push(name)
		}
		for (const k of byBody.keys()) {
			if (!order.includes(k)) order.push(k)
		}
		order.sort((a, b) => bodySortKey(a) - bodySortKey(b) || a.localeCompare(b))

		return order.map((body) => {
			const groupRows = byBody.get(body) ?? []
			const parent = MOON_PARENT_BODY[/** @type {keyof typeof MOON_PARENT_BODY} */ (body)]
			return {
				key: body,
				title: body,
				caption: parent ? `moon of ${parent}` : undefined,
				isMoon: Boolean(parent),
				rows: groupRows,
			}
		})
	}

	// experiment
	/** @type {Map<string, ScienceReportRow[]>} */
	const byExp = new Map()
	for (const r of rows) {
		const k = r.experiment
		const list = byExp.get(k) ?? []
		list.push(r)
		byExp.set(k, list)
	}

	const keys = [...byExp.keys()].sort((a, b) => {
		const ta = byExp.get(a)?.[0]?.experimentLabel ?? a
		const tb = byExp.get(b)?.[0]?.experimentLabel ?? b
		return ta.localeCompare(tb, undefined, { sensitivity: 'base' }) || a.localeCompare(b)
	})

	return keys.map((experiment) => ({
		key: experiment,
		title: byExp.get(experiment)?.[0]?.experimentLabel ?? experiment,
		rows: byExp.get(experiment) ?? [],
	}))
}

/**
 * Remaining sci at or below this is treated as float noise only — "Fully studied" is allowed.
 * Does not hide real trace amounts (see {@link TRACE_UNCOLLECTED_THRESHOLD}).
 */
export const REMAINING_NUMERICAL_EPS = 1e-6

/**
 * When `remaining` is positive but below this, the caption shows `< 0.1 sci uncollected`
 * instead of rounding tiny amounts to `0`.
 */
export const TRACE_UNCOLLECTED_THRESHOLD = 0.1

/**
 * True only when R&D sci has effectively reached cap (numerical zero residual).
 *
 * @param {ScienceReportRow} r
 * @returns {boolean}
 */
export function isFullyStudiedNumerically(r) {
	return r.cap > 0 && r.remaining <= REMAINING_NUMERICAL_EPS
}

/**
 * Format a science-related number for UI (rounded for readability). Not used for sort/filter.
 *
 * @param {number} n
 * @returns {string}
 */
export function formatSciDisplay(n) {
	if (!Number.isFinite(n)) return '—'
	const rounded = Math.round(n * 100) / 100
	if (Number.isInteger(rounded)) return String(rounded)
	return rounded.toFixed(2).replace(/\.?0+$/, '')
}

/**
 * @param {ScienceReportRow[]} rows
 * @returns {{ subjectCount: number, earnedSum: number, remainingSum: number, onboardMitsSum: number, distinctVesselCount: number }}
 */
export function summarizeScienceReportGroup(rows) {
	let earnedSum = 0
	let remainingSum = 0
	let onboardMitsSum = 0
	/** @type {Set<string>} */
	const vessels = new Set()
	for (const r of rows) {
		earnedSum += r.earned
		remainingSum += r.remaining
		onboardMitsSum += r.onboardData
		for (const v of r.vessels) {
			vessels.add(v.vesselName)
		}
	}
	return {
		subjectCount: rows.length,
		earnedSum,
		remainingSum,
		onboardMitsSum,
		distinctVesselCount: vessels.size,
	}
}

/**
 * @param {ScienceReportRow[]} rows
 * @returns {boolean}
 */
export function groupFullyStudiedNoOnboard(rows) {
	if (rows.length === 0) return false
	for (const r of rows) {
		if (r.onboardData > 0) return false
		if (r.cap <= 0) return false
		if (!isFullyStudiedNumerically(r)) return false
	}
	return true
}
