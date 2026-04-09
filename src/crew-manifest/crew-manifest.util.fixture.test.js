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
			expect(rows).toHaveLength(126)
			const jeb = rows.find(r => r.name === 'Jebediah Kerman')
			expect(jeb).toBeDefined()
			expect(jeb?.vessel).toBe('Zarathustra Asteroid Station')
			expect(jeb?.situation).toBe('ORBITING')
			expect(jeb?.body).toBe('Kerbin')
			expect(jeb?.suit).toBe('Slim')
			expect(jeb?.build).toEqual({ abbr: 'M', title: 'Masculine' })
			expect(jeb?.color).toBe('1')
		},
		30_000,
	)
})
