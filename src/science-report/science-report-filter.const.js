import { compareBodyNames } from '../ksp/body-rank.util.js'
import { humanizeScienceSituation } from '../ksp/science-taxonomy.util.js'

/**
 * Column definitions for the science report table filter UI.
 *
 * @type {readonly import('../shared/table-filter.const.js').TableFilterColumnDef[]}
 */
export const SCIENCE_REPORT_FILTER_COLUMNS = Object.freeze([
	{
		key: 'body',
		label: 'Location',
		type: 'enum',
		enumOptionCompare: compareBodyNames,
		accessor: (row) => /** @type {import('./science-report.util.js').ScienceReportRow} */ (row).body,
	},
	{
		key: 'experiment',
		label: 'Experiment',
		type: 'enum',
		accessor: (row) =>
			/** @type {import('./science-report.util.js').ScienceReportRow} */ (row).experimentLabel,
	},
	{
		key: 'situation',
		label: 'Situation',
		type: 'enum',
		enumOptionLabel: humanizeScienceSituation,
		accessor: (row) =>
			/** @type {import('./science-report.util.js').ScienceReportRow} */ (row).situation,
	},
	{
		key: 'biome',
		label: 'Biome',
		type: 'string',
		accessor: (row) => /** @type {import('./science-report.util.js').ScienceReportRow} */ (row).biomeLabel,
	},
	{
		key: 'scienceCollected',
		label: 'Science collected',
		type: 'number',
		numberStep: '0.1',
		accessor: (row) =>
			/** @type {import('./science-report.util.js').ScienceReportRow} */ (row).earned,
	},
	{
		key: 'scienceUncollected',
		label: 'Science uncollected',
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
		label: 'Onboard data (mits)',
		type: 'number',
		numberStep: '0.1',
		accessor: (row) =>
			/** @type {import('./science-report.util.js').ScienceReportRow} */ (row).onboardData,
	},
])
