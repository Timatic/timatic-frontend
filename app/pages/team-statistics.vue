<template>
  <div class="font-body">
    <app-bar />

    <div class="bg-background">
      <div class="page-margins page-width min-h-screen">
        <div class="p-8">
          <div class="flex justify-between items-center pb-4">
            <div id="team-selector" class="w-1/3 flex items-center justify-start">
              <vue-select
                v-model="team"
                :options="teamsWithUsers"
                :redus="value => value.name"
                :clearable="false"
                :select-on-tab="true"
                label="name"
                class="text-center w-64"
                :max-height="'42px'"
              />
            </div>
            <div id="period-unit-selector" class="w-2/5 flex justify-end">
              <vue-select
                v-model="periodUnit"
                :options="['Week', 'Month']"
                :clearable="false"
                class="text-center w-32"
                :select-on-tab="true"
              />
            </div>
            <div class="w-1/3 text-right flex justify-end">
              <week-picker v-if="periodUnit === 'Week'" ref="weekSelect" v-model="period" />
              <month-picker v-else ref="monthSelect" v-model="period" />
            </div>
          </div>
          <div class="flex mb-4">
            <div class="mr-4 p-6 box-shadow rounded justify-between bg-white">
              <canvas id="detailedChart" width="632" height="300" />
            </div>
            <div class="p-6 box-shadow rounded justify-between bg-white">
              <canvas id="trendChart" width="632" height="300" />
            </div>
          </div>
          <vue-good-table
            :columns="columns"
            :rows="rows"
            :group-options="{
              enabled: true,
              collapsable: true
            }"
            :style-class="'vgt-table text-page-title font-normal grouped'"
          >
            <template #table-column="props">
              <div class="text-sm leading-5 text-label font-normal">
                {{ props.column.label }}
              </div>
            </template>
            <template #table-header-row="props">
              <span v-if="(props.column.type === 'number' && props.row[props.column.field] > 0) || props.column.field === 'totalMinutes'">
                <router-link v-if="!props.row.isTotalRow" class="underline cursor-pointer" :to="goToEntries(props.row, props.column.field)">
                  {{ timeFormat(props.row[props.column.field]) }}
                </router-link>
                <span v-else>
                  {{ timeFormat(props.row[props.column.field]) }}
                </span>
              </span>
              <span v-else-if="props.column.type === 'number' && props.row[props.column.field] === 0">&nbsp;</span>
              <span v-else>
                {{ props.formattedRow[props.column.field] }}
              </span>
            </template>
            <template #table-row="props">
              <template v-if="props.column.type === 'number'">
                <template v-if="props.row[props.column.field] > 0">
                  <router-link class="underline cursor-pointer" :to="goToEntries(props.row, props.column.field)">
                    {{ timeFormat(props.row[props.column.field]) }}
                  </router-link>
                </template>
                <span v-else>&nbsp;</span>
              </template>
              <template v-else>
                {{ props.formattedRow[props.column.field] }}
              </template>
            </template>
          </vue-good-table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import collect from 'collect.js'
import moment from 'moment'
import Chart from 'chart.js/auto'
import { useI18n } from 'vue-i18n'
import { useTeamsStore } from '~/stores/teams'
import { useUsersStore } from '~/stores/users'
import { useCustomersStore } from '~/stores/customers'
import { getTimaticApi } from '~/utils/timaticApi'
import { timeFormat } from '~/utils/filters'

useHead({ title: 'Team overview - Timatic' })

const { t } = useI18n()
const teamsStore = useTeamsStore()
const usersStore = useUsersStore()
const customersStore = useCustomersStore()

const period = ref(null)
const periodUnit = ref('Week')
const team = ref(null)
const rows = ref([])
const weekSelect = ref(null)
const monthSelect = ref(null)
let detailedChart = null
let trendChart = null

const columns = computed(() => [
  { label: '', field: 'grouped', sortable: false },
  { label: t('customer'), field: 'customer.name' },
  { label: t('internal'), field: 'internalMinutes', type: 'number' },
  { label: t('budget'), field: 'budgetMinutes', type: 'number' },
  { label: t('paidPerHour'), field: 'paidPerHourMinutes', type: 'number' },
  { label: t('total'), field: 'totalMinutes', type: 'number' }
])

