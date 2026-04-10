/**
 * @typedef {Object} CrewManifestMark
 * @property {string} emoji
 * @property {string} title
 */

/**
 * @typedef {'openRescue'|'rescued'|'tourist'} CrewManifestMarkKind
 */

/** @type {Record<CrewManifestMarkKind, CrewManifestMark>} */
export const CREW_MANIFEST_MARKS = {
	openRescue: {
		emoji: '🆘',
		title: 'Needs Rescue',
	},
	rescued: {
		emoji: '🛟',
		title: 'Rescued',
	},
	tourist: {
		emoji: '🗺️',
		title: 'Tourist',
	},
}

/**
 * @param {CrewManifestMarkKind} kind
 * @returns {CrewManifestMark}
 */
export function crewManifestMark(kind) {
	return CREW_MANIFEST_MARKS[kind]
}

/**
 * Labels for table filter enum checkboxes and filter pills (emoji + title).
 *
 * @param {string} storedValue
 * @returns {string}
 */
export function crewManifestMarkEnumOptionLabel(storedValue) {
	const m = CREW_MANIFEST_MARKS[/** @type {keyof typeof CREW_MANIFEST_MARKS} */ (storedValue)]
	if (m) return `${m.emoji} ${m.title}`
	return storedValue
}
