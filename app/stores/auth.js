import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { navigateTo } from '#app'
import { apiBaseUrl } from '~/utils/apiBaseUrl'
import { challengeFor, randomString } from '~/utils/pkce'
import { getTimaticApi } from '~/utils/timaticApi'
import { clearToken, readToken, writeToken } from '~/utils/tokenStorage'

const CLIENT_ID = 'web'
const VERIFIER_KEY = 'timatic.codeVerifier'
const STATE_KEY = 'timatic.state'
const INTENDED_KEY = 'timatic.intendedPath'

export class AuthorizationError extends Error {}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(readToken())

  const isAuthenticated = computed(() => token.value !== null)

  /**
   * Starts the authorization code flow. The api answers oauth/authorize with a redirect straight
   * back to this app, because the web client is first party and skips the consent screen, but an
   * unauthenticated visitor passes through the identity provider on the way.
   */
  async function login (intendedPath = '/') {
    const codeVerifier = randomString(64)
    const state = randomString(32)

    window.sessionStorage.setItem(VERIFIER_KEY, codeVerifier)
    window.sessionStorage.setItem(STATE_KEY, state)
    window.sessionStorage.setItem(INTENDED_KEY, intendedPath)

    const query = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: redirectUri(),
      state,
      code_challenge: await challengeFor(codeVerifier),
      code_challenge_method: 'S256'
    })

    window.location.assign(apiBaseUrl() + '/oauth/authorize?' + query)
  }

  /**
   * Exchanges the single use code for a token and answers with the path the visitor was heading
   * for before they were sent to the login screen.
   */
  async function handleCallback ({ code, state, error }) {
    const expectedState = window.sessionStorage.getItem(STATE_KEY)
    const codeVerifier = window.sessionStorage.getItem(VERIFIER_KEY)
    const intendedPath = window.sessionStorage.getItem(INTENDED_KEY) || '/'

    forgetFlow()

    if (error) {
      throw new AuthorizationError(error)
    }

    if (!state || state !== expectedState) {
      throw new AuthorizationError('The response does not belong to this login attempt.')
    }

    if (!code || !codeVerifier) {
      throw new AuthorizationError('The response carries no usable authorization code.')
    }

    const response = await fetch(apiBaseUrl() + '/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        code,
        code_verifier: codeVerifier,
        redirect_uri: redirectUri(),
        device_name: deviceName()
      })
    })

    if (!response.ok) {
      throw new AuthorizationError(`The token exchange failed with status ${response.status}.`)
    }

    remember((await response.json()).token)

    return intendedPath
  }

  async function logout () {
    try {
      await getTimaticApi().$delete('oauth/token')
    } finally {
      forget()
      await navigateTo('/login')
    }
  }

  function remember (issuedToken) {
    writeToken(issuedToken)
    token.value = issuedToken
  }

  function forget () {
    clearToken()
    token.value = null
  }

  function forgetFlow () {
    window.sessionStorage.removeItem(VERIFIER_KEY)
    window.sessionStorage.removeItem(STATE_KEY)
    window.sessionStorage.removeItem(INTENDED_KEY)
  }

  function redirectUri () {
    return window.location.origin + '/auth/callback'
  }

  function deviceName () {
    return navigator.userAgent.includes('Mac')
      ? 'Browser op Mac'
      : navigator.userAgent.includes('Win') ? 'Browser op Windows' : 'Browser op Linux'
  }

  return {
    token,
    isAuthenticated,
    login,
    handleCallback,
    logout,
    remember,
    forget
  }
})
