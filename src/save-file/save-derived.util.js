/**
 * Single-pass walks of `GAME/FLIGHTSTATE/VESSEL` to build LUTs for science, crew, and procedural bodies.
 */

import { asArray } from './save-file.util.js'

/**
 * @typedef {'asteroid' | 'comet'} ProceduralBodyKind
 */

/**
 * @typedef {Object} ProceduralBodyEntry
 * @property {ProceduralBodyKind} kind
 * @property {string} [name] display name from save when present
 */

/**
 * @typedef {Object} SaveDerived
 * @property {Map<string, ProceduralBodyEntry>} asteroidNameByUid keyed by part `uid` string
 * @property {Map<string, { data: number, trans: number, title: string, vessels: Map<string, { data: number, xmit: number }> }>} scienceDataBySubjectId
 * @property {Map<string, { vesselName: string, sit: string, orbitRef: string | undefined }>} kerbalAssignmentsByName
 */

/** @type {Readonly<Record<string, ProceduralBodyKind>>} */
export const POTATO_PART_TO_KIND = Object.freeze({
	PotatoRoid: 'asteroid',
	PotatoComet: 'comet',
})

/**
 * Depth-first walk of object nodes under `root` (arrays recurse into elements; visitor only sees plain objects).
 *
 * @param {unknown} root
 * @param {(node: Record<string, unknown>) => void} visitor
 */
function walkObjectTree(root, visitor) {
	if (root === undefined || root === null) return
	if (typeof root === 'string' || typeof root === 'number' || typeof root === 'boolean') return
	if (Array.isArray(root)) {
		for (const item of root) walkObjectTree(item, visitor)
		return
	}
	if (typeof root !== 'object') return
	const rec = /** @type {Record<string, unknown>} */ (root)
	visitor(rec)
	for (const v of Object.values(rec)) {
		walkObjectTree(v, visitor)
	}
}

/**
 * @param {Record<string, unknown> | null | undefined} tree
 * @param {(node: Record<string, unknown>, ctx: { vessel: Record<string, unknown> }) => void} onVesselNode
 */
export function walkVessels(tree, onVesselNode) {
	const vessels = asArray(tree?.GAME?.FLIGHTSTATE, 'VESSEL')
	for (const vessel of vessels) {
		if (!vessel || typeof vessel !== 'object') continue
		const v = /** @type {Record<string, unknown>} */ (vessel)
		walkObjectTree(v, (node) => onVesselNode(node, { vessel: v }))
	}
}

/**
 * Kerbal names assigned on a vessel (walks PART trees; `crew` may be string or string[]).
 *
 * @param {unknown} vessel
 * @returns {string[]}
 */
export function collectCrewNamesFromVessel(vessel) {
	/** @type {Set<string>} */
	const names = new Set()
	walkObjectTree(vessel, (node) => {
		const crew = node.crew
		if (typeof crew === 'string' && crew.trim()) names.add(crew.trim())
		else if (Array.isArray(crew)) {
			for (const item of crew) {
				if (typeof item === 'string' && item.trim()) names.add(item.trim())
			}
		}
	})
	return [...names]
}

/**
 * @param {unknown} v
 * @returns {number}
 */
function num(v) {
	if (v === undefined || v === null || v === '') return 0
	const n = Number.parseFloat(String(v))
	return Number.isFinite(n) ? n : 0
}

/**
 * @param {Record<string, unknown>} mod
 * @param {ProceduralBodyKind} kind
 * @returns {string | undefined}
 */
function proceduralDisplayNameFromModule(mod, kind) {
	const n =
		kind === 'comet'
			? mod.CometName ?? mod.AsteroidName
			: mod.AsteroidName
	if (typeof n === 'string' && n.length > 0) return n
	return undefined
}

/**
 * @param {Record<string, unknown>} node
 * @param {Map<string, ProceduralBodyEntry>} asteroidNameByUid
 */
