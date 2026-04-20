<script setup>
import { computed, onBeforeUnmount, useId } from 'vue'
import Popover from './Popover.component.vue'

/** Delay before opening on hover (fine pointer + hover-capable UA), similar to native `title`. */
const HOVER_OPEN_MS = 450
/** Time to move from trigger to teleported panel without closing. */
const HOVER_CLOSE_GRACE_MS = 220

const props = defineProps({
	/**
	 * Panel copy (sighted users). When `accessibleLabel` is set, that string is used for
	 * `aria-label` instead so the trigger name can differ from the popup (e.g. presentation-only detail).
	 * Visible slot content is aria-hidden so AT does not read emoji/symbols/abbrev letters.
	 */
	label: {
		type: String,
		required: true,
	},
	/**
	 * Optional override for the trigger’s `aria-label`. Defaults to `label`.
	 * @type {string | undefined}
	 */
	accessibleLabel: {
		type: String,
		default: undefined,
	},
	/**
	 * Optional `aria-describedby` id(s) for supplemental AT text (e.g. sr-only copy elsewhere).
	 * @type {string | undefined}
	 */
	ariaDescribedBy: {
		type: String,
		default: undefined,
	},
	/**
	 * Trigger element / semantics.
	 * - `abbr` — real &lt;abbr&gt; (no title; meaning only via aria-label).
	 * - `abbr-like` — dotted underline on a non-abbr hint.
	 * - `text` — activatable inline content (e.g. stars); dotted hint line.
	 * - `button` — native button.
	 * @type {'abbr' | 'abbr-like' | 'text' | 'button'}
	 */
	as: {
		type: String,
		default: 'abbr-like',
		/** @param {unknown} v */
		validator: (v) =>
			typeof v === 'string' && ['abbr', 'abbr-like', 'text', 'button'].includes(v),
	},
})

const ariaLabelForTrigger = computed(() =>
	props.accessibleLabel !== undefined ? props.accessibleLabel : props.label,
)

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
			:aria-label="ariaLabelForTrigger"
			:aria-describedby="ariaDescribedBy || undefined"
			:aria-expanded="open"
		>
			<span class="c-tooltip--visual" aria-hidden="true"><slot /></span>
		</button>
		<abbr
			v-else-if="as === 'abbr'"
			class="c-tooltip--trigger c-tooltip--trigger__abbr"
			tabindex="0"
			:aria-label="ariaLabelForTrigger"
			:aria-describedby="ariaDescribedBy || undefined"
			:aria-expanded="open"
			@keydown.enter.prevent="toggleOpen"
			@keydown.space.prevent="toggleOpen"
		>
			<span class="c-tooltip--visual" aria-hidden="true"><slot /></span>
		</abbr>
		<span
			v-else-if="as === 'text'"
			class="c-tooltip--trigger c-tooltip--trigger__text"
			role="button"
			tabindex="0"
			:aria-label="ariaLabelForTrigger"
			:aria-describedby="ariaDescribedBy || undefined"
			:aria-expanded="open"
			@keydown.enter.prevent="toggleOpen"
			@keydown.space.prevent="toggleOpen"
		>
			<span class="c-tooltip--visual" aria-hidden="true"><slot /></span>
		</span>
		<span
			v-else
			class="c-tooltip--trigger c-tooltip--trigger__abbr-like"
			role="button"
			tabindex="0"
			:aria-label="ariaLabelForTrigger"
			:aria-describedby="ariaDescribedBy || undefined"
			:aria-expanded="open"
			@keydown.enter.prevent="toggleOpen"
			@keydown.space.prevent="toggleOpen"
		>
			<span class="c-tooltip--visual" aria-hidden="true"><slot /></span>
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

.c-tooltip--visual {
	display: inline;
}

.c-tooltip--trigger__button > .c-tooltip--visual {
	display: inline-block;
	max-width: 100%;
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
