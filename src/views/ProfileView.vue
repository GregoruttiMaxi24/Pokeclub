<script setup>
import { ref, watch } from 'vue'
import { supabase } from '../services/supabase'
import PostCard from '../components/PostCard.vue'

const props = defineProps({
  username: {
    type: String,
    required: true,
  },
})

const perfil = ref(null)
const publicaciones = ref([])
const cargando = ref(true)
const error = ref('')

/**
 * Obtiene los datos públicos del entrenador y sus publicaciones.
 */
async function cargarPerfil() {
  cargando.value = true
  error.value = ''
  perfil.value = null
  publicaciones.value = []

  try {
    const { data: datosPerfil, error: errorPerfil } = await supabase
      .from('profiles')
      .select('id, username, display_name, bio, avatar_url, created_at')
      .eq('username', props.username)
      .maybeSingle()

    if (errorPerfil) throw errorPerfil

    if (!datosPerfil) {
      error.value = 'No encontramos a este entrenador.'
      return
    }

    perfil.value = datosPerfil

    const { data: datosPublicaciones, error: errorPublicaciones } =
      await supabase
        .from('posts')
        .select('id, title, description, category, image_url, created_at')
        .eq('user_id', datosPerfil.id)
        .order('created_at', { ascending: false })

    if (errorPublicaciones) throw errorPublicaciones

    publicaciones.value = datosPublicaciones ?? []
  } catch (e) {
    console.error('Error al cargar el perfil:', e)
    error.value = 'No pudimos cargar el perfil. Intentá nuevamente.'
  } finally {
    cargando.value = false
  }
}

watch(() => props.username, cargarPerfil, { immediate: true })
</script>

<template>
  <main class="container main-content">
    <section class="auth-card profile-card" aria-labelledby="profile-title">
      <p class="eyebrow">ENTRENADOR DE POKÉCLUB</p>

      <p v-if="cargando" role="status">
        Cargando perfil...
      </p>

      <div v-else-if="error" class="form-error" role="alert">
        <p>{{ error }}</p>
        <button type="button" @click="cargarPerfil">
          Volver a intentar
        </button>
      </div>

      <template v-else-if="perfil">
        <div class="profile-header">
          <img
            v-if="perfil.avatar_url"
            class="profile-avatar"
            :src="perfil.avatar_url"
            :alt="`Foto de perfil de ${perfil.display_name}`"
          />

          <div>
            <h1 id="profile-title">
              {{ perfil.display_name }}
            </h1>
            <p class="profile-username">@{{ perfil.username }}</p>
          </div>
        </div>

        <p class="profile-bio">
          {{ perfil.bio || 'Este entrenador todavía no agregó una descripción.' }}
        </p>
      </template>
    </section>

    <section
      v-if="!cargando && perfil && !error"
      class="feed-section"
      aria-labelledby="profile-posts-title"
    >
      <div class="section-heading">
        <h2 id="profile-posts-title">Sus publicaciones</h2>
        <p>
          {{ publicaciones.length }}
          {{ publicaciones.length === 1 ? 'logro compartido' : 'logros compartidos' }}
        </p>
      </div>

      <div v-if="publicaciones.length" class="post-list">
        <PostCard
          v-for="publicacion in publicaciones"
          :key="publicacion.id"
          :username="perfil.username"
          :title="publicacion.title"
          :author="perfil.display_name"
          :category="publicacion.category === 'cards' ? 'Cartas' : 'Videojuegos'"
          :description="publicacion.description"
          :image-url="publicacion.image_url"
        />
      </div>

      <div v-else class="empty-feed">
        <h3>¡Una nueva aventura está por comenzar!</h3>
        <p>Este entrenador todavía no compartió ninguna publicación.</p>
      </div>
    </section>
  </main>
</template>