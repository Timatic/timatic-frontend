<template>
  <base-modal :title=" $t('editBudget')" width="w-11/12" :api-error="error" @closeModal="closeModal" @submitModal="submit">
    <template #content>
      <div class="w-full">
        <div class="flex justify-between border-b border-input-border">
          <div class="w-1/2">
            <div class="mb-4">
              <div class="font-medium text-sm leading-5">
                {{ $t('customer') }}
              </div>
              <span class="">{{ customer.name }}</span>
            </div>
            <div class="mb-4">
              <div class="font-medium text-sm leading-5">
                {{ $t('type') }}
              </div>
              <span class="">{{ budgetType.title }}</span>
            </div>
          </div>
          <div class="w-1/2 ml-8 pl-4">
            <div class="mb-4">
              <div class="font-medium text-sm leading-5">
                {{ $t('renewalFrequency') }}
              </div>
              <span class="">{{ budget.renewalFrequency || 'none' }}</span>
            </div>
            <div class="mb-4">
              <div class="font-medium text-sm leading-5">
                {{ $t('startDate') }}
              </div>
              <span class="">{{ budgetStartedAt }}</span>
            </div>
          </div>
        </div>
        <div class="flex justify-between mt-4">
          <div class="w-1/2">
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
            <div class="mb-4">
              <label for="description" class="text-sm leading-5 pb-2">{{ $t('description') }}</label>
              <textarea
                id="description"
                v-model="params.description"
                name="description"
                rows="5"
                class="w-full rounded border border-gray-400 p-2"
              />
            </div>
            <div v-if="budgetType.hasChangeTicket" class="mb-4">
              <label for="change-no" class="text-sm leading-5">{{ $t('changeNo') }}</label>
              <input
                id="change-no"
                v-model="params.changeId"
                type="text"
                name="change-no"
                class="w-full border border-input-border rounded h-8 px-2"
              >
            </div>
            <div v-if="budgetType.hasSupervisor" class="mb-4">
              <VeeField v-slot="{errors}" name="supervisor">
                <label for="supervisor" class="text-sm leading-5">{{ $t('supervisor') }}</label>
                <user-select id="supervisor" v-model="params.supervisor" :classes="errors.length > 0 ? 'invalid' : null" />
              </VeeField>
            </div>
          </div>
          <div class="w-1/2 ml-8 pl-4">
            <div v-if="budgetType.hasTotalPrice" class="mb-4">
              <label for="total-amount" class="text-sm leading-5">{{ $t('totalPrice') }}</label>
              <VeeField v-slot="{errors}" name="totalPrice" rules="required" :model-value="params.totalPrice">
                <div class="money relative">
                  <input
                    id="total-amount"
                    v-model="params.totalPrice"
                    type="number"
                    min="0"
                    name="total-amount"
                    class="border border-input-border h-8 rounded w-full  px-2 text-right"
                    :class="errors.length > 0 ? 'invalid' : ''"
                    step=".01"
                  >
                </div>
              </VeeField>
            </div>
            <div class="mb-4">
              <label for="hours-amount" class="text-sm leading-5">{{ $t('hoursAmount') }}</label>
              <VeeField v-slot="{errors}" name="initialHours" rules="required" :model-value="params.initialHours">
                <input
                  id="hours-amount"
                  v-model="params.initialHours"
                  type="number"
                  min="0"
                  name="hours-amount"
                  class="border border-input-border h-8 rounded w-full px-2 text-right"
                  :class="errors.length > 0 ? 'invalid' : ''"
                  step=".01"
                >
              </VeeField>
            </div>
            <div v-if="true" class="mb-4">
              <label for="end-date" class="text-sm leading-5 block">{{ $t('endDate') }}</label>
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
            <div v-if="budgetType.hasContractId" class="mb-4">
              <label for="contractId" class="text-sm leading-5">{{ $t('salesReference') }}</label>
              <input
                id="contractId"
                v-model="params.contractId"
                type="text"
                name="contractId"
                class="w-full border border-input-border rounded h-8 px-2"
              >
            </div>
            <div>
              <VeeField v-slot="{errors}" name="allowedUsers">
                <label for="allowedUsers" class="text-sm leading-5 pb-2">{{ $t('allowedUsers') }}</label>
                <user-select id="allowedUsers" v-model="params.allowedUsers" :classes="errors.length > 0 ? 'invalid' : null" multiple />
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
          </div>
        </div>
      </div>
    </template>
    <template #footer-left>
      <template v-if="budgetType.hasRenewalFrequency">
        <label for="end-date" class="text-sm leading-5 block">{{ $t('effectiveFrom') }}</label>
        <VeeField v-slot="{errors}" name="effectiveFrom" rules="required" :model-value="effectiveFrom">
          <vue-select
            v-model="effectiveFrom"
            :class="errors.length > 0 ? 'invalid' : ''"
            :options="periodStartDates"
            :clearable="false"
          />
        </VeeField>
      </template>
    </template>
  </base-modal>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import DatePicker from 'vue-datepicker-next'
