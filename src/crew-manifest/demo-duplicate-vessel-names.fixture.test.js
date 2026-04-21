import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'ksp-confignode'
import { describe, expect, it } from 'vitest'
import { groupCrewManifestRows } from './crew-manifest-group.util.js'
import { buildCrewManifestRows } from './crew-manifest.util.js'

const demoPath = join(import.meta.dirname, 'fixtures/demo-duplicate-vessel-names.sfs')

describe('demo-duplicate-vessel-names.sfs fixture', () => {
	it('parses two vessels with the same display name into separate groups with titleIndex', () => {
		const tree = parse(readFileSync(demoPath, 'utf8'))
		const rows = buildCrewManifestRows(tree)
		expect(rows).toHaveLength(2)

		const jeb = rows.find(r => r.name === 'Jebediah Kerman')
		const val = rows.find(r => r.name === 'Valentina Kerman')
		expect(jeb?.vessel).toBe('Alpha')
		expect(val?.vessel).toBe('Alpha')
		expect(jeb?.vesselPid).toBe('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
		expect(val?.vesselPid).toBe('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb')
		expect(jeb?.vesselLct).toBe(1000)
		expect(val?.vesselLct).toBe(5000)

		const groups = groupCrewManifestRows(rows, 'vessel')
		expect(groups).toHaveLength(2)
		expect(groups.map(g => g.title)).toEqual(['Alpha', 'Alpha'])
		expect(groups.map(g => g.titleIndex)).toEqual([1, 2])
		expect(groups[0].rows.map(r => r.name)).toEqual(['Jebediah Kerman'])
		expect(groups[1].rows.map(r => r.name)).toEqual(['Valentina Kerman'])
	})
})
