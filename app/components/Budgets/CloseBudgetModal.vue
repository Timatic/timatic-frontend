<template>
  <base-modal :title=" $t('closeBudget')" width="w-1/3" @closeModal="closeModal" @submitModal="submit">
    <template #content>
      <div v-if="warnings" class="w-full">
        <p
          v-for="(warning,key) in warnings"
          :key="key"
          class="text-warning pb-5"
        >
          {{ warning }}
        </p>
        <p>{{ $t('closeBudgetConfirmation') }}</p>
      </div>
    </template>
    <template #submit-button>
      <button class="bg-warning-button py-2 px-10 rounded text-white font-normal h-12" type="submit">
        {{ $t('closeBudget') }}
      </button>
    </template>
  </base-modal>
</template>

<script setup>
import { computed } from 'vue'
import moment from 'moment'
import { useI18n } from 'vue-i18n'
import BaseModal from '../BaseModal.vue'
import { useBudgetsStore } from '~/stores/budgets'

const props = defineProps({
  budget: {
    required: true,
    type: Object
  },
  periods: {
    required: true,
    type: Object
  }
})

const emit = defineEmits(['closeModal'])

const { t } = useI18n()
const budgetsStore = useBudgetsStore()

const warnings = computed(() => {
  const warns = []
  if (moment().diff(props.budget.endedAt) < 0) {
    warns.push(t('budgetNotEndedYet'))
  }
  if (!props.budget.renewalFrequency && props.periods.first().remainingMinutes > 0) {
    const hours = Math.floor(props.periods.first().remainingMinutes / 60)
    warns.push(t('budgetHasRemainingHours', { hours }))
  }
  return warns
})

function closeModal () {
  emit('closeModal', true)
}

function submit () {
  budgetsStore.close({ id: props.budget.id })
  closeModal()
}
</script>
