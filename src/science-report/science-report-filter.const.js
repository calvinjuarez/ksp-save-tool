/**
 * Column definitions for the science report table filter UI.
 *
 * @type {readonly import('../shared/table-filter.const.js').TableFilterColumnDef[]}
 */
export const SCIENCE_REPORT_FILTER_COLUMNS = Object.freeze([
	{
		key: 'body',
		label: 'Body',
		type: 'enum',
		accessor: (row) => /** @type {import('./science-report.util.js').ScienceReportRow} */ (row).body,
	},
	{
		key: 'experiment',
		label: 'Experiment',
		type: 'enum',
		accessor: (row) =>
			/** @type {import('./science-report.util.js').ScienceReportRow} */ (row).experimentTitle,
	},
	{
		key: 'situation',
		label: 'Situation',
		type: 'enum',
		accessor: (row) =>
			/** @type {import('./science-report.util.js').ScienceReportRow} */ (row).situation,
	},
	{
		key: 'biome',
		label: 'Biome',
		type: 'string',
		accessor: (row) => /** @type {import('./science-report.util.js').ScienceReportRow} */ (row).biome,
	},
	{
		key: 'scienceCollected',
		label: 'Science Collected',
		type: 'number',
		numberStep: '0.1',
		accessor: (row) =>
			/** @type {import('./science-report.util.js').ScienceReportRow} */ (row).earned,
	},
	{
		key: 'scienceUncollected',
		label: 'Science Uncollected',
		type: 'number',
		numberStep: '0.1',
		accessor: (row) =>
			/** @type {import('./science-report.util.js').ScienceReportRow} */ (row).remaining,
	},
	{
		key: 'completionPct',
		label: 'Completion %',
		type: 'number',
		numberStep: '0.1',
		accessor: (row) => {
			const r = /** @type {import('./science-report.util.js').ScienceReportRow} */ (row)
			return r.completionRatio * 100
		},
	},
	{
		key: 'onboardData',
		label: 'Onboard',
		type: 'number',
		numberStep: '0.1',
		accessor: (row) =>
			/** @type {import('./science-report.util.js').ScienceReportRow} */ (row).onboardData,
	},
])
