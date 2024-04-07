import Home from '@/pages/Home/Home.vue'
import Login from '@/pages/Login.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_BASE_PATH),
  routes: [
    {
        path: '/',
        name: 'home',
        component: Home,
		meta: { layout: 'default' }
    },
    {
        path: "/login",
        name: 'login',
        component: Login,
    }
  ]
})

export default router
