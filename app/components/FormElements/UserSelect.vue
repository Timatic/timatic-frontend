<template>
  <vue-select
    :id="id"
    ref="userInput"
    v-model="currentValue"
    :options="options"
    :name="name"
    label="fullName"
    :clearable="false"
    :select-on-tab="true"
    :placeholder="$t('selectUser')"
    :class="classes"
    :multiple="multiple"
  />
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import collect from 'collect.js'
import VueSelect from 'vue-select'
import { useUsersStore } from '~/stores/users'

const props = defineProps({
  classes: {
    type: Object,
    default: null
  },
  name: {
    type: String,
    default: 'user'
  },
  modelValue: {
    type: [Array, Object],
    required: false,
    default: null
  },
  multiple: {
    type: Boolean,
    default: false
  },
  id: {
    type: String,
    default: 'userSelect'
  }
})

const emit = defineEmits(['update:modelValue'])

const usersStore = useUsersStore()
const userInput = ref(null)
const currentValue = ref(null)

const options = computed(() => {
  if (!props.multiple) {
    return usersStore.collection.sortBy('fullName').all()
  }
  const selectedUserIds = collect(props.modelValue).pluck('id')
  return usersStore.collection
    .reject(user => selectedUserIds.contains(user.id))
    .sortBy('fullName')
    .all()
})

watch(currentValue, (val) => {
  emit('update:modelValue', val)
})

watch(() => usersStore.collection, (newVal) => {
  if (newVal.count() > 0) {
    userInput.value?.toggleLoading(false)
  }
})

watch(() => props.modelValue, (newVal) => {
  currentValue.value = newVal
})

onMounted(() => {
  currentValue.value = props.modelValue
  if (usersStore.collection.count() === 0) {
    userInput.value?.toggleLoading(true)
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