import VueSelect from 'vue-select'
import BaseModal from '../BaseModal.vue'
import UserSelect from '../FormElements/UserSelect.vue'
import { useBudgetsStore } from '~/stores/budgets'
import { useBudgetTypesStore } from '~/stores/budgetTypes'
import { useCustomersStore } from '~/stores/customers'
import { useUsersStore } from '~/stores/users'

const props = defineProps({
  budget: {
    required: true,
    type: Object
  },
  periods: {
    required: true,
    type: Object
  }
})

const emit = defineEmits(['closeModal'])

const budgetsStore = useBudgetsStore()
const budgetTypesStore = useBudgetTypesStore()
const customersStore = useCustomersStore()
const usersStore = useUsersStore()

const params = ref({
  title: null,
  contractId: null,
  changeId: null,
  renewalFrequency: null,
  startedAt: null,
  endedAt: null,
  description: null,
  billingOption: 'per_hour',
  initialHours: null,
  totalPrice: null,
  supervisor: null,
  allowedUsers: null,
  showToCustomer: true
})
const effectiveFrom = ref(null)
const customer = ref({})
const budgetStartedAt = ref('')
const periodStartDates = ref([])
const budgetType = ref({})
const error = ref(null)

onMounted(() => {
  customer.value = customersStore.getById(props.budget.customerId) ?? {}
  budgetStartedAt.value = props.budget.startedAt.format('DD-MM-YYYY')
  budgetType.value = budgetTypesStore.collection.firstWhere('id', '=', props.budget.budgetTypeId)
  periodStartDates.value = props.periods.pluck('startDate')
    .transform((date) => ({ label: date.format('DD-MM-YYYY'), date })).reverse().all()

  if (budgetType.value.hasRenewalFrequency) {
    effectiveFrom.value = periodStartDates.value[0]
  }

  params.value.title = props.budget.title
  params.value.contractId = props.budget.contractId
  params.value.changeId = props.budget.changeId
  params.value.endedAt = props.budget.endedAt.format('DD-MM-YYYY')
  params.value.description = props.budget.description
  params.value.initialHours = props.budget.initialMinutes / 60
  params.value.totalPrice = props.budget.totalPrice
  params.value.supervisor = usersStore.collection?.firstWhere('id', props.budget.supervisorUserId)
  params.value.allowedUsers = usersStore.collection?.whereIn('id', props.budget.allowedUsers.map(user => user.id)).all()
  params.value.showToCustomer = props.budget.showToCustomer
})

function closeModal () {
  emit('closeModal', true)
}

function submit () {
  const submitParams = {
    id: props.budget.id,
    budgetType: budgetType.value,
    ...params.value
  }
  if (effectiveFrom.value) {
    submitParams.effectiveFrom = effectiveFrom.value.date.utc().toJSON()
  }
  budgetsStore.update(submitParams)
    .then(() => {
      closeModal()
    }).catch((err) => {
      error.value = err
    })
}
</script>

<style scoped>
.modal {
  transition: opacity 0.25s ease;
}

.money:before {
  display: block;
  content: '€';
  position: absolute;
  left: 5px;
  top: calc(50% - 12px);
}
</style>
