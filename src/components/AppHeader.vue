<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { supabase } from '../services/supabase'

const router = useRouter()
const usuario = ref(null)
const cargandoSesion = ref(true)
let suscripcionAuth = null

/**
 * Obtiene la sesión actual y escucha los cambios de autenticación.
 */
onMounted(async () => {
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    console.error('Error al obtener la sesión:', error)
  }

  usuario.value = data?.session?.user ?? null
  cargandoSesion.value = false

  const { data: listener } = supabase.auth.onAuthStateChange(
    (_evento, session) => {
      usuario.value = session?.user ?? null
    },
  )

  suscripcionAuth = listener.subscription
})

onUnmounted(() => {
  if (suscripcionAuth) {
    suscripcionAuth.unsubscribe()
  }
})

/**
 * Cierra la sesión y redirige al inicio.
 */
async function cerrarSesion() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Error al cerrar sesión:', error)
    return
  }

  usuario.value = null
  await router.push('/')
}
</script>

<template>
  <header class="site-header">
    <div class="container">
      <RouterLink
        class="brand"
        to="/"
        aria-label="PokéClub, ir al inicio"
      >
        <span class="brand-name">PokéClub</span>
        <span class="brand-tagline">Tu aventura, tus logros.</span>
      </RouterLink>

      <nav class="main-nav" aria-label="Navegación principal">
        <RouterLink to="/">Inicio</RouterLink>

        <template v-if="!cargandoSesion && !usuario">
          <RouterLink to="/login">Iniciar sesión</RouterLink>
          <RouterLink to="/registro">Registrarse</RouterLink>
        </template>

        <template v-else-if="usuario">
          <RouterLink
            :to="{
              name: 'profile',
              params: {
                username: usuario.user_metadata?.username || '',
              },
            }"
            v-if="usuario.user_metadata?.username"
          >
            Mi perfil
          </RouterLink>

          <RouterLink to="/ajustes">Configuración</RouterLink>

          <button type="button" @click="cerrarSesion">
            Cerrar sesión
          </button>
        </template>
      </nav>
    </div>
  </header>
</template>