
<script setup>
import AppHeader from './components/AppHeader.vue'
</script>

<template>
  <div class="app-shell">
    <AppHeader />
    <RouterView />
    <footer class="site-footer">
      <p>PokéClub · Tu aventura, tus logros.</p>
    </footer>
  </div>
</template>
