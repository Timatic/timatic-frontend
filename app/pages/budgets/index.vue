<template>
  <div class="font-body">
    <app-bar />

    <div class="bg-background">
      <div class="p-8 text-page-title page-margins page-width min-h-screen">
        <div class="flex mb-6 font-rubik justify-between">
          <div class="w-1/3">
            <div class="flex justify-start mb-4">
              <div class="text-2xl font-bold leading-8">{{ $t('budgets') }}</div>
            </div>
          </div>
          <div class="w-2/3 flex justify-end items-center">
            <div v-show="userIsAccountManager" class="flex justify-center items-center mr-4">
              <div class="input-wrapper mr-2">
                <input id="accountManagerFilter" class="checkbox" type="checkbox" name="accountManagerFilter" @click="showAccountManagerBudgets = !showAccountManagerBudgets">
                <span class="checkmark" />
              </div>
              <label for="accountManagerFilter">{{ $t('onlyMyBudgets') }}</label>
            </div>
            <div class="flex justify-center items-center mr-4">
              <div class="input-wrapper mr-2">
                <input id="closed" class="checkbox" type="checkbox" name="closed" @click="showArchived = !showArchived">
                <span class="checkmark" />
              </div>
              <label for="closed">{{ $t('closedBudgets') }}</label>
            </div>
            <div v-if="canCreateBudget" class="pl-4">
              <button class="bg-action-button py-2 px-10 rounded text-white font-medium h-12" @click="openCreateBudgetModal = true">
                {{ $t('create') }}
              </button>
            </div>
            <div class="pl-4">
              <button class="border border-input-border py-2 px-5 rounded font-normal h-12" @click="openExportModal = true">
                {{ $t('export') }}
              </button>
            </div>
          </div>
        </div>
        <div>
          <vue-good-table
            :columns="columns"
            :rows="rows"
            style-class="vgt-table vgt-table-customization whitespace-no-wrap text-page-title font-normal"
            :sort-options="{
              enabled:true,
              initialSortBy: { field: tableState.sortBy.field, type: tableState.sortBy.type }
            }"
            :pagination-options="{
              perPage: tableState.currentPerPage,
              setCurrentPage: tableState.currentPage,
              enabled: true,
              perPageDropdown: [25, 50, 100],
              dropdownAllowAll: true,
              rowsPerPageLabel: $t('Budgets per page'),
              allLabel: $t('All')
            }"
            @column-filter="onColumnFilter"
            @row-click="openDetails"
            @page-change="onPageChange"
            @sort-change="onSortChange"
            @per-page-change="onPageChange"
          >
            <template #table-column="props">
              <div class="font-rubik text-sm text-filter-text text-left text-page-title font-normal" :class="{ 'text-right': props.column.label === 'Time' }">
                <p class="cursor-pointer">{{ $t(props.column.label) }}</p>
              </div>
            </template>
            <template #table-row="props">
              <div :class="{'archived':props.row.isArchived}">
                <template v-if="props.column.field === 'initialMinutes'">
                  <span>{{ timeFormat(props.row.initialMinutes) }}</span>
                </template>
                <template v-else-if="props.column.field === 'lastPeriod.remainingMinutes'">
                  <span v-if="props.row.lastPeriod" :class="props.row.class">
                    {{ timeFormat(props.row.lastPeriod.remainingMinutes) }}
                  </span>
                </template>
                <div v-else-if="props.column.field === 'concatenatedTitle'" class="truncate budget-title" :class="{'archived':props.row.isArchived}">
                  <span v-show="searchOnChangeNo">{{ props.row.changeId }} -</span>
                  {{ props.row.title }}
                </div>
                <div v-else-if="props.column.field === 'customer.name'" class="truncate customer-name">
                  {{ props.formattedRow[props.column.field] }}
                </div>
                <template v-else-if="props.column.field === 'endedAtString'">
                  <span :class="props.row.expirationClass">{{ props.formattedRow[props.column.field] }}</span>
                </template>
                <template v-else>{{ props.formattedRow[props.column.field] }}</template>
              </div>
            </template>
            <template #emptystate>
              <div class="text-center">
                <template v-if="loadingBudgets">
                  <LoadingIcon />
                  <span>Loading {{ showArchived ? 'closed' : '' }} budgets</span>
                </template>
                <span v-else>There are no matching budgets</span>
              </div>
            </template>
          </vue-good-table>
        </div>
      </div>
    </div>
    <export-modal v-if="openExportModal" @closeModal="openExportModal = false" />
    <create-budget-modal v-if="openCreateBudgetModal" @closeModal="openCreateBudgetModal = false" />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import collect from 'collect.js'
