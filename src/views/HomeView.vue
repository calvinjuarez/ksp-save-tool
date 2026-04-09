<script setup>
import { ref } from 'vue'
import { APP_DESCRIPTION, APP_NAME } from '../app.meta.js'
import { useSaveFileStore } from '../stores/save-file.js'

const saveFile = useSaveFileStore()
const fileInputRef = ref(/** @type {HTMLInputElement | null} */ (null))
const isDragActive = ref(false)

function openFilePicker() {
	fileInputRef.value?.click()
}

/**
 * @param {FileList | null} list
 */
async function handleFiles(list) {
	const file = list?.[0]
	if (!file) return
	await saveFile.loadFromFile(file)
}

/**
 * @param {Event} event
 */
function onFileInputChange(event) {
	const input = /** @type {HTMLInputElement} */ (event.target)
	void handleFiles(input.files)
	input.value = ''
}

/**
 * @param {DragEvent} event
 */
function onDragOver(event) {
	event.preventDefault()
	event.dataTransfer.dropEffect = 'copy'
	isDragActive.value = true
}

/**
 * @param {DragEvent} event
 */
function onDragLeave(event) {
	if (!event.currentTarget?.contains(/** @type {Node | null} */ (event.relatedTarget))) {
		isDragActive.value = false
	}
}

/**
 * @param {DragEvent} event
 */
async function onDrop(event) {
	event.preventDefault()
	isDragActive.value = false
	await handleFiles(event.dataTransfer?.files ?? null)
}
</script>

<template>
	<div class="v-home">
		<h1>{{ APP_NAME }}</h1>
		<p class="lead">
			{{ APP_DESCRIPTION }} Upload a save file below to parse it in the browser.
		</p>

		<input
			ref="fileInputRef"
			class="v-home--file_input"
			type="file"
			accept=".sfs"
			@change="onFileInputChange"
		/>

		<div
			class="drop_zone  card  l-stack"
			:class="{ 'drop_zone--active': isDragActive }"
			@dragover="onDragOver"
			@dragleave="onDragLeave"
			@drop="onDrop"
		>
			<p class="drop_zone--text">
				Drop an <code>.sfs</code> file here, or
				<button type="button" class="btn  btn-primary" @click="openFilePicker">choose a file</button>
			</p>
			<p v-if="saveFile.isLoading" class="form_help">Loading…</p>
			<p v-if="saveFile.loadError" class="form_help" role="alert">
				Could not read that file: {{ saveFile.loadError }}
			</p>
		</div>

		<section v-if="saveFile.hasSave" class="l-stack  l-stack--tight  card  card-vw_400_up" aria-live="polite">
			<h2 class="v-home--summary_heading">Loaded save</h2>
			<dl class="v-home--summary">
				<div class="v-home--summary_row">
					<dt>File</dt>
					<dd>{{ saveFile.fileName }}</dd>
				</div>
				<div class="v-home--summary_row">
					<dt>Game title</dt>
					<dd>{{ saveFile.gameTitle }}</dd>
				</div>
				<div class="v-home--summary_row">
					<dt>Vessels</dt>
					<dd>{{ saveFile.vesselCount }}</dd>
				</div>
				<div class="v-home--summary_row">
					<dt>Crew (ROSTER)</dt>
					<dd>{{ saveFile.crewCount }}</dd>
				</div>
			</dl>
		</section>
	</div>
</template>

<style scoped>
.v-home {
	max-width: var(--house--page--max_width);
}

.v-home--file_input {
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	border: 0;
}

.drop_zone {
	padding: 1.25rem 1rem;
	border-style: dashed;
	transition: border-color 0.15s ease, background 0.15s ease;
}

.drop_zone--active {
	border-color: var(--house--color--primary);
	background: var(--house--color--primary-faint);
}

.drop_zone--text {
	margin: 0;
}

.v-home--summary_heading {
	margin: 0 0 0.5rem;
	font-size: 1.1rem;
}

.v-home--summary {
	margin: 0;
	display: grid;
	gap: 0.5rem 1rem;
}

@media (min-width: 400px) {
	.v-home--summary {
		grid-template-columns: auto 1fr;
	}
}

.v-home--summary_row {
	display: contents;
}

.v-home--summary dt {
	margin: 0;
	font-weight: 600;
	color: var(--house--color--ink-muted);
}

.v-home--summary dd {
	margin: 0;
}
</style>
