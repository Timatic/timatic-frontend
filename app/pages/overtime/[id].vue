<template>
  <div class="font-body">
    <app-bar />

    <div class="bg-background">
      <div class="page-margins page-width min-h-screen">
        <div class="p-8">
          <div class="flex justify-between items-center pb-4">
            <div class="text-2xl leading-8 text-page-title font-bold w-1/3 flex items-center justify-start">
              <ArrowBack @click="goBack" />
              <div class="ml-3">{{ team.name }}</div>
            </div>
            <div class="w-1/3 text-right flex justify-end">
              <month-picker @update:model-value="setPeriod" />
              <div
                v-if="canApproveOvertime"
                class="py-3 w-40 accept-button text-center px-2 rounded font-medium h-12 ml-2 cursor-pointer"
                :class="{
                  'bg-action-button text-white' : selectedRows.length > 0,
                  'border border-input-border text-action-button' : selectedRows.length === 0
                }"
                @click="acceptSelected"
              >
                <span>{{ $t('accept') }} <span v-if="selectedRows.length > 0">({{ selectedRows.length }})</span></span>
              </div>
            </div>
          </div>
          <div class="custom-shadow mb-4 w-full flex justify-between items-center bg-white px-4">
            <div class="w-1/3 gap-0 my-4 text-page-title font-roboto">
              <div class="flex justify-between items-center">
                <div class="w-1/2">{{ $t('period') }}</div>
                <div class="w-1/2 font-medium">{{ period.format('MM-YYYY') }}</div>
              </div>
              <div class="flex justify-between items-center">
                <div class="w-1/2">{{ $t('unapproved') }}</div>
                <div class="w-1/2 font-medium">{{ stats.unapproved }}</div>
              </div>
            </div>
          </div>
          <div class="text-xl text-table-title leading-8 pb-4">{{ $t('activities.activities') }}</div>
          <vue-good-table
            :columns="columns"
            :rows="rows"
            :group-options="{ enabled: true }"
          >
            <template #table-column="props">
              <template v-if="props.column.field === 'approved' && canApproveOvertime">
                <div class="input-wrapper top-5">
                  <input
                    id="select-all"
                    class="checkbox"
                    type="checkbox"
                    name="select-all"
                    :checked="allSelected"
                    @click.stop="selectAll"
                  >
                  <span class="checkmark" />
                </div>
              </template>
              <span v-else class="text-filter-text text-sm leading-5 font-normal">{{ props.column.label }}</span>
            </template>
            <template #table-row="props">
              <template v-if="props.column.field === 'approved'">
                <span v-if="!canApproveOvertimeOfUser(props.row.user)">
                  {{ $t( props.row.approvedAt ? 'Yes' : 'No') }}
                </span>
                <template v-else-if="!props.row.approvedAt">
                  <div class="input-wrapper">
                    <input
                      v-model="selectedRows"
                      class="checkbox"
                      type="checkbox"
                      :value="props.row.id"
                      :disabled="props.row.approved"
                    >
                    <span class="checkmark" />
                  </div>
                </template>
                <template v-else>
                  <div class="text-info"><CheckIcon /></div>
                </template>
              </template>
              <span v-else-if="props.column.field ==='entry.hadEmergencyShift'" class="truncate">
                {{ props.row.entry.hadEmergencyShift ? $t('yes') : $t('no') }}
              </span>
              <span
                v-else-if="'entry.customerName' === props.column.field"
                class="truncate"
                :title="props.formattedRow[props.column.field]"
              >
                {{ props.formattedRow[props.column.field] }}
              </span>
              <div v-else-if="'entry.description' === props.column.field">
                <span class="truncate" :title="props.formattedRow[props.column.field]">
                  {{ props.formattedRow[props.column.field] }}
                </span>
                <a :href="'/entries?entryId='+props.row.entryId" target="_blank">
                  <InfoIcon class="inline-block" />
                </a>
              </div>
              <span v-else-if="props.column.field == 'minutes'" class="truncate">
                {{ timeFormat(props.row.minutes) }}
              </span>
              <span v-else>{{ props.formattedRow[props.column.field] }}</span>
            </template>
          </vue-good-table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import moment from 'moment'
