<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import {
	TABLE_FILTER_ENUM_OP,
	TABLE_FILTER_NUMBER_OPS,
	TABLE_FILTER_STRING_OPS,
} from '../table-filter.const.js'
import {
	formatTableFilterSummary,
	tableFilterColumnDefByKey,
	tableFilterEnumOptions,
	tableFilterNextId,
} from '../table-filter.util.js'
import Popover from './Popover.component.vue'

/**
 * @typedef {import('../table-filter.const.js').TableFilterColumnDef} TableFilterColumnDef
 * @typedef {import('../table-filter.util.js').TableFilter} TableFilter
 */

const props = defineProps({
	/** Column definitions (key, label, type, accessor). */
	columnDefs: {
		type: Array,
		required: true,
	},
	/** Full row set (unfiltered), used to derive enum options. */
	rows: {
		type: Array,
		required: true,
	},
})

const filters = defineModel('filters', {
	type: Array,
	required: true,
})

const builderOpen = ref(false)

/** When set, Apply/Update replaces this filter id instead of appending. */
/** @type {import('vue').Ref<string | null>} */
const editingFilterId = ref(null)

/** Skips `resetDraftForColumn` while hydrating from an existing filter. */
const draftLoadingFromFilter = ref(false)

/** Primary value input to focus after opening the builder to edit. */
/** @type {import('vue').Ref<HTMLElement | null>} */
const valueFocusRef = ref(null)

/** When editing a pill, popover panel anchors to this element; null uses the Add filter trigger. */
/** @type {import('vue').Ref<HTMLElement | null>} */
const popoverPositionAnchorRef = ref(null)

/** @type {import('vue').Ref<{ updatePosition: () => void } | null>} */
const popoverRef = ref(null)

function getPopoverPositionAnchorEl() {
	return popoverPositionAnchorRef.value
}

/** @type {import('vue').Ref<string>} */
const draftColumnKey = ref('')

/** @type {import('vue').Ref<string>} */
const draftOperator = ref('is')

/** @type {import('vue').Ref<string>} */
const draftStringSingle = ref('')

/** One input per value (commas allowed inside a value). */
/** @type {import('vue').Ref<string[]>} */
const draftStringAnyRows = ref([''])

/** One input per number for "= any". */
/** @type {import('vue').Ref<string[]>} */
const draftNumAnyRows = ref([''])

/** @type {import('vue').Ref<string>} */
const draftNumSingle = ref('')

/** @type {import('vue').Ref<string>} */
const draftNumLo = ref('')

/** @type {import('vue').Ref<string>} */
const draftNumHi = ref('')

/** Inclusive lower bound when operator is `between` (pairs with draftNumLo). */
/** @type {import('vue').Ref<boolean>} */
const draftNumLoInclusive = ref(true)

/** Inclusive upper bound when operator is `between` (pairs with draftNumHi). */
/** @type {import('vue').Ref<boolean>} */
const draftNumHiInclusive = ref(true)

/** @type {import('vue').Ref<string[]>} */
const draftEnumSelected = ref([])

/** @type {readonly TableFilterColumnDef[]} */
const columnDefsList = computed(() => /** @type {readonly TableFilterColumnDef[]} */ (props.columnDefs))

const selectedColumnDef = computed(() =>
	tableFilterColumnDefByKey([...columnDefsList.value], draftColumnKey.value),
)

const operatorsForColumn = computed(() => {
	const t = selectedColumnDef.value?.type
	if (t === 'string') return TABLE_FILTER_STRING_OPS
	if (t === 'number') return TABLE_FILTER_NUMBER_OPS
	return []
})

const enumOptions = computed(() => {
	const d = selectedColumnDef.value
	if (!d || d.type !== 'enum') return []
	return tableFilterEnumOptions(props.rows, d.accessor, {
		enumOptionLabel: d.enumOptionLabel,
		enumValueUniverse: d.enumValueUniverse,
		enumOptionCompare: d.enumOptionCompare,
	})
})

