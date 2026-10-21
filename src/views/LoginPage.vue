<template>
  <ion-page>
    <ion-content class="ion-padding">
      <main class="auth-shell">
        <section class="auth-card">
          <p class="eyebrow">IONIC + VUE + SUPABASE</p>
          <h1>Entrar no aplicativo</h1>
          <p class="muted">Acesse sua conta para continuar.</p>

          <ion-note v-if="!isSupabaseConfigured" color="warning" class="feedback">
            O acesso está desativado porque o Supabase ainda não foi configurado. Crie o arquivo
            .env.local com as credenciais do projeto e reinicie o servidor.
          </ion-note>
          <ion-note v-else-if="route.query.setup === 'required'" color="warning" class="feedback">
            Configure a conexão com o Supabase antes de acessar essa área.
          </ion-note>
          <ion-note v-else-if="route.query.session === 'error'" color="danger" class="feedback">
            Não foi possível validar sua sessão. Tente entrar novamente.
          </ion-note>
          <ion-note v-else-if="route.query.redirect" color="medium" class="feedback">
            Entre para acessar a página solicitada.
          </ion-note>
          <ion-note v-if="feedback" :color="feedbackColor" class="feedback" role="status">
            {{ feedback }}
          </ion-note>

          <form @submit.prevent="handleLogin">
            <ion-item>
              <ion-input
                v-model="email"
                type="email"
                label="E-mail"
                label-placement="floating"
                autocomplete="email"
                required
              />
            </ion-item>
            <ion-item>
              <ion-input
                v-model="password"
                type="password"
                label="Senha"
                label-placement="floating"
                autocomplete="current-password"
                required
              />
            </ion-item>
            <ion-button expand="block" type="submit" :disabled="busy || !isSupabaseConfigured">
              {{ busy ? 'Entrando...' : 'Entrar' }}
            </ion-button>
            <ion-button
              expand="block"
              fill="clear"
              type="button"
              :disabled="busy || !isSupabaseConfigured"
              @click="handleSignUp"
            >
              Criar minha conta
            </ion-button>
          </form>

          <div class="divider"><span>ou</span></div>

          <form class="reset-form" @submit.prevent="handlePasswordReset">
            <ion-item>
              <ion-input
                v-model="resetEmail"
                type="email"
                label="E-mail para recuperação"
                label-placement="floating"
                autocomplete="email"
                required
              />
            </ion-item>
            <ion-button
              expand="block"
              fill="outline"
              type="submit"
              :disabled="busy || !isSupabaseConfigured"
            >
              Esqueci minha senha
            </ion-button>
          </form>
        </section>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonNote,
  IonPage
} from '@ionic/vue';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

const route = useRoute();
const router = useRouter();
const email = ref('');
const resetEmail = ref('');
const password = ref('');
const busy = ref(false);
const feedback = ref('');
const feedbackColor = ref<'success' | 'danger'>('danger');

async function handleLogin() {
  busy.value = true;
  feedback.value = '';

  try {
    const { error } = await getSupabase().auth.signInWithPassword({
      email: email.value,
      password: password.value
    });
    if (error) throw error;

    await router.replace('/welcome');
  } catch (error) {
    feedback.value = error instanceof Error ? error.message : 'Não foi possível entrar.';
    feedbackColor.value = 'danger';
  } finally {
    busy.value = false;
  }
}

async function handlePasswordReset() {
  busy.value = true;
  feedback.value = '';

  try {
    const { error } = await getSupabase().auth.resetPasswordForEmail(resetEmail.value, {
      redirectTo: `${window.location.origin}/password-reset`
    });
    if (error) throw error;

    feedback.value = 'Se o endereço estiver cadastrado, você receberá um link para redefinir a senha.';
    feedbackColor.value = 'success';
  } catch (error) {
    feedback.value = error instanceof Error ? error.message : 'Não foi possível solicitar a recuperação.';
    feedbackColor.value = 'danger';
  } finally {
    busy.value = false;
  }
}

async function handleSignUp() {
  busy.value = true;
  feedback.value = '';

  try {
    const { data, error } = await getSupabase().auth.signUp({
      email: email.value,
      password: password.value
    });
    if (error) throw error;

    if (data.session) {
      await router.replace('/welcome');
      return;
    }

    feedback.value = 'Conta criada. Confira seu e-mail para confirmar o cadastro antes de entrar.';
    feedbackColor.value = 'success';
  } catch (error) {
    feedback.value = error instanceof Error ? error.message : 'Não foi possível criar a conta.';
    feedbackColor.value = 'danger';
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.feedback {
  display: block;
  margin: 1rem 0;
}

.reset-form {
  margin-top: 0.75rem;
}

.divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1.25rem 0;
  color: var(--ion-color-medium);
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--ion-color-light-shade);
}
</style>
