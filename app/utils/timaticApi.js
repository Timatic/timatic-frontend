import axios from 'axios'
import * as qs from 'qs'
import { navigateTo } from '#app'
import { clearToken, readToken } from '~/utils/tokenStorage'

let _instance = null

export function getTimaticApi () {
  if (_instance) {
    return _instance
  }

  const baseURL = 'https://api.' + document.location.hostname

  const instance = axios.create({
    baseURL,
    paramsSerializer: (params) => qs.stringify(params, { arrayFormat: 'brackets' })
  })

  // Compat shims matching @nuxtjs/axios $-prefixed methods (return response.data directly)
  instance.$get = (url, config) => instance.get(url, config).then(r => r.data)
  instance.$post = (url, data, config) => instance.post(url, data, config).then(r => r.data)
  instance.$put = (url, data, config) => instance.put(url, data, config).then(r => r.data)
  instance.$patch = (url, data, config) => instance.patch(url, data, config).then(r => r.data)
  instance.$delete = (url, config) => instance.delete(url, config).then(r => r.data)

  instance.interceptors.request.use((config) => {
    const token = readToken()

    if (token) {
      config.headers.Authorization = 'Bearer ' + token
    }

    return config
  })

  instance.interceptors.response.use(
    response => response,
    (error) => {
      if (error.response?.status === 401) {
        clearToken()

        return navigateTo('/login').then(() => Promise.reject(error))
      }
      console.error(error)
      return Promise.reject(error)
    }
  )

  _instance = instance
  return _instance
}
