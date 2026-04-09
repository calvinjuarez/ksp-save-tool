import { bodyNameFromOrbitRef } from '../ksp/body.util.js'
import { parseBuild } from '../ksp/kerbal.util.js'
import { asArray } from '../save-file/save-file.util.js'

/**
 * @typedef {Object} CrewManifestBuild
 * @property {'M'|'F'} abbr
 * @property {'Masculine'|'Feminine'} title
 */

/**
 * @typedef {Object} CrewManifestRow
 * @property {string} name
 * @property {string} role
 * @property {string} vessel
 * @property {string} situation
 * @property {string} body
 * @property {string} suit
 * @property {CrewManifestBuild | null} build
 * @property {string} color
 * @property {string} status
 */

/**
 * Collect kerbal full names assigned to a vessel (walks PART trees; `crew` may be string or string[]).
 *
 * @param {unknown} vessel
 * @returns {string[]}
 */
export function collectCrewNamesFromVessel(vessel) {
	/** @type {Set<string>} */
	const names = new Set()
	/**
	 * @param {unknown} node
	 */
	function walk(node) {
		if (node === undefined || node === null) return
		if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') return
		if (Array.isArray(node)) {
			for (const item of node) walk(item)
			return
		}
		if (typeof node !== 'object') return
		for (const [k, v] of Object.entries(node)) {
			if (k === 'crew') {
				if (typeof v === 'string' && v.trim()) names.add(v.trim())
				else if (Array.isArray(v)) {
					for (const item of v) {
						if (typeof item === 'string' && item.trim()) names.add(item.trim())
					}
				}
			} else {
				walk(v)
			}
		}
	}
	walk(vessel)
	return [...names]
}

/**
 * @param {Record<string, unknown> | null | undefined} tree
 * @returns {Map<string, { vesselName: string, sit: string, orbitRef: string | undefined }>}
 */
function kerbalAssignmentsFromVessels(tree) {
	/** @type {Map<string, { vesselName: string, sit: string, orbitRef: string | undefined }>} */
	const map = new Map()
	const vessels = asArray(tree?.GAME?.FLIGHTSTATE, 'VESSEL')
	for (const vessel of vessels) {
		if (!vessel || typeof vessel !== 'object') continue
		const vesselName = typeof vessel.name === 'string' ? vessel.name : '—'
		const sit = typeof vessel.sit === 'string' ? vessel.sit : '—'
		const orbit = vessel.ORBIT
		const orbitRef =
			orbit && typeof orbit === 'object' && orbit.REF !== undefined && orbit.REF !== null
				? String(orbit.REF)
				: undefined
		for (const name of collectCrewNamesFromVessel(vessel)) {
			if (!map.has(name)) {
				map.set(name, { vesselName, sit, orbitRef })
			}
		}
	}
	return map
}

/**
 * @param {Record<string, unknown>} kerbal
 * @returns {string}
 */
function roleFromKerbal(kerbal) {
	const t = kerbal.type
	if (t === 'Tourist') return 'Tourist'
	const trait = kerbal.trait
	return typeof trait === 'string' && trait.length > 0 ? trait : '—'
}

/**
 * @param {Record<string, unknown>} kerbal
 * @returns {string}
 */
function statusFromKerbal(kerbal) {
	if (kerbal.type === 'Tourist' || kerbal.tour === 'True') return '🎟️'
	return ''
}

/**
 * @param {Record<string, unknown> | null | undefined} tree
 * @returns {CrewManifestRow[]}
 */
export function buildCrewManifestRows(tree) {
	const roster = tree?.GAME?.ROSTER
	let kerbals = asArray(roster, 'KERBAL')
	if (kerbals.length === 0) kerbals = asArray(roster, 'CREW')

	const assignments = kerbalAssignmentsFromVessels(tree)

	/** @type {CrewManifestRow[]} */
	const rows = []
	for (const k of kerbals) {
		if (!k || typeof k !== 'object') continue
		const name = typeof k.name === 'string' ? k.name : '—'
		const assign = assignments.get(name)
		const vessel = assign ? assign.vesselName : '—'
		const situation = assign ? assign.sit : '—'
		let body = '—'
		if (assign?.orbitRef !== undefined) {
			body = bodyNameFromOrbitRef(assign.orbitRef)
		} else if (k.state === 'Available') {
			body = 'Unassigned'
		}
		const kerbal = /** @type {Record<string, unknown>} */ (k)
		const suit = typeof kerbal.suit === 'string' && kerbal.suit.length > 0 ? kerbal.suit : '—'
		const comboId = typeof kerbal.comboId === 'string' ? kerbal.comboId : undefined
		const parsed = parseBuild(comboId)
		const build =
			parsed !== null ? { abbr: parsed.abbr, title: parsed.title } : null
		const color = parsed !== null ? parsed.colorVariant : '—'
		rows.push({
			name,
			role: roleFromKerbal(kerbal),
			vessel,
			situation,
			body,
			suit,
			build,
			color,
			status: statusFromKerbal(kerbal),
		})
	}

	rows.sort((a, b) => {
		const va = sortKeyVessel(a.vessel)
		const vb = sortKeyVessel(b.vessel)
		if (va !== vb) return va.localeCompare(vb)
		return a.name.localeCompare(b.name)
	})
	return rows
}

/**
 * @param {string} vessel
 * @returns {string}
 */
function sortKeyVessel(vessel) {
	if (vessel === '—') return '\uffff'
	return vessel
}

/**
 * @param {CrewManifestRow[]} rows
 * @returns {string}
 */
export function formatCrewManifestMarkdown(rows) {
	const lines = [
		'# KSP Crew Manifest Report',
		'',
		'Legend:',
		'',
		'- 🎟️ = tourist',
		'',
		'',
		'## Full Crew Table',
		'',
		'| Kerbal | Role | Vessel | Situation | Body | Suit | Build | Color | Status |',
		'| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
	]
	for (const r of rows) {
		const buildMd = r.build !== null ? r.build.abbr : '—'
		const cells = [
			r.name,
			r.role,
			r.vessel,
			r.situation,
			r.body,
			r.suit,
			buildMd,
			r.color,
			r.status,
		].map(escapeCell)
		lines.push(`| ${cells.join(' | ')} |`)
	}
	lines.push('')
	return lines.join('\n')
}

/**
 * @param {string} s
 * @returns {string}
 */
function escapeCell(s) {
	return s.replace(/\|/g, '\\|').replace(/\n/g, ' ')
}
