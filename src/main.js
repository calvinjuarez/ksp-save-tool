import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import { useEnvStore } from './stores/env.js'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

// Initialize env store (sets up app mode detection and body class)
useEnvStore()

app.mount('#app')
