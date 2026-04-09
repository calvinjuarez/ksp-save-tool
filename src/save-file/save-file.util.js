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
