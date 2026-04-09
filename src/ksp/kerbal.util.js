/**
 * Kerbal / roster helpers: pure parsing of fields that appear on `KERBAL` nodes in saves.
 * Add new kerbal-specific parsers here rather than new `src/ksp/*.util.js` files unless
 * the logic is clearly a different domain (e.g. vessel parts).
 *
 * Suit `comboId` format follows game definitions (see SUITCOMBOS.cfg); color names are
 * not in saves—we expose the raw variant number until mapped.
 */

/**
 * @typedef {Object} ParsedBuild
 * @property {'M'|'F'} abbr
 * @property {'Masculine'|'Feminine'} title
 * @property {string} colorVariant
 */

/**
 * @param {string | undefined} comboId
 * @returns {ParsedBuild | null}
 */
export function parseBuild(comboId) {
	if (typeof comboId !== 'string' || comboId.length === 0) return null
	const m = /^(\w+)_(male|female)_(\d+)$/.exec(comboId)
	if (!m) return null
	const gender = m[2]
	const colorVariant = m[3]
	if (gender === 'male') {
		return { abbr: 'M', title: 'Masculine', colorVariant }
	}
	if (gender === 'female') {
		return { abbr: 'F', title: 'Feminine', colorVariant }
	}
	return null
}
