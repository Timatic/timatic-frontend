import { defineStore } from 'pinia'
import { ref, shallowRef, computed } from 'vue'
import collect from 'collect.js'
import { getTimaticApi } from '~/utils/timaticApi'

export const colors = [
  '24a086', '30ac63', '3081b8', '8c48ab', '2e3f51', 'f0c430', 'e47f31', '96a6a6',
  '28bc9a', '38cc76', '3b99da', '9b5cb3', '354a5d', 'f19b2e', 'd05518', 'bd3933', 'bcc3c9', '818c8e'
]

// A customer without a color of its own gets a palette color by id
function fallbackColor (customer) {
  return customer.attributes.isOwnOrganization ? '3081b8' : colors[customer.id % colors.length]
}

function parseCustomer (customer) {
  return {
    id: customer.id,
    ...customer.attributes,
    color: customer.attributes.color ?? fallbackColor(customer),
    accountManagerUserId: customer.relationships?.accountManager?.data?.id
  }
}

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
      collect(response.data).transform(parseCustomer).all()
    ).unique('id')

    if (response.links.next) {
      return fetch({ page: response.meta.currentPage + 1 })
    }

    return response
  }

  async function save (customer) {
    const api = getTimaticApi()
    const body = {
      data: {
        type: 'customers',
        attributes: {
          name: customer.name,
          hourlyRate: customer.hourlyRate === '' ? null : customer.hourlyRate,
          color: customer.color
        },
        relationships: {
          accountManager: { data: customer.accountManagerUserId ? { type: 'users', id: customer.accountManagerUserId } : null }
        }
      }
    }
    const config = { params: { include: 'accountManager' } }
    const response = customer.id
      ? await api.$patch('customers/' + customer.id, body, config)
      : await api.$post('customers', body, config)

    const saved = parseCustomer(response.data)
    customers.value = customers.value.reject(item => item.id === saved.id).push(saved)

    return saved
  }

  async function remove (id) {
    await getTimaticApi().$delete('customers/' + id)
    customers.value = customers.value.reject(item => item.id === id)
  }

  return { customers, collection, getById, getByExternalId, fetch, save, remove }
})
