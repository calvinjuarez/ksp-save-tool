import { describe, expect, it } from 'vitest'
import { humanizeVesselSituation } from './vessel-situation.util.js'

describe('humanizeVesselSituation', () => {
	it('maps stock situation tokens to sentence-case labels', () => {
		expect(humanizeVesselSituation('LANDED')).toBe('Landed')
		expect(humanizeVesselSituation('SPLASHED')).toBe('Splashed')
		expect(humanizeVesselSituation('PRELAUNCH')).toBe('Pre-launch')
		expect(humanizeVesselSituation('FLYING')).toBe('Flying')
		expect(humanizeVesselSituation('SUB_ORBITAL')).toBe('Sub-orbital')
		expect(humanizeVesselSituation('ORBITING')).toBe('Orbiting')
		expect(humanizeVesselSituation('ESCAPING')).toBe('Escaping')
		expect(humanizeVesselSituation('DOCKED')).toBe('Docked')
	})

	it('returns the em-dash sentinel for empty or placeholder input', () => {
		expect(humanizeVesselSituation('')).toBe('—')
		expect(humanizeVesselSituation('—')).toBe('—')
	})

	it('falls back to sentence-case splitting for unknown underscored tokens', () => {
		expect(humanizeVesselSituation('FUTURE_STATE')).toBe('Future state')
	})
})