import collect from 'collect.js'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from '#app'
import CheckIcon from '~/assets/svg/check.svg'
import InfoIcon from '~/assets/svg/info.svg'
import { timeFormat } from '~/utils/filters'
import { useUsersStore } from '~/stores/users'
import { useTeamsStore } from '~/stores/teams'
import { useOvertimeStore } from '~/stores/overtime'

useHead({ title: 'Overtime - Timatic' })

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const usersStore = useUsersStore()
const teamsStore = useTeamsStore()
const overtimeStore = useOvertimeStore()

const selectedRows = ref([])
const period = ref(moment())

const columns = [
  { label: t('date'), field: 'date', type: 'date', dateInputFormat: 'dd-MM-yyyy', dateOutputFormat: 'EEE dd-MM' },
  { label: t('time'), field: 'startAndEnd' },
  { label: t('emergencyShift'), field: 'entry.hadEmergencyShift' },
  { label: t('ticket'), field: 'entry.ticketNumber' },
  { label: t('customer'), field: 'entry.customerName' },
  { label: t('description'), field: 'entry.description' },
  { label: 'duration', field: 'minutes', type: 'number' },
  { label: 'Approved', field: 'approved', sortable: false }
]

const team = computed(() => teamsStore.getById(route.params.id) ?? {})
const teamUsers = computed(() => usersStore.collection.where('teamId', '==', team.value.id))

const teamOvertime = computed(() =>
  overtimeStore.collection
    .where('month', '==', period.value.format('YYYY-MM'))
    .whereIn('user.id', teamUsers.value.pluck('id').all())
)

const stats = computed(() => ({
  unapproved: teamOvertime.value.whereNull('approvedAt').count() + ' activities'
}))

const rows = computed(() =>
  teamOvertime.value.mapToGroups((overtime) => [overtime.user.id, overtime])
    .transform((overtimes) => ({
      mode: 'span',
      label: overtimes[0].user.fullName,
      html: false,
      children: collect(overtimes).transform((overtime) => {
        overtime.date = overtime.startedAt.format('DD-MM-YYYY')
        overtime.startAndEnd = overtime.startedAt.format('HH:mm') + ' - ' + overtime.endedAt.format('HH:mm')
        overtime.minutes = collect(overtime.percentages).sum('minutes')
        return overtime
      }).all()
    }))
    .values().all()
)

const allSelected = computed(() => selectedRows.value.length === teamOvertime.value.count())
const canApproveOvertime = computed(() => usersStore.canApproveOvertime)
const currentUser = computed(() => usersStore.getCurrentUser)

usersStore.fetch()
teamsStore.fetch()

function canApproveOvertimeOfUser (user) {
  return canApproveOvertime.value && user.id !== currentUser.value.id
}

function goBack () {
  router.push({ path: '/overtime/', query: { month: period.value.format('YYYY-MM') } })
}

function selectAll () {
  if (allSelected.value) {
    selectedRows.value = []
  } else {
    rows.value.forEach((member) => {
      member.children.forEach((entry) => {
        if (entry.user.id === currentUser.value.id) return
        if (!entry.approvedAt && !selectedRows.value.includes(entry.id)) {
          selectedRows.value.push(entry.id)
        }
      })
    })
  }
}

function setPeriod (value) {
  period.value = value
  overtimeStore.fetch({ date: period.value })
}

function acceptSelected () {
  overtimeStore.approve({ ids: selectedRows.value, date: period.value })
    .then(() => {
      selectedRows.value = []
    })
}
</script>

<style scoped>
.accept-button { min-width: 130px; }
#select-all { position: relative; }
:deep(td .input-wrapper) { margin: 0; position: relative; top: 7px; }
:deep(td .truncate) { white-space: nowrap; text-overflow: ellipsis; overflow: hidden; max-width: 300px; display: inline-block; }
</style>
