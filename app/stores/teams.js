import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import collect from 'collect.js'
import { getTimaticApi } from '~/utils/timaticApi'

export const useTeamsStore = defineStore('teams', () => {
  const teams = ref(collect([]))

  const collection = computed(() => teams.value)
  const getById = computed(() => (id) => teams.value.firstWhere('id', id))

  async function fetch () {
    const api = getTimaticApi()
    const response = await api.$get('teams', {
      params: { page: { size: 500 } }
    })
    teams.value = collect(response.data).transform((team) => ({
      id: team.id,
      ...team.attributes
    }))
  }

  return { teams, collection, getById, fetch }
})
