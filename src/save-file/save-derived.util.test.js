import { describe, expect, it } from 'vitest'
import { buildSaveDerived, collectCrewNamesFromVessel, walkVessels } from './save-derived.util.js'

describe('collectCrewNamesFromVessel', () => {
	it('collects string crew and array crew', () => {
		const vessel = {
			name: 'Test Ship',
			PART: [
				{ crew: 'Alice Kerman' },
				{ crew: ['Bob Kerman', 'Carol Kerman'] },
			],
		}
		const names = collectCrewNamesFromVessel(vessel).sort()
		expect(names).toEqual(['Alice Kerman', 'Bob Kerman', 'Carol Kerman'])
	})
})

describe('walkVessels', () => {
	it('invokes callback for object nodes under each vessel', () => {
		const tree = {
			GAME: {
				FLIGHTSTATE: {
					VESSEL: {
						name: 'V',
						PART: { name: 'mk1Pod', foo: 1 },
					},
				},
			},
		}
		/** @type {string[]} */
		const seen = []
		walkVessels(tree, (node, ctx) => {
			if (node.name === 'mk1Pod') seen.push(String(ctx.vessel.name))
		})
		expect(seen).toEqual(['V'])
	})
})

describe('buildSaveDerived', () => {
	it('aggregates ScienceData by subject id across vessels', () => {
		const tree = {
			GAME: {
				FLIGHTSTATE: {
					VESSEL: [
						{
							name: 'A',
							PART: {
								MODULE: {
									ScienceData: {
										subjectID: 'goo@MunSrfLanded',
										data: '1',
										xmit: '0.5',
									},
								},
							},
						},
						{
							name: 'B',
							ScienceData: {
								subjectID: 'goo@MunSrfLanded',
								data: '2',
								xmit: '1',
							},
						},
					],
				},
			},
		}
		const d = buildSaveDerived(tree)
		const agg = d.scienceDataBySubjectId.get('goo@MunSrfLanded')
		expect(agg?.data).toBe(3)
		expect(agg?.vessels.get('A')).toEqual({ data: 1, xmit: 0.5 })
		expect(agg?.vessels.get('B')).toEqual({ data: 2, xmit: 1 })
	})

	it('maps kerbal names to first vessel assignment', () => {
		const tree = {
			GAME: {
				FLIGHTSTATE: {
					VESSEL: [
						{
							name: 'First',
							pid: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
							lct: '100.5',
							sit: 'Landed',
							ORBIT: { REF: '1' },
							PART: { crew: 'Jeb Kerman' },
						},
						{
							name: 'Second',
							sit: 'ORBITING',
							PART: { crew: 'Jeb Kerman' },
						},
					],
				},
			},
		}
		const d = buildSaveDerived(tree)
		expect(d.kerbalAssignmentsByName.get('Jeb Kerman')).toEqual({
			vesselName: 'First',
			vesselPid: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
			vesselLct: 100.5,
			sit: 'Landed',
			orbitRef: '1',
		})
	})

	it('indexes PotatoRoid uid and AsteroidName', () => {
		const tree = {
			GAME: {
				FLIGHTSTATE: {
					VESSEL: {
						PART: {
							name: 'PotatoRoid',
							uid: '1617243892',
							MODULE: {
								name: 'ModuleAsteroid',
								AsteroidName: 'Named A',
							},
						},
					},
				},
			},
		}
		const d = buildSaveDerived(tree)
		expect(d.asteroidNameByUid.get('1617243892')).toEqual({
			kind: 'asteroid',
			name: 'Named A',
		})
	})

	it('indexes PotatoRoid with ModuleAsteroid but no AsteroidName as kind-only', () => {
		const tree = {
			GAME: {
				FLIGHTSTATE: {
					VESSEL: {
						PART: {
							name: 'PotatoRoid',
							uid: '7',
							MODULE: { name: 'ModuleAsteroid' },
						},
					},
				},
			},
		}
		const d = buildSaveDerived(tree)
		expect(d.asteroidNameByUid.get('7')).toEqual({ kind: 'asteroid' })
	})
})
