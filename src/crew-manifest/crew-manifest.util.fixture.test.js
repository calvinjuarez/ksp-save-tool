import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { parse } from 'ksp-confignode'
import { describe, expect, it } from 'vitest'
import { buildCrewManifestRows } from './crew-manifest.util.js'

const roverGzPath = join(
	import.meta.dirname,
	'../../packages/ksp-confignode/fixtures/20260407-4-move-the-rover.sfs.gz',
)

describe('crew-manifest.util (Easy Mode move-the-rover save)', () => {
	it(
		'buildCrewManifestRows matches roster size and finds Jebediah on Zarathustra',
		() => {
			const buf = readFileSync(roverGzPath)
			const tree = parse(gunzipSync(buf).toString('utf8'))
			const rows = buildCrewManifestRows(tree)
			expect(rows).toHaveLength(118)
			const jeb = rows.find(r => r.name === 'Jebediah Kerman')
			expect(jeb).toBeDefined()
			expect(jeb?.vessel).toBe('Zarathustra Asteroid Station')
			expect(jeb?.situation).toBe('ORBITING')
			expect(jeb?.body).toBe('Kerbin')
			expect(jeb?.suit).toBe('Slim')
			expect(jeb?.rank).toBe(2)
			expect(jeb?.totalXp).toBeCloseTo(11.25, 5)
			expect(jeb?.bodyModel).toEqual({ abbr: 'M', title: 'Masculine' })
			expect(jeb?.color).toBe('1')
		},
		30_000,
	)

	it('marks Rosrim Kerman with open rescue and a completed-only rescue with life ring', () => {
		const buf = readFileSync(roverGzPath)
		const tree = parse(gunzipSync(buf).toString('utf8'))
		const rows = buildCrewManifestRows(tree)
		const rosrim = rows.find(r => r.name === 'Rosrim Kerman')
		expect(rosrim?.mark).toEqual({
			emoji: '🆘',
			title: 'Needs Rescue',
		})
		const derpont = rows.find(r => r.name === 'Derpont Kerman')
		expect(derpont?.mark).toEqual({
			emoji: '🛟',
			title: 'Rescued',
		})
	}, 30_000)
})
