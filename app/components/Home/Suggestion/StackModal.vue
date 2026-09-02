<template>
  <div>
    <div
      class="fixed top-0 right-0 cursor-pointer flex flex-col items-center mt-4 mr-4 text-white text-sm z-50"
      @click="$emit('closeModal', true)"
    >
      <CloseIcon />
      <span class="text-sm">(Esc)</span>
    </div>
    <div class="fixed w-full h-full bg-gray-900 opacity-50 top-0 right-0 z-40" />
    <div class="z-50 top-0 left-0 w-full absolute">
      <suggestion-card
        :suggestion="suggestion"
        :is-inside-modal="true"
        @closeModal="$emit('closeModal', true)"
      />
      <activity
        v-for="activity in activities"
        :key="activity.id"
        :activity="activity"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import Activity from './Activity.vue'
import CloseIcon from '~/assets/svg/close.svg'

const props = defineProps({
  suggestion: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['closeModal'])

const activities = computed(() => props.suggestion.activities.sortBy('startedAt').all())

onMounted(() => {
  window.addEventListener('keyup', (e) => {
    if (e.code === 'Escape') {
      emit('closeModal', true)
    }
  })
})
</script>
