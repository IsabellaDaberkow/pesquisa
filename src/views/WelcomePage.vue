<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Início</ion-title>
        <ion-buttons slot="end">
          <ion-button :disabled="busy" @click="logout">Sair</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <main class="welcome-shell">
        <section class="welcome-card">
          <div class="welcome-mark" aria-hidden="true">✓</div>
          <p class="eyebrow">SESSÃO AUTENTICADA</p>
          <h1>Bem-vindo(a) de volta!</h1>
          <p class="welcome-message">
            Olá, <strong>{{ displayName }}</strong>. É ótimo ver você por aqui.
          </p>
          <ion-note v-if="feedback" color="danger" class="feedback" role="status">
            {{ feedback }}
          </ion-note>
          <ion-button expand="block" router-link="/profile">Editar meu perfil</ion-button>
          <ion-button expand="block" fill="clear" :disabled="busy" @click="logout">
            {{ busy ? 'Saindo...' : 'Sair da conta' }}
          </ion-button>
        </section>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonNote,
  IonPage,
  IonTitle,
  IonToolbar
} from '@ionic/vue';
import { getSupabase } from '@/lib/supabase';

const router = useRouter();
const email = ref('');
const fullName = ref('');
const feedback = ref('');
const busy = ref(false);
const displayName = computed(() => fullName.value || email.value || 'Usuário');

onMounted(async () => {
  try {
    const supabase = getSupabase();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) {
      await router.replace('/login');
      return;
    }

    email.value = userData.user.email ?? '';
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userData.user.id)
      .maybeSingle();
    if (error) throw error;
    fullName.value = data?.full_name ?? '';
  } catch (error) {
    feedback.value = error instanceof Error ? error.message : 'Não foi possível carregar seu perfil.';
  }
});

async function logout() {
  busy.value = true;
  feedback.value = '';
  try {
    const { error } = await getSupabase().auth.signOut();
    if (error) throw error;
    await router.replace('/login');
  } catch (error) {
    feedback.value = error instanceof Error ? error.message : 'Não foi possível encerrar a sessão.';
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.welcome-mark {
  display: grid;
  width: 4rem;
  height: 4rem;
  margin: 0 auto 1.5rem;
  place-items: center;
  border-radius: 50%;
  color: white;
  background: var(--ion-color-primary);
  font-size: 1.75rem;
}

.welcome-message {
  margin: 1.5rem 0 2rem;
  line-height: 1.6;
}

.feedback {
  display: block;
  margin: 1rem 0;
}
</style>
