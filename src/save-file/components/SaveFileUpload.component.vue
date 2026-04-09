<script setup>
import FileUpload from '../../shared/components/FileUpload.component.vue'
import { useSaveFileStore } from '../save-file.store.js'

defineProps({
	/** Accessible label for the hidden file input. */
	inputLabel: {
		type: String,
		required: true,
	},
	/** Render the "choose a file" button with primary styling. */
	primary: {
		type: Boolean,
		default: false,
	},
})

const saveFile = useSaveFileStore()

/**
 * @param {File} file
 */
async function onFileSelect(file) {
	await saveFile.loadFromFile(file)
}
</script>

<template>
	<FileUpload accept=".sfs" :input-label="inputLabel" @select="onFileSelect">
		<template #default="{ openFilePicker }">
			<p class="c-save_file_upload--prompt">
				<span class="c-save_file_upload--prompt_text">Drop an <code>.sfs</code> file here, or</span>
				<button
					type="button"
					class="c-save_file_upload--prompt_btn  btn"
					:class="{ 'btn-primary': primary }"
					@click="openFilePicker"
				>choose a file</button>
			</p>
			<p v-if="saveFile.isLoading" class="form_help">Loading…</p>
			<p v-if="saveFile.loadError" class="form_help" role="alert">
				Could not read that file: {{ saveFile.loadError }}
			</p>
		</template>
	</FileUpload>
</template>

<style scoped>
.c-save_file_upload--prompt {
	margin: 0;
}
.c-save_file_upload--prompt_text {
	display: inline flow-root;
	margin-bottom: 0.5rem;
	margin-right: 0.5rem;
}
.c-save_file_upload--prompt_btn {}
</style>
