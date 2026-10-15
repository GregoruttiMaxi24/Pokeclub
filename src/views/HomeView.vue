<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../services/supabase'
import PostCard from '../components/PostCard.vue'

const router = useRouter()

const publicaciones = ref([])
const cargando = ref(true)
const error = ref('')
const usuarioAutenticado = ref(false)

const titulo = ref('')
const categoria = ref('cards')
const descripcion = ref('')
const imagenSeleccionada = ref(null)
const vistaPrevia = ref('')

const publicando = ref(false)
const mensajePublicacion = ref('')
const errorPublicacion = ref('')

let canalRealtime = null
let suscripcionAuth = null

// Seleccionar y validar la imagen
function seleccionarImagen(evento) {
  const archivo = evento.target.files?.[0]

  mensajePublicacion.value = ''
  errorPublicacion.value = ''

  if (!archivo) return

  if (!archivo.type.startsWith('image/')) {
    errorPublicacion.value = 'Elegí un archivo de imagen válido.'
    evento.target.value = ''
    return
  }

  if (archivo.size > 5 * 1024 * 1024) {
    errorPublicacion.value = 'La imagen no puede superar los 5 MB.'
    evento.target.value = ''
    return
  }

  if (vistaPrevia.value) {
    URL.revokeObjectURL(vistaPrevia.value)
  }

  imagenSeleccionada.value = archivo
  vistaPrevia.value = URL.createObjectURL(archivo)
}

// Quitar la imagen elegida
function quitarImagen() {
  if (vistaPrevia.value) {
    URL.revokeObjectURL(vistaPrevia.value)
  }

  imagenSeleccionada.value = null
  vistaPrevia.value = ''

  const campoImagen = document.querySelector('#post-image')
  if (campoImagen) campoImagen.value = ''
}

// Cargar las publicaciones
async function cargarPublicaciones() {
  error.value = ''

  const { data, error: errorConsulta } = await supabase
    .from('posts')
    .select(`
      id,
      title,
      description,
      category,
      image_url,
      created_at,
      user_id,
      profiles (
        username,
        display_name
      )
    `)
    .order('created_at', { ascending: false })

  if (errorConsulta) {
    console.error('Error al cargar publicaciones:', errorConsulta)
    error.value = 'No pudimos cargar las publicaciones. Intentá nuevamente.'
    return
  }

  publicaciones.value = data ?? []
}

// Comprobar si hay una sesión activa
async function comprobarSesion() {
  const { data, error: errorSesion } = await supabase.auth.getSession()

  if (errorSesion) {
    console.error('Error al comprobar la sesión:', errorSesion)
    usuarioAutenticado.value = false
    return
  }

  usuarioAutenticado.value = Boolean(data.session)
}

// Subir la imagen al bucket de Storage
async function subirImagen(usuarioId) {
  if (!imagenSeleccionada.value) return null

  const archivo = imagenSeleccionada.value
  const extension = archivo.name.split('.').pop()?.toLowerCase() || 'jpg'
  const rutaArchivo = `${usuarioId}/${Date.now()}.${extension}`

  const { error: errorSubida } = await supabase.storage
    .from('post-images')
    .upload(rutaArchivo, archivo, {
      contentType: archivo.type,
      upsert: false,
    })

  if (errorSubida) throw errorSubida

  const { data } = supabase.storage
    .from('post-images')
    .getPublicUrl(rutaArchivo)

  return data.publicUrl
}

// Crear una publicación
async function crearPublicacion() {
  mensajePublicacion.value = ''
  errorPublicacion.value = ''

  const tituloLimpio = titulo.value.trim()
  const descripcionLimpia = descripcion.value.trim()

  if (!tituloLimpio || !descripcionLimpia) {
    errorPublicacion.value = 'Completá el título y la descripción.'
    return
  }

  publicando.value = true

  try {
    const {
      data: { user },
      error: errorUsuario,
    } = await supabase.auth.getUser()

    if (errorUsuario) throw errorUsuario

    if (!user) {
      usuarioAutenticado.value = false
      await router.push('/login')
      return
    }

    // Primero se sube la imagen, si se eligió una
    const urlImagen = await subirImagen(user.id)

    // Después se guarda la publicación con la URL
    const { error: errorGuardado } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        title: tituloLimpio,
        description: descripcionLimpia,
        category: categoria.value,
        image_url: urlImagen,
      })

    if (errorGuardado) throw errorGuardado

    titulo.value = ''
    categoria.value = 'cards'
    descripcion.value = ''
    quitarImagen()

    mensajePublicacion.value = '¡Tu logro se publicó correctamente!'

    await cargarPublicaciones()
  } catch (e) {
    console.error('Error al crear la publicación:', e)
    errorPublicacion.value =
      'No pudimos publicar tu logro. Revisá la conexión y los permisos de Storage.'
  } finally {
    publicando.value = false
  }
}

