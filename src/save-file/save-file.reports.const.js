/**
 * Reports exposed as child routes of Save Explorer (`/save-explorer/...`).
 * @type {ReadonlyArray<{ routeName: import('vue-router').RouteRecordName; title: string; description: string }>}
 */
export const SAVE_EXPLORER_REPORTS = [
	{
		routeName: 'crew-manifest',
		title: 'Crew Manifest',
		description: 'Roster kerbals and copy or download as Markdown.',
	},
]
