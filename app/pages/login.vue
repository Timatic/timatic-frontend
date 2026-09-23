<template>
  <div class="font-body min-h-screen flex items-center justify-center bg-background px-4">
    <div class="w-full max-w-sm rounded-lg bg-white p-8 shadow-standard">
      <h1 class="text-2xl font-bold text-page-title">
        {{ $t('login.title') }}
      </h1>

      <p class="mt-2 text-sm text-label">
        {{ $t('login.intro') }}
      </p>

      <button
        type="button"
        class="mt-6 w-full rounded bg-action-button py-3 text-sm font-medium text-white"
        @click="signIn"
      >
        {{ $t('login.action') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: false })

const route = useRoute()
const authStore = useAuthStore()

function signIn () {
  authStore.login(route.query.redirect || '/')
}
</script>
