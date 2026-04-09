<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { buildCrewManifestRows, formatCrewManifestMarkdown } from './crew-manifest.util.js'
import { useSaveFileStore } from '../save-file/save-file.store.js'

const saveFile = useSaveFileStore()

const rows = computed(() => {
	if (!saveFile.tree) return []
	return buildCrewManifestRows(saveFile.tree)
})

const markdown = computed(() => formatCrewManifestMarkdown(rows.value))

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
</script>

<template>
	<div class="v-crew-manifest">
		<h1>Crew manifest</h1>
		<p v-if="!saveFile.hasSave" class="lead">
			Load a save from <RouterLink to="/">Home</RouterLink> to see the crew table.
		</p>
		<template v-else>
			<p class="lead">
				Generated from <strong>{{ saveFile.fileName }}</strong> ({{ rows.length }} kerbals).
			</p>
			<div class="v-crew-manifest--actions">
				<button type="button" class="btn btn-primary" @click="copyMarkdown">Copy markdown</button>
				<button type="button" class="btn" @click="downloadMarkdown">Download .md</button>
				<span v-if="copyMessage" class="form_help" role="status">{{ copyMessage }}</span>
			</div>
			<div class="v-crew-manifest--table_wrap">
				<table class="v-crew-manifest--table">
					<thead>
						<tr>
							<th>Kerbal</th>
							<th>Role</th>
							<th>Vessel</th>
							<th>Situation</th>
							<th>Body</th>
							<th>Suit</th>
							<th>Build</th>
							<th>Color</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="(r, idx) in rows" :key="`${r.name}-${idx}`">
							<td>{{ r.name }}</td>
							<td>{{ r.role }}</td>
							<td>{{ r.vessel }}</td>
							<td>{{ r.situation }}</td>
							<td>{{ r.body }}</td>
							<td>{{ r.suit }}</td>
							<td>
								<abbr v-if="r.build" :title="r.build.title">{{ r.build.abbr }}</abbr>
								<span v-else>—</span>
							</td>
							<td>{{ r.color }}</td>
							<td>{{ r.status }}</td>
						</tr>
					</tbody>
				</table>
			</div>
		</template>
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

.v-crew-manifest--table tbody tr:last-child td {
	border-bottom: none;
}
</style>