import moment from 'moment'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from '#app'
import LoadingIcon from '~/assets/svg/loading.svg'
import { timeFormat } from '~/utils/filters'
import { useUsersStore } from '~/stores/users'
import { useCustomersStore } from '~/stores/customers'
import { useBudgetsStore } from '~/stores/budgets'
import { useBudgetTypesStore } from '~/stores/budgetTypes'

useHead({ title: 'Budgets - Timatic' })

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const usersStore = useUsersStore()
const customersStore = useCustomersStore()
const budgetsStore = useBudgetsStore()
const budgetTypesStore = useBudgetTypesStore()

const defaultTableState = {
  sortBy: { field: 'customer.name', type: 'asc' },
  currentPerPage: 25,
  currentPage: 1,
  filters: { customer: '', budgetType: '', budgetTitle: '' }
}

const showArchived = ref(false)
const showAccountManagerBudgets = ref(false)
const openExportModal = ref(false)
const openCreateBudgetModal = ref(false)
const tableState = ref({ ...defaultTableState, updating: true })
const searchOnChangeNo = ref(false)

const loadingBudgets = computed(() => budgetsStore.loadingState)
const canCreateBudget = computed(() => usersStore.canCreateBudget)

const userIsAccountManager = computed(() => {
  if (customersStore.collection.count() > 0) {
    return customersStore.collection.where('accountManagerUserId', usersStore.getCurrentUser.id).count() > 0
  }
  return false
})

const rows = computed(() => {
  if (loadingBudgets.value) return []

  let budgetRows = budgetsStore.collection.map((budget) => {
    budget.type = budgetTypesStore.collection.firstWhere('id', budget.budgetTypeId)
    budget.customer = customersStore.collection.firstWhere('id', budget.customerId?.toString()) || { name: budget.customerId }

    if (budget.expired) budget.expirationClass = 'text-warning'

    budget.supervisorString = ''
    if (budget.supervisorUserId) {
      budget.supervisorString = usersStore.collection.firstWhere('id', budget.supervisorUserId)?.fullName || null
    }

    budget.endedAtString = budget.endedAt.format('YYYY-MM-DD')
    budget.concatenatedTitle = (budget.changeId || '') + ' ' + budget.title

    if (budget.initialMinutes === 0) {
      budget.class = 'text-gray-400'
    } else if (budget.lastPeriod) {
      if (budget.lastPeriod.remainingMinutes < 0) {
        budget.class = 'text-warning'
      } else if (moment(budget.endedAt).isBefore(moment())) {
        budget.class = 'text-gray-400'
      } else if (budget.lastPeriod.remainingMinutes / budget.initialMinutes < 0.2) {
        budget.class = 'text-alert'
      }
    }

    return budget
  })

  budgetRows = budgetRows.where('isArchived', showArchived.value)

  if (showAccountManagerBudgets.value) {
    budgetRows = budgetRows.where('customer.accountManagerUserId', usersStore.getCurrentUser.id)
  }

  return budgetRows.all()
})

const customersWithBudgets = computed(() => {
  if (customersStore.collection.count() > 0 && budgetsStore.collection) {
    return customersStore.collection.whereIn('id', budgetsStore.collection.pluck('customerId').toArray())
  }
  return collect()
})

