<script setup>
import { computed, ref } from 'vue'
import TableFilter from '../shared/components/TableFilter.component.vue'
import { useTableFilter } from '../shared/table-filter.compose.js'
import { kerbalDisplayName } from '../ksp/kerbal.util.js'
import { useSaveFileStore } from '../save-file/save-file.store.js'
import { CREW_MANIFEST_FILTER_COLUMNS } from './crew-manifest-filter.const.js'
import {
	cycleCrewManifestSortDirForColumn,
	initialCrewManifestSortDirForColumn,
	sortCrewManifestRows,
} from './crew-manifest-sort.util.js'
import {
	buildCrewManifestRows,
	formatCrewManifestMarkdown,
	formatTotalXpDisplay,
	rankToStars,
} from './crew-manifest.util.js'

/** @typedef {import('./crew-manifest-sort.util.js').CrewManifestSortColumn} CrewManifestSortColumn */

const saveFile = useSaveFileStore()

const allRows = computed(() => {
	if (!saveFile.tree) return []
	return buildCrewManifestRows(saveFile.tree)
})

const { filters, applyTo } = useTableFilter(CREW_MANIFEST_FILTER_COLUMNS)

const filteredRows = computed(() => applyTo(allRows.value))

/** @type {import('vue').Ref<import('./crew-manifest-sort.util.js').CrewManifestSortSpec>} */
const primarySort = ref({ key: 'body', dir: 'asc' })

/** @type {import('vue').Ref<import('./crew-manifest-sort.util.js').CrewManifestSortSpec>} */
const secondarySort = ref({ key: 'vessel', dir: 'asc' })

const sortedRows = computed(() =>
	sortCrewManifestRows(filteredRows.value, primarySort.value, secondarySort.value),
)

