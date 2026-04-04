import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import { routes } from './routes'

import './assets/theme.css'
import './assets/fonts.css'
import './responsive.css'

export const createApp = ViteSSG(App, {
  routes,
  base: import.meta.env.BASE_URL,
})