import { defineStore } from 'pinia'
import { ref, shallowRef, computed } from 'vue'
import collect from 'collect.js'
import moment from 'moment'
import { getTimaticApi } from '~/utils/timaticApi'

export const useUsersStore = defineStore('users', () => {
  const currentUser = ref({
    id: null,
    givenName: null,
    familyName: null,
    permissions: collect(),
    entryLockDate: null
  })
  const users = shallowRef(collect())

  const getCurrentUser = computed(() => currentUser.value)
  const entryLockDate = computed(() => currentUser.value.entryLockDate)
  const canApproveOvertime = computed(() => currentUser.value.permissions.contains('overtimes.approve'))
  const canCreateBudget = computed(() => currentUser.value.permissions.contains('budgets.create'))
  const canEditBudget = computed(() => currentUser.value.permissions.contains('budgets.update'))
  const canEditEntriesFromOthers = computed(() => currentUser.value.permissions.contains('entries.update_from_others'))
  const canCreateEntriesForOthers = computed(() => currentUser.value.permissions.contains('entries.create_for_others'))
  const collection = computed(() => users.value.map((user) => {
    user.fullName = user.givenName + ' ' + user.familyName
    return user
  }))

  async function login () {
    const api = getTimaticApi()
    const response = await api.$get('me?include=permissions,team')
    const user = response.data

    if (currentUser.value.id === user.id) {
      return
    }

    const permissions = collect(response.included).where('type', 'permissions')
    user.permissions = permissions.pluck('id')
    user.entryLockDate = moment(permissions.firstWhere('id', 'entries.update_in_past_until').attributes.values.lockedAt)

    const { id, attributes, relationships } = user
    currentUser.value = {
      id,
      givenName: attributes.givenName,
      familyName: attributes.familyName,
      teamId: relationships.team.data?.id,
      permissions: user.permissions,
      entryLockDate: user.entryLockDate
    }
  }

  async function fetch () {
    if (users.value.count() > 0) {
      return
    }

    const api = getTimaticApi()
    const response = await api.$get('users', {
      params: {
        filters: { isInternal: true, accountEnabled: true },
        page: { size: 1000 },
        include: 'team'
      }
    })

    users.value = collect(response.data).transform((user) => ({
      id: user.id,
      teamId: user.relationships.team.data?.id,
      ...user.attributes
    }))

    return response
  }

  return {
    currentUser,
    users,
    getCurrentUser,
    entryLockDate,
    canApproveOvertime,
    canCreateBudget,
    canEditBudget,
    canEditEntriesFromOthers,
    canCreateEntriesForOthers,
    collection,
    login,
    fetch
  }
})
