<script setup>
import { onBeforeUnmount, useId } from 'vue'
import Popover from './Popover.component.vue'

/** Delay before opening on hover (fine pointer + hover-capable UA), similar to native `title`. */
const HOVER_OPEN_MS = 450
/** Time to move from trigger to teleported panel without closing. */
const HOVER_CLOSE_GRACE_MS = 220

const props = defineProps({
	/** Hint text; shown in the panel and exposed to assistive tech on the trigger. */
	label: {
		type: String,
		required: true,
	},
	/**
	 * Trigger presentation: real button, inline abbr-like span, or block cell wrapper.
	 * @type {'button' | 'abbr-like' | 'cell'}
	 */
	as: {
		type: String,
		default: 'abbr-like',
		/** @param {unknown} v */
		validator: (v) => typeof v === 'string' && ['button', 'abbr-like', 'cell'].includes(v),
	},
})

const open = defineModel('open', {
	type: Boolean,
	default: false,
})

const tipId = useId()

/** @type {ReturnType<typeof setTimeout> | null} */
let hoverOpenTimer = null
/** @type {ReturnType<typeof setTimeout> | null} */
let hoverCloseTimer = null

function prefersHoverOpen() {
	return (
		typeof window !== 'undefined' &&
		window.matchMedia('(hover: hover) and (pointer: fine)').matches
	)
}

function clearHoverOpenTimer() {
	if (hoverOpenTimer != null) {
		clearTimeout(hoverOpenTimer)
		hoverOpenTimer = null
	}
}

function clearHoverCloseTimer() {
	if (hoverCloseTimer != null) {
		clearTimeout(hoverCloseTimer)
		hoverCloseTimer = null
	}
}

function onTriggerPointerEnter() {
	if (!prefersHoverOpen()) return
	clearHoverCloseTimer()
	clearHoverOpenTimer()
	if (!open.value) {
		hoverOpenTimer = setTimeout(() => {
			hoverOpenTimer = null
			open.value = true
		}, HOVER_OPEN_MS)
	}
}

function onTriggerPointerLeave() {
	if (!prefersHoverOpen()) return
	clearHoverOpenTimer()
	if (open.value) {
		hoverCloseTimer = setTimeout(() => {
			hoverCloseTimer = null
			open.value = false
		}, HOVER_CLOSE_GRACE_MS)
	}
}

function onPanelPointerEnter() {
	clearHoverCloseTimer()
}

function onPanelPointerLeave() {
	if (!prefersHoverOpen()) return
	clearHoverCloseTimer()
	hoverCloseTimer = setTimeout(() => {
		hoverCloseTimer = null
		open.value = false
	}, HOVER_CLOSE_GRACE_MS)
}

onBeforeUnmount(() => {
	clearHoverOpenTimer()
	clearHoverCloseTimer()
})

function toggleOpen() {
	open.value = !open.value
}
</script>

<template>
	<Popover
		v-model:open="open"
		placement="top-start"
		:offset="6"
		panel-hug-content
		@trigger-pointer-enter="onTriggerPointerEnter"
		@trigger-pointer-leave="onTriggerPointerLeave"
		@panel-pointer-enter="onPanelPointerEnter"
		@panel-pointer-leave="onPanelPointerLeave"
	>
		<button
			v-if="as === 'button'"
			type="button"
			class="c-tooltip--trigger c-tooltip--trigger__button"
			:aria-label="label"
			:aria-expanded="open"
			:aria-describedby="open ? tipId : undefined"
		>
			<slot />
		</button>
		<span
			v-else
			:class="[
				'c-tooltip--trigger',
				as === 'cell' ? 'c-tooltip--trigger__cell' : 'c-tooltip--trigger__abbr-like',
			]"
			role="button"
			tabindex="0"
			:aria-label="label"
			:aria-expanded="open"
			:aria-describedby="open ? tipId : undefined"
			@keydown.enter.prevent="toggleOpen"
			@keydown.space.prevent="toggleOpen"
		>
			<slot />
		</span>
		<template #panel>
			<span :id="tipId" role="tooltip" class="c-tooltip--body">{{ label }}</span>
		</template>
	</Popover>
</template>

<style scoped>
.c-tooltip--trigger {
	font: inherit;
	color: inherit;
	text-align: inherit;
	padding: 0;
	margin: 0;
	background: none;
	border: none;
	border-radius: 0;
	cursor: help;
	text-decoration: underline dotted;
	text-underline-offset: 0.12em;
}

.c-tooltip--trigger:focus-visible {
	outline: 2px solid var(--house--color--interactive, var(--house--gray-500));
	outline-offset: 2px;
}

.c-tooltip--trigger__button {
	display: inline-block;
	max-width: 100%;
}

.c-tooltip--trigger__abbr-like {
	display: inline;
}

.c-tooltip--trigger__cell {
	display: block;
	width: fit-content;
	max-width: 100%;
	box-sizing: border-box;
}

.c-tooltip--body {
	display: block;
}
</style>
