import { compareBodyNames } from '../ksp/body-rank.util.js'
import { humanizeVesselSituation } from '../ksp/vessel-situation.util.js'
import { crewManifestMarkEnumOptionLabel } from './crew-manifest-mark.const.js'
import {
	CREW_MANIFEST_RANK_ENUM_VALUES,
	crewManifestRankEnumOptionLabel,
} from './crew-manifest-rank.util.js'

/**
 * Column definitions for the crew manifest table filter UI.
 *
 * @type {readonly import('../shared/table-filter.const.js').TableFilterColumnDef[]}
 */
export const CREW_MANIFEST_FILTER_COLUMNS = Object.freeze([
	{
		key: 'name',
		label: 'Name',
		type: 'string',
		accessor: (row) => /** @type {import('./crew-manifest.util.js').CrewManifestRow} */ (row).name,
	},
	{
		key: 'mark',
		label: 'Mark',
		type: 'enum',
		enumOptionLabel: crewManifestMarkEnumOptionLabel,
		accessor: (row) => {
			const r = /** @type {import('./crew-manifest.util.js').CrewManifestRow} */ (row)
			return r.markKind ?? '—'
		},
	},
	{
		key: 'role',
		label: 'Role',
		type: 'enum',
		accessor: (row) => /** @type {import('./crew-manifest.util.js').CrewManifestRow} */ (row).role,
	},
	{
		key: 'rank',
		label: 'Rank',
		type: 'enum',
		enumValueUniverse: CREW_MANIFEST_RANK_ENUM_VALUES,
		enumOptionLabel: crewManifestRankEnumOptionLabel,
		accessor: (row) => {
			const r = /** @type {import('./crew-manifest.util.js').CrewManifestRow} */ (row).rank
			return Number.isFinite(r) ? String(Math.trunc(r)) : '0'
		},
	},
	{
		key: 'xp',
		label: 'XP',
		type: 'number',
		numberStep: '0.1',
		accessor: (row) => /** @type {import('./crew-manifest.util.js').CrewManifestRow} */ (row).totalXp,
	},
	{
		key: 'vessel',
		label: 'Vessel',
		type: 'string',
		accessor: (row) => /** @type {import('./crew-manifest.util.js').CrewManifestRow} */ (row).vessel,
	},
	{
		key: 'situation',
		label: 'Situation',
		type: 'enum',
		enumOptionLabel: humanizeVesselSituation,
		accessor: (row) =>
			/** @type {import('./crew-manifest.util.js').CrewManifestRow} */ (row).situation,
	},
	{
		key: 'body',
		label: 'Location',
		type: 'enum',
		enumOptionCompare: compareBodyNames,
		accessor: (row) => /** @type {import('./crew-manifest.util.js').CrewManifestRow} */ (row).body,
	},
	{
		key: 'suit',
		label: 'Suit',
		type: 'enum',
		accessor: (row) => /** @type {import('./crew-manifest.util.js').CrewManifestRow} */ (row).suit,
	},
	{
		key: 'bodyModel',
		label: 'Model',
		type: 'enum',
		accessor: (row) => {
			const r = /** @type {import('./crew-manifest.util.js').CrewManifestRow} */ (row)
			return r.bodyModel !== null ? r.bodyModel.title : '—'
		},
	},
	{
		key: 'color',
		label: 'Color',
		type: 'enum',
		accessor: (row) => /** @type {import('./crew-manifest.util.js').CrewManifestRow} */ (row).color,
	},
])
