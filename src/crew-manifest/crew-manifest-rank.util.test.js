import { describe, expect, it } from 'vitest'
import {
	crewManifestRankEnumOptionLabel,
	rankToStars,
} from './crew-manifest-rank.util.js'

describe('rankToStars', () => {
	it('returns empty star for rank 0 and filled stars for 1–5', () => {
		expect(rankToStars(0)).toBe('☆')
		expect(rankToStars(1)).toBe('★')
		expect(rankToStars(3)).toBe('★★★')
		expect(rankToStars(5)).toBe('★★★★★')
	})

	it('clamps out-of-range values', () => {
		expect(rankToStars(-1)).toBe('☆')
		expect(rankToStars(99)).toBe('★★★★★')
	})
})

describe('crewManifestRankEnumOptionLabel', () => {
	it('matches rankToStars for 0–5', () => {
		expect(crewManifestRankEnumOptionLabel('0')).toBe(rankToStars(0))
		expect(crewManifestRankEnumOptionLabel('3')).toBe(rankToStars(3))
	})
})
