import { useAuthStore } from '~/stores/auth'

const PUBLIC_PATHS = ['/login', '/auth/callback', '/health']

export default defineNuxtRouteMiddleware((to) => {
  if (PUBLIC_PATHS.includes(to.path)) {
    return
  }

  if (useAuthStore().isAuthenticated) {
    return
  }

  return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
})
