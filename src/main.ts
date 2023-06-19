import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

import EventBus from '@/utils/eventbus'
window.eventBus = new EventBus()

createApp(App).mount('#app')
