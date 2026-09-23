<template>
  <div class="font-body min-h-screen flex items-center justify-center bg-background px-4">
    <div class="w-full max-w-sm rounded-lg bg-white p-8 shadow-standard">
      <template v-if="error">
        <p class="rounded bg-info-background p-4 text-sm text-warning">
          {{ error }}
        </p>

        <NuxtLink to="/login" class="mt-6 block text-center text-sm text-link">
          {{ $t('login.retry') }}
        </NuxtLink>
      </template>

      <p v-else class="text-sm text-label">
        {{ $t('login.completing') }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { navigateTo } from '#app'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: false })

const route = useRoute()
const authStore = useAuthStore()

const error = ref(null)

onMounted(async () => {
  try {
    const intendedPath = await authStore.handleCallback(route.query)

    await navigateTo(intendedPath, { replace: true })
  } catch (caught) {
    error.value = caught.message
  }
})
</script>
