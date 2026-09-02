<template>
  <div class="font-body">
    <app-bar />

    <div class="bg-background">
      <div class="page-margins page-width min-h-screen  text-page-title">
        <div class="px-8 pt-8">
          <div class="flex justify-between items-center pb-4">
            <div class="text-2xl leading-8 text-page-title font-bold w-1/3">
              {{ $t('entries') }}
            </div>
            <div class="w-1/3 flex justify-end">
              <month-picker v-if="! queryFilters.dates" :allow-all="true" @update:model-value="setPeriod" />
              <div v-else class="flex">
                <div class="min-w-min h-12 border border-input-border rounded px-4 flex items-center text-base">
                  {{ queryFilters.dates.from.format('D MMMM') }} to {{ queryFilters.dates.to.format('D MMMM') }}
                </div>
                <div class="h-12 border border-input-border w-12 rounded ml-2 cursor-pointer text-action-button flex items-center justify-center" @click="dropFilters">
                  <CloseIcon class="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="px-8">
          <vue-good-table
            ref="entriesTable"
            :columns="columns"
            :rows="rows"
            :sort-options="{
              enabled: true,
              initialSortBy: {field: 'date', type: 'desc'}
            }"
            :pagination-options="{
              enabled: true,
              mode: 'pages',
              perPage: 50,
              perPageDropdownEnabled: false,
            }"
            mode="remote"
            :total-rows="totalRecords"
            @row-click="onEventClick"
            @page-change="onPageChange"
            @sort-change="onSortChange"
            @column-filter="onColumnFilter"
            @per-page-change="onPerPageChange"
          >
            <template #table-column="props">
              <div
                class="font-rubik text-sm text-filter-text text-left font-normal"
                :class="{'text-right' : props.column.field === 'timeSpent'}"
              >
                {{ props.column.label }}
              </div>
            </template>
            <template #table-row="props">
              <div v-if="props.column.field === 'ticketNumber'">
                {{ props.formattedRow[props.column.field] }}
                <a v-if="props.row.ticketId" :href="props.row.ticketUrl" target="_blank">
                  <LinkIcon class="font-normal text-action-button cursor-pointer inline" />
                </a>
              </div>
              <div v-else-if="props.column.field === 'timeSpent'" class="text-right">
                {{ timeFormat(props.formattedRow[props.column.field]) }}
              </div>
              <div
                v-else-if="props.column.field === 'ticketTitle'"
                class="truncate"
                style="max-width: 300px;"
                :title="props.formattedRow[props.column.field]"
              >
                {{ props.formattedRow[props.column.field] }}
              </div>
              <template v-else-if="props.column.field === 'grouped'" />
              <div v-else class="text-left">
                {{ props.formattedRow[props.column.field] }}
              </div>
            </template>
            <template #emptystate><div class="text-center">
              <template v-if="loadingEntries">
                <LoadingIcon />
                Loading entries
              </template>
              <p v-else>
                No entries found
              </p>
            </div></template>
          </vue-good-table>
          <div class="text-right p-3">
            {{ $t('totalAmountOfHours') }}: <span class="font-medium">{{ timeFormat(totalHours) }}</span>
          </div>
        </div>
      </div>
    </div>
    <update-entry-modal
      v-if="showEntryModal"
      :entry="selectedEntry"
      :long-title="true"
      @closeModal="showEntryModal=false"
      @entrySaved="setPeriod(month)"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import moment from 'moment'
import collect from 'collect.js'
import axios from 'axios'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useBudgetsStore } from '~/stores/budgets'
import { useCustomersStore } from '~/stores/customers'
import { useUsersStore } from '~/stores/users'
import { parseDataToEntries } from '~/stores/entries'
import { getTimaticApi } from '~/utils/timaticApi'
import LoadingIcon from '~/assets/svg/loading.svg'
import LinkIcon from '~/assets/svg/external-link.svg'
import CloseIcon from '~/assets/svg/close.svg'
import { timeFormat } from '~/utils/filters'