/**
 * @returns {string[]}
 */
function nonEmptyStringAnyValues() {
	return draftStringAnyRows.value.map((s) => s.trim()).filter((s) => s.length > 0)
}

/**
 * @returns {string[]}
 */
function nonEmptyNumAnyRaw() {
	return draftNumAnyRows.value.map((s) => s.trim()).filter((s) => s.length > 0)
}

const applyDisabled = computed(() => {
	const d = selectedColumnDef.value
	if (!d) return true
	if (d.type === 'enum') {
		return draftEnumSelected.value.length === 0
	}
	const op = draftOperator.value
	if (d.type === 'string') {
		if (op === 'isAny' || op === 'containsAny') {
			return nonEmptyStringAnyValues().length === 0
		}
		return false
	}
	if (d.type === 'number') {
		if (op === 'between') {
			const lo = Number(draftNumLo.value)
			const hi = Number(draftNumHi.value)
			return !Number.isFinite(lo) || !Number.isFinite(hi)
		}
		if (op === 'eqAny') {
			const parts = nonEmptyNumAnyRaw()
			if (parts.length === 0) return true
			return parts.some((p) => !Number.isFinite(Number(p)))
		}
		return !Number.isFinite(Number(draftNumSingle.value))
	}
	return true
})

/**
 * @param {string} key
 */
function resetDraftForColumn(key) {
	const d = tableFilterColumnDefByKey([...columnDefsList.value], key)
	if (!d) return
	if (d.type === 'enum') {
		draftOperator.value = TABLE_FILTER_ENUM_OP
		draftEnumSelected.value = []
	} else if (d.type === 'string') {
		draftOperator.value = 'is'
		draftStringSingle.value = ''
		draftStringAnyRows.value = ['']
	} else {
		draftOperator.value = 'eq'
		draftNumSingle.value = ''
		draftNumLo.value = ''
		draftNumHi.value = ''
		draftNumLoInclusive.value = true
		draftNumHiInclusive.value = true
		draftNumAnyRows.value = ['']
	}
}

watch(draftColumnKey, (key) => {
	if (draftLoadingFromFilter.value) return
	if (key) resetDraftForColumn(key)
})

watch(builderOpen, (v) => {
	if (!v) {
		editingFilterId.value = null
		popoverPositionAnchorRef.value = null
		return
	}
	if (editingFilterId.value !== null) return
	popoverPositionAnchorRef.value = null
	const first = columnDefsList.value[0]
	if (first) {
		draftColumnKey.value = first.key
		resetDraftForColumn(first.key)
	}
})

watch(popoverPositionAnchorRef, () => {
	if (builderOpen.value) {
		void nextTick(() => {
			popoverRef.value?.updatePosition()
		})
	}
})

watch(
	() => selectedColumnDef.value?.type,
	(t) => {
		if (draftLoadingFromFilter.value) return
		if (t === 'string' && !TABLE_FILTER_STRING_OPS.some((o) => o.key === draftOperator.value)) {
			draftOperator.value = 'is'
		}
		if (t === 'number' && !TABLE_FILTER_NUMBER_OPS.some((o) => o.key === draftOperator.value)) {
			draftOperator.value = 'eq'
		}
	},
)

watch(draftOperator, (op) => {
	if (draftLoadingFromFilter.value) return
	if (op === 'isAny' || op === 'containsAny') {
		if (draftStringAnyRows.value.length === 0) draftStringAnyRows.value = ['']
	}
	if (op === 'eqAny') {
		if (draftNumAnyRows.value.length === 0) draftNumAnyRows.value = ['']
	}
})

function closeBuilder() {
	builderOpen.value = false
	editingFilterId.value = null
}

/**
 * @param {TableFilter} f
 */
