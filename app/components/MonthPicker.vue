<template>
  <PeriodSelector
    :options="monthOptions"
    :allow-all="allowAll"
    query-param="month"
    query-param-format="YYYY-MM"
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

const month = ref({ label: null, value: null })

const monthOptions = computed(() => {
  const labels = []
  const date = moment().startOf('month')

  while (labels.length < 12) {
    labels.push({
      value: date.clone(),
      label: date.format('MMMM YYYY')
    })
    date.subtract(1, 'month')
  }

  if (props.allowAll) {
    labels.push({
      value: 'all',
      label: t('all')
    })
  }

  return labels
})

function onInput (period) {
  month.value = period
  emit('update:modelValue', period.value)
}

defineExpose({ month })
</script>
