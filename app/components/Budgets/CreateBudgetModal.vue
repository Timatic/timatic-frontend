<template>
  <base-modal
    :title=" $t('createBudget')"
    width="w-11/12"
    :api-error="error"
    @closeModal="closeModal"
    @submitModal="submit"
  >
    <template #content>
      <div class="w-1/3">
        <div class="mb-4">
          <VeeField v-slot="{errors}" name="customer" rules="required" :model-value="params.customer">
            <label for="customer" class="text-sm leading-5 pb-2">{{ $t('customer') }} *</label>
            <customer-select v-model="params.customer" :classes="errors.length > 0 ? 'invalid' : null" />
          </VeeField>
        </div>
        <div class="mb-4">
          <VeeField v-slot="{errors}" name="type" rules="required" :model-value="params.type">
            <label for="type" class="text-sm leading-5 pb-2">{{ $t('type') }} *</label>
            <vue-select
              id="type"
              v-model="params.type"
              :options="budgetTypesStore.collection.where('isArchived',false).sortBy('title').all()"
              name="type"
              label="title"
              :clearable="false"
              :select-on-tab="true"
              :class="errors.length > 0 ? 'invalid' : ''"
            />
          </VeeField>
        </div>
        <div class="mb-4">
          <VeeField v-slot="{errors}" name="title" rules="required" :model-value="params.title">
            <label for="title" class="text-sm leading-5 pb-2">{{ $t('budgetTitle') }}
              *</label>
            <input
              id="title"
              v-model="params.title"
              type="text"
              name="title"
              class="w-full border border-input-border rounded h-8 px-2"
              :class="errors.length > 0 ? 'invalid' : ''"
            >
          </VeeField>
        </div>
        <div class="py-2 flex space-x-2 items-center">
          <div class="input-wrapper">
            <input
              id="showToCustomer"
              v-model="params.showToCustomer"
              class="checkbox"
              type="checkbox"
              name="showToCustomer"
            >
            <span class="checkmark" />
          </div>
          <label for="showToCustomer">
            {{ $t('showToCustomer') }}
          </label>
        </div>
        <transition name="slide">
          <div v-if="hasContractId" class="mb-4">
            <label for="contractId" class="text-sm leading-5 pb-2">{{ $t('salesReference') }}</label>
            <input
              id="contractId"
              v-model="params.contractId"
              type="text"
              name="contractId"
              class="w-full border border-input-border rounded h-8 px-2"
            >
          </div>
        </transition>
        <transition name="slide">
          <div v-if="hasSupervisor" class="mb-4">
            <VeeField v-slot="{errors}" name="supervisor">
              <label for="supervisor" class="text-sm leading-5 pb-2">{{ $t('supervisor') }}</label>
              <user-select id="supervisor" v-model="params.supervisor" :classes="errors.length > 0 ? 'invalid' : null" />
            </VeeField>
          </div>
        </transition>
        <transition name="slide">
          <div v-show="hasChangeTicket" class="mb-4">
            <label for="change-no" class="text-sm leading-5 pb-2">{{ $t('changeNo') }}</label>
            <input
              id="change-no"
              v-model="params.changeNo"
              type="text"
              name="change-no"
              class="w-full border border-input-border rounded h-8 px-2"
            >
          </div>
        </transition>
      </div>
      <div class="w-2/3 ml-8 pl-4">
        <div class="mb-4 flex justify-start items-center">
          <div class="w-1/3 pr-3">
            <label for="hours-amount" class="text-sm leading-5 pb-2">{{ $t('hoursAmount') }}</label>
            <VeeField v-slot="{errors}" name="initialHours" rules="required" :model-value="params.initialHours">
              <input
                id="hours-amount"
                v-model="params.initialHours"
                type="number"
                min="0"
                name="hours-amount"
                class="border border-input-border h-8 rounded w-4/5 px-2 text-right"
                :class="errors.length > 0 ? 'invalid' : ''"
                step=".01"
              >
            </VeeField>
          </div>
          <transition name="slide">
            <div v-if="hasTotalPrice" class="w-1/3">
              <label for="total-price" class="text-sm leading-5 pb-2">{{ $t('totalPrice') }}</label>
              <VeeField v-slot="{errors}" name="totalPrice" rules="required" :model-value="params.totalPrice">
                <div class="money relative">
                  <input
                    id="total-price"
                    v-model="params.totalPrice"
                    type="number"
                    min="0"
                    name="total-price"
                    class="border border-input-border h-8 rounded w-4/5  px-2 text-right"
                    :class="errors.length > 0 ? 'invalid' : ''"
                    step=".01"
                  >
                </div>
              </VeeField>
            </div>
          </transition>
        </div>
        <transition name="slide">
          <div v-if="hasRenewalFrequency">
            <div class="text-sm leading-5 pb-2 mt-5">
              <span v-if="params.type && params.type.id === 'service_fee'">{{ $t('displayFrequency') }}</span>
              <span v-else>{{ $t('renewalFrequency') }}</span>
            </div>
            <VeeField v-slot="{errors}" name="renewalFrequency" rules="required" :model-value="params.renewalFrequency">
              <div class="mb-4 flex justify-start items-center">
                <div
                  v-for="(frequency,frequencyIndex) in params.type.renewalFrequencies"
                  :key="frequencyIndex"
                  class="w-1/3 flex justify-start items-center pr-3"
                >
                  <div class="radio-wrapper">
                    <input
                      :id="'frequency'+frequencyIndex"
                      v-model="params.renewalFrequency"
                      type="radio"
                      class="radio"
                      name="renewalFrequency"
                      :value="frequency"
                      :class="errors.length > 0 ? 'invalid' : ''"
                    >
                    <span class="radio-checkmark" />
                  </div>
                  <label :for="'frequency'+frequencyIndex" class="cursor-pointer text-label ml-2">{{ $t(frequency) }}</label>
                </div>
              </div>
            </VeeField>
          </div>
        </transition>
        <transition name="slide">
          <div v-if="hasStartAndEndDate" class="mb-4 flex justify-start items-center">
            <div class="w-1/3 pr-3">
              <label for="start-date" class="text-sm leading-5 pb-2">{{ $t('startDate') }}</label>
              <VeeField v-slot="{errors}" name="startedAt" rules="required" :model-value="params.startedAt">
                <date-picker
                  id="start-date"
                  v-model:value="params.startedAt"
                  type="date"
                  style="width: 120px"
                  value-type="format"
                  format="DD-MM-YYYY"
                  :class="errors.length > 0 ? 'invalid' : ''"
                />
              </VeeField>
            </div>
            <div class="w-1/3">
              <label for="end-date" class="text-sm leading-5 pb-2">{{ $t('endDate') }}</label>
              <VeeField v-slot="{errors}" name="endedAt" rules="required" :model-value="params.endedAt">
                <date-picker
                  id="end-date"
                  v-model:value="params.endedAt"
                  type="date"
                  style="width: 120px"
                  value-type="format"
                  format="DD-MM-YYYY"
                  :class="errors.length > 0 ? 'invalid' : ''"
                />
              </VeeField>
            </div>
          </div>
        </transition>
        <div class="pr-2">
          <label for="description" class="text-sm leading-5 pb-2">{{ $t('description') }}</label>
          <textarea
            id="description"
            v-model="params.description"
            name="description"
            rows="2"
            class="w-full rounded border border-gray-400 p-2"
          />
        </div>
        <div class="pr-2">
          <VeeField v-slot="{errors}" name="allowedUsers">
            <label for="allowedUsers" class="text-sm leading-5 pb-2">{{ $t('allowedUsers') }}</label>
            <user-select id="allowedUsers" v-model="params.allowedUsers" :classes="errors.length > 0 ? 'invalid' : null" multiple />
          </VeeField>
        </div>
      </div>
    </template>
  </base-modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import DatePicker from 'vue-datepicker-next'
