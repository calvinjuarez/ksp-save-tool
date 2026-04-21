import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './app/App.vue'
import router from './router'
import { persistUiPrefsPlugin } from './app/persist-ui-prefs.plugin.js'
import { useEnvStore } from './app/env.store.js'

const app = createApp(App)
const pinia = createPinia()
pinia.use(persistUiPrefsPlugin)
app.use(pinia)
app.use(router)

// Initialize env store (sets up app mode detection and body class)
useEnvStore()

app.mount('#app')
