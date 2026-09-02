<template>
  <vue-select
    ref="customerInput"
    v-model="currentValue"
    :options="customersStore.collection.sortBy('name').all()"
    :name="name"
    label="name"
    :clearable="false"
    :select-on-tab="true"
    :placeholder="$t('selectCustomer')"
    :class="classes"
    />
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import VueSelect from 'vue-select'
import { useCustomersStore } from '~/stores/customers'

const props = defineProps({
  classes: {
    type: Object,
    default: null
  },
  name: {
    type: String,
    default: 'customer'
  },
  modelValue: {
    type: Object,
    required: false,
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

const customersStore = useCustomersStore()
const customerInput = ref(null)
const currentValue = ref(null)

watch(currentValue, (val) => {
  emit('update:modelValue', val)
})

watch(() => customersStore.collection, (newVal) => {
  if (newVal.count() > 0) {
    customerInput.value?.toggleLoading(false)
  }
})

watch(() => props.modelValue, (newVal) => {
  currentValue.value = newVal
})

onMounted(() => {
  currentValue.value = props.modelValue
  if (customersStore.collection.count() === 0) {
    customerInput.value?.toggleLoading(true)
  }
})
</script>

<style scoped>
:deep(.vs__dropdown-menu) {
  min-width: 400px;
}
:deep(.vs__selected-options) {
  width: 100%;
  min-width: 0;
}
</style>
