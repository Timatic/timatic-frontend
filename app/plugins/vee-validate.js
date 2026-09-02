import { defineRule, configure, Form, Field, ErrorMessage } from 'vee-validate'
import { required } from '@vee-validate/rules'

defineRule('required', required)

configure({
  validateOnInput: false,
  validateOnBlur: true
})

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('VeeForm', Form)
  nuxtApp.vueApp.component('VeeField', Field)
  nuxtApp.vueApp.component('VeeErrorMessage', ErrorMessage)
})
