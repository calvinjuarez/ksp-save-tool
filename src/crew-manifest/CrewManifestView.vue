<script setup>
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import TableFilter from '../shared/components/TableFilter.component.vue'
import { useTableFilter } from '../shared/table-filter.compose.js'
import { useSaveFileStore } from '../save-file/save-file.store.js'
import CrewManifestTable from './CrewManifestTable.component.vue'
import { useCrewManifestPrefsStore } from './crew-manifest-prefs.store.js'
import { CREW_MANIFEST_FILTER_COLUMNS } from './crew-manifest-filter.const.js'
import {
	formatCrewManifestGroupSummary,
	formatCrewManifestMarksEmojiSuffix,
	groupCrewManifestRows,
	summarizeCrewManifestGroup,
} from './crew-manifest-group.util.js'
import { sortCrewManifestRows } from './crew-manifest-sort.util.js'
import { buildCrewManifestRows, formatCrewManifestMarkdown } from './crew-manifest.util.js'

const saveFile = useSaveFileStore()
const prefs = useCrewManifestPrefsStore()
const { groupBy, primarySort, secondarySort, filters } = storeToRefs(prefs)

const allRows = computed(() => {
	if (!saveFile.tree || !saveFile.saveDerived) return []
	return buildCrewManifestRows(saveFile.tree, saveFile.saveDerived)
})

const { applyTo } = useTableFilter(CREW_MANIFEST_FILTER_COLUMNS, { filters })

const filteredRows = computed(() => applyTo(allRows.value))

const sortedRows = computed(() =>
	sortCrewManifestRows(filteredRows.value, primarySort.value, secondarySort.value),
)

const groups = computed(() => groupCrewManifestRows(sortedRows.value, groupBy.value))

const groupsWithSummary = computed(() =>
	groups.value.map((g) => {
		if (groupBy.value === 'ungrouped') {
			return { ...g, summaryLine: '', titleSuffix: '' }
		}
		const summary = summarizeCrewManifestGroup(g.rows)
		return {
			...g,
			summaryLine: formatCrewManifestGroupSummary(summary, groupBy.value),
			titleSuffix: g.isUnassigned ? '' : formatCrewManifestMarksEmojiSuffix(summary),
		}
	}),
)

const markdown = computed(() =>
	formatCrewManifestMarkdown(sortedRows.value, {
		primary: primarySort.value,
		secondary: secondarySort.value,
		filters: filters.value,
		groupBy: groupBy.value,
	}),
)

const copyMessage = ref('')

function copyMarkdown() {
	const text = markdown.value
	if (!text) return
	void navigator.clipboard.writeText(text).then(() => {
		copyMessage.value = 'Copied.'
		setTimeout(() => {
			copyMessage.value = ''
		}, 2000)
	})
}

function downloadMarkdown() {
	const blob = new Blob([markdown.value], { type: 'text/markdown;charset=utf-8' })
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url
	a.download = 'ksp_krew_manifest_report.md'
	a.click()
	URL.revokeObjectURL(url)
}
</script>

