import { defineStore } from 'pinia'
import { ref, shallowRef, computed } from 'vue'
import collect from 'collect.js'
import { getTimaticApi } from '~/utils/timaticApi'

const colors = [
  '24a086', '30ac63', '3081b8', '8c48ab', '2e3f51', 'f0c430', 'e47f31', 'e47f31', 'ecf0f1', '96a6a6',
  '28bc9a', '38cc76', '3b99da', '9b5cb3', '354a5d', 'f19b2e', 'd05518', 'bd3933', 'bcc3c9', '818c8e'
]

export const useCustomersStore = defineStore('customers', () => {
  const customers = shallowRef(collect())

  const collection = computed(() => customers.value)
  const getById = computed(() => (id) => customers.value.firstWhere('id', id))
  const getByExternalId = computed(() => (externalId) => customers.value.firstWhere('externalId', externalId))

  async function fetch (params) {
    const api = getTimaticApi()
    const response = await api.$get('customers', {
      params: {
        page: {
          size: 1000,
          number: (params && params.page) ? params.page : 1
        },
        include: 'accountManager'
      }
    })

    customers.value = customers.value.merge(
      collect(response.data).transform((customer) => {
        let color = colors[customer.id % 20]
        if (customer.attributes.isOwnOrganization) {
          color = '3081b8'
        }
        return {
          id: customer.id,
          color,
          ...customer.attributes,
          accountManagerUserId: customer.relationships.accountManager.data?.id
        }
      }).all()
    ).unique('id')

    if (response.links.next) {
      return fetch({ page: response.meta.currentPage + 1 })
    }

    return response
  }

  return { customers, collection, getById, getByExternalId, fetch }
})
