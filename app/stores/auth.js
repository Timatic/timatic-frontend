import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { navigateTo } from '#app'
import { getTimaticApi } from '~/utils/timaticApi'
import { clearToken, readToken, writeToken } from '~/utils/tokenStorage'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(readToken())

  const isAuthenticated = computed(() => token.value !== null)

  function remember (issuedToken) {
    writeToken(issuedToken)
    token.value = issuedToken
  }

  function forget () {
    clearToken()
    token.value = null
  }

  async function logout () {
    try {
      await getTimaticApi().$delete('oauth/token')
    } finally {
      forget()
      await navigateTo('/login')
    }
  }

  return {
    token,
    isAuthenticated,
    remember,
    forget,
    logout
  }
})
