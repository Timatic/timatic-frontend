<template>
  <div class="font-body">
    <app-bar />
    <div class="bg-background">
      <div class="page-margins page-width text-page-title pt-8 px-8">
        <div v-if="showCloseBudgetMessage" class="h-8 w-full bg-info text-center pt-1 text-white">
          {{ activePeriod.budgetTitle + ' ' + $t('budgetClosedConfirmation') }}
        </div>

        <div class="flex justify-between mb-8">
          <div class="flex-grow flex justify-start items-center">
            <ArrowBack @click="linkBack" />
            <div class="text-2xl flex-1 text-page-title leading-8 font-bold text-rubik pl-3">
              <span :class="{archived: budget.isArchived} ">{{ activePeriod.budgetTitle }}</span> {{ budget.isArchived ? '- Archived' : '' }}
            </div>
          </div>
          <div id="action-buttons" class="flex-grow flex justify-end items-center">
            <a
              class="border border-input-border py-2 px-5 rounded font-normal h-12 leading-8 mr-4 text-action-button"
              :href="periodExportLink"
            >
              Export entries
            </a>
            <button
              v-if="canEditBudget"
              class="border border-input-border py-2 px-5 rounded font-normal h-12 mr-4 text-action-button"
              @click="closeBudgetModal = true"
            >
              {{ $t('closeBudget') }}
            </button>
            <button
              v-if="canEditBudget"
              class="border border-input-border py-2 px-5 rounded font-normal h-12 mr-4 text-action-button"
              @click="editBudgetModal = true"
            >
              {{ $t('editBudget') }}
            </button>
            <button
              class="border border-input-border py-2 px-5 rounded font-normal h-12"
              :class="{'text-action-button':periodIsOpen, 'opacity-50 cursor-default': !periodIsOpen}"
              @click="openCustomEntryModal= periodIsOpen"
            >
              {{ $t('customEntry') }}
            </button>
          </div>
        </div>

        <template v-if="budgetType.hasRenewalFrequency === true && periods.count() > 0">
          <detailed-date-picker
            :active-period="activePeriod"
            :periods="periods"
            :frequency="budget.renewalFrequency"
            @pickedPeriod="changeActivePeriod"
          />
        </template>

        <div class="flex my-4 p-6 box-shadow justify-between bg-white">
          <div class="w-full">
            <div class="flex justify-start items-center mb-6">
              <div
                class="rounded-full pl-2 pr-4 py-1 text-center text-white flex justify-start"
                :class="{ 'gradient-warning' : activePeriod.remainingMinutes < 0, 'gradient-info' : activePeriod.remainingMinutes >=0 }"
              >
                <div class="w-8 px-1">
                  <BarChartIcon />
                </div>
                {{ timeFormat(activePeriod.remainingMinutes) }}
              </div>
              <div
                class="gradient-primary rounded-full py-1 text-center text-page-title ml-3 flex justify-start items-center pl-3 pr-4"
              >
                <ContactIcon class="w-4" />
                <p class="pl-3">
                  {{ customer.name || budget.customerId }}
                </p>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <div class="flex justify-start items-center text-page-title">
                  <div class="w-1/2 font-medium">
                    {{ $t('startDate') }}
                  </div>
                  <div class="w-1/2">
                    {{ budget.startedAt && budget.startedAt.format('DD-MM-YYYY') }}
                  </div>
                </div>
                <div class="flex justify-start items-center text-page-title">
                  <div class="w-1/2 font-medium">
                    {{ $t('endDate') }}
                  </div>
                  <div class="w-1/2">
                    {{ budget.endedAt && budget.endedAt.format('DD-MM-YYYY') }}
                  </div>
                </div>
                <div class="flex justify-start items-center text-page-title">
                  <div class="w-1/2 font-medium">
                    {{ $t('Type') }}
                  </div>
                  <div class="w-1/2">
                    {{ budgetType.title }}
                  </div>
                </div>
                <div class="flex justify-start items-center text-page-title">
                  <div class="w-1/2 font-medium">
                    {{ $t('renewalFrequency') }}
                  </div>
                  <div class="w-1/2">
                    {{ $t(budget.renewalFrequency || 'once') }}
                  </div>
                </div>
                <div class="flex justify-start items-center text-page-title">
                  <div class="w-1/2 font-medium">
                    {{ $t('accountManager') }}
                  </div>
                  <div class="w-1/2">
                    {{ accountManager.fullName || $t('none') }}
                  </div>
                </div>
                <div v-if="budgetType.hasSupervisor" class="flex justify-start items-center text-page-title">
                  <div class="w-1/2 font-medium">
                    {{ $t('supervisor') }}
                  </div>
                  <div class="w-1/2">
                    {{ supervisor.fullName || $t('none') }}
                  </div>
                </div>
                <div
                  v-if="budgetType.hasChangeTicket"
                  class="flex justify-start items-center text-page-title"
                >
                  <div class="w-1/2 font-medium">
                    {{ $t('changeNo') }}
                  </div>
                  <div class="w-1/2">
                    {{ budget.changeId }}
                  </div>
                </div>
              </div>
              <div>
                <div class="flex justify-start items-center text-page-title">
                  <div class="w-1/2 font-medium">
                    {{ $t('initialHours') }}
                  </div>
                  <div class="w-1/2">
                    {{ timeFormat(activePeriod.initialMinutes) }}
                  </div>
                </div>
                <div v-if="budgetType.hasTotalPrice" class="flex justify-start items-center text-page-title">
                  <div class="w-1/2 font-medium">
                    {{ $t('hourlyRate') }}
                  </div>
                  <div class="w-1/2">
                    &euro;{{ currency(activePeriod.totalPrice / (activePeriod.initialMinutes / 60)) }}
                  </div>
                </div>
                <div v-if="budgetType.hasTotalPrice" class="flex justify-start items-center text-page-title">
                  <div class="w-1/2 font-medium">
                    {{ $t('totalPrice') }}
                  </div>
                  <div class="w-1/2">
                    &euro;{{ currency(activePeriod.totalPrice) }}
                  </div>
                </div>
                <div class="flex justify-start items-center text-page-title">
                  <div class="w-1/2 font-medium">
                    {{ $t('status') }}
                  </div>
                  <div class="w-1/2">
                    {{ budget.isArchived ? $t('archived') : $t('active') }}
                  </div>
                </div>
                <div class="flex justify-start items-start text-page-title">
                  <div class="w-1/2 font-medium">
                    {{ $t('allowedUsers') }}
                  </div>
                  <div class="w-1/2">
                    <div v-for="user in allowedUsers" :key="user.id">
                      {{ user.fullName }}
                    </div>
                    <div v-if="allowedUsers.length === 0">
                      {{ $t('everyone') }}
                    </div>
                  </div>
                </div>
              </div>
              <div :class="[budget.renewalFrequency === null ? 'col-span-2 order-4' : '']">
                <div class="font-medium">
                  {{ $t('description') }}
                </div>
                <!-- eslint-disable-next-line vue/no-v-html -->
                <div v-html="budgetDescription" />
              </div>
              <div v-if="budget.renewalFrequency === null" class="order-3 row-span-2">
                <chart :budget="budget" />
              </div>
            </div>
          </div>
        </div>

        <div class="py-8 text-page-title">
          <div class="text-xl text-table-title leading-8 pb-4">
            {{ $t('activities.activities') }}
          </div>
          <div class="flex justify-start items-center mb-2">
            <div class="w-auto">
              {{ $t('groupBy') }}
            </div>
            <div
              class="rounded-full bg-filter text-center px-4 py-1 text-white font-medium leading-5 text-sm cursor-pointer ml-4"
              :class="{'bg-filter-active text-white': groupEnabled === true, 'text-filter-text': groupEnabled !== true}"
              @click="groupEnabled = !groupEnabled"
            >
              {{ $t('ticket') }}
            </div>
          </div>
          <vue-good-table
            :columns="columns"
            :rows="rows"
            :group-options="{
              enabled: groupEnabled !== false,
              collapsable: groupEnabled !== false,
            }"
            :sort-options="{
              enabled: true,
              initialSortBy: {field: 'date', type: 'desc'}
            }"
            :style-class="'vgt-table' + (groupEnabled?'grouped':'')"
            @row-click="onEventClick"
          >
            <template #table-header-row="props">
              <span class="label">
                {{ props.row.label }}
              </span>
              <span class="total-time-spent">
                {{ timeFormat(props.row.minutesSpent) }}
              </span>
            </template>
            <template #table-column="props">
              <div
                class="font-rubik text-sm text-filter-text text-left font-normal"
                :class="{'text-right' : props.column.field === 'minutesSpent'}"
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
              <div v-else-if="props.column.field === 'minutesSpent'" class="text-right">
                {{ timeFormat(props.formattedRow.minutesSpent) }}
              </div>
              <div
                v-else-if="props.column.field === 'ticketTitle'"
                class="truncate"
                style="max-width: 300px;"
                :title="props.formattedRow[props.column.field]"
              >
                {{ props.formattedRow[props.column.field] }}
              </div>
              <div v-else-if="props.column.field === 'customerOvertime'">
                {{ props.formattedRow[props.column.field] }}
                <InfoIcon
                  v-if="props.row.customerOvertime"
                  v-tooltip="{
                    content: props.row.overtimeDescription,
                    trigger: 'hover'
                  }"
                  class="inline-block"
                />
              </div>
              <template v-else-if="props.column.field === 'grouped'" />
              <div v-else class="text-left">
                {{ props.formattedRow[props.column.field] }}
              </div>
            </template>
          </vue-good-table>
        </div>
      </div>
    </div>

    <custom-entry-modal
      v-if="openCustomEntryModal"
      :date-max="activePeriod.endDate"
      :date-min="activePeriod.startDate"
      :customer="customer"
      :budget="budget"
      @closeModal="openCustomEntryModal = false"
      @entrySaved="loadPeriods"
    />
    <close-budget-modal
      v-if="closeBudgetModal"
      :budget="budget"
      :periods="periods"
      @closeModal="closeBudgetModal = false"
      @budgetClosed="showCloseBudgetMessage = true"
    />
    <update-budget-modal
      v-if="editBudgetModal"
      :title="$t('editBudget')"
      :budget="budget"
      :periods="periods"
      @closeModal="editBudgetModal = false"
    />
    <update-entry-modal
      v-if="editEntryModal"
      :entry="selectedEntry"
      :long-title="true"
      @closeModal="editEntryModal=false"
      @entrySaved="loadEntries"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import collect from 'collect.js'
