/**
 * Distance-from-Kerbin / solar order for stock KSP bodies; unknown and em dash sort after Home.
 * Used by Crew Manifest and Science Report grouping.
 */
export const CREW_MANIFEST_BODY_RANK = Object.freeze([
	'Kerbin',
	'Mun',
	'Minmus',
	'Sun',
	'Moho',
	'Eve',
	'Gilly',
	'Duna',
	'Ike',
	'Dres',
	'Jool',
	'Laythe',
	'Vall',
	'Tylo',
	'Bop',
	'Pol',
	'Eeloo',
	'Home',
])

/** @type {Readonly<Record<string, string>>} Moon → parent body display name (for section captions). */
export const MOON_PARENT_BODY = Object.freeze({
	Mun: 'Kerbin',
	Minmus: 'Kerbin',
	Gilly: 'Eve',
	Ike: 'Duna',
	Laythe: 'Jool',
	Vall: 'Jool',
	Tylo: 'Jool',
	Bop: 'Jool',
	Pol: 'Jool',
})
