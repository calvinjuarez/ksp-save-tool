import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useSaveFileStore } from './save-file.store.js'

beforeEach(() => {
	setActivePinia(createPinia())
})

describe('useSaveFileStore', () => {
	it('parses a File and exposes summary fields', async () => {
		const store = useSaveFileStore()
		const text = `GAME
{
	Title = Test Save
	FLIGHTSTATE
	{
		VESSEL
		{
			name = A
		}
	}
	ROSTER
	{
		CREW
		{
			name = Jeb
		}
	}
}`
		const file = new File([text], 'persistent.sfs', { type: 'text/plain', lastModified: 1_700_000_000_000 })

		await store.loadFromFile(file)

		expect(store.loadError).toBeNull()
		expect(store.hasSave).toBe(true)
		expect(store.gameTitle).toBe('Test Save')
		expect(store.vesselCount).toBe(1)
		expect(store.crewCount).toBe(1)
		expect(store.fileName).toBe('persistent.sfs')
		expect(store.tree?.GAME?.Title).toBe('Test Save')
		expect(store.saveDerived).not.toBeNull()
		expect(store.saveDerived?.scienceDataBySubjectId).toBeDefined()
		expect(store.saveDerived?.kerbalAssignmentsByName).toBeDefined()
		expect(store.saveDerived?.asteroidNameByUid).toBeDefined()
	})

	it('clear resets state', async () => {
		const store = useSaveFileStore()
		const file = new File(['GAME\n{\n}\n'], 'x.sfs', { type: 'text/plain' })
		await store.loadFromFile(file)
		store.clear()
		expect(store.tree).toBeNull()
		expect(store.hasSave).toBe(false)
	})
})
