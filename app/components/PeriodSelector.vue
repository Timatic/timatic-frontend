<template>
  <div class="text-right flex justify-end unselectable">
    <div
      class="h-12 border border-input-border w-12 rounded flex content-center mr-2 cursor-pointer"
      :class="{ 'cursor-not-allowed' : blockPrevious }"
      @click="previousValue"
    >
      <ArrowLeft :class="{ 'text-input-border' : blockPrevious, 'block':true, 'm-auto':true }" />
    </div>
    <vue-select
      :model-value="period"
      :options="options"
      @update:model-value="onSelectChange"
      :redus="value => value.label"
      :clearable="false"
      :select-on-tab="true"
      label="label"
      class="text-center w-64"
      :max-height="'42px'"
    />
    <div
      class="h-12 border border-input-border w-12 rounded  flex content-center ml-2"
      :class="{ 'cursor-not-allowed' : blockNext }"
      @click="nextValue"
    >
      <ArrowRight :class="{ 'text-input-border' : blockNext, 'block':true, 'm-auto':true }" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import moment from 'moment'
import { useRoute } from '#app'
import VueSelect from 'vue-select'
import ArrowLeft from '~/assets/svg/arrow-left.svg'
import ArrowRight from '~/assets/svg/arrow-right.svg'

const props = defineProps({
  allowAll: {
    type: Boolean,
    default: false,
    required: false
  },
  queryParam: {
    type: String,
    default: ''
  },
  queryParamFormat: {
    type: String,
    default: ''
  },
  options: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['input'])

const route = useRoute()

const currentIndex = ref(0)
const period = computed(() => props.options[currentIndex.value])

watch(period, () => emitPeriod(), { immediate: true })

const blockPrevious = computed(() => currentIndex.value >= props.options.length - 1)
const blockNext = computed(() => currentIndex.value <= 0)

function emitPeriod () {
  emit('input', period.value)
}

function previousValue () {
  if (!blockPrevious.value) {
    currentIndex.value++
  }
}

function nextValue () {
  if (!blockNext.value) {
    currentIndex.value--
  }
}

function onSelectChange (option) {
  const idx = props.options.indexOf(option)
  if (idx !== -1) currentIndex.value = idx
}

onMounted(() => {
  if (Object.prototype.hasOwnProperty.call(route.query, props.queryParam)) {
    const month = moment(route.query[props.queryParam], props.queryParamFormat)
    const idx = props.options.findIndex(o => moment(o.value).isSame(month, 'month'))
    currentIndex.value = idx !== -1 ? idx : 0
  } else {
    currentIndex.value = 0
  }
})
</script>

<style scoped>
  :deep(.vs__search),
  :deep(.vs__selected) {
    line-height: 36px;
    padding-left: 10px;
  }
</style>
