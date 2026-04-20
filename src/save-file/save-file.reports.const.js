/**
 * Reports exposed as child routes of Save Explorer (`/save-explorer/...`).
 * @type {ReadonlyArray<{ routeName: import('vue-router').RouteRecordName; title: string; description: string }>}
 */
export const SAVE_EXPLORER_REPORTS = [
	{
		routeName: 'crew-manifest',
		title: 'Krew Manifest',
		description: 'Roster kerbals and copy or download as Markdown.',
	},
	{
		routeName: 'science-report',
		title: 'Science Report',
		description:
			'Per-subject breakdown of science R&D has awarded, what is outstanding, and data still onboard.',
	},
]
