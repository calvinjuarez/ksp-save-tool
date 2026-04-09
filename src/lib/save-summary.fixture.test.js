import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { parse } from 'ksp-confignode'
import { describe, expect, it } from 'vitest'
import { crewCountFromTree } from './save-summary.js'

const roverGzPath = join(
	import.meta.dirname,
	'../../packages/ksp-confignode/fixtures/20260407-4-move-the-rover.sfs.gz',
)

describe('save-summary (Easy Mode move-the-rover save)', () => {
	it(
		'crewCountFromTree matches ROSTER KERBAL count',
		() => {
			const buf = readFileSync(roverGzPath)
			const tree = parse(gunzipSync(buf).toString('utf8'))
			expect(crewCountFromTree(tree)).toBe(126)
		},
		30_000,
	)
})