const markdown = computed(() =>
	formatCrewManifestMarkdown(sortedRows.value, {
		primary: primarySort.value,
		secondary: secondarySort.value,
		filters: filters.value,
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
	a.download = 'ksp_crew_manifest_report.md'
	a.click()
	URL.revokeObjectURL(url)
}

/**
 * @param {CrewManifestSortColumn} key
 * @param {MouseEvent} event
 */
function onSortHeaderClick(key, event) {
	if (event.shiftKey) {
		if (primarySort.value.key === key) return
		if (secondarySort.value.key === key) {
			const next = cycleCrewManifestSortDirForColumn(key, secondarySort.value.dir)
			if (next === null) secondarySort.value = { key: null, dir: null }
			else secondarySort.value = { key, dir: next }
		} else {
			secondarySort.value = { key, dir: initialCrewManifestSortDirForColumn(key) }
		}
		return
	}

	secondarySort.value = { key: null, dir: null }
	if (primarySort.value.key === key) {
		const next = cycleCrewManifestSortDirForColumn(key, primarySort.value.dir)
		if (next === null) primarySort.value = { key: null, dir: null }
		else primarySort.value = { key, dir: next }
	} else {
		primarySort.value = { key, dir: initialCrewManifestSortDirForColumn(key) }
	}
}

/**
 * @param {CrewManifestSortColumn} key
 * @param {'primary'|'secondary'} which
 */
function sortIndicator(key, which) {
	const spec = which === 'primary' ? primarySort.value : secondarySort.value
	if (spec.key !== key || spec.dir === null) return ''
	return spec.dir === 'asc' ? '\u2191' : '\u2193'
}
</script>

<template>
	<div class="v-crew-manifest">
		<h2>Crew Manifest</h2>
		<p class="lead">
			Generated from <strong>{{ saveFile.fileName }}</strong>
			(<template v-if="filters.length > 0">{{ sortedRows.length }} of {{ allRows.length }}</template>
			<template v-else>{{ sortedRows.length }}</template>
			kerbals).
		</p>
		<div class="v-crew-manifest--actions">
			<button type="button" class="btn" @click="downloadMarkdown">Download .md</button>
			<button type="button" class="btn" @click="copyMarkdown">Copy Markdown</button>
			<span v-if="copyMessage" class="form_help" role="status">{{ copyMessage }}</span>
		</div>
		<TableFilter
			v-model:filters="filters"
			:column-defs="CREW_MANIFEST_FILTER_COLUMNS"
			:rows="allRows"
		/>
		<div class="v-crew-manifest--table_wrap">
			<table class="v-crew-manifest--table">
				<thead>
					<tr>
						<th class="v-crew-manifest--sort_th" @click="onSortHeaderClick('name', $event)">
							Name
							<span class="v-crew-manifest--sort_primary">{{ sortIndicator('name', 'primary') }}</span>
							<span class="v-crew-manifest--sort_secondary">{{ sortIndicator('name', 'secondary') }}</span>
						</th>
						<th class="v-crew-manifest--sort_th" @click="onSortHeaderClick('mark', $event)">
							Mark
							<span class="v-crew-manifest--sort_primary">{{ sortIndicator('mark', 'primary') }}</span>
							<span class="v-crew-manifest--sort_secondary">{{ sortIndicator('mark', 'secondary') }}</span>
						</th>
						<th class="v-crew-manifest--sort_th" @click="onSortHeaderClick('role', $event)">
							Role
							<span class="v-crew-manifest--sort_primary">{{ sortIndicator('role', 'primary') }}</span>
							<span class="v-crew-manifest--sort_secondary">{{ sortIndicator('role', 'secondary') }}</span>
						</th>
						<th class="v-crew-manifest--sort_th" @click="onSortHeaderClick('rank', $event)">
							Rank
							<span class="v-crew-manifest--sort_primary">{{ sortIndicator('rank', 'primary') }}</span>
							<span class="v-crew-manifest--sort_secondary">{{ sortIndicator('rank', 'secondary') }}</span>
						</th>
						<th class="v-crew-manifest--sort_th" @click="onSortHeaderClick('vessel', $event)">
							Vessel
							<span class="v-crew-manifest--sort_primary">{{ sortIndicator('vessel', 'primary') }}</span>
							<span class="v-crew-manifest--sort_secondary">{{ sortIndicator('vessel', 'secondary') }}</span>
						</th>
						<th class="v-crew-manifest--sort_th" @click="onSortHeaderClick('situation', $event)">
							Situation
							<span class="v-crew-manifest--sort_primary">{{ sortIndicator('situation', 'primary') }}</span>
							<span class="v-crew-manifest--sort_secondary">{{ sortIndicator('situation', 'secondary') }}</span>
						</th>
						<th class="v-crew-manifest--sort_th" @click="onSortHeaderClick('body', $event)">
							At
							<span class="v-crew-manifest--sort_primary">{{ sortIndicator('body', 'primary') }}</span>
							<span class="v-crew-manifest--sort_secondary">{{ sortIndicator('body', 'secondary') }}</span>
						</th>
						<th class="v-crew-manifest--sort_th" @click="onSortHeaderClick('suit', $event)">
							Suit
							<span class="v-crew-manifest--sort_primary">{{ sortIndicator('suit', 'primary') }}</span>
							<span class="v-crew-manifest--sort_secondary">{{ sortIndicator('suit', 'secondary') }}</span>
						</th>
						<th class="v-crew-manifest--sort_th" @click="onSortHeaderClick('build', $event)">
							Build
							<span class="v-crew-manifest--sort_primary">{{ sortIndicator('build', 'primary') }}</span>
							<span class="v-crew-manifest--sort_secondary">{{ sortIndicator('build', 'secondary') }}</span>
						</th>
						<th class="v-crew-manifest--sort_th" @click="onSortHeaderClick('color', $event)">
							Color
							<span class="v-crew-manifest--sort_primary">{{ sortIndicator('color', 'primary') }}</span>
							<span class="v-crew-manifest--sort_secondary">{{ sortIndicator('color', 'secondary') }}</span>
						</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(r, idx) in sortedRows" :key="`${r.name}-${idx}`">
						<td>{{ kerbalDisplayName(r.name) }}</td>
						<td>
							<abbr
								v-if="r.mark"
								:title="r.mark.title"
								:aria-label="r.mark.title"
							>{{ r.mark.emoji }}</abbr>
						</td>
						<td>{{ r.role }}</td>
						<td class="v-crew-manifest--rank_cell">
							<abbr
								class="v-crew-manifest--rank_abbr"
								:title="`Rank ${r.rank}; XP ${formatTotalXpDisplay(r.totalXp)}`"
								:aria-label="`Rank ${r.rank}; XP ${formatTotalXpDisplay(r.totalXp)}`"
							>{{ rankToStars(r.rank) }}</abbr>
						</td>
						<td>{{ r.vessel }}</td>
						<td>{{ r.situation }}</td>
						<td>{{ r.body }}</td>
						<td>{{ r.suit }}</td>
						<td>
							<abbr v-if="r.build" :title="r.build.title">{{ r.build.abbr }}</abbr>
							<span v-else>—</span>
						</td>
						<td>{{ r.color }}</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</template>

<style scoped>
.v-crew-manifest {
	max-width: 100%;
}

.v-crew-manifest--actions {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.75rem 1rem;
	margin-bottom: 1rem;
}

.v-crew-manifest--table_wrap {
	overflow-x: auto;
	border: 1px solid var(--house--border_color-interactive);
	border-radius: var(--house--border_radius, 4px);
}

.v-crew-manifest--table {
	width: 100%;
	border-collapse: collapse;
	font-size: 0.9rem;
}

.v-crew-manifest--table th,
.v-crew-manifest--table td {
	padding: 0.4rem 0.6rem;
	text-align: left;
	border-bottom: 1px solid var(--house--border_color-interactive);
	vertical-align: top;
}

.v-crew-manifest--table th {
	font-weight: 600;
	background: var(--house--color--surface-muted, rgba(0, 0, 0, 0.04));
	white-space: nowrap;
}

.v-crew-manifest--sort_th {
	cursor: pointer;
	user-select: none;
}

.v-crew-manifest--sort_primary {
	margin-left: 0.25rem;
	font-size: 0.85em;
}

.v-crew-manifest--sort_secondary {
	margin-left: 0.15rem;
	font-size: 0.7em;
	opacity: 0.65;
}

.v-crew-manifest--table tbody tr:last-child td {
	border-bottom: none;
}

.v-crew-manifest--rank_cell {
	white-space: nowrap;
}

.v-crew-manifest--rank_abbr {
	cursor: help;
}
</style>
