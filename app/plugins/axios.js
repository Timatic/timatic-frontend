import { getTimaticApi } from '~/utils/timaticApi'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.provide('timaticApi', getTimaticApi())
})
