<script setup>
import { computed, ref } from 'vue'
import Tooltip from '../shared/components/Tooltip.component.vue'
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
 * Earned/cap fraction on the line under the progress bar (Science column).
 *
 * @param {import('./science-report.util.js').ScienceReportRow} r
 */
function scienceEarnedCapRatio(r) {
	if (r.cap <= 0 && r.earned <= 0) return '—'
	if (r.cap <= 0) return formatSciDisplay(r.earned)
	return `${formatSciDisplay(r.earned)}/${formatSciDisplay(r.cap)}`
}

/**
 * Status line under the ratio row (muted): only when there is no R&D cap (“earned” only).
 *
 * @param {import('./science-report.util.js').ScienceReportRow} r
 * @returns {string}
 */
function scienceStatusLine(r) {
	if (r.cap <= 0 && r.earned <= 0) return ''
	if (r.cap <= 0) return 'earned'
	return ''
}

/**
 * Muted text on the same line as X/Y: uncollected sci, or “Fully studied” when uncollected ≤ 0 (cap known).
 *
 * @param {import('./science-report.util.js').ScienceReportRow} r
 * @returns {string}
 */
function scienceRatioMutedSuffix(r) {
	if (r.cap <= 0) return ''
	if (isFullyStudiedNumerically(r)) return 'Fully studied'
	if (r.remaining <= 0) return ''
	if (r.remaining > 0 && r.remaining < TRACE_UNCOLLECTED_THRESHOLD) {
		return `< ${TRACE_UNCOLLECTED_THRESHOLD} uncollected`
	}
	return `${formatSciDisplay(r.remaining)} uncollected`
}

/**
 * Vessel name for table display: parenthetical segments removed, whitespace collapsed.
 *
 * @param {string} name
 */
function vesselNameWithoutParentheticals(name) {
	const stripped = name.replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim()
	return stripped.length > 0 ? stripped : name
}

/**
 * @param {string} name
 */
function vesselNameHasStrippableParenthetical(name) {
	return vesselNameWithoutParentheticals(name) !== name
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
						<div class="c-science_report_table--science_bar_host">
							<progress
								class="c-science_report_table--bar_progress"
								:value="r.cap > 0 ? r.earned : 0"
								:max="r.cap > 0 ? r.cap : 1"
							/>
						</div>
						<p class="c-science_report_table--science_ratio_row">
							<span class="c-science_report_table--science_ratio">{{ scienceEarnedCapRatio(r) }}</span>
							<span
								v-if="scienceRatioMutedSuffix(r)"
								:class="[
									'c-science_report_table--science_ratio_muted',
									'text-small-muted',
									isFullyStudiedNumerically(r) && 'c-science_report_table--science_fully_studied',
								]"
							>{{ scienceRatioMutedSuffix(r) }}</span>
						</p>
						<p
							v-if="scienceStatusLine(r)"
							class="c-science_report_table--science_note  text-small-muted"
						>
							{{ scienceStatusLine(r) }}
						</p>
					</td>
					<td>
						<template v-if="r.onboardData <= 0">—</template>
						<template v-else>
							{{ formatSciDisplay(r.onboardData) }} mits
							<span class="text-small-muted  text-nowrap">
								{{ formatSciDisplay(r.onboardDataTransmissible) }} transmissible
							</span>
						</template>
					</td>
					<td>
						<dl
							v-if="r.vessels.length > 0"
							class="c-science_report_table--vessels_dl"
						>
							<template v-for="v in r.vessels" :key="v.vesselName">
								<dt>
									<Tooltip
										v-if="vesselNameHasStrippableParenthetical(v.vesselName)"
										as="abbr"
										:label="v.vesselName"
									>
										{{ vesselNameWithoutParentheticals(v.vesselName) }}
									</Tooltip>
									<template v-else>{{ v.vesselName }}</template>
								</dt>
								<dd class="text-small-muted">{{ formatSciDisplay(v.data) }} mits</dd>
							</template>
						</dl>
						<template v-else>—</template>
					</td>
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

.c-science_report_table--science_bar_host {
	width: 100%;
	min-width: 0;
}

.c-science_report_table--science_ratio_row {
	display: flex;
	flex-wrap: wrap;
	align-items: baseline;
	gap: 0.5rem;
	margin: 0.35rem 0 0;
	line-height: 1.35;
}

.c-science_report_table--science_ratio {
	font: inherit;
	color: inherit;
	font-variant-numeric: tabular-nums;
	white-space: nowrap;
}

.c-science_report_table--science_ratio_muted {
	white-space: nowrap;
}

.c-science_report_table--science_fully_studied {
	font-style: italic;
}

.c-science_report_table--bar_progress {
	display: block;
	width: 100%;
	height: 0.5rem;
	min-width: 6rem;
	border: none;
	border-radius: 999px;
	overflow: hidden;
	appearance: none;
	accent-color: var(--house--color--success);
	background: var(--house--gray-200);
}

.c-science_report_table--bar_progress::-webkit-progress-bar {
	background: var(--house--gray-200);
	border-radius: 999px;
}

.c-science_report_table--bar_progress::-webkit-progress-value {
	background: var(--house--color--success);
	border-radius: 999px;
}

.c-science_report_table--bar_progress::-moz-progress-bar {
	background: var(--house--color--success);
	border-radius: 999px;
}

.c-science_report_table--science_note {
	margin: 0.35rem 0 0;
	line-height: 1.35;
}

.c-science_report_table--science_note + .c-science_report_table--science_note {
	margin-top: 0.15rem;
}

.c-science_report_table--science {
	min-width: 14rem;
}

.c-science_report_table--vessels_dl {
	margin: 0;
}

.c-science_report_table--vessels_dl dt {
	margin: 0.35rem 0 0;
	font-weight: inherit;
}

.c-science_report_table--vessels_dl dt:first-child {
	margin-top: 0;
}

.c-science_report_table--vessels_dl dd {
	margin: 0;
	font-variant-numeric: tabular-nums;
}
</style>
