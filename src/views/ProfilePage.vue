<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/welcome" />
        </ion-buttons>
        <ion-title>Meu perfil</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <main class="profile-shell">
        <section class="profile-card">
          <div class="avatar-wrap">
            <ion-avatar class="profile-avatar">
              <img v-if="imageSource" :src="imageSource" alt="Foto do perfil" />
              <span v-else>{{ initials }}</span>
            </ion-avatar>
          </div>
          <div class="photo-actions">
            <ion-button fill="outline" size="small" :disabled="loading || busy" @click="takePicture">
              Tirar foto
            </ion-button>
            <ion-button
              fill="clear"
              size="small"
              :disabled="loading || busy"
              @click="fileInput?.click()"
            >
              Escolher arquivo
            </ion-button>
            <input
              ref="fileInput"
              class="visually-hidden"
              type="file"
              accept="image/*"
              @change="selectFile"
            />
          </div>

          <ion-note v-if="feedback" :color="feedbackColor" class="feedback" role="status">
            {{ feedback }}
          </ion-note>

          <form @submit.prevent="saveProfile">
            <ion-item>
              <ion-input
                v-model="fullName"
                label="Nome completo"
                label-placement="floating"
                autocomplete="name"
                :maxlength="100"
                required
              />
            </ion-item>
            <ion-item>
              <ion-input
                v-model="nickname"
                label="Nickname"
                label-placement="floating"
                autocomplete="nickname"
                :maxlength="40"
                required
              />
            </ion-item>
            <ion-item>
              <ion-input
                v-model="birthDate"
                type="date"
                label="Data de nascimento"
                label-placement="floating"
              />
            </ion-item>
            <ion-button expand="block" type="submit" :disabled="busy || loading">
              {{ busy ? 'Salvando...' : 'Salvar perfil' }}
            </ion-button>
          </form>
        </section>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { Camera, CameraResultType } from '@capacitor/camera';
import { useRouter } from 'vue-router';
import {
  IonAvatar,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonNote,
  IonPage,
  IonTitle,
  IonToolbar
} from '@ionic/vue';
import { getSupabase } from '@/lib/supabase';

const router = useRouter();
const fullName = ref('');
const nickname = ref('');
const birthDate = ref('');
const avatarPath = ref('');
const avatarUrl = ref('');
const previewUrl = ref('');
const pendingPhoto = ref<Blob | null>(null);
const pendingPhotoType = ref('image/jpeg');
const fileInput = ref<HTMLInputElement>();
const loading = ref(true);
const busy = ref(false);
const feedback = ref('');
const feedbackColor = ref<'success' | 'danger'>('danger');
const imageSource = computed(() => previewUrl.value || avatarUrl.value);
const initials = computed(() => fullName.value.trim().charAt(0).toUpperCase() || 'U');

onMounted(loadProfile);
onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
});

async function loadProfile() {
  try {
    const supabase = getSupabase();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) {
      await router.replace('/login');
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('full_name,nickname,birth_date,avatar_path')
      .eq('id', userData.user.id)
      .maybeSingle();
    if (error) throw error;

    if (data) {
      fullName.value = data.full_name ?? '';
      nickname.value = data.nickname ?? '';
      birthDate.value = data.birth_date ?? '';
      avatarPath.value = data.avatar_path ?? '';
      await refreshAvatarUrl();
    }
  } catch (error) {
    feedback.value = error instanceof Error ? error.message : 'Não foi possível carregar o perfil.';
  } finally {
    loading.value = false;
  }
}

async function takePicture() {
  feedback.value = '';
  try {
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      quality: 85,
      allowEditing: true
    });
    if (!photo.webPath) throw new Error('A câmera não retornou uma imagem.');

    const response = await fetch(photo.webPath);
    if (!response.ok) throw new Error('Não foi possível ler a foto capturada.');
    setPendingPhoto(await response.blob());
  } catch (error) {
    feedback.value = error instanceof Error ? error.message : 'Não foi possível obter a foto.';
    feedbackColor.value = 'danger';
  }
}

function selectFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    feedback.value = 'Selecione um arquivo de imagem.';
    feedbackColor.value = 'danger';
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    feedback.value = 'A imagem deve ter no máximo 5 MB.';
    feedbackColor.value = 'danger';
    return;
  }

  setPendingPhoto(file);
}

function setPendingPhoto(blob: Blob) {
  if (blob.size > 5 * 1024 * 1024) {
    throw new Error('A imagem deve ter no máximo 5 MB.');
  }
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  pendingPhoto.value = blob;
  pendingPhotoType.value = blob.type || 'image/jpeg';
  previewUrl.value = URL.createObjectURL(blob);
  feedback.value = 'Foto selecionada. Salve o perfil para enviar a imagem.';
  feedbackColor.value = 'success';
}

async function refreshAvatarUrl() {
  if (!avatarPath.value) {
    avatarUrl.value = '';
    return;
  }

  const { data, error } = await getSupabase()
    .storage.from('avatars')
    .createSignedUrl(avatarPath.value, 60 * 60);
  if (error) throw error;
  avatarUrl.value = data.signedUrl;
}

async function saveProfile() {
  busy.value = true;
  feedback.value = '';
  let profileSaved = false;

  try {
    const supabase = getSupabase();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) throw new Error('Sua sessão expirou. Entre novamente.');

    let nextAvatarPath = avatarPath.value;
    if (pendingPhoto.value) {
      const extension = pendingPhotoType.value.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
      nextAvatarPath = `${userData.user.id}/avatar.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(nextAvatarPath, pendingPhoto.value, {
          upsert: true,
          contentType: pendingPhotoType.value
        });
      if (uploadError) throw uploadError;
    }

    const { error } = await supabase.from('profiles').upsert({
      id: userData.user.id,
      full_name: fullName.value.trim(),
      nickname: nickname.value.trim(),
      birth_date: birthDate.value || null,
      avatar_path: nextAvatarPath || null,
      updated_at: new Date().toISOString()
    });
    if (error) throw error;

    profileSaved = true;
    avatarPath.value = nextAvatarPath;
    pendingPhoto.value = null;
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = '';
    await refreshAvatarUrl();
    feedback.value = 'Perfil atualizado com sucesso.';
    feedbackColor.value = 'success';
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível salvar o perfil.';
    feedback.value = profileSaved
      ? `Perfil salvo, mas não foi possível carregar a foto: ${message}`
      : message;
    feedbackColor.value = 'danger';
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.avatar-wrap {
  display: flex;
  justify-content: center;
  margin: 0.5rem 0 1rem;
}

.profile-avatar {
  display: grid;
  width: 7rem;
  height: 7rem;
  place-items: center;
  color: var(--ion-color-primary-contrast);
  background: var(--ion-color-primary);
  font-size: 2rem;
}

.profile-avatar img {
  object-fit: cover;
}

.photo-actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}

.feedback {
  display: block;
  margin: 1rem 0;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  clip-path: inset(50%);
}
</style>
