<template>
  <base-modal
    :title="$t('trackedDomains.add')"
    width="w-1/2"
    :api-error="error"
    @closeModal="$emit('closeModal')"
    @submitModal="submit"
  >
    <template #content>
      <div class="w-full">
        <div class="mb-4">
          <VeeField v-slot="{ errors }" name="domain" rules="required" :model-value="form.domain">
            <label for="domain" class="text-sm leading-5 pb-2">{{ $t('trackedDomains.domain') }} *</label>
            <input
              id="domain"
              v-model="form.domain"
              type="text"
              class="w-full border border-input-border rounded h-8 px-2"
              :class="errors.length > 0 ? 'invalid' : ''"
              @blur="splitUrl"
            >
          </VeeField>
          <p class="text-sm text-label">
            {{ $t('trackedDomains.domainHelp') }}
          </p>
        </div>
        <div class="mb-4">
          <label for="path" class="text-sm leading-5 pb-2">{{ $t('trackedDomains.path') }}</label>
          <input id="path" v-model="form.path" type="text" class="w-full border border-input-border rounded h-8 px-2">
          <p class="text-sm text-label">
            {{ $t('trackedDomains.pathHelp') }}
          </p>
        </div>
        <div class="mb-4">
          <label for="budget" class="text-sm leading-5 pb-2">{{ $t('trackedDomains.budget') }}</label>
          <select id="budget" v-model="form.budgetId" class="w-full border border-input-border rounded h-8 px-2">
            <option :value="null">
              {{ $t('trackedDomains.paidPerHour') }}
            </option>
            <option v-for="budget in budgets" :key="budget.id" :value="budget.id">
              {{ budget.title }}
            </option>
          </select>
          <p class="text-sm text-label">
            {{ $t('trackedDomains.budgetHelp') }}
          </p>
        </div>
        <label class="flex items-center">
          <input v-model="form.isInternal" type="checkbox" class="mr-2">
          {{ $t('trackedDomains.internal') }}
        </label>
      </div>
    </template>
  </base-modal>
</template>

<script setup>
import { ref } from 'vue'
import { getTimaticApi } from '~/utils/timaticApi'

const props = defineProps({
  customerId: { type: String, required: true },
  budgets: { type: Array, required: true }
})

const emit = defineEmits(['closeModal', 'saved'])

const form = ref({ domain: '', path: '', budgetId: null, isInternal: false })
const error = ref(null)

// Same normalisation as TrackedDomain::normalise(): a bare lowercase host without www, the path apart
function splitUrl () {
  const value = form.value.domain.trim()
  if (!value) {
    return
  }
  try {
    const url = new URL(value.includes('://') ? value : 'https://' + value)
    form.value.domain = url.hostname.toLowerCase().replace(/^www\./, '')
    const path = url.pathname.replace(/\/+$/, '')
    if (path) {
      form.value.path = path
    }
  } catch {
    // Leave the input as typed; the API explains what is wrong with it
  }
}

async function submit () {
  error.value = null
  try {
    const response = await getTimaticApi().$post('tracked-domains', {
      data: {
        type: 'trackedDomains',
        attributes: {
          userId: null,
          domain: form.value.domain,
          path: form.value.path || null,
          customerId: props.customerId,
          budgetId: form.value.budgetId ? Number(form.value.budgetId) : null,
          isInternal: form.value.isInternal
        }
      }
    })
    emit('saved', response.data)
  } catch (e) {
    error.value = e
  }
}
</script>