function maybeIndexProceduralPart(node, asteroidNameByUid) {
	const partName = node.name
	if (partName !== 'PotatoRoid' && partName !== 'PotatoComet') return
	const uidRaw = node.uid
	if (uidRaw === undefined || uidRaw === null) return
	const uid = String(uidRaw)

	for (const mod of asArray(node, 'MODULE')) {
		if (!mod || typeof mod !== 'object') continue
		const m = /** @type {Record<string, unknown>} */ (mod)
		if (m.name !== 'ModuleAsteroid' && m.name !== 'ModuleComet') continue
		const modKind = m.name === 'ModuleComet' ? 'comet' : 'asteroid'
		const name = proceduralDisplayNameFromModule(m, modKind)
		const prev = asteroidNameByUid.get(uid)
		const entry = /** @type {ProceduralBodyEntry} */ ({
			kind: modKind,
			...(name !== undefined ? { name } : {}),
		})
		if (!prev) {
			asteroidNameByUid.set(uid, entry)
			return
		}
		if (name && !prev.name) {
			asteroidNameByUid.set(uid, { ...prev, name })
		}
		return
	}
}

/**
 * @param {Record<string, unknown> | null | undefined} tree
 * @returns {SaveDerived}
 */
export function buildSaveDerived(tree) {
	/** @type {Map<string, ProceduralBodyEntry>} */
	const asteroidNameByUid = new Map()
	/** @type {Map<string, { data: number, trans: number, title: string, vessels: Map<string, { data: number, xmit: number }> }>} */
	const scienceDataBySubjectId = new Map()
	/** @type {Map<string, { vesselName: string, sit: string, orbitRef: string | undefined }>} */
	const kerbalAssignmentsByName = new Map()

	const vessels = asArray(tree?.GAME?.FLIGHTSTATE, 'VESSEL')
	for (const vessel of vessels) {
		if (!vessel || typeof vessel !== 'object') continue
		const vRec = /** @type {Record<string, unknown>} */ (vessel)
		const vesselName = typeof vRec.name === 'string' ? vRec.name : '—'
		const sit = typeof vRec.sit === 'string' ? vRec.sit : '—'
		const orbit = vRec.ORBIT
		const orbitRef =
			orbit && typeof orbit === 'object' && orbit !== null && 'REF' in orbit && orbit.REF !== undefined && orbit.REF !== null
				? String(/** @type {Record<string, unknown>} */ (orbit).REF)
				: undefined

		for (const name of collectCrewNamesFromVessel(vessel)) {
			if (!kerbalAssignmentsByName.has(name)) {
				kerbalAssignmentsByName.set(name, { vesselName, sit, orbitRef })
			}
		}

		walkObjectTree(vessel, (node) => {
			maybeIndexProceduralPart(node, asteroidNameByUid)

			if ('ScienceData' in node) {
				for (const sd of asArray(node, 'ScienceData')) {
					if (!sd || typeof sd !== 'object') continue
					const sdr = /** @type {Record<string, unknown>} */ (sd)
					const sid = typeof sdr.subjectID === 'string' ? sdr.subjectID : ''
					if (!sid) continue
					const d = num(sdr.data)
					const xmit = num(sdr.xmit)
					const x = Math.min(Math.max(xmit, 0), 1)
					const sdTitle = typeof sdr.title === 'string' && sdr.title.length > 0 ? sdr.title : ''
					let agg = scienceDataBySubjectId.get(sid)
					if (!agg) {
						agg = { data: 0, trans: 0, title: '', vessels: new Map() }
						scienceDataBySubjectId.set(sid, agg)
					}
					agg.data += d
					agg.trans += d * x
					if (!agg.title && sdTitle) agg.title = sdTitle
					const prev = agg.vessels.get(vesselName) ?? { data: 0, xmit: x }
					agg.vessels.set(vesselName, { data: prev.data + d, xmit: x })
				}
			}
		})
	}

	return { asteroidNameByUid, scienceDataBySubjectId, kerbalAssignmentsByName }
}