function loadFilterIntoDraft(f) {
	draftLoadingFromFilter.value = true
	try {
		draftColumnKey.value = f.columnKey
		draftOperator.value = f.operator
		const d = tableFilterColumnDefByKey([...columnDefsList.value], f.columnKey)
		if (!d) return
		const v = f.value
		if (d.type === 'enum') {
			draftEnumSelected.value = Array.isArray(v) ? v.map((x) => String(x)) : []
		} else if (d.type === 'string') {
			const op = f.operator
			if (op === 'isAny' || op === 'containsAny') {
				draftStringAnyRows.value =
					Array.isArray(v) && v.length > 0 ? v.map((x) => String(x)) : ['']
			} else {
				draftStringSingle.value = v == null ? '' : String(v)
			}
		} else {
			const op = f.operator
			if (op === 'between') {
				if (
					v !== null &&
					typeof v === 'object' &&
					!Array.isArray(v) &&
					'lo' in v &&
					'hi' in v
				) {
					const o = /** @type {{ lo: unknown, hi: unknown, loInclusive?: unknown, hiInclusive?: unknown }} */ (v)
					draftNumLo.value = String(o.lo)
					draftNumHi.value = String(o.hi)
					draftNumLoInclusive.value = o.loInclusive !== false
					draftNumHiInclusive.value = o.hiInclusive !== false
				} else if (Array.isArray(v) && v.length === 2) {
					draftNumLo.value = String(v[0])
					draftNumHi.value = String(v[1])
					draftNumLoInclusive.value = true
					draftNumHiInclusive.value = true
				}
			} else if (op === 'eqAny') {
				draftNumAnyRows.value =
					Array.isArray(v) && v.length > 0 ? v.map((x) => String(x)) : ['']
			} else {
				draftNumSingle.value = v == null ? '' : String(v)
			}
		}
	} finally {
		// Watchers on draftColumnKey / type / operator run after this function returns but
		// before nextTick; keep the guard true until then so resetDraftForColumn does not
		// clobber hydrated values.
		void nextTick(() => {
			draftLoadingFromFilter.value = false
		})
	}
}

/**
 * @param {TableFilter} f
 * @param {MouseEvent} [event]
 */
async function editFilter(f, event) {
	const el = event?.currentTarget
	const pill =
		el instanceof HTMLElement ? el.closest('.c-table-filter--pill') : null
	popoverPositionAnchorRef.value = pill instanceof HTMLElement ? pill : null
	editingFilterId.value = f.id
	loadFilterIntoDraft(f)
	builderOpen.value = true
	await nextTick()
	await nextTick()
	requestAnimationFrame(() => {
		focusValueInputAfterEdit()
	})
}

function focusValueInputAfterEdit() {
	const el = valueFocusRef.value
	if (el instanceof HTMLElement && typeof el.focus === 'function') el.focus()
}

/**
 * @param {unknown} el
 * @param {number} index
 */
function setValueFocusRefFirstRow(el, index) {
	if (index === 0 && el instanceof HTMLElement) valueFocusRef.value = el
}

/**
 * @param {string} id
 */
function removeFilter(id) {
	filters.value = filters.value.filter((f) => f.id !== id)
	if (editingFilterId.value === id) closeBuilder()
}

/**
 * @param {string} value
 * @param {Event} event
 */
function toggleEnumValue(value, event) {
	const el = /** @type {HTMLInputElement | null} */ (event.target)
	const checked = el?.checked === true
	const cur = new Set(draftEnumSelected.value)
	if (checked) cur.add(value)
	else cur.delete(value)
	draftEnumSelected.value = [...cur]
}

function addStringAnyRow() {
	draftStringAnyRows.value = [...draftStringAnyRows.value, '']
}

/**
 * @param {number} index
 */
function removeStringAnyRow(index) {
	if (draftStringAnyRows.value.length <= 1) return
	draftStringAnyRows.value = draftStringAnyRows.value.filter((_, i) => i !== index)
}

