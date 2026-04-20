<script setup>
import { onBeforeUnmount, useId } from 'vue'
import Popover from './Popover.component.vue'

/** Delay before opening on hover (fine pointer + hover-capable UA), similar to native `title`. */
const HOVER_OPEN_MS = 450
/** Time to move from trigger to teleported panel without closing. */
const HOVER_CLOSE_GRACE_MS = 220

defineProps({
	/** Hint text; shown in the panel and exposed to assistive tech on the trigger. */
	label: {
		type: String,
		required: true,
	},
	/**
	 * Trigger element / semantics.
	 * - `abbr` — real &lt;abbr&gt; (expansion in aria-label; no title to avoid native tooltips).
	 * - `abbr-like` — dotted underline on inline/cell triggers (e.g. non-abbr hints).
	 * - `text` — activatable content (e.g. stars); aria-label carries meaning, no underline.
	 * - `cell` — block wrapper with underline (tables, progress bar).
	 * - `button` — native button.
	 * @type {'abbr' | 'abbr-like' | 'text' | 'cell' | 'button'}
	 */
	as: {
		type: String,
		default: 'abbr-like',
		/** @param {unknown} v */
		validator: (v) =>
			typeof v === 'string' && ['abbr', 'abbr-like', 'text', 'cell', 'button'].includes(v),
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
		placement="top-center"
		:offset="6"
		panel-hug-content
		panel-compact
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
		<abbr
			v-else-if="as === 'abbr'"
			class="c-tooltip--trigger c-tooltip--trigger__abbr"
			tabindex="0"
			:aria-label="label"
			:aria-expanded="open"
			:aria-describedby="open ? tipId : undefined"
			@keydown.enter.prevent="toggleOpen"
			@keydown.space.prevent="toggleOpen"
		>
			<slot />
		</abbr>
		<span
			v-else-if="as === 'text'"
			class="c-tooltip--trigger c-tooltip--trigger__text"
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
}

.c-tooltip--trigger:focus-visible {
	outline: 2px solid var(--house--color--interactive, var(--house--gray-500));
	outline-offset: 2px;
}

/* Border draws reliably under emoji / symbols; text-decoration often skips them. */
.c-tooltip--trigger__abbr,
.c-tooltip--trigger__abbr-like {
	display: inline;
	border-bottom: 1px dotted currentColor;
	text-decoration: none;
	padding-bottom: 0.08em;
	cursor: help;
}

.c-tooltip--trigger__button {
	display: inline-block;
	max-width: 100%;
}

.c-tooltip--trigger__text {
	display: inline;
	cursor: help;
}

.c-tooltip--trigger__cell {
	display: block;
	width: fit-content;
	max-width: 100%;
	box-sizing: border-box;
	border-bottom: 1px dotted currentColor;
	text-decoration: none;
	padding-bottom: 0.08em;
	cursor: help;
}

.c-tooltip--body {
	display: block;
	font-size: 0.8rem;
	line-height: 1.35;
	text-align: center;
	text-wrap: balance;
}
</style>
