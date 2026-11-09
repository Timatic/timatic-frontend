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
        <div class="font-roboto font-medium text-black">
          {{ $t('settlement') }}
        </div>
        <div class="flex justify-between items-center py-2">
          <div class="w-1-8">
            <div class="radio-wrapper">
              <input id="paid" v-model="form.settlement" class="radio" type="radio" value="paid" name="settlement">
              <span class="radio-checkmark" />
            </div>
          </div>
          <div class="w-7-8">
            <budget-select v-model="form.budget" :customer-id="budgetCustomerId" :disabled="form.settlement !== 'paid'" />
          </div>
        </div>
        <div class="flex justify-between items-center">
          <div class="w-1-8">
            <div class="radio-wrapper">
              <input id="internal" v-model="form.settlement" class="radio" type="radio" value="internal" name="settlement">
              <span class="radio-checkmark" />
            </div>
          </div>
          <div class="w-7-8">
            <label class="leading-5 font-roboto" for="internal">{{ $t('internal') }}</label>
          </div>
        </div>
      </div>
    </template>
  </base-modal>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getTimaticApi } from '~/utils/timaticApi'

const props = defineProps({
  customerId: { type: String, required: true }
})

const emit = defineEmits(['closeModal', 'saved'])

const form = ref({ domain: '', path: '', settlement: 'paid', budget: null })
// budget-select loads the budgets when its customer changes, so it gets the customer once mounted
const budgetCustomerId = ref(null)
onMounted(() => { budgetCustomerId.value = props.customerId })
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
          budgetId: form.value.settlement === 'paid' && form.value.budget && form.value.budget.id !== 'paidPerHour'
            ? Number(form.value.budget.id)
            : null,
          isInternal: form.value.settlement === 'internal'
        }
      }
    })
    emit('saved', response.data)
  } catch (e) {
    error.value = e
  }
}
</script>
