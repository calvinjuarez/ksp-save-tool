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