import moment from 'moment'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useBudgetsStore } from '~/stores/budgets'
import { useCustomersStore } from '~/stores/customers'
import { useBudgetTypesStore } from '~/stores/budgetTypes'
import { useUsersStore } from '~/stores/users'
import { parseDataToEntries } from '~/stores/entries'
import { getTimaticApi } from '~/utils/timaticApi'
import BarChartIcon from '~/assets/svg/bar-chart.svg'
import ContactIcon from '~/assets/svg/contact.svg'
import InfoIcon from '~/assets/svg/info.svg'
import LinkIcon from '~/assets/svg/external-link.svg'
import { timeFormat, currency } from '~/utils/filters'

useHead({ title: 'Budget - Timatic' })

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const budgetsStore = useBudgetsStore()
const customersStore = useCustomersStore()
const budgetTypesStore = useBudgetTypesStore()
const usersStore = useUsersStore()

const openCustomEntryModal = ref(false)
const closeBudgetModal = ref(false)
const showCloseBudgetMessage = ref(false)
const editBudgetModal = ref(false)
const editEntryModal = ref(false)
const periods = ref(collect())
const activePeriod = ref({})
const groupEnabled = ref(false)
const entries = ref(null)
const selectedEntry = ref(null)

const budget = computed(() => budgetsStore.collection.firstWhere('id', route.params.id) || {})
const customer = computed(() => customersStore.collection.firstWhere('id', budget.value.customerId) || {})
const budgetType = computed(() => budgetTypesStore.collection.firstWhere('id', budget.value.budgetTypeId) || {})
const accountManager = computed(() => usersStore.collection.firstWhere('id', customer.value.accountManagerUserId || null) || {})
const supervisor = computed(() => usersStore.collection.firstWhere('id', budget.value.supervisorUserId || null) || {})
const allowedUsers = computed(() => usersStore.collection.whereIn('id', budget.value.allowedUsers?.map(user => user.id) || []).all())
const canEditBudget = computed(() => usersStore.canEditBudget && !budget.value.isArchived)
const periodIsOpen = computed(() => activePeriod.value.endDate > moment().subtract(1, 'month') && !budget.value.isArchived)
const periodExportLink = computed(() => 'budgets/' + budget.value.id + '/entries-export')