// Preparar el feed y escuchar cambios
onMounted(async () => {
  try {
    await comprobarSesion()
    await cargarPublicaciones()

    canalRealtime = supabase
      .channel('publicaciones-comunidad')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
        },
        () => cargarPublicaciones()
      )
      .subscribe()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      usuarioAutenticado.value = Boolean(session)
    })

    suscripcionAuth = subscription
  } finally {
    cargando.value = false
  }
})

// Limpiar recursos al abandonar la página
onUnmounted(() => {
  if (canalRealtime) supabase.removeChannel(canalRealtime)
  if (suscripcionAuth) suscripcionAuth.unsubscribe()
  if (vistaPrevia.value) URL.revokeObjectURL(vistaPrevia.value)
})
</script>

<template>
  <main class="container main-content">
    <section class="welcome-section" aria-labelledby="welcome-title">
      <p class="eyebrow">LA COMUNIDAD POKÉMON</p>
      <h1 id="welcome-title">Cada entrenador tiene una historia.</h1>
      <p>
        Compartí tus logros, descubrí colecciones y conectá
        con otros entrenadores.
      </p>
    </section>

    <section
      v-if="usuarioAutenticado"
      class="auth-card publish-card"
      aria-labelledby="publish-title"
    >
      <h2 id="publish-title">Compartí tu logro</h2>
      <p>Contale a la comunidad qué descubriste en tu aventura.</p>

      <form class="auth-form" @submit.prevent="crearPublicacion">
        <label for="post-title">Título</label>
        <input
          id="post-title"
          v-model="titulo"
          type="text"
          maxlength="100"
          required
        />

        <label for="post-category">Categoría</label>
        <select id="post-category" v-model="categoria" required>
          <option value="cards">Cartas</option>
          <option value="games">Videojuegos</option>
        </select>

        <label for="post-description">Descripción</label>
        <textarea
          id="post-description"
          v-model="descripcion"
          rows="4"
          maxlength="1000"
          required
        ></textarea>

        <label for="post-image">Imagen (opcional)</label>
        <input
          id="post-image"
          type="file"
          accept="image/*"
          aria-describedby="image-help"
          @change="seleccionarImagen"
        />
        <small id="image-help">
          Formatos de imagen habituales. Tamaño máximo: 5 MB.
        </small>

        <div v-if="vistaPrevia" class="image-preview">
          <img :src="vistaPrevia" alt="Vista previa de la imagen elegida" />
          <button type="button" class="remove-image" @click="quitarImagen">
            Quitar imagen
          </button>
        </div>

        <button type="submit" :disabled="publicando">
          {{ publicando ? 'Publicando...' : 'Publicar logro' }}
        </button>

        <p v-if="mensajePublicacion" class="form-message" role="status">
          {{ mensajePublicacion }}
        </p>
        <p v-if="errorPublicacion" class="form-error" role="alert">
          {{ errorPublicacion }}
        </p>
      </form>
    </section>

    <section class="feed-section" aria-labelledby="feed-title">
      <div class="section-heading">
        <h2 id="feed-title">Últimas publicaciones</h2>
        <p>Descubrí lo que comparte la comunidad.</p>
      </div>

      <p v-if="cargando" role="status">Cargando publicaciones...</p>

      <div v-else-if="error" class="form-error" role="alert">
        <p>{{ error }}</p>
        <button type="button" @click="cargarPublicaciones">
          Volver a intentar
        </button>
      </div>

      <div v-else-if="publicaciones.length === 0" class="empty-feed">
        <h3>¡Todavía no hay publicaciones!</h3>
        <p>Cuando los entrenadores compartan sus logros, aparecerán acá.</p>
        <p v-if="!usuarioAutenticado">
          <RouterLink to="/login">Iniciá sesión</RouterLink>
          para compartir el tuyo.
        </p>
      </div>

      <div v-else class="post-list">
        <PostCard
          v-for="publicacion in publicaciones"
         :key="publicacion.id"
        :title="publicacion.title"
        :author="publicacion.profiles?.display_name || publicacion.profiles?.username || 'Entrenador'"
        :username="publicacion.profiles?.username || ''"
        :category="publicacion.category === 'cards' ? 'Cartas' : 'Videojuegos'"
        :description="publicacion.description"
        :image-url="publicacion.image_url"
        />
      </div>
    </section>
  </main>
</template>