useHead({ title: 'Entries - Timatic' })

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const budgetsStore = useBudgetsStore()
const customersStore = useCustomersStore()
const usersStore = useUsersStore()

const entriesTable = ref(null)
const month = ref(null)
const entries = ref(collect())
const showEntryModal = ref(false)
const selectedEntry = ref(null)
const loadingEntries = ref(false)
const cancelTokenSource = ref(null)
const totalHours = ref(0)
const totalRecords = ref(0)
const serverParams = ref({
  filter: {},
  page: { size: 50, number: 1 },
  include: 'customer,budget'
})
const queryFilters = ref({
  dates: null,
  user: null,
  customerId: null,
  settlement: null
})

const rows = computed(() => {
  if (loadingEntries.value) return []
  return entries.value.map((entry) => {
    entry.timeSpent = entry.endedAt.diff(entry.startedAt, 'minutes')
    const budget = budgetsStore.collection.firstWhere('id', entry.budgetId?.toString())
    const budgetTitle = budget ? budget.title : ''

    if (entry.isInternal) {
      entry.settlement = t('internal')
    } else if (entry.budgetId) {
      entry.settlement = t('budget') + (budgetTitle ? ': ' + budgetTitle : '')
    } else {
      entry.settlement = t('paidPerHour')
    }
    return entry
  }).all()
})

const dates = computed(() => {
  if (!month.value || month.value === 'all') return []
  const result = []
  for (let i = 0; i < month.value.daysInMonth(); i++) {
    result.push(month.value.clone().add(i, 'days').format('DD-MM-YYYY'))
  }
  return result
})

const columns = computed(() => [
  {
    label: t('date'),
    field: 'date',
    type: 'date',
    dateInputFormat: 'yyyy-MM-dd',
    dateOutputFormat: 'dd-MM-yyyy',
    filterOptions: {
      enabled: month.value !== 'all',
      filterDropdownItems: dates.value
    }
  },
  {
    label: t('ticketNumber'),
    field: 'ticketNumber',
    filterOptions: { enabled: true }
  },
  {
    label: t('customer'),
    field: 'customerName',
    filterOptions: {
      enabled: true,
      filterValue: queryFilters.value.customerId,
      filterDropdownItems: customersStore.collection.sortBy('name').map((customer) => ({
        value: customer.id,
        text: customer.name
      })).all()
    }
  },
  {
    label: t('type'),
    field: 'settlement',
    filterOptions: {
      enabled: true,
      filterValue: queryFilters.value.settlement,
      filterDropdownItems: [
        { value: 'budget', text: t('budget') },
        { value: 'internal', text: t('internal') },
        { value: 'paid-per-hour', text: t('paidPerHour') }
      ]
    },
    sortable: false
  },
  {
    label: t('user'),
    field: 'userFullName',
    filterOptions: { enabled: true, filterValue: queryFilters.value.user }
  },
  {
    label: t('timeSpent'),
    field: 'timeSpent'
  }
])

watch(() => usersStore.collection, () => setUserFromQueryFilter())

onMounted(() => {
  const entryId = route.query.entryId
  if (entryId) {
    const api = getTimaticApi()
    api.$get('entries/' + entryId).then((response) => {
      selectedEntry.value = parseDataToEntries([response.data], response.included).first()
      showEntryModal.value = true
      setPeriod(selectedEntry.value.startedAt.clone().date(1))
    })
  }

  const queryDateFilter = route.query['startedAt[gte]']
  if (queryDateFilter) {
    queryFilters.value.dates = {
      from: moment(route.query['startedAt[gte]']),
      to: moment(route.query['startedAt[lte]'])
    }
  }

  setUserFromQueryFilter()
  queryFilters.value.settlement = route.query.settlement
  queryFilters.value.customerId = route.query.customerId
})

function setUserFromQueryFilter () {
  const userId = route.query.userId
  if (userId) {
    const user = usersStore.collection.firstWhere('id', userId)
    if (user) {
      queryFilters.value.user = user.fullName
    }
  }
}