import { useRouter } from '#app'
import VueSelect from 'vue-select'
import BaseModal from '../BaseModal.vue'
import CustomerSelect from '../FormElements/CustomerSelect.vue'
import UserSelect from '../FormElements/UserSelect.vue'
import { useBudgetsStore } from '~/stores/budgets'
import { useBudgetTypesStore } from '~/stores/budgetTypes'

const emit = defineEmits(['closeModal'])

const router = useRouter()
const budgetsStore = useBudgetsStore()
const budgetTypesStore = useBudgetTypesStore()

const params = ref({
  customer: null,
  title: null,
  showToCustomer: true,
  type: null,
  contractId: null,
  changeNo: null,
  renewalFrequency: null,
  startedAt: null,
  endedAt: null,
  description: null,
  initialHours: null,
  totalPrice: null,
  supervisor: null,
  allowedUsers: null
})
const error = ref(null)

const hasChangeTicket = computed(() => params.value.type ? params.value.type.hasChangeTicket : false)
const hasRenewalFrequency = computed(() => params.value.type ? params.value.type.hasRenewalFrequency : false)
const hasSupervisor = computed(() => params.value.type ? params.value.type.hasSupervisor : false)
const hasStartAndEndDate = computed(() => true)
const hasTotalPrice = computed(() => params.value.type ? params.value.type.hasTotalPrice : true)
const hasContractId = computed(() => params.value.type ? params.value.type.hasContractId : false)

watch(() => params.value.type, (newVal, oldVal) => {
  if (!newVal) return
  if (oldVal && oldVal.defaultTitle === params.value.title) {
    params.value.title = ''
  }
  if (newVal.defaultTitle) {
    params.value.title = newVal.defaultTitle
  }
  if (newVal.renewalFrequencies.length === 0) {
    params.value.renewalFrequency = null
  }
  if (newVal.renewalFrequencies.length === 1) {
    params.value.renewalFrequency = newVal.renewalFrequencies[0]
  }
  if (newVal.hasTotalPrice === false) {
    params.value.totalPrice = 0
  }
})

function closeModal () {
  emit('closeModal', true)
}

function submit () {
  budgetsStore.create({ ...params.value })
    .then((response) => {
      closeModal()
      router.push({ path: '/budgets/' + response.data.id + '/' })
    })
    .catch((err) => {
      error.value = err
    })
}
</script>

<style scoped>
.modal {
  transition: opacity 0.25s ease;
}

.money:before {
  display:block;
  content: '€';
  position: absolute;
  left: 5px;
  top: calc( 50% - 12px);
}
</style>