function addNumAnyRow() {
	draftNumAnyRows.value = [...draftNumAnyRows.value, '']
}

/**
 * @param {number} index
 */
function removeNumAnyRow(index) {
	if (draftNumAnyRows.value.length <= 1) return
	draftNumAnyRows.value = draftNumAnyRows.value.filter((_, i) => i !== index)
}

function applyDraft() {
	const d = selectedColumnDef.value
	if (!d || applyDisabled.value) return

	/** @type {Omit<TableFilter, 'id'>} */
	let partial

	if (d.type === 'enum') {
		partial = {
			columnKey: d.key,
			operator: TABLE_FILTER_ENUM_OP,
			value: [...draftEnumSelected.value],
		}
	} else if (d.type === 'string') {
		const op = draftOperator.value
		if (op === 'isAny' || op === 'containsAny') {
			partial = {
				columnKey: d.key,
				operator: op,
				value: nonEmptyStringAnyValues(),
			}
		} else {
			partial = {
				columnKey: d.key,
				operator: op,
				value: draftStringSingle.value,
			}
		}
	} else {
		const op = draftOperator.value
		if (op === 'between') {
			partial = {
				columnKey: d.key,
				operator: op,
				value: {
					lo: Number(draftNumLo.value),
					hi: Number(draftNumHi.value),
					loInclusive: draftNumLoInclusive.value,
					hiInclusive: draftNumHiInclusive.value,
				},
			}
		} else if (op === 'eqAny') {
			partial = {
				columnKey: d.key,
				operator: op,
				value: nonEmptyNumAnyRaw().map((p) => Number(p)),
			}
		} else {
			partial = {
				columnKey: d.key,
				operator: op,
				value: Number(draftNumSingle.value),
			}
		}
	}

	const editId = editingFilterId.value
	const next = /** @type {TableFilter} */ ({
		...partial,
		id: editId ?? tableFilterNextId(),
	})
	if (editId !== null) {
		filters.value = filters.value.map((f) => (f.id === editId ? next : f))
	} else {
		filters.value = [...filters.value, next]
	}
	closeBuilder()
}

/**
 * @param {TableFilter} f
 */
function summaryText(f) {
	return formatTableFilterSummary(f, [...columnDefsList.value])
}
</script>

