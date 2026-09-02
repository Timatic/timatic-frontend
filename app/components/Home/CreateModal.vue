<template>
  <EntryModal
    :title="$t('addActivity')"
    :date="date"
    :time-start="startTime"
    :time-end="endTime"
    @closeModal="$emit('closeModal');"
    @entrySaved="$emit('entrySaved',$event);$emit('closeModal')"
  />
</template>

<script setup>
import { computed } from 'vue'
import moment from 'moment'
import EntryModal from './BaseEntryModal.vue'

const props = defineProps({
  date: {
    required: true,
    type: Object
  },
  start: {
    type: Date,
    default: null
  },
  end: {
    type: Date,
    default: null
  }
})

defineEmits(['closeModal', 'entrySaved'])

const startTime = computed(() => {
  if (props.start == null) return moment().subtract(15, 'minutes').format('HH:mm')
  return moment(props.start).format('HH:mm')
})

const endTime = computed(() => {
  if (props.end == null) return moment().format('HH:mm')
  return moment(props.end).format('HH:mm')
})
</script>
