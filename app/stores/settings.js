import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getTimaticApi } from '~/utils/timaticApi'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref({ defaultHourlyRate: null })

  async function fetch () {
    const response = await getTimaticApi().$get('settings')
    settings.value = response.data.attributes
  }

  return { settings, fetch }
})
