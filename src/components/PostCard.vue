<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    default: null,
  },
})
</script>

<template>
  <article class="post-card">
    <div class="post-card-header">
      <div>
        <RouterLink
          v-if="username"
          class="post-author post-author-link"
          :to="{ name: 'profile', params: { username } }"
        >
          {{ author }}
        </RouterLink>

        <p v-else class="post-author">
          {{ author }}
        </p>

        <span class="post-category">{{ category }}</span>
      </div>
    </div>

    <h3>{{ title }}</h3>

    <img
      v-if="imageUrl"
      class="post-image"
      :src="imageUrl"
      :alt="`Imagen de la publicación: ${title}`"
      loading="lazy"
    />

    <p class="post-description">{{ description }}</p>
  </article>
</template>