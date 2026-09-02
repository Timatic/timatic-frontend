import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import collect from 'collect.js'
import moment from 'moment'
import { getTimaticApi } from '~/utils/timaticApi'

export const useOvertimeStore = defineStore('overtime', () => {
  const overtimes = ref(collect())

  const collection = computed(() => overtimes.value)

  async function fetch (params) {
    const date = (params.date ?? moment()).clone().startOf('month')

    if (overtimes.value.where('month', date.format('YYYY-MM')).count() > 0 && params.reload !== true) {
      return
    }

    const startOfMonth = date.clone().startOf('month').utc().format('YYYY-MM-DD HH:mm:ss')
    const endOfMonth = date.clone().endOf('month').utc().format('YYYY-MM-DD HH:mm:ss')

    const api = getTimaticApi()
    const response = await api.$get('overtimes', {
      params: {
        filter: {
          startedAt: { gte: startOfMonth, lte: endOfMonth }
        },
        page: { size: 500 },
        include: 'entry'
      }
    })

    const relations = collect(response.included).map((item) => ({ id: item.id, ...item.attributes }))
    const newOvertimes = collect(response.data)
      .transform((overtime) => ({
        id: overtime.id,
        ...overtime.attributes
      }))
      .transform((overtime) => {
        overtime.month = moment(overtime.startedAt).startOf('month').format('YYYY-MM')
        overtime.startedAt = moment(overtime.startedAt)
        overtime.endedAt = moment(overtime.endedAt)
        const entry = relations.firstWhere('id', '==', overtime.entryId)
        overtime.user = {
          id: entry.userId,
          email: entry.userEmail,
          fullName: entry.userFullName
        }
        overtime.entry = {
          ticketNumber: entry.ticketNumber,
          ticketTitle: entry.ticketTitle,
          description: entry.description,
          customerId: entry.customerId,
          customerName: entry.customerName,
          hadEmergencyShift: entry.hadEmergencyShift
        }
        return overtime
      })

    let newState = overtimes.value
    if (newOvertimes.count()) {
      newState = newState.reject(entry => entry.month === newOvertimes.first().month)
    }

    overtimes.value = newState.merge(newOvertimes.all())
  }

  async function approve (params) {
    const api = getTimaticApi()
    const responses = await Promise.all(
      collect(params.ids).map(id => api.$post(`overtimes/${id}/approve`)).all()
    )
    await fetch({ date: params.date, reload: true })
    return responses
  }

  return { overtimes, collection, fetch, approve }
})
