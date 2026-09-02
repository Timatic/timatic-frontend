import { defineStore } from 'pinia'
import { ref, shallowRef, computed } from 'vue'
import collect from 'collect.js'
import { getTimaticApi } from '~/utils/timaticApi'

export const useBudgetTypesStore = defineStore('budgetTypes', () => {
  const budgetTypes = shallowRef(collect())

  const collection = computed(() => budgetTypes.value)

  async function fetch () {
    if (budgetTypes.value.count()) {
      return
    }

    const api = getTimaticApi()
    const response = await api.$get('budget-types')
    budgetTypes.value = collect(response.data).transform((budgetType) => ({
      id: budgetType.id,
      ...budgetType.attributes,
      hasRenewalFrequency: budgetType.attributes.renewalFrequencies.length > 0
    }))
  }

  return { budgetTypes, collection, fetch }
})
