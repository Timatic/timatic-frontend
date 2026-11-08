<template>
  <base-modal
    :title="customer.id ? $t('customerForm.edit') : $t('customerForm.create')"
    width="w-1/2"
    :api-error="error"
    @closeModal="$emit('closeModal')"
    @submitModal="submit"
  >
    <template #content>
      <div class="w-full">
        <div class="mb-4">
          <VeeField v-slot="{ errors }" name="name" rules="required" :model-value="form.name">
            <label for="name" class="text-sm leading-5 pb-2">{{ $t('customerForm.name') }} *</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              class="w-full border border-input-border rounded h-8 px-2"
              :class="errors.length > 0 ? 'invalid' : ''"
            >
          </VeeField>
        </div>
        <div v-if="form.externalId" class="mb-4">
          <div class="text-sm leading-5 pb-2">
            {{ $t('externalId') }}
          </div>
          <span>{{ form.externalId }}</span>
        </div>
        <div class="mb-4">
          <label for="hourlyRate" class="text-sm leading-5 pb-2">{{ $t('customerForm.hourlyRate') }}</label>
          <input
            id="hourlyRate"
            v-model="form.hourlyRate"
            type="number"
            min="0"
            step=".01"
            :placeholder="$t('customerForm.defaultRatePlaceholder', { rate: settingsStore.settings.defaultHourlyRate })"
            class="w-full border border-input-border rounded h-8 px-2 text-right"
          >
        </div>
        <div class="mb-4">
          <label for="accountManager" class="text-sm leading-5 pb-2">{{ $t('customerForm.accountManager') }}</label>
          <select id="accountManager" v-model="form.accountManagerUserId" class="w-full border border-input-border rounded h-8 px-2">
            <option :value="null">
              {{ $t('none') }}
            </option>
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.fullName }}
            </option>
          </select>
        </div>
        <label class="flex items-center">
          <input v-model="form.isOwnOrganization" type="checkbox" class="mr-2">
          {{ $t('customerForm.isOwnOrganization') }}
        </label>
      </div>
    </template>
  </base-modal>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCustomersStore } from '~/stores/customers'
import { useUsersStore } from '~/stores/users'
import { useSettingsStore } from '~/stores/settings'

const props = defineProps({
  customer: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['closeModal', 'saved'])

const customersStore = useCustomersStore()
const usersStore = useUsersStore()
const settingsStore = useSettingsStore()

const form = ref({
  id: props.customer.id,
  externalId: props.customer.externalId,
  name: props.customer.name ?? '',
  hourlyRate: props.customer.hourlyRate ?? '',
  accountManagerUserId: props.customer.accountManagerUserId ?? null,
  isOwnOrganization: props.customer.isOwnOrganization ?? false
})
const error = ref(null)

const users = computed(() => usersStore.collection.sortBy('fullName').all())

async function submit () {
  error.value = null
  try {
    emit('saved', await customersStore.save(form.value))
  } catch (e) {
    error.value = e
  }
}
</script>
