<script setup>
import Tooltip from '../shared/components/Tooltip.component.vue'
import { kerbalDisplayName } from '../ksp/kerbal.util.js'
import { humanizeVesselSituation } from '../ksp/vessel-situation.util.js'
import {
	cycleCrewManifestSortDirForColumn,
	initialCrewManifestSortDirForColumn,
} from './crew-manifest-sort.util.js'
import {
	formatCrewManifestRankTooltipLabel,
	rankToStars,
} from './crew-manifest.util.js'

/** @typedef {import('./crew-manifest-sort.util.js').CrewManifestSortColumn} CrewManifestSortColumn */

const props = defineProps({
	rows: {
		type: Array,
		required: true,
	},
	primarySort: {
		type: Object,
		required: true,
	},
	secondarySort: {
		type: Object,
		required: true,
	},
	hideBody: {
		type: Boolean,
		default: false,
	},
	hideSituation: {
		type: Boolean,
		default: false,
	},
	hideVessel: {
		type: Boolean,
		default: false,
	},
})

const emit = defineEmits(['update:primarySort', 'update:secondarySort'])

/**
 * @param {CrewManifestSortColumn} key
 * @param {MouseEvent} event
 */
function onSortHeaderClick(key, event) {
	if (event.shiftKey) {
		if (props.primarySort.key === key) return
		if (props.secondarySort.key === key) {
			const next = cycleCrewManifestSortDirForColumn(key, props.secondarySort.dir)
			if (next === null) emit('update:secondarySort', { key: null, dir: null })
			else emit('update:secondarySort', { key, dir: next })
		} else {
			emit('update:secondarySort', { key, dir: initialCrewManifestSortDirForColumn(key) })
		}
		return
	}

	emit('update:secondarySort', { key: null, dir: null })
	if (props.primarySort.key === key) {
		const next = cycleCrewManifestSortDirForColumn(key, props.primarySort.dir)
		if (next === null) emit('update:primarySort', { key: null, dir: null })
		else emit('update:primarySort', { key, dir: next })
	} else {
		emit('update:primarySort', { key, dir: initialCrewManifestSortDirForColumn(key) })
	}
}

/**
 * @param {CrewManifestSortColumn} key
 * @param {'primary'|'secondary'} which
 */
function sortIndicator(key, which) {
	const spec = which === 'primary' ? props.primarySort : props.secondarySort
	if (spec.key !== key || spec.dir === null) return ''
	return spec.dir === 'asc' ? '\u2191' : '\u2193'
}
</script>

