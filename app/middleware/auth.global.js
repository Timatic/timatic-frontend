import { useAuthStore } from '~/stores/auth'

const PUBLIC_PATHS = ['/login', '/auth/callback', '/health']

/**
 * A visitor without a token leaves for the api straight away, so the login screen they meet is the
 * identity provider's rather than one of this app's. The path they were heading for is kept for the
 * way back.
 *
 * Someone who signed out is the exception. The identity provider still remembers them, so sending
 * them on would sign them back in without a screen ever appearing and make signing out pointless.
 * They get this app's own screen and decide for themselves.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  if (PUBLIC_PATHS.includes(to.path)) {
    return
  }

  const authStore = useAuthStore()

  if (authStore.isAuthenticated) {
    return
  }

  if (authStore.signedOut) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }

  return navigateTo(await authStore.authorizationUrl(to.fullPath), { external: true })
})
