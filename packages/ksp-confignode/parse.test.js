import { describe, expect, it } from 'vitest'
import { parse } from './parse.js'

describe('parse', () => {
	it('parses a minimal GAME block', () => {
		const text = `GAME
{
	version = 1.12.5
	Title = My Career
}`
		const out = parse(text)
		expect(out.GAME).toEqual({
			version: '1.12.5',
			Title: 'My Career',
		})
	})

	it('parses nested blocks and duplicate node names as arrays', () => {
		const text = `GAME
{
	FLIGHTSTATE
	{
		UT = 123456.789
		VESSEL
		{
			name = A
			sit = ORBITING
		}
		VESSEL
		{
			name = B
			sit = LANDED
		}
	}
}`
		const out = parse(text)
		expect(out.GAME.FLIGHTSTATE.UT).toBe('123456.789')
		expect(out.GAME.FLIGHTSTATE.VESSEL).toHaveLength(2)
		expect(out.GAME.FLIGHTSTATE.VESSEL[0]).toEqual({ name: 'A', sit: 'ORBITING' })
		expect(out.GAME.FLIGHTSTATE.VESSEL[1]).toEqual({ name: 'B', sit: 'LANDED' })
	})

	it('splits on first = only (values may contain =)', () => {
		const text = `NODE
{
	desc = a=b=c
}`
		const out = parse(text)
		expect(out.NODE.desc).toBe('a=b=c')
	})

	it('coalesces duplicate keys at the same level into arrays', () => {
		const text = `GAME
{
	foo = 1
	foo = 2
}`
		const out = parse(text)
		expect(out.GAME.foo).toEqual(['1', '2'])
	})

	it('handles empty node bodies', () => {
		const text = `GAME
{
	EMPTY
	{
	}
}`
		const out = parse(text)
		expect(out.GAME.EMPTY).toEqual({})
	})

	it('handles CRLF line endings', () => {
		const text = 'GAME\r\n{\r\n\tx = 1\r\n}'
		const out = parse(text)
		expect(out.GAME.x).toBe('1')
	})
})
