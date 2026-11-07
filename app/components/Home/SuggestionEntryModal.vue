<template>
  <EntryModal
    :title=" $t('addActivity')"
    :time-end="endTime"
    :time-start="startTime"
    :customer="customer"
    :ticket-number="suggestion.ticketNumber"
    :suggestion-id="suggestion.id"
    :date="date"
    :show-date-input="true"
    :settlement="settlement"
    :description="description"
    :budget="budget"
    :activities="stackedActivities"
    :minutes-spent="suggestion.minutesSpent"
    :time-blocks="timeBlocks"
    @closeModal="$emit('closeModal');"
    @entrySaved="onSubmit"
  />
</template>

<script setup>
import { ref, computed } from 'vue'
import moment from 'moment'
import EntryModal from './BaseEntryModal.vue'
import { useCustomersStore } from '~/stores/customers'
import { useBudgetsStore } from '~/stores/budgets'
import { useSuggestionsStore } from '~/stores/suggestions'

const props = defineProps({
  suggestion: {
    required: true,
    type: Object
  }
})

const emit = defineEmits(['closeModal', 'entrySaved'])

const customersStore = useCustomersStore()
const budgetsStore = useBudgetsStore()
const suggestionsStore = useSuggestionsStore()

const customer = ref(customersStore.getById(props.suggestion.customerId))
const budget = ref(budgetsStore.getById(props.suggestion.budgetId))

const activities = computed(() => props.suggestion.activities.sortBy(activity => activity.startedAt.valueOf()).all())
const stackedActivities = computed(() => activities.value.length > 1 ? activities.value : null)
const firstStartedAt = computed(() => activities.value[0].startedAt)
// A stack is saved as one entry per block of overlapping activities, so no time is counted twice.
const timeBlocks = computed(() => stackedActivities.value && activities.value.reduce((blocks, activity) => {
  const lastBlock = blocks.at(-1)
  if (lastBlock && activity.startedAt.isBefore(lastBlock.endedAt)) {
    lastBlock.endedAt = moment.max(lastBlock.endedAt, activity.endedAt)
  } else {
    blocks.push({ startedAt: activity.startedAt, endedAt: activity.endedAt })
  }
  return blocks
}, []))

const startTime = computed(() => firstStartedAt.value.format('HH:mm'))
const endTime = computed(() => (timeBlocks.value?.at(-1).endedAt ?? activities.value[0].endedAt).format('HH:mm'))
const date = computed(() => firstStartedAt.value.clone().startOf('day'))
const settlement = computed(() => props.suggestion.activities.first().isInternal ? 'internal' : 'paid')
const description = computed(() => props.suggestion.activities.first().description)

async function onSubmit ($event) {
  await suggestionsStore.deleteSuggestion({ suggestionId: props.suggestion.id })
  emit('entrySaved', $event)
  emit('closeModal')
}
</script>