const budgetDescription = computed(() => {
  if (!activePeriod.value.budgetDescription) return ''
  return activePeriod.value.budgetDescription.replace(/(\r\n|\r|\n)/g, '<br>')
})

const rows = computed(() => {
  if (entries.value === null) return []

  const rows = entries.value.map((entry) => {
    if (entry.customerOvertime) {
      entry.overtimeDescription = ''
      const percentages = entry.customerOvertime.percentages
      for (const index in percentages) {
        entry.overtimeDescription += `${percentages[index].minutes} minutes * ${percentages[index].percentage}% (${index}) <br>`
      }
    }
    return entry
  })

  if (!groupEnabled.value) return rows.all()

  const groups = rows.mapToGroups(entry => [entry.ticketNumber, entry])
  return groups.map((group) => {
    const total = collect(group).pluck('minutesSpent').sum()
    return {
      mode: 'span',
      label: group[0].ticketNumber + ' - ' + group[0].ticketTitle,
      minutesSpent: total,
      html: false,
      children: group
    }
  }).values().all()
})

const columns = computed(() => {
  const cols = [
    { label: t('date'), field: 'date', type: 'date', dateInputFormat: 'yyyy-MM-dd', dateOutputFormat: 'dd-MM-yyyy' },
    { label: t('ticketNumber'), field: 'ticketNumber' },
    { label: t('ticket'), field: 'ticketTitle' },
    { label: t('user'), field: 'userFullName' },
    { label: t('overtime'), field: 'customerOvertime', formatFn: (value) => t(value ? 'yes' : 'no') },
    { label: t('timeSpent'), field: 'minutesSpent' }
  ]
  if (groupEnabled.value) {
    cols.unshift({ label: '', field: 'grouped', sortable: false })
  }
  return cols
})

