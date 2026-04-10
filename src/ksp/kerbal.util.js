import { xpFromCareerLog } from './kerbal-career-xp.util.js'

/**
 * Kerbal / roster helpers: pure parsing of fields that appear on `KERBAL` nodes in saves.
 * Add new kerbal-specific parsers here rather than new `src/ksp/*.util.js` files unless
 * the logic is clearly a different domain (e.g. vessel parts).
 *
 * Suit `comboId` format follows game definitions (see SUITCOMBOS.cfg); color names are
 * not in saves—we expose the raw variant number until mapped.
 *
 * Body model (M/F, Masculine/Feminine) comes from the roster `gender` field (`Male` / `Female`);
 * `comboId` is used only for the color variant (trailing `_<digits>` segment).
 *
 * Career rank (stars): use cached `experience` + `extraXP` when present; otherwise (or when
 * lower) derive XP from `CAREER_LOG` using stock per-body achievement values from the wiki
 * Experience table. Star thresholds match KSP 1 (2 / 8 / 16 / 32 / 64 XP).
 */

/** @type {readonly [number, number, number, number, number]} */
const KERBAL_STAR_XP_THRESHOLDS = [2, 8, 16, 32, 64]

/**
 * @typedef {Object} KerbalBodyModel
 * @property {'M'|'F'} abbr
 * @property {'Masculine'|'Feminine'} title
 * @property {string | null} colorVariant
 */

/**
 * @param {string | undefined} comboId
 * @returns {string | null}
 */
function colorVariantFromComboId(comboId) {
	if (typeof comboId !== 'string' || comboId.length === 0) return null
	const m = /_(\d+)$/.exec(comboId)
	return m ? m[1] : null
}

/**
 * Roster kerbal: `gender` for body model, `comboId` for color variant only.
 *
 * @param {Record<string, unknown>} kerbal
 * @returns {KerbalBodyModel | null}
 */
export function parseBodyModel(kerbal) {
	const g = kerbal.gender
	if (typeof g !== 'string' || g.trim().length === 0) return null
	const lower = g.trim().toLowerCase()
	/** @type {'M'|'F'} */
	let abbr
	/** @type {'Masculine'|'Feminine'} */
	let title
	if (lower === 'male') {
		abbr = 'M'
		title = 'Masculine'
	} else if (lower === 'female') {
		abbr = 'F'
		title = 'Feminine'
	} else {
		return null
	}
	const comboId = typeof kerbal.comboId === 'string' ? kerbal.comboId : undefined
	const colorVariant = colorVariantFromComboId(comboId)
	return { abbr, title, colorVariant }
}

/**
 * KSP roster names are typically `Given Kerman`. Strips the ` Kerman` suffix for display;
 * internal matching still uses the full string from the save.
 *
 * @param {string} fullName
 * @returns {string}
 */
export function kerbalDisplayName(fullName) {
	if (typeof fullName !== 'string' || fullName.length === 0) return '—'
	const stripped = fullName.replace(/\s+Kerman$/, '')
	return stripped.length > 0 ? stripped : fullName
}

/**
 * Map cumulative experience points to star rank 0–5 (KSP 1).
 *
 * @param {number} xpTotal
 * @returns {number}
 */
export function rankFromTotalExperience(xpTotal) {
	if (!Number.isFinite(xpTotal) || xpTotal < 0) return 0
	if (xpTotal < KERBAL_STAR_XP_THRESHOLDS[0]) return 0
	if (xpTotal < KERBAL_STAR_XP_THRESHOLDS[1]) return 1
	if (xpTotal < KERBAL_STAR_XP_THRESHOLDS[2]) return 2
	if (xpTotal < KERBAL_STAR_XP_THRESHOLDS[3]) return 3
	if (xpTotal < KERBAL_STAR_XP_THRESHOLDS[4]) return 4
	return 5
}

/**
 * @param {unknown} raw
 * @returns {number | null}
 */
function parseExperienceLevelField(raw) {
	if (raw === undefined || raw === null) return null
	if (typeof raw === 'number' && Number.isFinite(raw)) return Math.trunc(raw)
	if (typeof raw === 'string' && raw.trim() !== '') {
		const n = Number.parseInt(raw, 10)
		if (!Number.isNaN(n)) return n
	}
	return null
}

/**
 * @param {unknown} raw
 * @returns {number}
 */
function parseXpContribution(raw) {
	if (raw === undefined || raw === null) return 0
	const n = typeof raw === 'number' ? raw : Number.parseFloat(String(raw))
	return Number.isFinite(n) ? n : 0
}

/**
 * Total experience points used for rank: `max(experience + extraXP, CAREER_LOG-derived XP)`.
 *
 * @param {Record<string, unknown>} kerbal
 * @returns {number}
 */
export function kerbalTotalXpFromKerbal(kerbal) {
	const xpCached =
		parseXpContribution(kerbal.experience) + parseXpContribution(kerbal.extraXP)
	const xpCareer = xpFromCareerLog(kerbal.CAREER_LOG)
	return Math.max(xpCached, xpCareer)
}

/**
 * Star rank (0–5) from a `ROSTER` KERBAL node. Combines cached `experience` + `extraXP` with
 * XP derived from `CAREER_LOG` (whichever total is higher). If `experienceLevel` is present,
 * uses the max of that level and the rank from total XP.
 *
 * @param {Record<string, unknown>} kerbal
 * @returns {number}
 */
export function kerbalRankFromKerbal(kerbal) {
	const level = parseExperienceLevelField(kerbal.experienceLevel)
	const totalXp = kerbalTotalXpFromKerbal(kerbal)
	const fromXp = rankFromTotalExperience(totalXp)
	if (level !== null) {
		return Math.min(5, Math.max(0, Math.max(level, fromXp)))
	}
	return fromXp
}
