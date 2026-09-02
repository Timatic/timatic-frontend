import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import collect from 'collect.js'
import moment from 'moment'
import { getTimaticApi } from '~/utils/timaticApi'

export const useEntriesStore = defineStore('entries', () => {
  const entries = ref(collect())

  const collection = computed(() => entries.value)

  async function fetch (params) {
    if (entries.value.where('date', params.date).count() > 0 && params.reload !== true) {
      return
    }

    const { useUsersStore } = await import('~/stores/users')
    const usersStore = useUsersStore()

    const date = params.date
    const startedAt = date.clone().endOf('day').utc().format('YYYY-MM-DD HH:mm:ss')
    const endedAt = date.clone().startOf('day').utc().format('YYYY-MM-DD HH:mm:ss')

    const api = getTimaticApi()
    const response = await api.$get('entries', {
      params: {
        page: { size: 1000 },
        filter: {
          startedAt: { lte: startedAt },
          endedAt: { gt: endedAt },
          userId: usersStore.getCurrentUser.id
        },
        include: 'customer,budget'
      }
    })

    const newEntries = parseDataToEntries(response.data, response.included)

    let newState = entries.value
    if (newEntries.count()) {
      newState = newState.reject(entry => entry.date === newEntries.first().date)
    }

    entries.value = newState.merge(newEntries.all())
  }

  async function save (entryFields) {
    const { useUsersStore } = await import('~/stores/users')
    const usersStore = useUsersStore()

    const attributes = {
      customerId: entryFields.customer.id,
      customerName: entryFields.customer.name,
      userId: entryFields.userId ?? usersStore.getCurrentUser.id,
      description: entryFields.description,
      entryType: entryFields.type,
      date: entryFields.startedAt.format('YYYY-MM-DD'),
      hasOvertime: entryFields.overtime || false,
      hasCustomerOvertime: entryFields.chargeCustomer || false,
      startedAt: entryFields.startedAt.clone().utc().toJSON(),
      endedAt: entryFields.endedAt.clone().utc().toJSON(),
      isPaidPerHour: entryFields.settlement === 'paid',
      isInternal: entryFields.settlement === 'internal'
    }

    if (entryFields.ticket !== null) {
      attributes.ticketId = entryFields.ticket.id
      attributes.ticketType = entryFields.ticket.type
      attributes.ticketTitle = entryFields.ticket.title
      attributes.ticketNumber = entryFields.ticket.number
    }
    if (entryFields.settlement === 'paid' && !isNaN(entryFields.budget.id)) {
      attributes.budgetId = entryFields.budget.id
    }
    if (entryFields.overtimeHours) {
      attributes.overtimeStartedAt = entryFields.overtimeHours.start.utc().toJSON()
      attributes.overtimeEndedAt = entryFields.overtimeHours.end.utc().toJSON()
    }
    if (entryFields.userFullName) {
      attributes.userFullName = entryFields.userFullName
    }

    let action = '$post'
    let endpoint = 'entries'
    if (entryFields.id) {
      action = '$put'
      endpoint += '/' + entryFields.id
    }
    if (entryFields.suggestionId) {
      attributes.entrySuggestionId = entryFields.suggestionId
    }

    const api = getTimaticApi()
    const result = await api[action](endpoint, {
      data: { type: 'entries', attributes }
    })

    await fetch({ date: entryFields.startedAt, reload: true })
    return result
  }

  function remove (entryId) {
    entries.value = entries.value.reject(entry => entry.id === entryId)
  }

  async function deleteEntry (params) {
    const api = getTimaticApi()
    api.$delete('entries/' + params.entryId)
    remove(params.entryId)
  }

  async function updateStartEnd (event) {
    const api = getTimaticApi()
    const result = await api.$patch('entries/' + event.id, {
      data: {
        type: 'entries',
        attributes: {
          startedAt: moment(event.start).utc().toJSON(),
          endedAt: moment(event.end).utc().toJSON()
        }
      }
    })

    await fetch({ date: moment(event.start), reload: true })
    return result
  }

  return { entries, collection, fetch, save, deleteEntry, updateStartEnd }
})

export function parseDataToEntries (data, included) {
  const relations = collect(included).map((item) => ({ ...item.attributes }))

  return collect(data)
    .transform((entry) => ({
      id: entry.id,
      ...entry.attributes,
      customerId: entry.relationships?.customer?.data.id
    }))
    .transform((entry) => {
      entry.date = moment(entry.startedAt).format('YYYY-MM-DD')
      entry.startedAt = moment(entry.startedAt)
      entry.endedAt = moment(entry.endedAt)
      const overtimes = relations.where('entryId', '==', entry.id)
      entry.personalOvertime = overtimes.firstWhere('overtimeTypeId', '==', 'personal')
      entry.customerOvertime = overtimes.firstWhere('overtimeTypeId', '==', 'customer')
      return entry
    })
}
