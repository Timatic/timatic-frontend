<template>
  <div class="flex justify-between items-center text-white">
    <div
      class="w-10 h-10 mr-2 rounded-full cursor-pointer border border-input-border hover:bg-button text-icon-text text-center relative hover:font-bold"
      @click="prevWeek"
    >
      <div class="absolute arrow-position-left">
        <ArrowLeft />
      </div>
    </div>
    <template v-for="(day,index) in week" :key="index">
      <div
        class="mx-1 rounded hover:bg-background  text-xs leading-2 p-1 text-center dt-picker-size relative unselectable day-button"
        :class="{
          'current' : day.isSame(activeDay),
          'border border-input-border' : day.isSameOrBefore(today),
          'cursor-pointer' : !day.isAfter(today)
        }"
        :style="day.style"
        @click="day.isAfter(today) ? false : activeDay = day"
      >
        <p
          class="text-sm text-center text-action-button leading-2 py-2"
          :class="{ 'text-filter-text' : day.format() > today.format()}"
        >
          {{ day.format('dd').toUpperCase() }}
        </p>
        <div class="text-page-title pb-2 text-base text-center absolute day-alignment">
          {{ day.format('DD') }}
        </div>
        <div v-if="day.hasUnusedSuggestions" class="notification" title="There are unused suggestions on this day" />
      </div>
    </template>
    <div
      class="w-10 h-10 rounded-full ml-2 cursor-pointer border border-input-border hover:bg-button text-icon-text text-center relative ml-center hover:font-bold"
      @click="nextWeek"
    >
      <div class="absolute arrow-position-right">
        <ArrowRight class="ml-center" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import moment from 'moment'
import ArrowLeft from '~/assets/svg/arrow-left-small.svg'
import ArrowRight from '~/assets/svg/arrow-right-small.svg'
import { getTimaticApi } from '~/utils/timaticApi'
import { useUsersStore } from '~/stores/users'
import { useSuggestionsStore } from '~/stores/suggestions'

const props = defineProps({
  modelValue: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

const usersStore = useUsersStore()
const suggestionsStore = useSuggestionsStore()

const today = ref(moment().startOf('day'))
const activeDay = ref(moment().startOf('day'))
const progress = ref({})

const week = computed(() => {
  const sunday = activeDay.value.clone().startOf('isoWeek')
  const gradient = 'linear-gradient( to top, rgba(183,231,253,30%), rgba(153,224,255,47%) ?%, rgba(255,255,255,0) ?%)'
  const result = []
  for (let i = 0; i < 7; i++) {
    const day = sunday.clone().add(i, 'days')
    const date = day.format('YYYY-MM-DD')
    const percentage = progress.value[date]
    if (percentage) {
      day.style = [{ 'background-image': gradient.replace(/\?/g, percentage), 'background-position': '0 0' }]
    }
    day.hasUnusedSuggestions = false
    if (day.isSameOrAfter(moment(usersStore.entryLockDate))) {
      day.hasUnusedSuggestions = suggestionsStore.collection.where('date', date).count() > 0
    }
    result.push(day)
  }
  return result
})

watch(activeDay, () => {
  emit('update:modelValue', activeDay.value)
})

activeDay.value = props.modelValue
loadProgressAndSuggestions()

function prevWeek () {
  activeDay.value = activeDay.value.clone().add(-7, 'days')
  loadProgressAndSuggestions()
}

function nextWeek () {
  const nextDate = activeDay.value.clone().add(7, 'days')
  if (nextDate.diff(today.value, 'days') <= 7) {
    activeDay.value = (nextDate > today.value ? today.value.clone() : nextDate)
    loadProgressAndSuggestions()
  }
}

function loadProgressAndSuggestions () {
  const api = getTimaticApi()
  api.$get('daily-progress', {
    params: {
      filter: {
        from: week.value[0].clone().format('YYYY-MM-DD'),
        to: week.value[6].clone().format('YYYY-MM-DD')
      }
    }
  }).then((response) => {
    response.data.forEach((day) => {
      const shortDate = day.attributes.date
      progress.value[shortDate] = day.attributes.progress
    })
  })

  suggestionsStore.fetch({
    date: {
      gte: week.value[0].clone().format('YYYY-MM-DD'),
      lte: week.value[6].clone().format('YYYY-MM-DD')
    }
  })
}

defineExpose({ loadProgressAndSuggestions })
</script>

<style scoped>
.arrow-position-left {
  transform: translate(6px, 7px);
}

.arrow-position-right {
  transform: translate(2px, 7px);
}

.day-alignment {
  transform: translate(7px, -6px);
}

.current {
  @apply border-2 border-action-button;
}

.ml-center {
  margin-left: 6px;
}

.day-button {
  transition: background-position 0.5s;
  background-position: 0 66px;
  background-repeat: no-repeat;
}
.day-button .notification {
  border-radius: 6px;
  background-color: #AAC1D9;
  position: absolute;
  top: -6px;
  right: -6px;
  display: block;
  width: 12px;
  height: 12px;
}
</style>
