<script setup>
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import SaveFileUpload from './components/SaveFileUpload.component.vue'
import { SAVE_EXPLORER_REPORTS } from './save-file.reports.const.js'
import { useSaveFileStore } from './save-file.store.js'

const route = useRoute()
const saveFile = useSaveFileStore()

const reports = SAVE_EXPLORER_REPORTS

const isSaveExplorerIndex = computed(() => route.name === 'save-explorer')
</script>

<template>
	<article class="v-save_file_explorer">
		<header class="page_header">
			<h1>Save Explorer</h1>
			<p class="lead">Explore your KSP saves.</p>
		</header>

		<template v-if="!saveFile.hasSave">
			<p class="lead">Upload a save file below to parse it in the  browser.</p>
			<div class="v-save_file_explorer--drop_full">
				<SaveFileUpload input-label="Choose save file" primary />
			</div>
		</template>

		<template v-else>
			<div class="l-with_sidebar">
				<aside class="l-with_sidebar--sidebar  v-save_file_explorer--sidebar" aria-label="Loaded Save">
					<section class="v-save_file_explorer--summary">
						<h6>Loaded Save</h6>
						<dl class="v-save_file_explorer--dl">
							<dt>Title</dt>
							<dd>{{ saveFile.gameTitle }}</dd>
							<dt>File</dt>
							<dd>{{ saveFile.fileName }}</dd>
							<dt>Vessels</dt>
							<dd>{{ saveFile.vesselCount }}</dd>
							<dt>Kerbals</dt>
							<dd>{{ saveFile.crewCount }}</dd>
						</dl>
					</section>

					<div class="v-save_file_explorer--replace">
						<h6>Explore A Different Save</h6>
						<SaveFileUpload input-label="Upload another save file" />
					</div>
				</aside>

				<div class="l-with_sidebar--content">
					<div class="tab_dossier">
						<nav class="tab_dossier--nav  sticky-top" aria-label="Reports">
							<RouterLink v-slot="{ href, navigate, isExactActive }" :to="{ name: 'save-explorer' }" custom>
								<a
									:href="href"
									class="tab_dossier--link"
									:class="{ 'is-active': isExactActive }"
									@click="navigate"
								>
									Overview
								</a>
							</RouterLink>
							<RouterLink
								v-for="report in reports"
								:key="String(report.routeName)"
								:to="{ name: report.routeName }"
								class="tab_dossier--link"
							>
								{{ report.title }}
							</RouterLink>
						</nav>

						<section v-if="isSaveExplorerIndex" class="tab_dossier--panel" aria-labelledby="reports-heading">
							<h2 id="reports-heading" class="v-save_file_explorer--reports_heading">Available reports</h2>
							<ul class="v-save_file_explorer--report_cards">
								<li v-for="report in reports" :key="String(report.routeName)">
									<RouterLink :to="{ name: report.routeName }" class="v-save_file_explorer--report_card">
										<span class="v-save_file_explorer--report_card_title">{{ report.title }}</span>
										<span class="v-save_file_explorer--report_card_desc">{{ report.description }}</span>
									</RouterLink>
								</li>
							</ul>
						</section>

						<section v-else class="tab_dossier--panel">
							<RouterView />
						</section>
					</div>
				</div>
			</div>
		</template>
	</article>
</template>

<style scoped>
.v-save_file_explorer {
	width: 100%;
}

.v-save_file_explorer--drop_full {
	min-height: min(70vh, 32rem);
	display: flex;
	flex-direction: column;
}

.v-save_file_explorer--drop_full :deep(.c-file_upload) {
	flex: 1;
	min-height: 0;
	justify-content: center;
}

.v-save_file_explorer--sidebar {
	@media (min-width: 600px) {
		position: sticky;
		top: calc(var(--house--nav--height) + 1rem);
	}
}

.v-save_file_explorer--summary {
	min-width: 0;
	margin-bottom: 1rem;
}

.v-save_file_explorer--replace {
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
	flex: 0 0 auto;
	min-height: 0;
	margin-bottom: 1rem;
}

.v-save_file_explorer--dl {
	margin: 0;
	font-size: var(--house--text--size-small);

	dt {
		font-weight: 400;
		color: var(--house--color--ink-muted);
	}
	dd {
		font-weight: 600;
		padding-left: 0.75rem;
		text-wrap: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
}

.v-save_file_explorer--dl dd {
	margin: 0;
}

.v-save_file_explorer--reports_heading {
	margin: 0 0 0.75rem;
	font-size: 1.1rem;
	font-weight: 600;
}

.v-save_file_explorer--report_cards {
	list-style: none;
	margin: 0;
	padding: 0;
	display: grid;
	gap: 0.75rem;
	grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
}

.v-save_file_explorer--report_card {
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
	padding: 1rem 1.1rem;
	min-height: 5rem;
	border: 1px solid var(--house--border_color-interactive);
	border-radius: 0.35rem;
	text-decoration: none;
	color: inherit;
	transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.v-save_file_explorer--report_card:hover {
	border-color: var(--house--color--primary);
	box-shadow: 0 1px 0 rgba(0, 0, 0, 0.04);
}

.v-save_file_explorer--report_card_title {
	font-weight: 600;
	color: var(--house--color--primary);
}

.v-save_file_explorer--report_card_desc {
	font-size: 0.9rem;
	color: var(--house--color--ink-muted);
	line-height: 1.35;
}

</style>