watch(showCloseBudgetMessage, (newValue) => {
  if (newValue) {
    setTimeout(() => { showCloseBudgetMessage.value = false }, 2000)
  }
})

watch(budget, (newValue) => {
  if (!newValue) return
  loadPeriods()
})

onMounted(() => {
  budgetsStore.fetchOne(route.params.id)
  if (budget.value.id) {
    loadPeriods()
  }
})

function linkBack () {
  router.push({ path: '/budgets/' })
}

function changeActivePeriod (period) {
  activePeriod.value = period
  loadEntries()
}

function loadEntries () {
  const api = getTimaticApi()
  entries.value = null
  const filter = { budgetId: budget.value.id }
  if (budget.value.renewalFrequency) {
    filter.startedAt = { lte: activePeriod.value.endDate.format('YYYY-MM-DD HH:mm') }
    filter.endedAt = { gt: activePeriod.value.startDate.format('YYYY-MM-DD HH:mm') }
  }
  api.$get('entries', { params: { filter, page: { size: 500 } } })
    .then((response) => {
      entries.value = parseDataToEntries(response.data, response.included)
    })
}

function onEventClick (params) {
  const entry = params.row
  entry.startedAt = moment(entry.startedAt)
  entry.endedAt = moment(entry.endedAt)
  selectedEntry.value = entry
  editEntryModal.value = true
}

function loadPeriods () {
  if (!budget.value) return
  const api = getTimaticApi()
  return api.$get(`budgets/${budget.value.id}/periods`).then((response) => {
    periods.value = collect(response.data).transform((period) => {
      const obj = { id: period.id, ...period.attributes }
      obj.startDate = moment(obj.startDate)
      obj.endDate = moment(obj.endDate)

      if (budget.value.renewalFrequency === 'yearly' && obj.startDate.month() === 1) {
        obj.title = obj.startDate.format('YYYY')
      } else if (budget.value.renewalFrequency === 'monthly' && obj.startDate.month() === obj.endDate.month()) {
        obj.title = obj.startDate.format('MMMM YYYY')
      } else {
        obj.title = obj.startDate.format("MMMM 'YY") + ' - ' + obj.endDate.format("MMMM 'YY")
      }
      return obj
    })

    if (activePeriod.value.id && periods.value.contains('id', activePeriod.value.id)) {
      activePeriod.value = periods.value.firstWhere('id', activePeriod.value.id)
    } else if (moment(budget.value.startedAt).isAfter(moment())) {
      activePeriod.value = periods.value.first()
    } else {
      activePeriod.value = periods.value.last(period => period.startDate.isBefore(moment()))
    }
    loadEntries()
  })
}
</script>

<style scoped>
th > span > span.total-time-spent {
  text-align: right;
}

.box-shadow {
  box-shadow: 0px 4px 6px rgba(153, 168, 184, 0.1);
}

.gradient-warning {
  background: linear-gradient(270deg, #FFFFFF -70.15%, rgba(255, 255, 255, 0) 93.36%), #D00505;
}

.gradient-primary {
  background: linear-gradient(270deg, #FFFFFF -10.18%, rgba(255, 255, 255, 0) 93.36%), #F0F5F9;
}

.gradient-info {
  background: linear-gradient(270deg, #FFFFFF -70.15%, rgba(255, 255, 255, 0) 93.36%), #28AFA1;
}

.archived {
  color: #99A8B8;
}

#action-buttons > * {
  white-space: nowrap;
}
</style>
