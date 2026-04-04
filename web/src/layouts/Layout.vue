<template>
  <RouterView />
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const lang = computed<'zh' | 'en'>(() => (String(route.path).split('/')[1] === 'en' ? 'en' : 'zh'))

watchEffect(() => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang.value
    document.documentElement.setAttribute('data-lang', lang.value)
  }
})
</script>