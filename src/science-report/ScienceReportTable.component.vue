<script setup>
import { computed, ref } from 'vue'
import {
	cycleScienceReportSortDirForColumn,
	initialScienceReportSortDirForColumn,
	SCIENCE_REPORT_SORT_COLUMN_LABELS,
	sortScienceReportRows,
} from './science-report-sort.util.js'
import {
	formatSciDisplay,
	isFullyStudiedNumerically,
	TRACE_UNCOLLECTED_THRESHOLD,
} from './science-report.util.js'

/** @typedef {import('./science-report-sort.util.js').ScienceReportSortColumn} ScienceReportSortColumn */

const props = defineProps({
	rows: {
		type: Array,
		required: true,
	},
	hideBody: {
		type: Boolean,
		default: false,
	},
	hideExperiment: {
		type: Boolean,
		default: false,
	},
})

/** @type {import('vue').Ref<import('./science-report-sort.util.js').ScienceReportSortSpec>} */
const primarySort = ref({ key: 'science', dir: 'asc' })

/** @type {import('vue').Ref<import('./science-report-sort.util.js').ScienceReportSortSpec>} */
const secondarySort = ref({ key: null, dir: null })

const sortedRows = computed(() =>
	sortScienceReportRows(props.rows, primarySort.value, secondarySort.value),
)

/**
 * @param {import('./science-report.util.js').ScienceReportRow} r
 */
function scienceProgressPct(r) {
	if (r.cap <= 0) return 0
	if (isFullyStudiedNumerically(r)) return 100
	return Math.min(100, Math.max(0, r.completionRatio * 100))
}

/**
 * @param {import('./science-report.util.js').ScienceReportRow} r
 */
function scienceCaption(r) {
	if (r.cap > 0 && isFullyStudiedNumerically(r)) return 'Fully studied'
	if (r.cap <= 0 && r.earned <= 0) return '—'
	if (r.remaining > 0 && r.remaining < TRACE_UNCOLLECTED_THRESHOLD) {
		return `< ${TRACE_UNCOLLECTED_THRESHOLD} sci uncollected`
	}
	return `${formatSciDisplay(r.remaining)} sci uncollected`
}

/**
 * @param {import('./science-report.util.js').ScienceReportRow} r
 */
function scienceTooltip(r) {
	if (r.cap <= 0) {
		return 'R&D has not logged a science cap for this subject in this save.'
	}
	if (isFullyStudiedNumerically(r)) {
		return `R&D has awarded the full ${formatSciDisplay(r.cap)} sci for this subject.`
	}
	return `R&D has awarded ${formatSciDisplay(r.earned)} of ${formatSciDisplay(r.cap)} sci. ${formatSciDisplay(r.remaining)} sci uncollected.`
}

/**
 * @param {import('./science-report.util.js').ScienceReportRow} r
 */
function onboardDisplay(r) {
	if (r.onboardData <= 0) return '—'
	const trans = formatSciDisplay(r.onboardDataTransmissible)
	return `${formatSciDisplay(r.onboardData)} mits (${trans} transmissible)`
}

/**
 * @param {import('./science-report.util.js').ScienceReportRow} r
 */
function onboardTooltip(r) {
	if (r.vessels.length === 0) return ''
	const lines = r.vessels.map(
		(v) =>
			`${v.vesselName}: ${formatSciDisplay(v.data)} mits · ${Math.round(v.xmit * 100)}% transmissible`,
	)
	return lines.join('\n')
}

/**
 * @param {import('./science-report.util.js').ScienceReportRow} r
 */
function vesselsDisplay(r) {
	if (r.vessels.length === 0) return '—'
	return r.vessels.map((v) => v.vesselName).join(', ')
}

/**
 * @param {ScienceReportSortColumn} key
 * @param {MouseEvent} event
 */
function onSortHeaderClick(key, event) {
	if (event.shiftKey) {
		if (primarySort.value.key === key) return
		if (secondarySort.value.key === key) {
			const next = cycleScienceReportSortDirForColumn(key, secondarySort.value.dir)
			if (next === null) secondarySort.value = { key: null, dir: null }
			else secondarySort.value = { key, dir: next }
		} else {
			secondarySort.value = { key, dir: initialScienceReportSortDirForColumn(key) }
		}
		return
	}

	secondarySort.value = { key: null, dir: null }
	if (primarySort.value.key === key) {
		const next = cycleScienceReportSortDirForColumn(key, primarySort.value.dir)
		if (next === null) primarySort.value = { key: null, dir: null }
		else primarySort.value = { key, dir: next }
	} else {
		primarySort.value = { key, dir: initialScienceReportSortDirForColumn(key) }
	}
}

/**
 * @param {ScienceReportSortColumn} key
 * @param {'primary'|'secondary'} which
 */
function sortIndicator(key, which) {
	const spec = which === 'primary' ? primarySort.value : secondarySort.value
	if (spec.key !== key || spec.dir === null) return ''
	return spec.dir === 'asc' ? '\u2191' : '\u2193'
}
</script>

