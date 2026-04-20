import { STOCK_BODY_ORDER } from './body-rank.const.js'

/**
 * Sort key for celestial body names: stock bodies first in
 * {@link STOCK_BODY_ORDER} order; unknown/mod bodies and em dash sort last.
 * Callers apply an alphabetical tiebreaker for ties.
 *
 * @param {string} body
 * @returns {number}
 */
export function bodySortKey(body) {
	if (body === '—' || body === '') return Number.POSITIVE_INFINITY
	const idx = STOCK_BODY_ORDER.indexOf(/** @type {never} */ (body))
	return idx >= 0 ? idx : Number.POSITIVE_INFINITY
}

/**
 * Full ordering used by body-typed table columns and their filters: stock
 * body order first, then alphabetical for ties. Em dash always sorts last.
 *
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function compareBodyNames(a, b) {
	const rankDiff = bodySortKey(a) - bodySortKey(b)
	if (rankDiff !== 0) return rankDiff
	const ka = a === '—' ? '\uffff' : a
	const kb = b === '—' ? '\uffff' : b
	return ka.localeCompare(kb, undefined, { numeric: true, sensitivity: 'base' })
}
