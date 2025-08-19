import Tres from '@tresjs/core'
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { createPinia } from 'pinia'

const pinia = createPinia()

export const app = createApp(App);

app.use(pinia)
app.use(Tres)
app.mount('#app')
