/**
 * Stock KSP 1.12.x `ORBIT.REF` → celestial body display name.
 * REF is the flight-global body index; modded installs may not match.
 *
 * @see https://gaming.stackexchange.com/questions/343816/ids-of-celestial-bodies-in-the-persistent-sfs-file
 */

/** @type {Readonly<Record<number, string>>} */
const STOCK_1_12_BODY_BY_ORBIT_REF = Object.freeze({
	0: 'Sun',
	1: 'Kerbin',
	2: 'Mun',
	3: 'Minmus',
	4: 'Moho',
	5: 'Eve',
	6: 'Duna',
	7: 'Ike',
	8: 'Jool',
	9: 'Laythe',
	10: 'Vall',
	11: 'Bop',
	12: 'Tylo',
	13: 'Gilly',
	14: 'Pol',
	15: 'Dres',
	16: 'Eeloo',
})

/**
 * @param {string | number | undefined | null} ref ORBIT.REF from save (string in ConfigNode)
 * @returns {string}
 */
export function bodyNameFromOrbitRef(ref) {
	if (ref === undefined || ref === null || ref === '') return '—'
	const n = typeof ref === 'number' ? ref : Number.parseInt(String(ref), 10)
	if (Number.isNaN(n)) return `— (${String(ref)})`
	const name = STOCK_1_12_BODY_BY_ORBIT_REF[/** @type {keyof typeof STOCK_1_12_BODY_BY_ORBIT_REF} */ (n)]
	return name ?? `Unknown (REF ${n})`
}
