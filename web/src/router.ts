import { createRouter, createWebHistory, createMemoryHistory } from 'vue-router'
import { routes } from './routes'

const history = import.meta.env.SSR
  ? createMemoryHistory(import.meta.env.BASE_URL)
  : createWebHistory(import.meta.env.BASE_URL)

export const router = createRouter({
  history,
  routes,
})