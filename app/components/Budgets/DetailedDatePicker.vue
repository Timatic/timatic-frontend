<template>
  <div class="unselectable">
    <div class="flex justify-between items-center">
      <div
        class="bg-white date-arrow custom-shadow flex items-center"
        :class="{ 'opacity-25' : blockPrevious, 'cursor-pointer' : !blockPrevious }"
        @click="!blockPrevious ? x-- : ''"
      >
        <ArrowLeft :class="{ 'text-action-button':!blockPrevious }" />
      </div>
      <div class="flex justify-between items-center w-full">
        <template v-for="period in periods.slice(x, visibleCount)" :key="period.id">
          <div
            class="w-1/5 custom-shadow mx-2 rounded text-center py-4 cursor-pointer bg-white relative z-10"
            :class="{ 'active-date' : activePeriod === period }"
            @click="$emit('pickedPeriod', period);"
          >
            <div class="text-action-button">
              {{ period.title }}
            </div>
            <div class="grid grid-cols-2 mt-2">
              <div class="border-r">
                <div class="text-filter-text">{{ $t('spent') }}</div>
                <div :class="{'text-warning' : period.remainingMinutes < 60 }">
                  {{ hoursFormat(period.initialMinutes - period.remainingMinutes) }}
                </div>
              </div>
              <div>
                <div class="text-filter-text">{{ $t('total') }}</div>
                <div>{{ hoursFormat(period.initialMinutes) }}</div>
              </div>
            </div>
          </div>
        </template>
      </div>
      <div
        class="bg-white date-arrow custom-shadow flex items-center"
        :class="{ 'opacity-25' : blockNext, 'cursor-pointer' : !blockNext }"
        @click="!blockNext ? x++ : ''"
      >
        <ArrowRight :class="{'text-action-button':!blockNext}" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ArrowLeft from '~/assets/svg/arrow-left.svg'
import ArrowRight from '~/assets/svg/arrow-right.svg'

const props = defineProps({
  activePeriod: {
    required: true,
    type: Object
  },
  periods: {
    required: true,
    type: Object
  },
  frequency: {
    type: String,
    required: true
  }
})

defineEmits(['pickedPeriod'])

const visibleCount = 5
const hoursFormat = minutes => (minutes / 60).toLocaleString('nl-NL', { maximumFractionDigits: 1 }) + 'h'
const x = ref(null)

const blockPrevious = computed(() => x.value <= 0)
const blockNext = computed(() => x.value >= props.periods.count() - visibleCount)

onMounted(() => {
  x.value = props.periods.count() - visibleCount
  if (x.value < 0) {
    x.value = 0
  }
})
</script>

<style>
.custom-shadow {
  box-shadow: 0 4px 6px rgba(153, 168, 184, 0.1);
}
</style>
<style scoped>
.date-arrow {
  height: 112px;
}

.active-date {
  border: 1px solid #5BB46F;
}

.active-date::after {
  content: '';
  width: 8px;
  height: 8px;
  position: absolute;
  top: calc(100% - 3px);
  left: calc(50% - 4px);
  transform: rotate(45deg);
  @apply border border-action-button border-t-0 border-l-0 bg-white;
  z-index: -1;
}
</style>
