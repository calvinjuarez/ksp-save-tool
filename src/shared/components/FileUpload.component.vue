<script setup>
import { ref } from 'vue'

const props = defineProps({
	/** `accept` attribute for the file input (e.g. `".sfs"`). */
	accept: {
		type: String,
		default: '',
	},
	/** Accessible label for the hidden file input. */
	inputLabel: {
		type: String,
		default: 'Choose file',
	},
})

const emit = defineEmits({
	/**
	 * @param {File} file
	 */
	select: (file) => file instanceof File,
})

const fileInputRef = ref(/** @type {HTMLInputElement | null} */ (null))
const isDragActive = ref(false)

function openFilePicker() {
	fileInputRef.value?.click()
}

defineExpose({ openFilePicker })

/**
 * @param {FileList | null} list
 */
function pickFirstFile(list) {
	const file = list?.[0]
	if (file) emit('select', file)
}

/**
 * @param {Event} event
 */
function onFileInputChange(event) {
	const input = /** @type {HTMLInputElement} */ (event.target)
	pickFirstFile(input.files)
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
function onDrop(event) {
	event.preventDefault()
	isDragActive.value = false
	pickFirstFile(event.dataTransfer?.files ?? null)
}
</script>

<template>
	<div
		class="c-file_upload  card  l-stack"
		:class="{ 'c-file_upload--active': isDragActive }"
		@dragover="onDragOver"
		@dragleave="onDragLeave"
		@drop="onDrop"
	>
		<input
			ref="fileInputRef"
			class="c-file_upload--input"
			type="file"
			:accept="accept"
			:aria-label="inputLabel"
			@change="onFileInputChange"
		/>
		<slot :open-file-picker="openFilePicker" />
	</div>
</template>

<style scoped>
.c-file_upload {
	padding: 1.25rem 1rem;
	border: 1px dashed var(--house--border_color-interactive);
	border-radius: var(--house--border_radius-lg);
	background: white;
	transition: border-color 0.15s ease, background 0.15s ease;
}

.c-file_upload:hover:not(.c-file_upload--active) {
	border-color: var(--house--border_color-interactive_hover);
}

.c-file_upload--active {
	border-color: var(--house--color--primary);
	background: var(--house--color--primary-faint);
}

.c-file_upload--input {
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
</style>
