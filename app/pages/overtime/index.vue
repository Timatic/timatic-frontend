<template>
  <div class="font-body">
    <app-bar />

    <div class="bg-background">
      <div class="page-margins page-width min-h-screen">
        <div class="text-page-title">
          <div v-if="showWarning" class="h-8 w-full bg-alert text-center pt-1 text-white relative">
            {{ $t('approveDaysWarning', {days: daysToApprove}) }}
            <div class="absolute top-7 right-10 cursor-pointer" @click="showWarning = false">
              <CloseIcon />
            </div>
          </div>
          <div class="p-8">
            <div class="flex justify-between items-center pb-4">
              <div class="text-2xl leading-8 text-page-title font-bold w-1/3">
                {{ $t('teamOverview') }}
              </div>
              <div class="w-1/3 text-right flex justify-end">
                <month-picker @update:model-value="setPeriod" />
              </div>
            </div>
            <vue-good-table
              :columns="columns"
              :rows="rows"
              @row-click="selectTeam"
            >
              <template #table-column="props">
                <div class="text-sm leading-5 text-label font-normal">
                  {{ props.column.label }}
                </div>
              </template>
              <template #table-row="props">
                <div
                  class="text-page-title leading-6 font-medium"
                  :class="{'underline': props.column.field === 'team'}"
                >
                  {{ props.formattedRow[props.column.field] }}
                </div>
              </template>
              <template #emptystate>
                <div class="text-center">
                  <template v-if="loadingOvertime">
                    <LoadingIcon />
                    Loading overtime
                  </template>
                  <p v-else>No overtime found</p>
                </div>
              </template>
            </vue-good-table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import moment from 'moment'
import { useI18n } from 'vue-i18n'
import { useRouter } from '#app'
import CloseIcon from '~/assets/svg/close.svg'
import LoadingIcon from '~/assets/svg/loading.svg'
import { useUsersStore } from '~/stores/users'
import { useTeamsStore } from '~/stores/teams'
import { useOvertimeStore } from '~/stores/overtime'

useHead({ title: 'Overtime - Timatic' })

const { t } = useI18n()
const router = useRouter()
const usersStore = useUsersStore()
const teamsStore = useTeamsStore()
const overtimeStore = useOvertimeStore()

const showWarning = ref(false)
const loadingOvertime = ref(true)
const period = ref(moment())

const columns = [
  { label: t('team'), field: 'name', width: '70%' },
  { label: t('total count'), field: 'totalCount' },
  { label: t('unapproved'), field: 'unapprovedCount' }
]

const daysToApprove = computed(() => {
  const tenthOfMonth = moment().date(10)
  let diffInDays = tenthOfMonth.diff(moment(), 'days')
  if (diffInDays < 0) diffInDays += tenthOfMonth.daysInMonth()
  return diffInDays
})

const rows = computed(() => {
  const overtimeRecords = overtimeStore.collection.where('month', '==', period.value.format('YYYY-MM'))
  const userIds = overtimeRecords.pluck('user.id').unique()
  const users = usersStore.collection.whereIn('id', userIds.all() || [])

  return teamsStore.collection
    .whereIn('id', users.pluck('teamId').all())
    .transform((team) => {
      const teamUsers = users.where('teamId', '==', team.id)
      const teamRecords = overtimeRecords.whereIn('user.id', teamUsers.pluck('id').all())
      return {
        id: team.id,
        name: team.name,
        totalCount: teamRecords.count(),
        unapprovedCount: teamRecords.whereNull('approvedAt').count()
      }
    })
    .all()
})

usersStore.fetch()
showWarning.value = usersStore.canApproveOvertime && daysToApprove.value < 10

function selectTeam (row) {
  router.push({ path: '/overtime/' + row.row.id + '/', query: { month: period.value.format('YYYY-MM') } })
}

async function setPeriod (value) {
  period.value = value
  loadingOvertime.value = true
  await overtimeStore.fetch({ date: period.value })
  loadingOvertime.value = false
}
</script>

<style>
.vgt-table-customization { border: none !important; }
.vgt-table-customization > thead > tr > th { background: none; border: none; }
.vgt-table-customization > tbody > tr { box-shadow: 0 4px 6px rgba(153, 168, 184, 0.1); }
.vgt-table-customization > tbody > tr > td { border: none; }
</style>
