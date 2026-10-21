import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import LoginPage from '@/views/LoginPage.vue';
import PasswordResetPage from '@/views/PasswordResetPage.vue';
import ProfilePage from '@/views/ProfilePage.vue';
import WelcomePage from '@/views/WelcomePage.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'login',
    component: LoginPage
  },
  {
    path: '/password-reset',
    name: 'password-reset',
    component: PasswordResetPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfilePage,
    meta: { requiresAuth: true }
  },
  {
    path: '/welcome',
    name: 'welcome',
    component: WelcomePage,
    meta: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

router.beforeEach(async (to) => {
  if (!isSupabaseConfigured) {
    return to.name === 'login'
      ? true
      : { name: 'login', query: { setup: 'required' } };
  }

  const { data, error } = await getSupabase().auth.getSession();
  if (error) {
    return { name: 'login', query: { session: 'error' } };
  }

  if (to.meta.requiresAuth && !data.session) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }

  if (to.name === 'login' && data.session) {
    return { name: 'welcome' };
  }

  return true;
});

export default router
