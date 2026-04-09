import {
	KERBAL_CAREER_XP_BODY_ALIASES,
	KERBAL_CAREER_XP_TABLE,
} from './kerbal-career-xp.const.js'

/**
 * @typedef {import('./kerbal-career-xp.const.js').KerbalCareerXpColumn} KerbalCareerXpColumn
 */

/**
 * Normalize roster body name to a key in {@link KERBAL_CAREER_XP_TABLE}.
 *
 * @param {string} body
 * @returns {string}
 */
export function normalizeCareerXpBody(body) {
	const alias = KERBAL_CAREER_XP_BODY_ALIASES[body]
	return alias !== undefined ? alias : body
}

/**
 * Map CAREER_LOG situation string to a wiki table column.
 * Stock saves use names like `Flight`, `Suborbit`, `PlantFlag` (see wiki / game).
 *
 * @param {string} situation
 * @returns {KerbalCareerXpColumn | null}
 */
export function careerSituationToXpColumn(situation) {
	switch (situation) {
		case 'Flyby':
			return 'flyby'
		case 'Orbit':
			return 'orbit'
		case 'Flight':
		case 'Suborbit':
			return 'flight'
		case 'Land':
		case 'Splashed':
			return 'land'
		case 'PlantFlag':
			return 'plantFlag'
		case 'Escape':
			return 'orbit'
		default:
			return null
	}
}

/**
 * XP for one (situation, body) pair from the stock table; 0 if unknown or not applicable.
 *
 * @param {string} situation
 * @param {string} body
 * @returns {number}
 */
export function careerXpForSituationBody(situation, body) {
	const col = careerSituationToXpColumn(situation)
	if (col === null) return 0
	const rowKey = normalizeCareerXpBody(body)
	const row = KERBAL_CAREER_XP_TABLE[rowKey]
	if (row === undefined) return 0
	const v = row[col]
	if (v === null || v === undefined) return 0
	return v
}

/**
 * Flatten CAREER_LOG node into `Situation,Body` strings (ConfigNode may use numeric keys).
 *
 * @param {unknown} careerLog
 * @returns {string[]}
 */
export function flattenCareerLogStrings(careerLog) {
	if (careerLog === undefined || careerLog === null) return []
	if (typeof careerLog !== 'object' || Array.isArray(careerLog)) return []

	/** @type {string[]} */
	const out = []
	for (const v of Object.values(careerLog)) {
		if (Array.isArray(v)) {
			for (const item of v) {
				if (typeof item === 'string') out.push(item)
			}
		} else if (typeof v === 'string') {
			out.push(v)
		}
	}
	return out
}

/**
 * Total XP from a kerbal’s CAREER_LOG: for each celestial body, only the best (highest-XP)
 * achievement counts; those per-body maxima are summed (stock KSP behavior).
 *
 * @param {unknown} careerLog
 * @returns {number}
 */
export function xpFromCareerLog(careerLog) {
	const strings = flattenCareerLogStrings(careerLog)
	/** @type {Map<string, number>} */
	const maxByBody = new Map()
	for (const line of strings) {
		const comma = line.indexOf(',')
		if (comma <= 0) continue
		const situation = line.slice(0, comma).trim()
		const body = line.slice(comma + 1).trim()
		if (situation.length === 0 || body.length === 0) continue
		const xp = careerXpForSituationBody(situation, body)
		const bKey = normalizeCareerXpBody(body)
		const prev = maxByBody.get(bKey) ?? 0
		if (xp > prev) maxByBody.set(bKey, xp)
	}
	let total = 0
	for (const x of maxByBody.values()) total += x
	return total
}
