/**
 * Active / completed `RecoverAsset` contracts in `ContractSystem` (ConfigNode save tree).
 */

import { asArray } from '../save-file/save-file.util.js'

/**
 * @typedef {'openRescue'|'rescued'} RecoverAssetMarkKind
 */

/**
 * @param {Record<string, unknown> | null | undefined} tree
 * @returns {Map<string, RecoverAssetMarkKind>}
 */
export function recoverAssetMarkByKerbalName(tree) {
	/** @type {Map<string, RecoverAssetMarkKind>} */
	const map = new Map()
	const scenarios = asArray(tree?.GAME, 'SCENARIO')
	/** @type {Record<string, unknown> | undefined} */
	let contractSystem
	for (const s of scenarios) {
		if (s && typeof s === 'object' && s.name === 'ContractSystem') {
			contractSystem = /** @type {Record<string, unknown>} */ (s)
			break
		}
	}
	if (!contractSystem) return map

	const contracts = asArray(contractSystem.CONTRACTS, 'CONTRACT')
	const contractsFinished = asArray(contractSystem.CONTRACTS, 'CONTRACT_FINISHED')

	for (const c of contracts) {
		if (!c || typeof c !== 'object') continue
		if (c.type !== 'RecoverAsset' || c.state !== 'Active') continue
		const name = normalizeKerbalName(c.kerbalName)
		if (name) map.set(name, 'openRescue')
	}

	function considerRescued(/** @type {Record<string, unknown>} */ c) {
		if (c.type !== 'RecoverAsset' || c.state !== 'Completed') return
		const name = normalizeKerbalName(c.kerbalName)
		if (!name) return
		if (map.get(name) === 'openRescue') return
		map.set(name, 'rescued')
	}

	for (const c of contracts) {
		if (!c || typeof c !== 'object') continue
		considerRescued(/** @type {Record<string, unknown>} */ (c))
	}
	for (const c of contractsFinished) {
		if (!c || typeof c !== 'object') continue
		considerRescued(/** @type {Record<string, unknown>} */ (c))
	}
	return map
}

/**
 * @param {unknown} v
 * @returns {string}
 */
function normalizeKerbalName(v) {
	if (typeof v !== 'string') return ''
	const t = v.trim()
	return t.length > 0 ? t : ''
}
