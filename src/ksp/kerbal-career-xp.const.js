/**
 * Stock KSP 1 experience (XP) per celestial body and achievement type.
 * Values match the wiki “Experience” table (Fly by / Orbit / Flight / Land / Plant flag);
 * see https://wiki.kerbalspaceprogram.com/wiki/Experience
 *
 * `null` means that achievement does not apply on that body (— in the wiki).
 */

/**
 * @typedef {'flyby'|'orbit'|'flight'|'land'|'plantFlag'} KerbalCareerXpColumn
 */

/**
 * @typedef {Record<KerbalCareerXpColumn, number | null>} KerbalCareerXpRow
 */

/** @type {Record<string, KerbalCareerXpRow>} */
export const KERBAL_CAREER_XP_TABLE = {
	Kerbol: { flyby: 4, orbit: 6, flight: null, land: null, plantFlag: null },
	Moho: { flyby: 7, orbit: 10.5, flight: null, land: 16.1, plantFlag: 17.5 },
	Eve: { flyby: 5, orbit: 7.5, flight: 10, land: 11.5, plantFlag: 12.5 },
	Gilly: { flyby: 6, orbit: 9, flight: null, land: 13.8, plantFlag: 15 },
	Kerbin: { flyby: 2, orbit: 2, flight: 1, land: 0, plantFlag: 0 },
	Mun: { flyby: 2, orbit: 3, flight: null, land: 4.6, plantFlag: 5 },
	Minmus: { flyby: 2.5, orbit: 3.75, flight: null, land: 5.75, plantFlag: 6.25 },
	Duna: { flyby: 5, orbit: 7.5, flight: 10, land: 11.5, plantFlag: 12.5 },
	Ike: { flyby: 5, orbit: 7.5, flight: null, land: 11.5, plantFlag: 12.5 },
	Dres: { flyby: 6, orbit: 9, flight: null, land: 13.8, plantFlag: 15 },
	Jool: { flyby: 6, orbit: 9, flight: 12, land: null, plantFlag: null },
	Laythe: { flyby: 8, orbit: 12, flight: 16, land: 18.4, plantFlag: 20 },
	Vall: { flyby: 8, orbit: 12, flight: null, land: 18.4, plantFlag: 20 },
	Tylo: { flyby: 8, orbit: 12, flight: null, land: 18.4, plantFlag: 20 },
	Bop: { flyby: 8, orbit: 12, flight: null, land: 18.4, plantFlag: 20 },
	Pol: { flyby: 8, orbit: 12, flight: null, land: 18.4, plantFlag: 20 },
	Eeloo: { flyby: 10, orbit: 15, flight: null, land: 23, plantFlag: 25 },
}

/** Save files use `Sun`; wiki lists the central star as Kerbol. */
export const KERBAL_CAREER_XP_BODY_ALIASES = {
	Sun: 'Kerbol',
}
