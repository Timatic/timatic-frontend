import { defineStore } from 'pinia'
import { ref, shallowRef, computed } from 'vue'
import collect from 'collect.js'
import moment from 'moment'
import { getTimaticApi } from '~/utils/timaticApi'

export const useBudgetsStore = defineStore('budgets', () => {
  const budgets = shallowRef(collect())
  const loadingBudgets = ref(false)

  const all = computed(() => budgets.value.count() ? budgets.value.sortBy('title').all() : [])
  const collection = computed(() => budgets.value)
  const loadingState = computed(() => loadingBudgets.value)
  const getActiveBudgetsFromCustomer = computed(() => (customerId) =>
    budgets.value.where('customerId', customerId).where('isArchived', false)
  )
  const getById = computed(() => (id) => budgets.value.firstWhere('id', String(id)))

  async function fetch (params = {}) {
    const filters = { isArchived: (params && params.loadArchived) ? 1 : 0 }

    if (budgets.value.where('isArchived', '===', !!filters.isArchived).count() > 0) {
      return
    }

    const api = getTimaticApi()
    loadingBudgets.value = true
    let pageNumber = 1

    do {
      await api.$get('budgets', {
        params: {
          filter: filters,
          include: 'customer,allowedUsers,lastPeriod,supervisor',
          page: { size: 500, number: pageNumber }
        }
      }).then((response) => {
        budgets.value = budgets.value.merge(parseJsonApiDataToBudgets(response.data, response.included).all()).unique('id')
        pageNumber++
        if (pageNumber > response.meta.lastPage) {
          pageNumber = false
        }
      })
    } while (pageNumber)

    loadingBudgets.value = false
  }

  async function fetchOne (budgetId) {
    if (budgets.value.where('id', '===', budgetId).count() > 0) {
      return
    }

    const api = getTimaticApi()
    const response = await api.$get('budgets/' + budgetId, {
      params: { include: 'customer,allowedUsers' }
    })

    const newBudget = parseJsonApiDataToBudgets([response.data], response.included).first()
    budgets.value = budgets.value.reject(budget => budget.id === response.data.id)
    budgets.value.push(newBudget)
  }

  async function create (budgetFields) {
    const attributes = {
      title: budgetFields.title,
      showToCustomer: budgetFields.showToCustomer,
      customerId: budgetFields.customer.id,
      initialMinutes: parseFloat(budgetFields.initialHours) * 60,
      budgetTypeId: budgetFields.type.id,
      contractId: budgetFields.contractId,
      description: budgetFields.description,
      totalPrice: budgetFields.totalPrice,
      startedAt: moment(budgetFields.startedAt, 'DD-MM-YYYY').toJSON(),
      endedAt: moment(budgetFields.endedAt, 'DD-MM-YYYY').toJSON()
    }
    const relationships = {
      allowedUsers: { data: budgetFields.allowedUsers || [] }
    }

    const budgetType = budgetFields.type
    if (budgetType.hasChangeTicket) {
      attributes.changeId = budgetFields.changeNo
    }
    if (budgetType.hasRenewalFrequency) {
      attributes.renewalFrequency = budgetFields.renewalFrequency
    }
    if (budgetType.hasSupervisor) {
      attributes.supervisorUserId = budgetFields.supervisor?.id
    }

    const api = getTimaticApi()
    const result = await api.$post('budgets', {
      data: { type: 'budgets', attributes, relationships }
    }, {
      params: { include: 'customer,allowedUsers,supervisor' }
    })

    const newBudget = parseJsonApiDataToBudgets([result.data], result.included).first()
    budgets.value = budgets.value.reject(budget => budget.id === result.data.id)
    budgets.value.push(newBudget)

    return result
  }

  async function update (budgetFields) {
    const attributes = {
      id: budgetFields.id,
      title: budgetFields.title,
      showToCustomer: budgetFields.showToCustomer,
      initialMinutes: parseFloat(budgetFields.initialHours) * 60,
      contractId: budgetFields.contractId,
      description: budgetFields.description,
      totalPrice: budgetFields.totalPrice,
      endedAt: moment(budgetFields.endedAt, 'DD-MM-YYYY').toJSON()
    }
    const relationships = {
      allowedUsers: { data: budgetFields.allowedUsers || [] }
    }

    if (budgetFields.effectiveFrom) {
      attributes.effectiveFrom = budgetFields.effectiveFrom
    }
    const budgetType = budgetFields.budgetType
    if (budgetType.hasSupervisor) {
      attributes.supervisorUserId = budgetFields.supervisor?.id
    }
    if (budgetType.hasChangeTicket) {
      attributes.changeId = budgetFields.changeId
    }

    const api = getTimaticApi()
    const result = await api.$patch('budgets/' + budgetFields.id, {
      data: { type: 'budgets', attributes, relationships }
    })

    const newBudget = parseJsonApiDataToBudgets([result.data], result.included).first()
    budgets.value = budgets.value.reject(budget => budget.id === result.data.id)
    budgets.value.push(newBudget)

    return result
  }

  async function close (budgetFields) {
    const api = getTimaticApi()
    const result = await api.$patch('budgets/' + budgetFields.id, {
      data: {
        type: 'budgets',
        attributes: { isArchived: true }
      }
    })

    const newBudget = parseJsonApiDataToBudgets([result.data], result.included).first()
    budgets.value = budgets.value.reject(budget => budget.id === result.data.id)
    budgets.value.push(newBudget)

    return result
  }

  return {
    budgets,
    loadingBudgets,
    all,
    collection,
    loadingState,
    getActiveBudgetsFromCustomer,
    getById,
    fetch,
    fetchOne,
    create,
    update,
    close
  }
})

export function parseJsonApiDataToBudgets (data, included) {
  const relations = collect(included).map((item) => ({ id: item.id, type: item.type, ...item.attributes }))
  const periods = relations.where('type', 'periods')
  const users = relations.where('type', 'users')

  return collect(data).transform((budget) => {
    const result = {
      id: budget.id,
      ...budget.attributes
    }
    result.customerId = budget.relationships.customer?.data.id
    result.supervisorUserId = budget.relationships.supervisor?.data?.id
    result.startedAt = moment(result.startedAt)
    result.endedAt = moment(result.endedAt)
    result.expired = result.endedAt.isBefore()
    result.startsInFuture = result.startedAt.isAfter()

    if (budget.relationships.lastPeriod?.data) {
      result.lastPeriod = periods.firstWhere('id', budget.relationships.lastPeriod.data.id)
    }

    result.allowedUsers = []
    if (budget.relationships.allowedUsers?.data) {
      const ids = collect(budget.relationships.allowedUsers.data).pluck('id').all()
      result.allowedUsers = users.whereIn('id', ids).all()
    }

    return result
  })
}
