/**
 * Star rank display and filter labels for crew manifest (KSP 1: 0–5 stars).
 */

/** Stored enum values for rank filters; matches {@link rankToStars} tiers. */
/** @type {readonly string[]} */
export const CREW_MANIFEST_RANK_ENUM_VALUES = Object.freeze(['0', '1', '2', '3', '4', '5'])

/**
 * @param {number} rank
 * @returns {string}
 */
export function rankToStars(rank) {
	const r = Math.min(5, Math.max(0, rank))
	if (r === 0) return '☆'
	return '★'.repeat(r)
}

/**
 * Checkbox / pill labels for rank enum filters (same stars as the table).
 *
 * @param {string} storedValue
 * @returns {string}
 */
export function crewManifestRankEnumOptionLabel(storedValue) {
	const n = Number.parseInt(storedValue, 10)
	if (!Number.isFinite(n) || n < 0 || n > 5) return storedValue
	return rankToStars(n)
}
