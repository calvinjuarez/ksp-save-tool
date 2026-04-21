/**
 * Human-readable labels for stock KSP vessel situation tokens (as stored on
 * `VESSEL.sit`). Distinct from the science-subject situation tokens handled in
 * {@link ./science-taxonomy.util.js}.
 */

/** @type {Readonly<Record<string, string>>} */
const VESSEL_SITUATION_LABEL = Object.freeze({
	LANDED: 'Landed',
	SPLASHED: 'Splashed',
	PRELAUNCH: 'Pre-launch',
	FLYING: 'Flying',
	SUB_ORBITAL: 'Sub-orbital',
	ORBITING: 'Orbiting',
	ESCAPING: 'Escaping',
	DOCKED: 'Docked',
})

/**
 * Human-readable label for a stock KSP vessel situation token.
 * Falls back to the raw token (with underscores turned into spaces and
 * sentence-cased) when not recognized.
 *
 * @param {string} sit
 * @returns {string}
 */
export function humanizeVesselSituation(sit) {
	if (typeof sit !== 'string' || sit.length === 0 || sit === '—') return '—'
	const mapped = VESSEL_SITUATION_LABEL[sit]
	if (mapped !== undefined) return mapped
	return sit
		.split('_')
		.filter(Boolean)
		.map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase()))
		.join(' ')
}
