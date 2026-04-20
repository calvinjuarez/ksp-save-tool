<script setup>
import { computed, ref } from 'vue'
import TableFilter from '../shared/components/TableFilter.component.vue'
import { useTableFilter } from '../shared/table-filter.compose.js'
import { useSaveFileStore } from '../save-file/save-file.store.js'
import { SCIENCE_REPORT_FILTER_COLUMNS } from './science-report-filter.const.js'
import ScienceReportTable from './ScienceReportTable.component.vue'
import {
	buildScienceReportRows,
	formatSciDisplay,
	groupFullyStudiedNoOnboard,
	groupScienceReportRows,
	summarizeScienceReportGroup,
} from './science-report.util.js'

/** @typedef {'ungrouped' | 'location' | 'experiment'} ScienceReportGroupBy */

const saveFile = useSaveFileStore()

const groupBy = ref(/** @type {ScienceReportGroupBy} */ ('location'))

const allRows = computed(() => {
	if (!saveFile.tree || !saveFile.saveDerived) return []
	return buildScienceReportRows(saveFile.tree, saveFile.saveDerived)
})

const { filters, applyTo } = useTableFilter(SCIENCE_REPORT_FILTER_COLUMNS)

const filteredRows = computed(() => applyTo(allRows.value))

const groups = computed(() => groupScienceReportRows(filteredRows.value, groupBy.value))

const groupsWithSummary = computed(() =>
	groups.value.map(g => ({
		...g,
		summaryLine: scienceReportGroupSummaryLine(g),
	})),
)

/**
 * @param {import('./science-report.util.js').ScienceReportGroup} g
 */
function scienceReportGroupSummaryLine(g) {
	if (groupBy.value === 'ungrouped') return ''
	const sum = summarizeScienceReportGroup(g.rows)
	const isLocation = groupBy.value === 'location'
	const easter =
		isLocation &&
		g.rows.length > 0 &&
		groupFullyStudiedNoOnboard(g.rows)
	if (easter) {
		return 'R&D has no further questions about this object.'
	}
	const vessels =
		sum.distinctVesselCount === 1 ? '1 vessel' : `${sum.distinctVesselCount} vessels`
	return `${sum.subjectCount} subjects tracked · ${formatSciDisplay(sum.earnedSum)} sci earned · ${formatSciDisplay(sum.remainingSum)} sci uncollected · ${formatSciDisplay(sum.onboardMitsSum)} mits onboard across ${vessels}`
}
</script>

<template>
	<div class="v-science-report">
		<h2 class="v-science-report--title">Science Report</h2>
		<p class="lead">
			Generated from <strong>{{ saveFile.fileName }}</strong>
			(<template v-if="filters.length > 0">{{ filteredRows.length }} of {{ allRows.length }}</template>
			<template v-else>{{ allRows.length }}</template>
			subjects).
		</p>

		<div class="v-science-report--toolbar">
			<div class="v-science-report--group_by">
				<label for="science-report-group-by" class="form_label  v-science-report--group_label">Group by</label>
				<select
					id="science-report-group-by"
					v-model="groupBy"
					class="form_control  v-science-report--group_select"
				>
					<option value="ungrouped">Ungrouped</option>
					<option value="location">Location</option>
					<option value="experiment">Experiment</option>
				</select>
			</div>
			<div class="v-science-report--filters">
				<TableFilter
					v-model:filters="filters"
					:column-defs="SCIENCE_REPORT_FILTER_COLUMNS"
					:rows="allRows"
				/>
			</div>
		</div>

		<div v-if="filteredRows.length === 0" class="form_help">No subjects match the current filters.</div>

		<template v-else-if="groupBy === 'ungrouped'">
			<section class="v-science-report--section">
				<ScienceReportTable
					:rows="groups[0].rows"
					:hide-body="false"
					:hide-experiment="false"
				/>
			</section>
		</template>

		<template v-else>
			<section
				v-for="(g, idx) in groupsWithSummary"
				:key="`${groupBy}:${g.key}:${idx}`"
				class="v-science-report--section"
			>
				<details open>
					<summary class="v-science-report--summary_row">
						<div class="v-science-report--summary_main">
							<hgroup class="v-science-report--heading_group">
								<h3 class="v-science-report--heading">{{ g.title }}</h3>
								<p v-if="g.caption" class="v-science-report--heading_sub">{{ g.caption }}</p>
							</hgroup>
							<p v-if="g.summaryLine" class="v-science-report--summary">{{ g.summaryLine }}</p>
						</div>
					</summary>
					<ScienceReportTable
						:rows="g.rows"
						:hide-body="groupBy === 'location'"
						:hide-experiment="groupBy === 'experiment'"
					/>
				</details>
			</section>
		</template>
	</div>
</template>

<style scoped>
.v-science-report {
	max-width: 100%;
}

.v-science-report--title {
	margin: 0 0 0.35rem;
}

.v-science-report--toolbar {
	display: flex;
	flex-wrap: wrap;
	align-items: flex-start;
	gap: 0.5rem 0.75rem;
	margin-bottom: 1rem;
}

.v-science-report--group_by {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.35rem 0.5rem;
	flex: 0 0 auto;
}

.v-science-report--group_label {
	margin: 0;
	font-size: var(--house--text--size-small, 0.85rem);
	font-weight: 500;
	white-space: nowrap;
}

.v-science-report--group_select {
	width: auto;
	min-width: 7.5rem;
	max-width: 11rem;
	padding-block: 0.2rem;
	font-size: var(--house--text--size-small, 0.85rem);
}

.v-science-report--filters {
	flex: 1 1 0;
	min-width: 0;
}

.v-science-report--filters :deep(.c-table-filter) {
	margin-bottom: 0;
	width: 100%;
	min-width: 0;
}

.v-science-report--section {
	margin-bottom: 2rem;
}

.v-science-report--section details > :not(summary) {
	margin-top: 0.75rem;
}

.v-science-report--summary_row {
	/* Keep default `display: list-item` so the disclosure marker stays visible. */
	user-select: none;
}

.v-science-report--summary_main {
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
}

.v-science-report--heading_group {
	display: flex;
	align-items: baseline;
	flex-wrap: wrap;
	gap: 0.5rem;
	margin: 0;
}

.v-science-report--heading {
	margin: 0;
	font-size: 1.15rem;
	font-weight: 600;
}

.v-science-report--heading_sub {
	margin: 0;
	font-size: 0.85rem;
	font-weight: 400;
	color: var(--house--color--ink-muted);
}

.v-science-report--summary {
	margin: 0;
	font-size: 0.9rem;
	color: var(--house--color--ink-muted);
}

.v-science-report--summary_row .v-science-report--summary {
	padding-inline-start: 0.75rem;
}
</style>
