import { describe, expect, it } from 'vitest'
import {
	vesselNameHasStrippableParenthetical,
	vesselNameWithoutParentheticals,
} from './vessel-name.util.js'

describe('vesselNameWithoutParentheticals', () => {
	it('strips a trailing parenthetical', () => {
		expect(vesselNameWithoutParentheticals('Alpha (1)')).toBe('Alpha')
	})

	it('strips a middle parenthetical', () => {
		expect(vesselNameWithoutParentheticals('X (old) Y')).toBe('X Y')
	})

	it('strips multiple parentheticals', () => {
		expect(vesselNameWithoutParentheticals('A (1) B (2)')).toBe('A B')
	})

	it('returns the original when stripping would leave nothing', () => {
		expect(vesselNameWithoutParentheticals('(scrap)')).toBe('(scrap)')
	})

	it('returns identity when there is no parenthetical', () => {
		expect(vesselNameWithoutParentheticals('Mun Lander')).toBe('Mun Lander')
	})
})

describe('vesselNameHasStrippableParenthetical', () => {
	it('is true when name changes after stripping', () => {
		expect(vesselNameHasStrippableParenthetical('Alpha (1)')).toBe(true)
	})

	it('is false when name is unchanged', () => {
		expect(vesselNameHasStrippableParenthetical('Alpha')).toBe(false)
	})

	it('is false for fully-parenthetical-only name (fallback)', () => {
		expect(vesselNameHasStrippableParenthetical('(scrap)')).toBe(false)
	})
})