<template>
	<div class="c-table-filter">
		<div class="c-table-filter--bar">
			<div class="c-table-filter--pills">
				<span
					v-for="f in filters"
					:key="f.id"
					class="c-table-filter--pill"
				>
					<button
						type="button"
						class="hitbox  c-table-filter--pill_edit"
						:aria-label="`Edit filter ${summaryText(f)}`"
						@click="editFilter(f, $event)"
					>{{ summaryText(f) }}</button>
					<button
						type="button"
						class="hitbox  c-table-filter--pill_dismiss"
						:aria-label="`Remove filter ${summaryText(f)}`"
						@click.stop="removeFilter(f.id)"
					>&times;</button>
				</span>
			</div>
			<Popover
				ref="popoverRef"
				v-model:open="builderOpen"
				placement="bottom-end"
				:get-position-anchor-el="getPopoverPositionAnchorEl"
				ignore-outside-close-selector=".c-table-filter--pill"
			>
				<button
					type="button"
					class="btn btn-sm btn-nowrap"
					:class="{ selected: builderOpen && editingFilterId === null }"
				>
					{{ builderOpen && editingFilterId === null ? 'Close filter' : 'Add filter' }}
				</button>
				<template #panel>
					<div class="c-table-filter--builder">
						<div class="c-table-filter--row">
							<label class="c-table-filter--field">
								<span class="c-table-filter--label  text-small text-muted">Field</span>
								<select
									v-model="draftColumnKey"
									class="c-table-filter--select"
									:disabled="editingFilterId !== null"
								>
									<option
										v-for="c in columnDefsList"
										:key="c.key"
										:value="c.key"
									>{{ c.label }}</option>
								</select>
							</label>

							<label
								v-if="selectedColumnDef && selectedColumnDef.type !== 'enum'"
								class="c-table-filter--field"
							>
								<span class="c-table-filter--label  text-small text-muted">Operator</span>
								<select v-model="draftOperator" class="c-table-filter--select">
									<option
										v-for="o in operatorsForColumn"
										:key="o.key"
										:value="o.key"
									>{{ o.label }}</option>
								</select>
							</label>
						</div>

						<div v-if="selectedColumnDef?.type === 'string'" class="c-table-filter--row">
							<template v-if="draftOperator === 'is' || draftOperator === 'contains'">
								<label class="c-table-filter--field  c-table-filter--field_grow">
									<span class="c-table-filter--label  text-small text-muted">Value</span>
									<input
										ref="valueFocusRef"
										v-model="draftStringSingle"
										type="text"
										class="c-table-filter--input"
									/>
								</label>
							</template>
							<template v-else>
								<div class="c-table-filter--field  c-table-filter--field_grow  c-table-filter--any_block">
									<span class="c-table-filter--label  text-small text-muted">Values</span>
									<div
										v-for="(_row, i) in draftStringAnyRows"
										:key="`s-${i}`"
										class="c-table-filter--any_row"
									>
										<input
											:ref="(el) => setValueFocusRefFirstRow(el, i)"
											v-model="draftStringAnyRows[i]"
											type="text"
											class="c-table-filter--input  c-table-filter--any_input"
										/>
										<button
											type="button"
											class="btn btn-sm"
											:disabled="draftStringAnyRows.length <= 1"
											@click="removeStringAnyRow(i)"
										>
											Remove
										</button>
									</div>
									<button type="button" class="btn btn-sm" @click="addStringAnyRow">Add value</button>
								</div>
							</template>
						</div>

						<div v-if="selectedColumnDef?.type === 'number'" class="c-table-filter--row">
							<template v-if="draftOperator === 'between'">
								<div class="c-table-filter--field">
									<span class="c-table-filter--label  text-small text-muted">Min</span>
									<input
										ref="valueFocusRef"
										v-model="draftNumLo"
										type="number"
										:step="selectedColumnDef.numberStep"
										class="c-table-filter--input"
									/>
									<label class="form--checkbox  c-table-filter--enum_item">
										<input v-model="draftNumLoInclusive" type="checkbox" />
										Inclusive
									</label>
								</div>
								<div class="c-table-filter--field">
									<span class="c-table-filter--label  text-small text-muted">Max</span>
									<input
										v-model="draftNumHi"
										type="number"
										:step="selectedColumnDef.numberStep"
										class="c-table-filter--input"
									/>
									<label class="form--checkbox  c-table-filter--enum_item">
										<input v-model="draftNumHiInclusive" type="checkbox" />
										Inclusive
									</label>
								</div>
							</template>
							<template v-else-if="draftOperator === 'eqAny'">
								<div class="c-table-filter--field  c-table-filter--field_grow  c-table-filter--any_block">
									<span class="c-table-filter--label  text-small text-muted">Values</span>
									<div
										v-for="(_row, i) in draftNumAnyRows"
										:key="`n-${i}`"
										class="c-table-filter--any_row"
									>
										<input
											:ref="(el) => setValueFocusRefFirstRow(el, i)"
											v-model="draftNumAnyRows[i]"
											type="number"
											inputmode="decimal"
											:step="selectedColumnDef.numberStep"
											class="c-table-filter--input  c-table-filter--any_input"
										/>
										<button
											type="button"
											class="btn btn-sm"
											:disabled="draftNumAnyRows.length <= 1"
											@click="removeNumAnyRow(i)"
										>
											Remove
										</button>
									</div>
									<button type="button" class="btn btn-sm" @click="addNumAnyRow">Add value</button>
								</div>
							</template>
							<template v-else>
								<label class="c-table-filter--field  c-table-filter--field_grow">
									<span class="c-table-filter--label  text-small text-muted">Value</span>
									<input
										ref="valueFocusRef"
										v-model="draftNumSingle"
										type="number"
										inputmode="decimal"
										:step="selectedColumnDef.numberStep"
										class="c-table-filter--input"
									/>
								</label>
							</template>
						</div>

						<div v-if="selectedColumnDef?.type === 'enum'" class="c-table-filter--enum">
							<span class="c-table-filter--label  text-small text-muted">Values</span>
							<div class="c-table-filter--enum_grid">
								<label
									v-for="(opt, ei) in enumOptions"
									:key="opt.value"
									class="form--checkbox  c-table-filter--enum_item"
								>
									<input
										:ref="(el) => setValueFocusRefFirstRow(el, ei)"
										type="checkbox"
										:checked="draftEnumSelected.includes(opt.value)"
										@change="toggleEnumValue(opt.value, $event)"
									/>
									{{ opt.label }}
								</label>
							</div>
						</div>

						<div class="c-table-filter--actions">
							<button
								type="button"
								class="btn btn-sm btn-primary"
								:disabled="applyDisabled"
								@click="applyDraft"
							>
								{{ editingFilterId ? 'Update' : 'Apply' }}
							</button>
							<button type="button" class="btn btn-sm" @click="closeBuilder">Cancel</button>
						</div>
					</div>
				</template>
			</Popover>
		</div>
	</div>
