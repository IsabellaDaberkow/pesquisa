import { mount } from '@vue/test-utils'
import { IonicVue } from '@ionic/vue'
import { createMemoryHistory, createRouter } from '@ionic/vue-router'
import LoginPage from '@/views/LoginPage.vue'
import { describe, expect, test } from 'vitest'

describe('LoginPage.vue', () => {
  test('renders login and password recovery forms', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: LoginPage }]
    })
    await router.push('/')
    await router.isReady()

    const wrapper = mount(LoginPage, { global: { plugins: [IonicVue, router] } })
    expect(wrapper.text()).toContain('Entrar no aplicativo')
    expect(wrapper.text()).toContain('Esqueci minha senha')
    expect(wrapper.text()).toContain('VITE_SUPABASE_URL')
  })
})
