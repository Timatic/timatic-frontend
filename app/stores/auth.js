import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { navigateTo } from '#app'
import { apiBaseUrl } from '~/utils/apiBaseUrl'
import { challengeFor, randomString } from '~/utils/pkce'
import { getTimaticApi } from '~/utils/timaticApi'
import { clearToken, hasSignedOut, markSignedOut, readToken, writeToken } from '~/utils/tokenStorage'

const CLIENT_ID = 'web'
const VERIFIER_KEY = 'timatic.codeVerifier'
const STATE_KEY = 'timatic.state'
const INTENDED_KEY = 'timatic.intendedPath'
const REAUTHENTICATED_KEY = 'timatic.reauthenticated'

export class AuthorizationError extends Error {}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(readToken())

  /**
   * Whether the visitor signed out rather than simply arriving without a token. It decides who gets
   * sent to the identity provider unasked and who gets a screen to press first.
   */
  const signedOut = ref(hasSignedOut())

  const isAuthenticated = computed(() => token.value !== null)

  /**
   * Starts the authorization code flow by leaving this app for the api.
   */
  async function login (intendedPath = '/') {
    window.location.assign(await authorizationUrl(intendedPath))
  }

  /**
   * Where a visitor without a token belongs. The api answers oauth/authorize with a redirect
   * straight back to this app, because the web client is first party and skips the consent screen,
   * but an unauthenticated visitor passes through the identity provider on the way, which is the
   * login screen they should be seeing instead of one of this app's own.
   */
  async function authorizationUrl (intendedPath = '/') {
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

    return apiBaseUrl() + '/oauth/authorize?' + query
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

  /**
   * Revokes the token this app holds, then leaves for the api to end the browser session the
   * authorization code flow runs on. Skipping that second step would let the next authorization
   * request approve itself against a session that is still open.
   */
  async function logout () {
    try {
      await getTimaticApi().$delete('oauth/token')
    } finally {
      forget()
      markSignedOut()
      signedOut.value = true

      window.location.assign(apiBaseUrl() + '/auth/logout')
    }
  }

  /**
   * Answers a token the api rejects. The identity provider still remembers the visitor, so one
   * silent attempt at a new token costs them nothing and spares them a screen. A second rejection
   * in the same tab means something other than expiry is wrong, and repeating would bounce the
   * browser between the two apps forever, so that one ends at the login screen.
   */
  async function reauthenticate (intendedPath = '/') {
    forget()

    if (window.sessionStorage.getItem(REAUTHENTICATED_KEY)) {
      return navigateTo('/login')
    }

    window.sessionStorage.setItem(REAUTHENTICATED_KEY, '1')

    await login(intendedPath)
  }

  function remember (issuedToken) {
    writeToken(issuedToken)
    token.value = issuedToken
    signedOut.value = false

    window.sessionStorage.removeItem(REAUTHENTICATED_KEY)
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
    signedOut,
    isAuthenticated,
    authorizationUrl,
    login,
    reauthenticate,
    handleCallback,
    logout,
    remember,
    forget
  }
})
