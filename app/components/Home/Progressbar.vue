<template>
  <div>
    <div id="progress-bar" class="w-full border rounded-full bg-divider-gray h-5 flex">
      <template v-for="(customer, index) in progressBar" :key="index">
        <div
          :class="{ 'rounded-l-full' : index === 0, 'rounded-r-full' : roundRightBorder(index), [customer.class] : true }"
          :style="{'width': calculateWidth(customer.time)}"
          :title="customer.name"
        />
      </template>
    </div>
    <div class="flex flex-wrap mt-2 text-page-title text-xs justify-start">
      <template v-for="(customer, index) in progressBar" :key="index">
        <div v-if="index < 3" class="flex w-1/2 items-center pr-4 mt-1">
          <div class="w-4 h-4 rounded-full" :class="customer.class" />
          <div class="w-auto pl-3">
            {{ customer.name }}
          </div>
        </div>
        <div v-else-if="index===3">
          <p class="mt-1">
            More...
          </p>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import collect from 'collect.js'
import { useCustomersStore } from '~/stores/customers'

const props = defineProps({
  entries: {
    type: Object,
    default: null
  }
})

const customersStore = useCustomersStore()

const progressBar = computed(() => {
  const bar = collect()
  props.entries.groupBy('customerId').each((entries, customerId) => {
    let customer = customersStore.collection.first(c => c.id === customerId)
    if (!customer) { customer = { name: 'loading...', color: 'grey' } }
    bar.push({
      time: entries.sum('duration'),
      class: 'bg-' + customer.color,
      name: customer.name
    })
  })
  return bar.sortByDesc('time').all()
})

const timeTotal = computed(() => props.entries.sum('duration'))

function roundRightBorder (index) {
  return index === (Object.keys(progressBar.value).length - 1) && timeTotal.value > 480
}

function calculateWidth (time) {
  if (timeTotal.value <= 480) {
    return ((time / 480) * 100) + '%'
  } else {
    return ((time / timeTotal.value) * 100) + '%'
  }
}
</script>
