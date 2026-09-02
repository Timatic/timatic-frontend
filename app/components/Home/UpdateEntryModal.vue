<template>
  <div>
    <EntryModal
      :title="title"
      :time-end="endTime"
      :time-start="startTime"
      :customer="customer"
      :ticket-number="entry.ticketNumber"
      :description="entry.description"
      :budget="budget"
      :overtime="overtime"
      :charge-customer="chargeCustomer"
      :settlement="settlement"
      :custom-overtime-hours="customOvertimeHours"
      :date="date"
      :is-locked="isLocked"
      :entry-id="entry.id"
      :user-id="entry.userId"
      :show-date-input="true"
      @closeModal="$emit('closeModal');"
      @entrySaved="$emit('entrySaved', $event);$emit('closeModal')"
    >
      <template #footer-left>
        <div
          class="cursor-pointer"
          @click="deleteEntry"
        >
          {{ $t('deleteEntry') }}
        </div>
      </template>
      <template #submit-button-text>
        {{ $t('updateEntry') }}
      </template>
    </EntryModal>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import moment from 'moment'
import { useI18n } from 'vue-i18n'
import EntryModal from './BaseEntryModal.vue'
import { useCustomersStore } from '~/stores/customers'
import { useUsersStore } from '~/stores/users'
import { useEntriesStore } from '~/stores/entries'
import { useBudgetsStore } from '~/stores/budgets'

const props = defineProps({
  entry: {
    required: true,
    type: Object
  },
  longTitle: {
    required: false,
    type: Boolean
  }
})

const emit = defineEmits(['closeModal', 'entrySaved'])

const { t } = useI18n()
const customersStore = useCustomersStore()
const usersStore = useUsersStore()
const entriesStore = useEntriesStore()
const budgetsStore = useBudgetsStore()

const isLocked = computed(() => {
  if (props.entry.userId !== usersStore.getCurrentUser.id && !usersStore.canEditEntriesFromOthers) {
    return true
  }
  return usersStore.entryLockDate.isAfter(props.entry.startedAt)
})

const customer = computed(() => customersStore.collection.firstWhere('id', props.entry.customerId))
const startTime = computed(() => props.entry.startedAt.format('HH:mm'))
const endTime = computed(() => props.entry.endedAt.format('HH:mm'))
const date = computed(() => props.entry.startedAt.clone().startOf('day'))

const budget = computed(() => {
  if (props.entry.budgetId) {
    return budgetsStore.collection.firstWhere('id', '==', props.entry.budgetId)
  } else {
    return { title: t('paidPerHour'), id: 'paidPerHour' }
  }
})

const overtime = computed(() => !!props.entry.personalOvertime)
const chargeCustomer = computed(() => !!props.entry.customerOvertime)
const settlement = computed(() => props.entry.isInternal ? 'internal' : 'paid')

const customOvertimeHours = computed(() => {
  if (props.entry.personalOvertime == null) return null
  return {
    start: moment(props.entry.personalOvertime.startedAt).format('HH:mm'),
    end: moment(props.entry.personalOvertime.endedAt).format('HH:mm')
  }
})

const title = computed(() => {
  let t2 = t('editEntry')
  if (props.longTitle) {
    t2 += ' - ' + props.entry.userFullName + ' - ' + props.entry.startedAt.format('DD-MM-YYYY')
  }
  return t2
})

function deleteEntry () {
  if (confirm(t('deleteEntryConfirm'))) {
    entriesStore.deleteEntry({ entryId: props.entry.id })
    emit('closeModal')
  }
}
</script>