<template>
	<div class="v-crew-manifest">
		<div class="v-crew-manifest--title_row">
			<h2 class="v-crew-manifest--title">Krew Manifest</h2>
			<div class="v-crew-manifest--export">
				<button type="button" class="btn" @click="downloadMarkdown">Download .md</button>
				<button type="button" class="btn" @click="copyMarkdown">Copy Markdown</button>
				<span v-if="copyMessage" class="form_help" role="status">{{ copyMessage }}</span>
			</div>
		</div>
		<p class="lead">
			Generated from <strong>{{ saveFile.fileName }}</strong>
			(<template v-if="filters.length > 0">{{ sortedRows.length }} of {{ allRows.length }}</template>
			<template v-else>{{ sortedRows.length }}</template>
			kerbals).
		</p>
		<div class="v-crew-manifest--toolbar">
			<div class="v-crew-manifest--group_by">
				<label for="crew-manifest-group-by" class="form_label  v-crew-manifest--group_label">Group by</label>
				<select
					id="crew-manifest-group-by"
					v-model="groupBy"
					class="form_control  v-crew-manifest--group_select"
				>
					<option value="ungrouped">Ungrouped</option>
					<option value="location">Location</option>
					<option value="vessel">Vessel</option>
				</select>
			</div>
			<div class="v-crew-manifest--filters">
				<TableFilter
					v-model:filters="filters"
					:column-defs="CREW_MANIFEST_FILTER_COLUMNS"
					:rows="allRows"
				/>
			</div>
		</div>
		<div v-if="filteredRows.length === 0" class="form_help">No kerbals match the current filters.</div>

		<template v-else-if="groupBy === 'ungrouped'">
			<section class="v-crew-manifest--section">
				<CrewManifestTable
					v-model:primary-sort="primarySort"
					v-model:secondary-sort="secondarySort"
					:rows="groups[0].rows"
					:hide-body="false"
					:hide-vessel="false"
				/>
			</section>
		</template>

		<template v-else>
			<section
				v-for="(g, idx) in groupsWithSummary"
				:key="`${groupBy}:${g.key}:${idx}`"
				class="v-crew-manifest--section"
			>
				<details open>
					<summary class="v-crew-manifest--summary_row">
						<div class="v-crew-manifest--summary_main">
							<hgroup class="v-crew-manifest--heading_group">
								<h3 class="v-crew-manifest--heading">
									{{ g.title }}<span
										v-if="g.titleSuffix"
										class="v-crew-manifest--title_marks"
									>{{ ' ' }}{{ g.titleSuffix }}</span>
								</h3>
								<p v-if="g.caption" class="v-crew-manifest--heading_sub">{{ g.caption }}</p>
							</hgroup>
							<p v-if="g.summaryLine" class="v-crew-manifest--summary">{{ g.summaryLine }}</p>
						</div>
					</summary>
					<CrewManifestTable
						v-model:primary-sort="primarySort"
						v-model:secondary-sort="secondarySort"
						:rows="g.rows"
						:hide-body="groupBy === 'location'"
						:hide-vessel="groupBy === 'vessel'"
					/>
				</details>
			</section>
		</template>
	</div>
</template>

<style scoped>
.v-crew-manifest {
	max-width: 100%;
}

.v-crew-manifest--title_row {
	display: flex;
	flex-wrap: wrap;
	align-items: baseline;
	justify-content: space-between;
	gap: 0.75rem 1rem;
	margin-bottom: 0.35rem;
}

.v-crew-manifest--title {
	margin: 0;
}

.v-crew-manifest--export {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.5rem 0.75rem;
}

.v-crew-manifest--toolbar {
	display: flex;
	flex-wrap: wrap;
	align-items: flex-start;
	gap: 0.5rem 0.75rem;
	margin-bottom: 1rem;
}

.v-crew-manifest--group_by {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.35rem 0.5rem;
	flex: 0 0 auto;
}

.v-crew-manifest--group_label {
	margin: 0;
	font-size: var(--house--text--size-small, 0.85rem);
	font-weight: 500;
	white-space: nowrap;
}

.v-crew-manifest--group_select {
	width: auto;
	min-width: 7.5rem;
	max-width: 11rem;
	padding-block: 0.2rem;
	font-size: var(--house--text--size-small, 0.85rem);
}

.v-crew-manifest--filters {
	flex: 1 1 0;
	min-width: 0;
}

/* Toolbar margin-bottom replaces TableFilter’s margin. */
.v-crew-manifest--filters :deep(.c-table-filter) {
	margin-bottom: 0;
	width: 100%;
	min-width: 0;
}

.v-crew-manifest--section {
	margin-bottom: 2rem;
}

.v-crew-manifest--section details > :not(summary) {
	margin-top: 0.75rem;
}

.v-crew-manifest--summary_row {
	/* Keep default `display: list-item` so the disclosure marker stays visible. */
	user-select: none;
}

.v-crew-manifest--summary_main {
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
}

.v-crew-manifest--heading_group {
	display: flex;
	align-items: baseline;
	flex-wrap: wrap;
	gap: 0.5rem;
	margin: 0;
}

.v-crew-manifest--heading {
	margin: 0;
	font-size: 1.15rem;
	font-weight: 600;
}

.v-crew-manifest--heading_sub {
	margin: 0;
	font-size: 0.85rem;
	font-weight: 400;
	color: var(--house--color--ink-muted);
}

.v-crew-manifest--summary {
	margin: 0;
	font-size: 0.9rem;
	color: var(--house--color--ink-muted);
}

.v-crew-manifest--summary_row .v-crew-manifest--summary {
	padding-inline-start: 0.75rem;
}
</style>
