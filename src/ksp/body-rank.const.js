/**
 * Distance-from-Kerbin / solar order for stock KSP bodies; unknown and em dash sort after Home.
 * Consumed by Crew Manifest, Science Report, and body-typed table filters.
 */
export const STOCK_BODY_ORDER = Object.freeze([
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
