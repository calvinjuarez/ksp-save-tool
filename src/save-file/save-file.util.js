/**
 * Derive display fields from a parsed ConfigNode tree (typical `persistent.sfs` shape).
 *
 * @param {Record<string, unknown> | null | undefined} data
 */
export function gameTitleFromTree(data) {
	const title = data?.GAME?.Title
	return typeof title === 'string' && title.length > 0 ? title : '—'
}

/**
 * @param {unknown} node
 * @param {string} key
 * @returns {unknown[]}
 */
export function asArray(node, key) {
	if (!node || typeof node !== 'object') return []
	const v = /** @type {Record<string, unknown>} */ (node)[key]
	if (v === undefined || v === null) return []
	return Array.isArray(v) ? v : [v]
}

/**
 * @param {unknown} node
 * @returns {number}
 */
function countKeyedNodes(node, key) {
	return asArray(node, key).length
}

/**
 * @param {Record<string, unknown> | null | undefined} data
 */
export function vesselCountFromTree(data) {
	return countKeyedNodes(data?.GAME?.FLIGHTSTATE, 'VESSEL')
}

/**
 * Kerbals in the astronaut roster (`ROSTER/KERBAL` in modern saves, `ROSTER/CREW` in some minimal / older shapes).
 *
 * @param {Record<string, unknown> | null | undefined} data
 */
export function crewCountFromTree(data) {
	const roster = data?.GAME?.ROSTER
	const kerbals = countKeyedNodes(roster, 'KERBAL')
	if (kerbals > 0) return kerbals
	return countKeyedNodes(roster, 'CREW')
}

/**
 * @param {Record<string, unknown> | null | undefined} data
 * @param {string} scenarioName
 * @param {string} fieldKey
 * @returns {number | null}
 */
function scenarioFieldNumber(data, scenarioName, fieldKey) {
	const scenarios = asArray(data?.GAME, 'SCENARIO')
	for (const s of scenarios) {
		if (!s || typeof s !== 'object') continue
		const rec = /** @type {Record<string, unknown>} */ (s)
		if (rec.name !== scenarioName) continue
		const v = rec[fieldKey]
		if (v === undefined || v === null || v === '') return null
		const n = Number.parseFloat(String(v))
		return Number.isFinite(n) ? n : null
	}
	return null
}

/**
 * @param {Record<string, unknown> | null | undefined} data
 */
export function scienceFromTree(data) {
	return scenarioFieldNumber(data, 'ResearchAndDevelopment', 'sci')
}

/**
 * @param {Record<string, unknown> | null | undefined} data
 */
export function reputationFromTree(data) {
	return scenarioFieldNumber(data, 'Reputation', 'rep')
}

/**
 * @param {Record<string, unknown> | null | undefined} data
 */
export function fundsFromTree(data) {
	return scenarioFieldNumber(data, 'Funding', 'funds')
}