</template>

<style scoped>
.c-table-filter {
	margin-bottom: 1rem;
}

.c-table-filter--bar {
	display: flex;
	flex-wrap: wrap;
	align-items: flex-start;
	justify-content: space-between;
	gap: 0.75rem 1rem;
}

.c-table-filter--pills {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.5rem;
	flex: 1 1 auto;
	min-width: 0;
}

.c-table-filter--pill {
	display: inline-flex;
	align-items: center;
	gap: 0;
	padding: 0;
	font-size: var(--house--text--size-small);
	background: var(--house--gray-100);
	border: 1px solid var(--house--border_color-interactive);
	border-radius: var(--house--border_radius-sm);
	max-width: 100%;
}

.c-table-filter--pill_edit {
	/* Former pill padding split: left / between / top+bottom; hitbox carries reset. */
	padding: 0.25rem 0.35rem 0.25rem 0.5rem;
	text-align: left;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	min-width: 0;
	flex: 1 1 auto;
}

.c-table-filter--pill_edit:hover {
	color: var(--house--color--primary);
}

.c-table-filter--pill_dismiss {
	/* Former pill padding right + slight inset for the ×. */
	padding: 0.25rem 0.5rem 0.25rem 0.15rem;
	line-height: 1;
}

.c-table-filter--pill_dismiss:hover {
	color: var(--house--color--primary);
}

.c-table-filter--builder {
	padding: 0;
}

.c-table-filter--row {
	display: flex;
	flex-wrap: wrap;
	align-items: flex-end;
	gap: 0.75rem 1rem;
	margin-bottom: 0.75rem;
}

.c-table-filter--field {
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
	min-width: 0;
}

.c-table-filter--field_grow {
	flex: 1 1 12rem;
}

.c-table-filter--select,
.c-table-filter--input {
	min-width: 0;
	width: 100%;
	max-width: 100%;
}

.c-table-filter--enum {
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
	margin-bottom: 0.75rem;
}

.c-table-filter--enum_grid {
	display: flex;
	flex-wrap: wrap;
	gap: 0.35rem 1rem;
}

.c-table-filter--enum_item {
	margin: 0;
	font-size: var(--house--text--size-small);
}

.c-table-filter--actions {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.5rem;
}

.c-table-filter--any_block {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	align-items: stretch;
	width: 100%;
}

.c-table-filter--any_row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.5rem;
}

.c-table-filter--any_input {
	flex: 1 1 8rem;
}
</style>
