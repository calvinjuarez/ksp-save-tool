import { describe, expect, it } from 'vitest'
import { formatVesselSituationLocation, humanizeVesselSituation } from './vessel-situation.util.js'

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

describe('formatVesselSituationLocation', () => {
	it('omits a preposition for stable orbit and escape', () => {
		expect(formatVesselSituationLocation('ORBITING', 'Minmus')).toBe('Orbiting Minmus')
		expect(formatVesselSituationLocation('ESCAPING', 'Kerbin')).toBe('Escaping Kerbin')
	})

	it('uses "over" for sub-orbital flight (same regime as atmospheric flying)', () => {
		expect(formatVesselSituationLocation('SUB_ORBITAL', 'Mun')).toBe('Sub-orbital over Mun')
	})

	it('uses "on" for surface contact states', () => {
		expect(formatVesselSituationLocation('LANDED', 'Minmus')).toBe('Landed on Minmus')
		expect(formatVesselSituationLocation('SPLASHED', 'Kerbin')).toBe('Splashed on Kerbin')
		expect(formatVesselSituationLocation('PRELAUNCH', 'Kerbin')).toBe('Pre-launch on Kerbin')
	})

	it('uses "over" for atmospheric flight and "at" for docked', () => {
		expect(formatVesselSituationLocation('FLYING', 'Eve')).toBe('Flying over Eve')
		expect(formatVesselSituationLocation('DOCKED', 'Kerbin')).toBe('Docked at Kerbin')
	})

	it('returns just the situation label when body is missing or placeholder', () => {
		expect(formatVesselSituationLocation('LANDED', '')).toBe('Landed')
		expect(formatVesselSituationLocation('LANDED', '—')).toBe('Landed')
		expect(formatVesselSituationLocation('ORBITING', null)).toBe('Orbiting')
	})

	it('falls back to no preposition for unknown situation tokens', () => {
		expect(formatVesselSituationLocation('FUTURE_STATE', 'Kerbin')).toBe('Future state Kerbin')
	})
})
