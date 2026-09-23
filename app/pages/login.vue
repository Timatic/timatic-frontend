<template>
  <div class="font-body min-h-screen flex items-center justify-center bg-background px-4">
    <div class="w-full max-w-sm rounded-lg bg-white p-8 shadow-standard">
      <h1 class="text-2xl font-bold text-page-title">
        {{ $t('login.title') }}
      </h1>

      <p v-if="error" class="mt-6 rounded bg-info-background p-4 text-sm text-warning">
        {{ error }}
      </p>

      <button
        v-else-if="provider"
        type="button"
        class="mt-6 w-full rounded bg-action-button py-3 text-sm font-medium text-white"
        @click="signIn"
      >
        {{ $t('login.action', { provider: provider.label }) }}
      </button>

      <p v-else class="mt-6 text-sm text-label">
        {{ $t('login.loading') }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { apiBaseUrl } from '~/utils/apiBaseUrl'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: false })

const route = useRoute()
const authStore = useAuthStore()

const provider = ref(null)
const error = ref(null)

onMounted(async () => {
  const response = await fetch(apiBaseUrl() + '/auth/provider', {
    headers: { Accept: 'application/json' }
  })

  if (!response.ok) {
    error.value = (await response.json()).message
    return
  }

  provider.value = await response.json()
})

function signIn () {
  authStore.login(route.query.redirect || '/')
}
</script>