const teamsWithUsers = computed(() =>
  teamsStore.collection.whereIn('id', usersStore.collection.pluck('teamId').all())
    .sortBy('name')
    .all()
)

const periodStart = computed(() => moment(period.value))

const periodEnd = computed(() => {
  if (periodUnit.value === 'Week') {
    return periodStart.value.clone().add(7, 'days')
  }
  return periodStart.value.clone().endOf('month')
})

const teamUsers = computed(() => {
  if (!team.value) return collect()
  return usersStore.collection.where('teamId', '==', team.value.id).sortBy('givenName')
})

watch(team, () => fetchStatistics())
watch(period, () => fetchStatistics())
watch(() => usersStore.getCurrentUser, (newValue) => setTeam(newValue.teamId))
watch(periodUnit, (newValue) => {
  const label = newValue === 'Month' ? 'Month number' : 'Week number'
  trendChart.options.scales.x.title.text = label
  trendChart.update()
})

setTeam(usersStore.getCurrentUser.teamId)

onMounted(() => {
  detailedChart = new Chart(document.getElementById('detailedChart'), {
    type: 'bar',
    data: {
      datasets: [{
        label: 'Internal',
        data: [],
        borderColor: '#3081b8',
        backgroundColor: '#3081b8',
        borderWidth: 1
      }, {
        label: 'Budget',
        data: [],
        borderColor: '#d35400',
        backgroundColor: '#d35400',
        borderWidth: 1
      }, {
        label: 'Paid per Hour',
        data: [],
        borderColor: '#e47f31',
        backgroundColor: '#e47f31',
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: { title: { display: true, text: 'Hours' } },
        x: { title: { display: true, text: 'Team member' } }
      }
    }
  })

  trendChart = new Chart(document.getElementById('trendChart'), {
    type: 'line',
    data: {
      datasets: [{
        label: 'Billable hours',
        data: [],
        borderColor: '#e47f31',
        backgroundColor: '#e47f31',
        fill: true,
        borderWidth: 1,
        tension: 0.3
      }, {
        label: 'Internal hours',
        data: [],
        borderColor: '#3081b8',
        backgroundColor: '#3081b8',
        fill: true,
        borderWidth: 1,
        tension: 0.3
      }]
    },
    options: {
      scales: {
        y: { stacked: true, title: { text: 'Hours (stacked)', display: true } },
        x: { title: { text: periodUnit.value === 'Month' ? 'Month number' : 'Week number', display: true } }
      }
    }
  })
})

function setTeam (teamId) {
  const foundTeam = teamsStore.getById(teamId)
  if (foundTeam) {
    team.value = foundTeam
  }
}

function fetchStatistics () {
  if (!team.value || !period.value) return
  const api = getTimaticApi()

  api.$get('user-customer-hours-aggregates/', {
    params: {
      filter: {
        teamId: team.value.id,
        startedAt: { gte: periodStart.value.toJSON(), lte: periodEnd.value.toJSON() }
      },
      page: { size: 1000 }
    }
  }).then((response) => {
    const dataPoints = collect(response.data).transform(item => item.attributes)
    buildRows(dataPoints, response.meta)
    buildDetailedChart(dataPoints)
  })

  api.$get('time-spent-totals/', {
    params: {
      filter: {
        teamId: team.value.id,
        startedAt: {
          gte: periodStart.value.clone().subtract(10, periodUnit.value).toJSON(),
          lte: periodEnd.value.toJSON()
        }
      },
      periodUnit: periodUnit.value.toLowerCase(),
      page: { size: 10 }
    }
  }).then((response) => {
    const dataPoints = collect(response.data).transform(item => item.attributes)
    buildtrendChart(dataPoints)
  })
}

function buildRows (dataPoints, totalsDataPoint) {
  let periodLabel
  if (periodUnit.value === 'Week') {
    periodLabel = weekSelect.value?.week?.label
  } else {
    periodLabel = monthSelect.value?.month?.label
  }

  const totalsRow = {
    budgetMinutes: totalsDataPoint?.totalBudgetMinutes,
    internalMinutes: totalsDataPoint?.totalInternalMinutes,
    paidPerHourMinutes: totalsDataPoint?.totalPaidPerHourMinutes,
    customer: { name: 'Total: ' + periodLabel },
    children: [],
    isTotalRow: true
  }
  totalsRow.totalMinutes = totalsRow.budgetMinutes + totalsRow.internalMinutes + totalsRow.paidPerHourMinutes

  rows.value = teamUsers.value.map((user) => {
    const detailedRows = dataPoints.where('userId', user.id).transform((row) => {
      row.customer = customersStore.getById(row.customerId)
      return row
    })

    return {
      customer: { name: user.fullName },
      userId: user.id,
      internalMinutes: detailedRows.sum('internalMinutes'),
      budgetMinutes: detailedRows.sum('budgetMinutes'),
      paidPerHourMinutes: detailedRows.sum('paidPerHourMinutes'),
      totalMinutes: detailedRows.sum('internalMinutes') + detailedRows.sum('budgetMinutes') + detailedRows.sum('paidPerHourMinutes'),
      children: detailedRows.all()
    }
  })
    .push(totalsRow)
    .values()
    .all()
}

function buildDetailedChart (dataPoints) {
  detailedChart.data.labels = teamUsers.value.pluck('givenName').values().all()
  detailedChart.data.datasets[0].data = teamUsers.value.map((user) => {
    return dataPoints.where('userId', user.id).sum('internalMinutes') / 60 || 0
  }).values().all()
  detailedChart.data.datasets[1].data = teamUsers.value.map((user) => {
    return dataPoints.where('userId', user.id).sum('budgetMinutes') / 60 || 0
  }).values().all()
  detailedChart.data.datasets[2].data = teamUsers.value.map((user) => {
    return dataPoints.where('userId', user.id).sum('paidPerHourMinutes') / 60 || 0
  }).values().all()
  detailedChart.update()
}

function buildtrendChart (dataPoints) {
  trendChart.data.labels = dataPoints.pluck('periodValue').all()
  trendChart.data.datasets[0].data = dataPoints.pluck('billableMinutes').map(total => total / 60).all()
  trendChart.data.datasets[1].data = dataPoints.pluck('internalMinutes').map(total => total / 60).all()
  trendChart.update()
}

function goToEntries (row, column) {
  const params = new URLSearchParams({
    userId: row.userId,
    'startedAt[gte]': periodStart.value.toJSON(),
    'startedAt[lte]': periodEnd.value.toJSON()
  })
  const settlement = column.replace('Minutes', '')
  if (settlement !== 'total') { params.set('settlement', settlement) }
  if (row.customerId) { params.set('customerId', row.customerId) }
  return '/entries/?' + params.toString()
}
</script>

<style scoped>
.box-shadow {
  box-shadow: 0px 4px 6px rgba(153, 168, 184, 0.1);
}

#team-selector :deep(.vs__selected) {
  @apply text-page-title text-xl leading-8 text-page-title font-medium;
}

#period-unit-selector :deep(.vs__selected) {
  @apply text-page-title leading-8 text-page-title font-light;
}

/* internal, budget and paid per hour columns should be normal font weight  */
:deep(#vgt-table tbody:not(:last-child) th.vgt-right-align:not(:last-child)) {
  @apply font-normal
}

/* style fixes for non-spanning group header row */
:deep(#vgt-table th.vgt-row-header > span:not(.triangle)) {
  @apply p-3;
}
:deep(#vgt-table th.vgt-row-header > span.triangle) {
  height: calc(24px + 1.5em);
  @apply cursor-pointer ml-0 mr-0 rounded-r-none;
}
:deep(#vgt-table th.vgt-row-header > span.triangle:after) {
  @apply ml-1
}
:deep(#vgt-table th.vgt-row-header > span.triangle + span) {
  @apply hidden
}

/* Styles for the totals row */
:deep(#vgt-table tbody:last-child th.vgt-row-header > span) {
  background-color: #D0F1FF;
}
:deep(#vgt-table tbody:last-child th.vgt-row-header > span.triangle) {
  @apply cursor-default
}
:deep(#vgt-table tbody:last-child th.vgt-row-header > span.triangle:after) {
  @apply hidden
}
</style>
