<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
	/** Gap between trigger and panel (px). */
	offset: {
		type: Number,
		default: 8,
	},
	/** Where the panel anchors relative to the trigger. */
	placement: {
		type: String,
		default: 'bottom-start',
		/** @param {unknown} v */
		validator: (v) =>
			typeof v === 'string' &&
			['bottom-start', 'bottom-end', 'top-start', 'top-end'].includes(v),
	},
	/**
	 * When set, panel positions relative to this element instead of the default trigger
	 * (e.g. a filter pill while editing). Return null to use the trigger.
	 * @type {(() => HTMLElement | null) | null}
	 */
	getPositionAnchorEl: {
		type: Function,
		default: null,
	},
	/**
	 * If the event target is inside this selector, do not close on outside pointerdown
	 * (e.g. other pills in the same row while switching which filter is edited).
	 */
	ignoreOutsideCloseSelector: {
		type: String,
		default: '',
	},
	/**
	 * When true, panel width follows content (max-content) instead of a wide default min-width.
	 * Still capped by max-width so long copy wraps within the viewport.
	 */
	panelHugContent: {
		type: Boolean,
		default: false,
	},
})

const emit = defineEmits([
	'triggerPointerEnter',
	'triggerPointerLeave',
	'panelPointerEnter',
	'panelPointerLeave',
])

const open = defineModel('open', {
	type: Boolean,
	default: false,
})

const triggerWrapRef = ref(/** @type {HTMLElement | null} */ (null))
const panelRef = ref(/** @type {HTMLElement | null} */ (null))

/** @type {import('vue').Ref<{ top: number, left: number } | null>} */
const panelStyle = ref(null)

/**
 * @param {DOMRect} tr
 * @param {DOMRect} pr
 * @returns {{ top: number, left: number }}
 */
function computePosition(tr, pr) {
	const margin = 8
	const vw = window.innerWidth
	const vh = window.innerHeight
	const off = props.offset
	let top = 0
	let left = 0

	if (props.placement === 'bottom-start') {
		top = tr.bottom + off
		left = tr.left
	} else if (props.placement === 'bottom-end') {
		top = tr.bottom + off
		left = tr.right - pr.width
	} else if (props.placement === 'top-start') {
		top = tr.top - pr.height - off
		left = tr.left
	} else {
		top = tr.top - pr.height - off
		left = tr.right - pr.width
	}

	left = Math.max(margin, Math.min(left, vw - pr.width - margin))
	top = Math.max(margin, Math.min(top, vh - pr.height - margin))
	return { top, left }
}

/**
 * @returns {HTMLElement | null}
 */
function getAnchorElForPosition() {
	const fromProp = props.getPositionAnchorEl?.()
	if (fromProp instanceof HTMLElement) return fromProp
	return triggerWrapRef.value
}

function updatePosition() {
	if (!open.value || !panelRef.value) return
	const anchorEl = getAnchorElForPosition()
	if (!anchorEl) return
	const tr = anchorEl.getBoundingClientRect()
	const pr = panelRef.value.getBoundingClientRect()
	panelStyle.value = computePosition(tr, pr)
}

function onDocPointerDown(/** @type {PointerEvent} */ e) {
	if (!open.value) return
	const t = e.target
	if (!(t instanceof Node)) return
	if (panelRef.value?.contains(t)) return
	if (triggerWrapRef.value?.contains(t)) return
	const anchorEl = getAnchorElForPosition()
	if (anchorEl?.contains(t)) return
	if (
		props.ignoreOutsideCloseSelector &&
		t instanceof Element &&
		t.closest(props.ignoreOutsideCloseSelector)
	) {
		return
	}
	open.value = false
}

function onDocKeydown(/** @type {KeyboardEvent} */ e) {
	if (e.key === 'Escape' && open.value) {
		e.stopPropagation()
		open.value = false
	}
}

function onWinResizeOrScroll() {
	if (open.value) updatePosition()
}

function bindGlobalListeners() {
	document.addEventListener('pointerdown', onDocPointerDown, true)
	document.addEventListener('keydown', onDocKeydown, true)
	window.addEventListener('resize', onWinResizeOrScroll)
	window.addEventListener('scroll', onWinResizeOrScroll, true)
}

function unbindGlobalListeners() {
	document.removeEventListener('pointerdown', onDocPointerDown, true)
	document.removeEventListener('keydown', onDocKeydown, true)
	window.removeEventListener('resize', onWinResizeOrScroll)
	window.removeEventListener('scroll', onWinResizeOrScroll, true)
}

watch(open, async (v) => {
	if (v) {
		bindGlobalListeners()
		panelStyle.value = null
		await nextTick()
		updatePosition()
		await nextTick()
		updatePosition()
	} else {
		unbindGlobalListeners()
		panelStyle.value = null
	}
})

watch(
	() => props.placement,
	() => {
		if (open.value) updatePosition()
	},
)

onBeforeUnmount(() => {
	unbindGlobalListeners()
})

function toggle() {
	open.value = !open.value
}

defineExpose({ toggle, updatePosition })
</script>

<template>
	<div class="c-popover">
		<div
			ref="triggerWrapRef"
			class="c-popover--trigger"
			@click="toggle"
			@pointerenter="emit('triggerPointerEnter', $event)"
			@pointerleave="emit('triggerPointerLeave', $event)"
		>
			<slot />
		</div>
		<Teleport to="body">
			<div
				v-show="open"
				ref="panelRef"
				class="c-popover--panel"
				:class="{ 'c-popover--panel__hug': panelHugContent }"
				role="dialog"
				aria-modal="false"
				@pointerenter="emit('panelPointerEnter', $event)"
				@pointerleave="emit('panelPointerLeave', $event)"
				:style="
					panelStyle
						? {
								top: `${panelStyle.top}px`,
								left: `${panelStyle.left}px`,
								visibility: 'visible',
							}
						: { visibility: 'hidden', top: '0', left: '0' }
				"
			>
				<slot name="panel" />
			</div>
		</Teleport>
	</div>
</template>

<style scoped>
.c-popover {
	display: inline-block;
	max-width: 100%;
	vertical-align: middle;
}

.c-popover--trigger {
	display: inline-block;
	max-width: 100%;
}

.c-popover--panel {
	position: fixed;
	z-index: 1000;
	box-sizing: border-box;
	min-width: min(18rem, calc(100vw - 2rem));
	max-width: min(28rem, calc(100vw - 2rem));
	max-height: min(70vh, calc(100vh - 2rem));
	overflow: auto;
	padding: 0.75rem;
	border: 1px solid var(--house--border_color-interactive);
	border-radius: var(--house--border_radius-sm);
	background: white;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);

	&.c-popover--panel__hug {
		min-width: 0;
		width: max-content;
		max-width: min(28rem, calc(100vw - 2rem));
	}
}
</style>
