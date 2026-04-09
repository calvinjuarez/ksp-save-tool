import { parse } from 'ksp-confignode'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { crewCountFromTree, gameTitleFromTree, vesselCountFromTree } from './save-file.util.js'

export const useSaveFileStore = defineStore('saveFile', () => {
	/** @type {import('vue').Ref<Record<string, unknown> | null>} */
	const tree = ref(null)
	const fileName = ref('')
	const fileSize = ref(0)
	const lastModified = ref(/** @type {number | null} */ (null))
	const loadError = ref(/** @type {string | null} */ (null))
	const isLoading = ref(false)

	const gameTitle = computed(() => gameTitleFromTree(tree.value ?? undefined))
	const vesselCount = computed(() => vesselCountFromTree(tree.value ?? undefined))
	const crewCount = computed(() => crewCountFromTree(tree.value ?? undefined))
	const hasSave = computed(() => tree.value !== null && loadError.value === null)

	/**
	 * @param {File} file
	 */
	async function loadFromFile(file) {
		loadError.value = null
		isLoading.value = true
		fileName.value = file.name
		fileSize.value = file.size
		lastModified.value = file.lastModified
		tree.value = null

		try {
			const text = await file.text()
			tree.value = parse(text)
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err)
			loadError.value = message
			tree.value = null
		} finally {
			isLoading.value = false
		}
	}

	function clear() {
		tree.value = null
		fileName.value = ''
		fileSize.value = 0
		lastModified.value = null
		loadError.value = null
		isLoading.value = false
	}

	return {
		tree,
		fileName,
		fileSize,
		lastModified,
		loadError,
		isLoading,
		gameTitle,
		vesselCount,
		crewCount,
		hasSave,
		loadFromFile,
		clear,
	}
})
