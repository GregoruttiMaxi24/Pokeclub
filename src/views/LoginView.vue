<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../services/supabase'

const router = useRouter()

const email = ref('')
const password = ref('')
const mensaje = ref('')
const error = ref('')
const cargando = ref(false)

async function iniciarSesion() {
  if (cargando.value) return

  mensaje.value = ''
  error.value = ''
  cargando.value = true

  try {
    const { error: errorAcceso } = await supabase.auth.signInWithPassword({
      email: email.value.trim().toLowerCase(),
      password: password.value,
    })

    if (errorAcceso) {
      if (errorAcceso.message.toLowerCase().includes('email not confirmed')) {
        throw new Error('Primero tenés que confirmar tu correo electrónico.')
      }

      throw new Error('Correo o contraseña incorrectos. Revisá los datos e intentá nuevamente.')
    }

    const destino = router.currentRoute.value.query.redirect

    if (
      typeof destino === 'string' &&
      destino.startsWith('/') &&
      !destino.startsWith('//')
    ) {
      await router.replace(destino)
    } else {
      await router.replace('/')
    }
  } catch (e) {
    error.value = e.message || 'No pudimos iniciar sesión. Intentá nuevamente.'
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <main class="container main-content">
    <section class="auth-card" aria-labelledby="login-title">
      <p class="eyebrow">¡QUÉ BUENO TENERTE DE VUELTA!</p>
      <h1 id="login-title">Iniciar sesión</h1>
      <p>Volvé a tu aventura en PokéClub.</p>

      <form class="auth-form" @submit.prevent="iniciarSesion">
        <label for="email">Correo electrónico</label>
        <input id="email" v-model="email" type="email" autocomplete="email" required />

        <label for="password">Contraseña</label>
        <input id="password" v-model="password" type="password" autocomplete="current-password" required />

        <button type="submit" :disabled="cargando">
          {{ cargando ? 'Ingresando...' : 'Iniciar sesión' }}
        </button>

        <p v-if="mensaje" class="form-message" role="status">
          {{ mensaje }}
        </p>

        <p v-if="error" class="form-error" role="alert">
          {{ error }}
        </p>
      </form>

      <p>
        ¿Todavía no tenés cuenta?
        <RouterLink to="/registro">Registrate</RouterLink>
      </p>
    </section>
  </main>
</template>
