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
 * Preposition to use when composing a "situation + body" phrase.
 * Stable orbit and escape trajectories read without one ("Orbiting Minmus");
 * surface, atmosphere, and sub-orbital flight use a connector ("Landed on
 * Minmus", "Flying over Kerbin", "Sub-orbital over Mun"). Missing entries
 * fall back to no preposition.
 *
 * @type {Readonly<Record<string, string>>}
 */
const VESSEL_SITUATION_LOCATION_PREPOSITION = Object.freeze({
	LANDED: 'on',
	SPLASHED: 'on',
	PRELAUNCH: 'on',
	FLYING: 'over',
	SUB_ORBITAL: 'over',
	ORBITING: '',
	ESCAPING: '',
	DOCKED: 'at',
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

/**
 * Compose a natural-language "situation at body" phrase from a raw stock
 * vessel situation token and a body name (e.g. `LANDED` + `Minmus` →
 * `Landed on Minmus`, `ORBITING` + `Minmus` → `Orbiting Minmus`). Falls
 * back to just the situation label when no body is supplied.
 *
 * @param {string} sit
 * @param {string | null | undefined} body
 * @returns {string}
 */
export function formatVesselSituationLocation(sit, body) {
	const situation = humanizeVesselSituation(sit)
	if (typeof body !== 'string' || body.length === 0 || body === '—') return situation
	const prep = VESSEL_SITUATION_LOCATION_PREPOSITION[sit] ?? ''
	return prep ? `${situation} ${prep} ${body}` : `${situation} ${body}`
}
