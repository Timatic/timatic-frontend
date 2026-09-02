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
        <template v-for="period in periods.slice(x,4)" :key="period.id">
          <div
            class="w-1/4 custom-shadow mx-2 rounded text-center py-4 cursor-pointer bg-white relative z-10"
            :class="{ 'active-date' : activePeriod === period }"
            @click="$emit('pickedPeriod', period);"
          >
            <div class="text-action-button">
              {{ period.title }}
            </div>
            <div class="">
              {{ $t('remainingBudget') }}: <span
                :class="{'text-warning' : period.remainingMinutes < 60 }"
              >{{
                timeFormat(period.remainingMinutes)
              }}</span>
            </div>
            <div class="">
              Tickets: {{ period.ticketCount }}
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
import { timeFormat } from '~/utils/filters'

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

const x = ref(null)

const blockPrevious = computed(() => x.value <= 0)
const blockNext = computed(() => x.value >= props.periods.count() - 4)

onMounted(() => {
  x.value = props.periods.count() - 4
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
  height: 104px;
}

.active-date {
  border: 1px solid #5BB46F;
}

.active-date::after {
  content: '';
  width: 8px;
  height: 8px;
  position: absolute;
  top: 101px;
  left: 148px;
  transform: rotate(45deg);
  @apply border border-action-button border-t-0 border-l-0 bg-white;
  z-index: -1;
}
</style>
