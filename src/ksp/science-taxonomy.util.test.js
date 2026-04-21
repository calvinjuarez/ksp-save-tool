import { describe, expect, it } from 'vitest'
import {
	humanizeBiome,
	humanizeExperimentId,
	humanizeScienceSituation,
	unknownProceduralObjectLabel,
} from './science-taxonomy.util.js'

describe('humanizeExperimentId', () => {
	it('maps stock ids', () => {
		expect(humanizeExperimentId('gravityScan')).toBe('Gravity Scan')
		expect(humanizeExperimentId('barometerScan')).toBe('Atmospheric Pressure Scan')
		expect(humanizeExperimentId('mysteryGoo')).toBe('Mystery Goo')
	})

	it('camelCase fallbacks for unknown mods', () => {
		expect(humanizeExperimentId('customFooBar')).toBe('Custom Foo Bar')
	})

	it('handles empty', () => {
		expect(humanizeExperimentId('')).toBe('—')
	})
})

describe('humanizeScienceSituation', () => {
	it('maps stock tokens', () => {
		expect(humanizeScienceSituation('SrfLanded')).toBe('Landed')
		expect(humanizeScienceSituation('InSpaceHigh')).toBe('High Orbit')
		expect(humanizeScienceSituation('FlyingLow')).toBe('Low Atmosphere')
	})

	it('passes through em dash', () => {
		expect(humanizeScienceSituation('—')).toBe('—')
	})
})

describe('humanizeBiome', () => {
	it('splits PascalCase words', () => {
		expect(humanizeBiome('SouthernIceShelf')).toBe('Southern Ice Shelf')
		expect(humanizeBiome('IslandAirfield')).toBe('Island Airfield')
	})

	it('preserves acronyms', () => {
		expect(humanizeBiome('SPH')).toBe('SPH')
		expect(humanizeBiome('VAB')).toBe('VAB')
		expect(humanizeBiome('KSC')).toBe('KSC')
		expect(humanizeBiome('R&D')).toBe('R&D')
	})

	it('empty to em dash', () => {
		expect(humanizeBiome('')).toBe('—')
	})
})

describe('unknownProceduralObjectLabel', () => {
	it('embeds the raw id for unrecognized procedural tokens', () => {
		expect(unknownProceduralObjectLabel('_PotatoRoid1617243892')).toBe(
			'Unknown object (_PotatoRoid1617243892)',
		)
	})

	it('empty id uses em dash inside parens', () => {
		expect(unknownProceduralObjectLabel('')).toBe('Unknown object (—)')
	})
})