<template>
	<div class="c-science_report_table--wrap">
		<table class="c-science_report_table">
			<thead>
				<tr>
					<th
						v-if="!hideExperiment"
						class="c-science_report_table--sort_th"
						@click="onSortHeaderClick('experiment', $event)"
					>
						{{ SCIENCE_REPORT_SORT_COLUMN_LABELS.experiment }}
						<span class="c-science_report_table--sort_primary">{{ sortIndicator('experiment', 'primary') }}</span>
						<span class="c-science_report_table--sort_secondary">{{ sortIndicator('experiment', 'secondary') }}</span>
					</th>
					<th
						v-if="!hideBody"
						class="c-science_report_table--sort_th"
						@click="onSortHeaderClick('body', $event)"
					>
						{{ SCIENCE_REPORT_SORT_COLUMN_LABELS.body }}
						<span class="c-science_report_table--sort_primary">{{ sortIndicator('body', 'primary') }}</span>
						<span class="c-science_report_table--sort_secondary">{{ sortIndicator('body', 'secondary') }}</span>
					</th>
					<th
						class="c-science_report_table--sort_th"
						@click="onSortHeaderClick('situation', $event)"
					>
						{{ SCIENCE_REPORT_SORT_COLUMN_LABELS.situation }}
						<span class="c-science_report_table--sort_primary">{{ sortIndicator('situation', 'primary') }}</span>
						<span class="c-science_report_table--sort_secondary">{{ sortIndicator('situation', 'secondary') }}</span>
					</th>
					<th
						class="c-science_report_table--sort_th"
						@click="onSortHeaderClick('biome', $event)"
					>
						{{ SCIENCE_REPORT_SORT_COLUMN_LABELS.biome }}
						<span class="c-science_report_table--sort_primary">{{ sortIndicator('biome', 'primary') }}</span>
						<span class="c-science_report_table--sort_secondary">{{ sortIndicator('biome', 'secondary') }}</span>
					</th>
					<th
						class="c-science_report_table--sort_th"
						@click="onSortHeaderClick('science', $event)"
					>
						{{ SCIENCE_REPORT_SORT_COLUMN_LABELS.science }}
						<span class="c-science_report_table--sort_primary">{{ sortIndicator('science', 'primary') }}</span>
						<span class="c-science_report_table--sort_secondary">{{ sortIndicator('science', 'secondary') }}</span>
					</th>
					<th
						class="c-science_report_table--sort_th"
						@click="onSortHeaderClick('onboard', $event)"
					>
						{{ SCIENCE_REPORT_SORT_COLUMN_LABELS.onboard }}
						<span class="c-science_report_table--sort_primary">{{ sortIndicator('onboard', 'primary') }}</span>
						<span class="c-science_report_table--sort_secondary">{{ sortIndicator('onboard', 'secondary') }}</span>
					</th>
					<th>Vessels</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="(r, idx) in sortedRows" :key="`${r.subjectId}-${idx}`">
					<td v-if="!hideExperiment">{{ r.experimentLabel }}</td>
					<td v-if="!hideBody">{{ r.body }}</td>
					<td>{{ r.situationLabel }}</td>
					<td>{{ r.biomeLabel }}</td>
					<td class="c-science_report_table--science">
						<div
							class="c-science_report_table--bar_track"
							:title="scienceTooltip(r)"
						>
							<div
								class="c-science_report_table--bar_fill"
								:style="{ width: `${scienceProgressPct(r)}%` }"
							/>
						</div>
						<p class="c-science_report_table--science_caption">{{ scienceCaption(r) }}</p>
						<p class="c-science_report_table--science_sub">
							{{ r.cap > 0 ? `${formatSciDisplay(r.earned)} / ${formatSciDisplay(r.cap)} sci` : '' }}
						</p>
					</td>
					<td :title="onboardTooltip(r)">{{ onboardDisplay(r) }}</td>
					<td>{{ vesselsDisplay(r) }}</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>

<style scoped>
.c-science_report_table--wrap {
	overflow-x: auto;
	border: 1px solid var(--house--border_color-interactive);
	border-radius: var(--house--border_radius, 4px);
}

.c-science_report_table {
	width: 100%;
	border-collapse: collapse;
	font-size: 0.9rem;
}

.c-science_report_table th,
.c-science_report_table td {
	padding: 0.4rem 0.6rem;
	text-align: left;
	border-bottom: 1px solid var(--house--border_color-interactive);
	vertical-align: top;
}

.c-science_report_table th {
	font-weight: 600;
	background: var(--house--color--surface-muted, rgba(0, 0, 0, 0.04));
	white-space: nowrap;
}

.c-science_report_table--sort_th {
	cursor: pointer;
	user-select: none;
}

.c-science_report_table--sort_primary {
	margin-left: 0.25rem;
	font-size: 0.85em;
}

.c-science_report_table--sort_secondary {
	margin-left: 0.15rem;
	font-size: 0.7em;
	opacity: 0.65;
}

.c-science_report_table tbody tr:last-child td {
	border-bottom: none;
}

.c-science_report_table--bar_track {
	height: 0.5rem;
	border-radius: 999px;
	background: var(--house--gray-200);
	overflow: hidden;
	min-width: 6rem;
}

.c-science_report_table--bar_fill {
	height: 100%;
	border-radius: 999px;
	background: var(--house--color--success);
	min-width: 0;
}

.c-science_report_table--science_caption {
	margin: 0.35rem 0 0;
	font-size: 0.85rem;
}

.c-science_report_table--science_sub {
	margin: 0.15rem 0 0;
	font-size: 0.75rem;
	color: var(--house--color--ink-muted);
}

.c-science_report_table--science {
	min-width: 10rem;
}
</style>