const columns = computed(() => {
  let budgetTypesList = []
  if (budgetTypesStore.collection) {
    budgetTypesList = budgetTypesStore.collection
      .whereIn('id', budgetsStore.collection.pluck('budgetTypeId').all())
      .pluck('title').values().sort().all()
  }

  return [
    {
      label: 'customer',
      field: 'customer.name',
      filterOptions: {
        enabled: true,
        filterDropdownItems: customersWithBudgets.value.pluck('name').values().sort().all(),
        filterValue: tableState.value.filters.customer
      }
    },
    {
      label: 'type',
      field: 'type.title',
      filterOptions: {
        enabled: true,
        filterDropdownItems: budgetTypesList,
        filterValue: tableState.value.filters.budgetType
      }
    },
    {
      label: 'budgetTitle',
      field: 'concatenatedTitle',
      filterOptions: {
        enabled: true,
        placeholder: t('filterBudgetTitleOrChangeNumber'),
        filterValue: tableState.value.filters.budgetTitle
      }
    },
    { label: 'supervisor', field: 'supervisorString', type: 'text' },
    { label: 'expirationDate', field: 'endedAtString', type: 'date', dateInputFormat: 'yyyy-MM-dd', dateOutputFormat: 'dd-MM-yyyy' },
    { label: 'budget', field: 'initialMinutes', type: 'number' },
    { label: 'time', field: 'lastPeriod.remainingMinutes', tdClass: 'text-right', type: 'number' }
  ]
})

watch(showArchived, (checked) => {
  if (checked) budgetsStore.fetch({ loadArchived: true })
})

onMounted(() => {
  restoreTableState()
  window.onpopstate = restoreTableState
  tableState.value.updating = false
})

onBeforeUnmount(() => {
  window.onpopstate = null
})

function openDetails (row) {
  router.push({ path: `/budgets/${row.row.id}/` })
}

function onColumnFilter (params) {
  searchOnChangeNo.value = params.columnFilters.concatenatedTitle?.includes('IMX')
  updateState({
    filters: {
      customer: params.columnFilters['customer.name'] ?? '',
      budgetType: params.columnFilters['type.title'] ?? '',
      budgetTitle: params.columnFilters.concatenatedTitle ?? ''
    }
  })
}

function onPageChange (params) {
  updateState({ currentPage: params.currentPage, currentPerPage: params.currentPerPage })
}

function onSortChange (params) {
  updateState({ sortBy: params[0] })
}

function updateState (stateChange) {
  if (tableState.value.updating) return

  const newState = { ...tableState.value, ...stateChange }
  delete newState.updating
  for (const propName in newState.filters) {
    if (newState.filters[propName] === null || newState.filters[propName] === '') {
      delete newState.filters[propName]
    }
  }

  const hash = btoa(JSON.stringify(newState))
  if (decodeURIComponent(route.hash.substr(1)) !== hash) {
    router.replace({ hash: '#' + hash })
  }
}

function restoreTableState () {
  tableState.value.updating = true
  const hash = decodeURIComponent(route.hash.substr(1))
  let state = { sortBy: {}, filters: {} }
  if (hash) {
    try {
      state = JSON.parse(atob(hash))
    } catch {
      state = { sortBy: {}, filters: {} }
    }
  }

  tableState.value.sortBy.field = state.sortBy.field ?? defaultTableState.sortBy.field
  tableState.value.sortBy.type = state.sortBy.type ?? defaultTableState.sortBy.type
  tableState.value.currentPerPage = state.currentPerPage ?? defaultTableState.currentPerPage
  tableState.value.currentPage = state.currentPage ?? defaultTableState.currentPage
  tableState.value.filters.customer = state.filters.customer ?? ''
  tableState.value.filters.budgetType = state.filters.budgetType ?? ''
  tableState.value.filters.budgetTitle = state.filters.budgetTitle ?? ''

  nextTick(() => {
    tableState.value.updating = false
  })
}
</script>

<style scoped>
:deep(tr th.filter-th:nth-child(1)), .customer-name { max-width: 15rem; }
:deep(tr th.filter-th:nth-child(3)), .budget-title { max-width: 22rem; }
:deep(tr div.archived) { color: #99A8B8; }
</style>
