import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { parse } from './parse.js'

const fixtureDir = join(import.meta.dirname, 'fixtures')
const roverGzPath = join(fixtureDir, '20260407-4-move-the-rover.sfs.gz')

describe('parse (Easy Mode move-the-rover save)', () => {
	it(
		'parses committed real .sfs.gz and exposes expected GAME / FLIGHTSTATE fields',
		() => {
			const buf = readFileSync(roverGzPath)
			const text = gunzipSync(buf).toString('utf8')
			const tree = parse(text)
			expect(tree.GAME.version).toBe('1.12.5')
			expect(tree.GAME.Title).toBe('Easy Mode (CAREER)')
			expect(tree.GAME.Seed).toBe('321595421')
			const vessels = tree.GAME?.FLIGHTSTATE?.VESSEL
			const vesselCount = Array.isArray(vessels) ? vessels.length : vessels ? 1 : 0
			expect(vesselCount).toBe(160)
		},
		30_000,
	)
})
