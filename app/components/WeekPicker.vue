<template>
  <PeriodSelector
    :options="weekOptions"
    :allow-all="allowAll"
    @input="onInput"
  />
</template>

<script setup>
import { ref, computed } from 'vue'
import moment from 'moment'
import { useI18n } from 'vue-i18n'
import PeriodSelector from './PeriodSelector.vue'

const props = defineProps({
  allowAll: {
    type: Boolean,
    default: false,
    required: false
  }
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()

const week = ref({ label: null, value: null })

const weekOptions = computed(() => {
  const labels = []
  const date = moment().startOf('isoWeek')

  while (labels.length < 12) {
    const endDate = date.clone().add(6, 'days')
    let label = ''
    if (date.month() === endDate.month()) {
      label = date.format('DD') + ' - ' + endDate.format('DD MMM')
    } else {
      label = date.format('DD MMM') + ' - ' + endDate.format('DD MMM')
    }

    labels.push({ value: date.clone(), label })
    date.subtract(1, 'week')
  }

  if (props.allowAll) {
    labels.push({ value: 'all', label: t('all') })
  }

  return labels
})

function onInput (period) {
  week.value = period
  emit('update:modelValue', period.value)
}

defineExpose({ week })
</script>
