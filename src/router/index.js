import { createRouter, createWebHistory } from 'vue-router'
import App from '../App.vue'
import QuizManagementPage from '../components/QuizManagementPage.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: App
  },
  {
    path: '/quiz-management',
    name: 'QuizManagement',
    component: QuizManagementPage
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router