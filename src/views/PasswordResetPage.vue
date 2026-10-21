<template>
  <ion-page>
    <ion-content class="ion-padding">
      <main class="auth-shell">
        <section class="auth-card">
          <p class="eyebrow">RECUPERAÇÃO DE CONTA</p>
          <h1>Defina uma nova senha</h1>
          <p class="muted">Escolha uma senha segura para voltar ao aplicativo.</p>

          <ion-note v-if="feedback" :color="feedbackColor" class="feedback" role="status">
            {{ feedback }}
          </ion-note>

          <form @submit.prevent="updatePassword">
            <ion-item>
              <ion-input
                v-model="password"
                type="password"
                label="Nova senha"
                label-placement="floating"
                autocomplete="new-password"
                :minlength="8"
                required
              />
            </ion-item>
            <ion-item>
              <ion-input
                v-model="confirmation"
                type="password"
                label="Confirme a nova senha"
                label-placement="floating"
                autocomplete="new-password"
                :minlength="8"
                required
              />
            </ion-item>
            <ion-button expand="block" type="submit" :disabled="busy">
              {{ busy ? 'Salvando...' : 'Salvar nova senha' }}
            </ion-button>
          </form>
        </section>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonButton, IonContent, IonInput, IonItem, IonNote, IonPage } from '@ionic/vue';
import { getSupabase } from '@/lib/supabase';

const router = useRouter();
const password = ref('');
const confirmation = ref('');
const busy = ref(false);
const feedback = ref('');
const feedbackColor = ref<'success' | 'danger'>('danger');

async function updatePassword() {
  feedback.value = '';
  if (password.value.length < 8) {
    feedback.value = 'A senha deve ter pelo menos 8 caracteres.';
    return;
  }
  if (password.value !== confirmation.value) {
    feedback.value = 'As senhas informadas não coincidem.';
    return;
  }

  busy.value = true;
  try {
    const { error } = await getSupabase().auth.updateUser({ password: password.value });
    if (error) throw error;

    feedback.value = 'Senha atualizada com sucesso.';
    feedbackColor.value = 'success';
    await router.replace('/welcome');
  } catch (error) {
    feedback.value = error instanceof Error ? error.message : 'Não foi possível atualizar a senha.';
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
</style>
