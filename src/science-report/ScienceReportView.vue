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
	if (!saveFile.tree) return []
	return buildScienceReportRows(saveFile.tree)
})

const { filters, applyTo } = useTableFilter(SCIENCE_REPORT_FILTER_COLUMNS)

const filteredRows = computed(() => applyTo(allRows.value))

const groups = computed(() => groupScienceReportRows(filteredRows.value, groupBy.value))

/**
 * @param {import('./science-report.util.js').ScienceReportGroup} g
 */
function groupSummaryLine(g) {
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
		<h2>Science Report</h2>
		<p class="lead">
			Generated from <strong>{{ saveFile.fileName }}</strong>
			(<template v-if="filters.length > 0">{{ filteredRows.length }} of {{ allRows.length }}</template>
			<template v-else>{{ allRows.length }}</template>
			subjects).
		</p>

		<div class="v-science-report--controls">
			<div class="v-science-report--group_by">
				<label for="science-report-group-by" class="form_label">Group by</label>
				<select
					id="science-report-group-by"
					v-model="groupBy"
					class="form_control"
				>
					<option value="ungrouped">Ungrouped</option>
					<option value="location">Location</option>
					<option value="experiment">Experiment</option>
				</select>
			</div>
		</div>

		<TableFilter
			v-model:filters="filters"
			:column-defs="SCIENCE_REPORT_FILTER_COLUMNS"
			:rows="allRows"
		/>

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
				v-for="g in groups"
				:key="g.key"
				class="v-science-report--section"
			>
				<h3
					class="v-science-report--heading"
					:class="{ 'v-science-report--heading_moon': g.isMoon }"
				>
					{{ g.title }}
				</h3>
				<p v-if="g.caption" class="v-science-report--caption">{{ g.caption }}</p>
				<p v-if="groupSummaryLine(g)" class="v-science-report--summary">{{ groupSummaryLine(g) }}</p>
				<ScienceReportTable
					:rows="g.rows"
					:hide-body="groupBy === 'location'"
					:hide-experiment="groupBy === 'experiment'"
				/>
			</section>
		</template>
	</div>
</template>

<style scoped>
.v-science-report {
	max-width: 100%;
}

.v-science-report--controls {
	margin-bottom: 1rem;
}

.v-science-report--group_by {
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
	max-width: 16rem;
}

.v-science-report--section {
	margin-bottom: 2rem;
}

.v-science-report--heading {
	margin: 0 0 0.25rem;
	font-size: 1.15rem;
	font-weight: 600;
}

.v-science-report--heading_moon {
	padding-left: 1rem;
	border-left: 3px solid var(--house--gray-300, #c9c9c9);
}

.v-science-report--caption {
	margin: 0 0 0.5rem;
	font-size: 0.85rem;
	color: var(--house--color--ink-muted);
}

.v-science-report--summary {
	margin: 0 0 0.75rem;
	font-size: 0.9rem;
	color: var(--house--color--ink-muted);
}
</style>
