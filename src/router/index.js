import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import ProfileView from '../views/ProfileView.vue'
import SettingsView from '../views/SettingsView.vue'
import { supabase } from '../services/supabase'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
  {
    path: '/registro',
    name: 'register',
    component: RegisterView,
  },
  {
    path: '/perfil/:username',
    name: 'profile',
    component: ProfileView,
    props: true,
  },
  {
    path: '/ajustes',
    name: 'settings',
    component: SettingsView,
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
history: createWebHistory(),
routes,
})

router.beforeEach(async (to) => {
if (to.meta.requiresAuth) {
const {
data: { session },
error,
} = await supabase.auth.getSession()

if (error || !session) {
  return {
    name: 'login',
    query: { redirect: to.fullPath },
  }
}

}
})

export default router
