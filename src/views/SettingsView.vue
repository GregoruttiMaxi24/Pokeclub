<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../services/supabase";

const router = useRouter();

const cargando = ref(true);
const guardandoPerfil = ref(false);
const cambiandoPassword = ref(false);
const error = ref("");
const mensajePerfil = ref("");
const mensajePassword = ref("");

const usuarioId = ref("");
const username = ref("");
const nombreVisible = ref("");
const biografia = ref("");
const passwordActualizada = ref("");
const confirmarPassword = ref("");

/**
 * Obtiene la sesión y carga los datos del perfil autenticado.
 */
async function cargarConfiguracion() {
  cargando.value = true;
  error.value = "";

  try {
    const {
      data: { session },
      error: errorSesion,
    } = await supabase.auth.getSession();

    if (errorSesion) throw errorSesion;

    if (!session) {
      await router.replace("/login");
      return;
    }

    const user = session.user;

    usuarioId.value = user.id;

    const { data: datosPerfil, error: errorPerfil } = await supabase
      .from("profiles")
      .select("username, display_name, bio")
      .eq("id", user.id)
      .single();

    if (errorPerfil) throw errorPerfil;

    username.value = datosPerfil.username;
    nombreVisible.value = datosPerfil.display_name;
    biografia.value = datosPerfil.bio ?? "";
  } catch (e) {
    console.error("Error al cargar la configuración:", e);
    error.value = "No pudimos cargar tus datos. Intentá nuevamente.";
  } finally {
    cargando.value = false;
  }
}

/**
 * Guarda los cambios del nombre visible y la biografía.
 */
async function guardarPerfil() {
  error.value = "";
  mensajePerfil.value = "";

  const nombreLimpio = nombreVisible.value.trim();
  const bioLimpia = biografia.value.trim();

  if (!nombreLimpio) {
    error.value = "El nombre visible no puede quedar vacío.";
    return;
  }

  guardandoPerfil.value = true;

  try {
    const { error: errorActualizacion } = await supabase
      .from("profiles")
      .update({
        display_name: nombreLimpio,
        bio: bioLimpia,
      })
      .eq("id", usuarioId.value);

    if (errorActualizacion) throw errorActualizacion;

    nombreVisible.value = nombreLimpio;
    biografia.value = bioLimpia;
    mensajePerfil.value = "¡Tu perfil se actualizó correctamente.";
  } catch (e) {
    console.error("Error al actualizar el perfil:", e);
    error.value = "No pudimos guardar los cambios de tu perfil.";
  } finally {
    guardandoPerfil.value = false;
  }
}

/**
 * Actualiza la contraseña de la cuenta autenticada.
 */
async function cambiarPassword() {
  error.value = "";
  mensajePassword.value = "";

  if (passwordActualizada.value.length < 8) {
    error.value = "La nueva contraseña debe tener al menos 8 caracteres.";
    return;
  }

  if (passwordActualizada.value !== confirmarPassword.value) {
    error.value = "Las contraseñas no coinciden.";
    return;
  }

  cambiandoPassword.value = true;

  try {
    const { error: errorCambio } = await supabase.auth.updateUser({
      password: passwordActualizada.value,
    });

    if (errorCambio) throw errorCambio;

    passwordActualizada.value = "";
    confirmarPassword.value = "";
    mensajePassword.value = "¡Tu contraseña se cambió correctamente!";
  } catch (e) {
    console.error("Error al cambiar la contraseña:", e);
    error.value =
      "No pudimos cambiar la contraseña. Es posible que debas volver a iniciar sesión.";
  } finally {
    cambiandoPassword.value = false;
  }
}

onMounted(cargarConfiguracion);
</script>

<template>
  <main class="container main-content settings-page">
    <!-- Encabezado de configuración -->
    <section class="settings-intro" aria-labelledby="settings-title">
      <p class="eyebrow">TU CUENTA · CENTRO DE ENTRENADOR</p>

      <h1 id="settings-title">Configuración de la cuenta</h1>

      <p class="settings-intro-description">
        Personalizá tu perfil y administrá tu cuenta de PokéClub.
      </p>
    </section>

    <p v-if="cargando" class="settings-status" role="status">
      Cargando configuración...
    </p>

    <div v-else class="settings-sections">
      <p v-if="error" class="form-error" role="alert">
        {{ error }}
      </p>

      <!-- Edición del perfil -->
      <section
        class="auth-card settings-card"
        aria-labelledby="profile-settings-title"
      >
        <h2 id="profile-settings-title">Tu perfil</h2>
        <p>Personalizá la información que ve la comunidad.</p>

        <form class="auth-form" @submit.prevent="guardarPerfil">
          <label for="settings-username">Nombre de usuario</label>
          <input
            id="settings-username"
            :value="username"
            type="text"
            readonly
            aria-describedby="username-help"
          />

          <small id="username-help">
            Tu nombre de usuario identifica tu perfil y no se puede modificar
            desde acá.
          </small>

          <label for="settings-display-name">Nombre visible</label>
          <input
            id="settings-display-name"
            v-model="nombreVisible"
            type="text"
            maxlength="60"
            autocomplete="name"
            required
          />

          <label for="settings-bio">Biografía</label>
          <textarea
            id="settings-bio"
            v-model="biografia"
            rows="4"
            maxlength="300"
            placeholder="Contale a la comunidad qué te gusta de Pokémon..."
          ></textarea>

          <button type="submit" :disabled="guardandoPerfil">
            {{ guardandoPerfil ? "Guardando..." : "Guardar perfil" }}
          </button>

          <p v-if="mensajePerfil" class="form-message" role="status">
            {{ mensajePerfil }}
          </p>
        </form>
      </section>

      <!-- Cambio de contraseña -->
      <section
        class="auth-card settings-card"
        aria-labelledby="password-title"
      >
        <h2 id="password-title">Cambiar contraseña</h2>
        <p>Elegí una contraseña segura de al menos 8 caracteres.</p>

        <form class="auth-form" @submit.prevent="cambiarPassword">
          <label for="settings-password">Nueva contraseña</label>
          <input
            id="settings-password"
            v-model="passwordActualizada"
            type="password"
            minlength="8"
            autocomplete="new-password"
            required
          />

          <label for="settings-password-confirm">
            Confirmar nueva contraseña
          </label>
          <input
            id="settings-password-confirm"
            v-model="confirmarPassword"
            type="password"
            minlength="8"
            autocomplete="new-password"
            required
          />

          <button type="submit" :disabled="cambiandoPassword">
            {{ cambiandoPassword ? "Actualizando..." : "Cambiar contraseña" }}
          </button>

          <p v-if="mensajePassword" class="form-message" role="status">
            {{ mensajePassword }}
          </p>
        </form>
      </section>
    </div>
  </main>
</template>
