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
    @closeModal="$emit('closeModal');"
    @entrySaved="onSubmit"
  />
</template>

<script setup>
import { ref, computed } from 'vue'
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

const startTime = computed(() => props.suggestion.activities.first().startedAt.format('HH:mm'))
const endTime = computed(() => props.suggestion.activities.first().endedAt.format('HH:mm'))
const date = computed(() => props.suggestion.activities.first().startedAt.clone().startOf('day'))
const settlement = computed(() => props.suggestion.activities.first().isInternal ? 'internal' : 'paid')
const description = computed(() => props.suggestion.activities.first().description)

async function onSubmit ($event) {
  await suggestionsStore.deleteSuggestion({ suggestionId: props.suggestion.id })
  emit('entrySaved', $event)
  emit('closeModal')
}
</script>
