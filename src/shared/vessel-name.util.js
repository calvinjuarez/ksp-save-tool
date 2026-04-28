/**
 * Vessel name for table display: parenthetical segments removed, whitespace collapsed.
 *
 * @param {string} name
 * @returns {string}
 */
export function vesselNameWithoutParentheticals(name) {
	const stripped = name.replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim()
	return stripped.length > 0 ? stripped : name
}

/**
 * @param {string} name
 * @returns {boolean}
 */
export function vesselNameHasStrippableParenthetical(name) {
	return vesselNameWithoutParentheticals(name) !== name
}
