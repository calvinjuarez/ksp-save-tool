/**
 * Column definitions for the crew manifest table filter UI.
 *
 * @type {readonly import('../shared/table-filter.const.js').TableFilterColumnDef[]}
 */
export const CREW_MANIFEST_FILTER_COLUMNS = Object.freeze([
	{
		key: 'name',
		label: 'Kerbal',
		type: 'string',
		accessor: (row) => /** @type {import('./crew-manifest.util.js').CrewManifestRow} */ (row).name,
	},
	{
		key: 'mark',
		label: 'Mark',
		type: 'enum',
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
		type: 'number',
		accessor: (row) => /** @type {import('./crew-manifest.util.js').CrewManifestRow} */ (row).rank,
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
		accessor: (row) =>
			/** @type {import('./crew-manifest.util.js').CrewManifestRow} */ (row).situation,
	},
	{
		key: 'body',
		label: 'At',
		type: 'enum',
		accessor: (row) => /** @type {import('./crew-manifest.util.js').CrewManifestRow} */ (row).body,
	},
	{
		key: 'suit',
		label: 'Suit',
		type: 'enum',
		accessor: (row) => /** @type {import('./crew-manifest.util.js').CrewManifestRow} */ (row).suit,
	},
	{
		key: 'build',
		label: 'Build',
		type: 'enum',
		accessor: (row) => {
			const r = /** @type {import('./crew-manifest.util.js').CrewManifestRow} */ (row)
			return r.build !== null ? r.build.abbr : '—'
		},
	},
	{
		key: 'color',
		label: 'Color',
		type: 'enum',
		accessor: (row) => /** @type {import('./crew-manifest.util.js').CrewManifestRow} */ (row).color,
	},
])