<template>
	<div class="c-crew_manifest_table--wrap">
		<table class="c-crew_manifest_table">
			<thead>
				<tr>
					<th class="c-crew_manifest_table--sort_th" @click="onSortHeaderClick('name', $event)">
						Name
						<span class="c-crew_manifest_table--sort_primary">{{ sortIndicator('name', 'primary') }}</span>
						<span class="c-crew_manifest_table--sort_secondary">{{ sortIndicator('name', 'secondary') }}</span>
					</th>
					<th class="c-crew_manifest_table--sort_th" @click="onSortHeaderClick('mark', $event)">
						Mark
						<span class="c-crew_manifest_table--sort_primary">{{ sortIndicator('mark', 'primary') }}</span>
						<span class="c-crew_manifest_table--sort_secondary">{{ sortIndicator('mark', 'secondary') }}</span>
					</th>
					<th class="c-crew_manifest_table--sort_th" @click="onSortHeaderClick('role', $event)">
						Role
						<span class="c-crew_manifest_table--sort_primary">{{ sortIndicator('role', 'primary') }}</span>
						<span class="c-crew_manifest_table--sort_secondary">{{ sortIndicator('role', 'secondary') }}</span>
					</th>
					<th class="c-crew_manifest_table--sort_th" @click="onSortHeaderClick('rank', $event)">
						Rank
						<span class="c-crew_manifest_table--sort_primary">{{ sortIndicator('rank', 'primary') }}</span>
						<span class="c-crew_manifest_table--sort_secondary">{{ sortIndicator('rank', 'secondary') }}</span>
					</th>
					<th
						v-if="!hideVessel"
						class="c-crew_manifest_table--sort_th"
						@click="onSortHeaderClick('vessel', $event)"
					>
						Vessel
						<span class="c-crew_manifest_table--sort_primary">{{ sortIndicator('vessel', 'primary') }}</span>
						<span class="c-crew_manifest_table--sort_secondary">{{ sortIndicator('vessel', 'secondary') }}</span>
					</th>
					<th
						v-if="!hideSituation"
						class="c-crew_manifest_table--sort_th"
						@click="onSortHeaderClick('situation', $event)"
					>
						Situation
						<span class="c-crew_manifest_table--sort_primary">{{ sortIndicator('situation', 'primary') }}</span>
						<span class="c-crew_manifest_table--sort_secondary">{{ sortIndicator('situation', 'secondary') }}</span>
					</th>
					<th
						v-if="!hideBody"
						class="c-crew_manifest_table--sort_th"
						@click="onSortHeaderClick('body', $event)"
					>
						Location
						<span class="c-crew_manifest_table--sort_primary">{{ sortIndicator('body', 'primary') }}</span>
						<span class="c-crew_manifest_table--sort_secondary">{{ sortIndicator('body', 'secondary') }}</span>
					</th>
					<th class="c-crew_manifest_table--sort_th" @click="onSortHeaderClick('suit', $event)">
						Suit
						<span class="c-crew_manifest_table--sort_primary">{{ sortIndicator('suit', 'primary') }}</span>
						<span class="c-crew_manifest_table--sort_secondary">{{ sortIndicator('suit', 'secondary') }}</span>
					</th>
					<th class="c-crew_manifest_table--sort_th" @click="onSortHeaderClick('bodyModel', $event)">
						Model
						<span class="c-crew_manifest_table--sort_primary">{{ sortIndicator('bodyModel', 'primary') }}</span>
						<span class="c-crew_manifest_table--sort_secondary">{{ sortIndicator('bodyModel', 'secondary') }}</span>
					</th>
					<th class="c-crew_manifest_table--sort_th" @click="onSortHeaderClick('color', $event)">
						Color
						<span class="c-crew_manifest_table--sort_primary">{{ sortIndicator('color', 'primary') }}</span>
						<span class="c-crew_manifest_table--sort_secondary">{{ sortIndicator('color', 'secondary') }}</span>
					</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="(r, idx) in rows" :key="`${r.name}-${idx}`">
					<td>{{ kerbalDisplayName(r.name) }}</td>
					<td>
						<Tooltip v-if="r.mark" as="abbr" :label="r.mark.title">{{ r.mark.emoji }}</Tooltip>
					</td>
					<td>{{ r.role }}</td>
					<td class="c-crew_manifest_table--rank_cell">
						<Tooltip
							as="text"
							:label="formatCrewManifestRankTooltipLabel(r.rank, r.totalXp)"
						>
							{{ rankToStars(r.rank) }}
						</Tooltip>
					</td>
					<td v-if="!hideVessel">{{ r.vessel }}</td>
					<td v-if="!hideSituation">{{ humanizeVesselSituation(r.situation) }}</td>
					<td v-if="!hideBody">{{ r.body }}</td>
					<td>{{ r.suit }}</td>
					<td>
						<Tooltip v-if="r.bodyModel" as="abbr" :label="r.bodyModel.title">{{ r.bodyModel.abbr }}</Tooltip>
						<span v-else>—</span>
					</td>
					<td>{{ r.color }}</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>

<style scoped>
.c-crew_manifest_table--wrap {
	overflow-x: auto;
	border: 1px solid var(--house--border_color-interactive);
	border-radius: var(--house--border_radius, 4px);
}

.c-crew_manifest_table {
	width: 100%;
	border-collapse: collapse;
	font-size: 0.9rem;
}

.c-crew_manifest_table th,
.c-crew_manifest_table td {
	padding: 0.4rem 0.6rem;
	text-align: left;
	border-bottom: 1px solid var(--house--border_color-interactive);
	vertical-align: top;
}

.c-crew_manifest_table th {
	font-weight: 600;
	background: var(--house--color--surface-muted, rgba(0, 0, 0, 0.04));
	white-space: nowrap;
}

.c-crew_manifest_table--sort_th {
	cursor: pointer;
	user-select: none;
}

.c-crew_manifest_table--sort_primary {
	margin-left: 0.25rem;
	font-size: 0.85em;
}

.c-crew_manifest_table--sort_secondary {
	margin-left: 0.15rem;
	font-size: 0.7em;
	opacity: 0.65;
}

.c-crew_manifest_table tbody tr:last-child td {
	border-bottom: none;
}

.c-crew_manifest_table--rank_cell {
	white-space: nowrap;
}
</style>
