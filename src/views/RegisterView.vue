<script setup>
import { ref } from 'vue'
import { supabase } from '../services/supabase'

const nombre = ref('')
const username = ref('')
const email = ref('')
const password = ref('')
const mensaje = ref('')
const error = ref('')
const cargando = ref(false)

async function registrarUsuario() {
  mensaje.value = ''
  error.value = ''

  const nombreLimpio = nombre.value.trim()
  const usernameLimpio = username.value.trim().toLowerCase()
  const emailLimpio = email.value.trim().toLowerCase()

  if (!nombreLimpio || !usernameLimpio || !emailLimpio || !password.value) {
    error.value = 'Completá todos los campos.'
    return
  }

  if (!/^[a-z0-9_]{3,20}$/.test(usernameLimpio)) {
    error.value =
      'El nombre de usuario debe tener entre 3 y 20 caracteres: letras, números o guion bajo.'
    return
  }

  if (password.value.length < 8) {
    error.value = 'La contraseña debe tener al menos 8 caracteres.'
    return
  }

  cargando.value = true

  try {
    const { data, error: errorRegistro } = await supabase.auth.signUp({
      email: emailLimpio,
      password: password.value,
      options: {
        data: {
          username: usernameLimpio,
          display_name: nombreLimpio,
        },
      },
    })

    if (errorRegistro) throw errorRegistro

    if (data.session) {
      mensaje.value = '¡Cuenta creada! Ya podés empezar tu aventura.'
    } else {
      mensaje.value =
        '¡Registro iniciado! Revisá tu correo para confirmar la cuenta antes de iniciar sesión.'
    }

    nombre.value = ''
    username.value = ''
    email.value = ''
    password.value = ''
  } catch (e) {
    if (e.message?.toLowerCase().includes('already registered')) {
      error.value = 'Ese correo ya está registrado. Probá iniciar sesión.'
    } else {
      error.value =
        'No pudimos completar el registro. Revisá los datos e intentá nuevamente.'
    }

    console.error('Error de registro:', e)
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <main class="container main-content">
    <section class="auth-card" aria-labelledby="register-title">
      <p class="eyebrow">UNITE A LA COMUNIDAD</p>
      <h1 id="register-title">Creá tu cuenta</h1>
      <p>Compartí tus logros y conocé otros entrenadores.</p>

      <form class="auth-form" @submit.prevent="registrarUsuario">
        <label for="nombre">Nombre visible</label>
        <input
          id="nombre"
          v-model="nombre"
          type="text"
          autocomplete="name"
          maxlength="60"
          required
        />

        <label for="username">Nombre de usuario</label>
        <input
          id="username"
          v-model="username"
          type="text"
          autocomplete="username"
          minlength="3"
          maxlength="20"
          pattern="[A-Za-z0-9_]+"
          aria-describedby="username-help"
          required
        />
        <small id="username-help">
          De 3 a 20 caracteres: letras, números o guion bajo.
        </small>

        <label for="email">Correo electrónico</label>
        <input
          id="email"
          v-model="email"
          type="email"
          autocomplete="email"
          required
        />

        <label for="password">Contraseña</label>
        <input
          id="password"
          v-model="password"
          type="password"
          autocomplete="new-password"
          minlength="8"
          required
        />

        <button type="submit" :disabled="cargando">
          {{ cargando ? 'Creando cuenta...' : 'Registrarme' }}
        </button>

        <p v-if="mensaje" class="form-message" role="status">
          {{ mensaje }}
        </p>
        <p v-if="error" class="form-error" role="alert">
          {{ error }}
        </p>
      </form>

      <p>
        ¿Ya tenés cuenta?
        <RouterLink to="/login">Iniciá sesión</RouterLink>
      </p>
    </section>
  </main>
</template>