function setPeriod (value) {
  month.value = value
  entries.value = collect()
  if (entriesTable.value) {
    entriesTable.value.columnFilters.date = null
  }
  loadEntries()
}

function loadEntries () {
  if (!month.value) return
  loadingEntries.value = true
  totalHours.value = 0

  if (cancelTokenSource.value) {
    cancelTokenSource.value.cancel('cancel previous request')
  }
  cancelTokenSource.value = axios.CancelToken.source()

  const params = serverParams.value

  if (queryFilters.value.dates) {
    params.filter.startedAt = {
      gte: queryFilters.value.dates.from.toJSON(),
      lte: queryFilters.value.dates.to.toJSON()
    }
  } else if (month.value !== 'all') {
    const endOfMonth = month.value.clone().endOf('month').utc().format('YYYY-MM-DD HH:mm:ss')
    const startOfMonth = month.value.clone().startOf('month').utc().format('YYYY-MM-DD HH:mm:ss')

    if (!params.filter.startedAt) {
      params.filter.startedAt = { lte: endOfMonth }
    }
    params.filter.endedAt = { gt: startOfMonth }
  }

  const api = getTimaticApi()
  api.$get('entries', {
    cancelToken: cancelTokenSource.value.token,
    params
  })
    .then((response) => {
      entries.value = parseDataToEntries(response.data, response.included)
      totalRecords.value = response.meta.total
      loadingEntries.value = false
      calculateTotalHours()
    })
    .catch(() => {})
}

function onEventClick (params) {
  const entry = params.row
  entry.startedAt = moment(entry.startedAt)
  entry.endedAt = moment(entry.endedAt)
  selectedEntry.value = entry
  showEntryModal.value = true
}

async function calculateTotalHours () {
  await new Promise(resolve => setTimeout(resolve, 100))
  const filteredRows = entriesTable.value?.processedRows[0]?.children

  if (!filteredRows) {
    totalHours.value = 0
  } else {
    totalHours.value = filteredRows.reduce((a, b) => a + b.timeSpent, 0)
  }
}

function updateParams (newProps) {
  serverParams.value = Object.assign({}, serverParams.value, newProps)
}

function onPageChange (params) {
  updateParams({ page: { number: params.currentPage, size: serverParams.value.page.size } })
  loadEntries()
}

function onPerPageChange (params) {
  updateParams({ page: { size: params.currentPerPage, number: serverParams.value.page.number } })
  loadEntries()
}

function onSortChange (params) {
  const operator = (params[0].type === 'asc' ? '' : '-')
  let field = params[0].field
  switch (field) {
    case 'date': field = 'startedAt'; break
    case 'timeSpent': field = 'minutesSpent'; break
  }
  updateParams({ sort: operator + field })
  loadEntries()
}

function onColumnFilter (params) {
  const filters = {}
  for (const filter in params.columnFilters) {
    const filterValue = params.columnFilters[filter]
    if (!filterValue) continue
    if (filter === 'settlement') {
      filters.settlement = filterValue
    } else if (filter === 'date') {
      const date = moment(filterValue, 'DD-MM-YYYY')
      filters.startedAt = { gte: date.clone().startOf('day').toJSON(), lte: date.clone().endOf('day').toJSON() }
    } else if (filter === 'customerName') {
      filters.customerId = filterValue
    } else {
      filters[filter] = { contains: filterValue }
    }
  }
  updateParams({ filter: filters })
  onPageChange({ currentPage: 1 })
}

function dropFilters () {
  queryFilters.value = {}
  if (entriesTable.value) {
    entriesTable.value.columnFilters.customerName = null
    entriesTable.value.columnFilters.settlement = null
    entriesTable.value.columnFilters.userFullName = null
  }
  router.push({ query: {} })
}
</script>

<style scoped>
:deep(table.vgt-table-customization > thead th),
:deep(table.vgt-table-customization > tbody td div) {
  white-space: nowrap;
}
</style>
