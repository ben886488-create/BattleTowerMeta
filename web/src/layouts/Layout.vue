<template>
  <RouterView />
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { routeLang } from '../lib/siteI18n'

const route = useRoute()
const lang = computed<'zh' | 'en'>(() => routeLang(route))

watchEffect(() => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang.value
    document.documentElement.setAttribute('data-lang', lang.value)
  }
})
</script>
