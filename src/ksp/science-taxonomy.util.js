/**
 * Human-readable labels for stock KSP science experiment ids, situations, and biome tokens.
 */

/** @type {Readonly<Record<string, string>>} */
const STOCK_EXPERIMENT_LABEL = Object.freeze({
	crewReport: 'Crew Report',
	evaReport: 'EVA Report',
	evaScience: 'EVA Science',
	surfaceSample: 'Surface Sample',
	mysteryGoo: 'Mystery Goo',
	mobileMaterialsLab: 'Materials Study',
	temperatureScan: 'Temperature Scan',
	barometerScan: 'Atmospheric Pressure Scan',
	seismicScan: 'Seismic Scan',
	gravityScan: 'Gravity Scan',
	atmosphereAnalysis: 'Atmosphere Analysis',
	infraredTelescope: 'Infrared Telescope',
	magnetometer: 'Magnetometer',
	ROCScience: 'ROC Science',
})

/** @type {Readonly<Record<string, string>>} */
const SITUATION_LABEL = Object.freeze({
	Landed: 'Landed',
	SrfLanded: 'Landed',
	Splashed: 'Splashed',
	SrfSplashed: 'Splashed',
	FlyingLow: 'Low Atmosphere',
	FlyingHigh: 'High Atmosphere',
	InSpaceLow: 'Low Orbit',
	InSpaceHigh: 'High Orbit',
})

/**
 * Short experiment name from the `experiment` portion of a subject id (e.g. `barometerScan`).
 *
 * @param {string} id
 * @returns {string}
 */
export function humanizeExperimentId(id) {
	if (typeof id !== 'string' || id.length === 0) return '—'
	const mapped = STOCK_EXPERIMENT_LABEL[id]
	if (mapped !== undefined) return mapped
	return camelCaseToWords(id)
}

/**
 * @param {string} s
 * @returns {string}
 */
function camelCaseToWords(s) {
	const spaced = s.replace(/([a-z])([A-Z])/g, '$1 $2')
	const parts = spaced.split(/[\s_]+/).filter(Boolean)
	if (parts.length === 0) return s
	return parts.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
}

/**
 * Human-readable flight situation from the raw subject-id token.
 *
 * @param {string} sit
 * @returns {string}
 */
export function humanizeSituation(sit) {
	if (typeof sit !== 'string' || sit.length === 0 || sit === '—') return '—'
	const mapped = SITUATION_LABEL[sit]
	if (mapped !== undefined) return mapped
	return sit
}

/**
 * Insert spaces into PascalCase biome tokens (e.g. `SouthernIceShelf` → `Southern Ice Shelf`).
 * Acronym runs like `SPH`, `KSC` stay intact.
 *
 * @param {string} biome
 * @returns {string}
 */
export function humanizeBiome(biome) {
	if (typeof biome !== 'string' || biome.length === 0) return '—'
	return biome.replace(/([a-z])([A-Z])/g, '$1 $2')
}

/**
 * Fallback label when a procedural object token (e.g. `Potato*` suffix in science subject ids)
 * is not in the recognized kind map and no display name was resolved from the save.
 *
 * @param {string} theId full raw token for traceability (e.g. `_PotatoRoid1617243892`)
 * @returns {string}
 */
export function unknownProceduralObjectLabel(theId) {
	if (typeof theId !== 'string' || theId.length === 0) return 'Unknown object (—)'
	return `Unknown object (${theId})`
}
