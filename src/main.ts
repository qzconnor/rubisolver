import Tres from '@tresjs/core'
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

export const app = createApp(App);
app.use(Tres)
app.mount('#app')
