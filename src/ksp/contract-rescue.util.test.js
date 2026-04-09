import { describe, expect, it } from 'vitest'
import { recoverAssetMarkByKerbalName } from './contract-rescue.util.js'

function scenarioContractSystem(contracts, contractFinished = []) {
	return {
		GAME: {
			SCENARIO: [
				{ name: 'Other' },
				{
					name: 'ContractSystem',
					CONTRACTS: {
						CONTRACT: contracts,
						...(contractFinished.length > 0
							? { CONTRACT_FINISHED: contractFinished }
							: {}),
					},
				},
			],
		},
	}
}

describe('recoverAssetMarkByKerbalName', () => {
	it('returns empty map when ContractSystem is missing', () => {
		expect(recoverAssetMarkByKerbalName({ GAME: {} })).toEqual(new Map())
	})

	it('maps Active RecoverAsset to openRescue', () => {
		const tree = scenarioContractSystem([
			{ type: 'CollectScience', state: 'Active' },
			{
				type: 'RecoverAsset',
				state: 'Active',
				kerbalName: 'Ada Kerman',
			},
		])
		const m = recoverAssetMarkByKerbalName(tree)
		expect(m.get('Ada Kerman')).toBe('openRescue')
		expect(m.size).toBe(1)
	})

	it('maps Completed RecoverAsset to rescued when not active', () => {
		const tree = scenarioContractSystem([
			{
				type: 'RecoverAsset',
				state: 'Completed',
				kerbalName: 'Bob Kerman',
			},
		])
		const m = recoverAssetMarkByKerbalName(tree)
		expect(m.get('Bob Kerman')).toBe('rescued')
	})

	it('prefers openRescue when both Active and Completed exist for the same name', () => {
		const tree = scenarioContractSystem([
			{
				type: 'RecoverAsset',
				state: 'Completed',
				kerbalName: 'Cal Kerman',
			},
			{
				type: 'RecoverAsset',
				state: 'Active',
				kerbalName: 'Cal Kerman',
			},
		])
		const m = recoverAssetMarkByKerbalName(tree)
		expect(m.get('Cal Kerman')).toBe('openRescue')
	})

	it('ignores empty kerbalName', () => {
		const tree = scenarioContractSystem([
			{ type: 'RecoverAsset', state: 'Active', kerbalName: '  ' },
		])
		expect(recoverAssetMarkByKerbalName(tree).size).toBe(0)
	})

	it('maps Completed RecoverAsset from CONTRACT_FINISHED', () => {
		const tree = scenarioContractSystem(
			[],
			[
				{
					type: 'RecoverAsset',
					state: 'Completed',
					kerbalName: 'Dan Kerman',
				},
			],
		)
		expect(recoverAssetMarkByKerbalName(tree).get('Dan Kerman')).toBe('rescued')
	})
})
