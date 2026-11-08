<template>
  <base-modal :title="$t('hoursExport')" width="w-11/12" :api-error="error" @closeModal="closeModal" @submitModal="submit">
    <template #content>
      <div class="w-1/2 pr-4">
        <div class="leading-5 font-normal">
          {{ $t('fromMonth') }}*
        </div>
        <VeeField v-slot="{errors}" name="fromMonth" rules="required" :model-value="parameters.fromMonth">
          <vue-select
            v-model="parameters.fromMonth"
            :options="months"
            :reduce="month => month.value"
            :clearable="false"
            :select-on-tab="true"
            class="my-4"
            :class="errors.length > 0 ? 'invalid' : ''"
          />
        </VeeField>
        <div class="leading-5 font-normal">
          {{ $t('toMonth') }}*
        </div>
        <VeeField v-slot="{errors}" name="toMonth" rules="required" :model-value="parameters.toMonth">
          <vue-select
            v-model="parameters.toMonth"
            :options="months"
            :reduce="month => month.value"
            :clearable="false"
            :select-on-tab="true"
            class="my-4"
            :class="errors.length > 0 ? 'invalid' : ''"
          />
        </VeeField>
        <div class="leading-5 font-normal">
          {{ $t('groupBy') }}*
        </div>
        <VeeField v-slot="{errors}" name="groupBy" rules="required" :model-value="parameters.groupBy">
          <vue-select
            v-model="parameters.groupBy"
            :options="dimensions"
            :reduce="dimension => dimension.value"
            :clearable="false"
            :select-on-tab="true"
            class="my-4"
            :class="errors.length > 0 ? 'invalid' : ''"
          />
        </VeeField>
        <div class="leading-5 font-normal">
          {{ $t('splitBy') }}
        </div>
        <vue-select
          v-model="parameters.splitBy"
          :options="dimensions.filter(dimension => dimension.value !== parameters.groupBy)"
          :reduce="dimension => dimension.value"
          :placeholder="$t('optional')"
          :select-on-tab="true"
          class="my-4"
        />
      </div>
      <div class="w-1/2 pl-4">
        <div class="leading-5 font-normal">
          {{ $t('customer') }}
        </div>
        <vue-select
          v-model="parameters.customer"
          :options="customersStore.collection.sortBy('name').all()"
          label="name"
          :placeholder="$t('optional')"
          :select-on-tab="true"
          class="my-4"
        />
        <template v-if="parameters.customer">
          <div class="leading-5 font-normal">
            {{ $t('budget') }}
          </div>
          <vue-select
            v-model="parameters.budget"
            :options="budgetsStore.collection.where('customerId', parameters.customer.id).sortBy('title').all()"
            label="title"
            :placeholder="$t('optional')"
            :select-on-tab="true"
            class="my-4"
          />
        </template>
        <div class="leading-5 font-normal">
          {{ $t('user') }}
        </div>
        <vue-select
          v-model="parameters.user"
          :options="usersStore.collection.sortBy('fullName').all()"
          label="fullName"
          :placeholder="$t('optional')"
          :select-on-tab="true"
          class="my-4"
        />
      </div>
    </template>
  </base-modal>
</template>

<script setup>
import { ref, watch } from 'vue'
import moment from 'moment'
import { useI18n } from 'vue-i18n'
import VueSelect from 'vue-select'
import { useToast } from 'vue-toast-notification'
import BaseModal from '../BaseModal.vue'
import { getTimaticApi } from '~/utils/timaticApi'
import { useBudgetsStore } from '~/stores/budgets'
import { useCustomersStore } from '~/stores/customers'
import { useUsersStore } from '~/stores/users'

const emit = defineEmits(['closeModal'])

const { t } = useI18n()
const toast = useToast()
const budgetsStore = useBudgetsStore()
const customersStore = useCustomersStore()
const usersStore = useUsersStore()

const months = Array.from({ length: 24 }, (_, i) => {
  const month = moment().startOf('month').subtract(i, 'months')
  return { value: month.format('YYYY-MM'), label: month.format('MMMM YYYY') }
})

const dimensions = [
  { value: 'user', label: t('user') },
  { value: 'budget', label: t('budget') },
  { value: 'customer', label: t('customer') },
  { value: 'ticketType', label: t('ticketType') }
]

const parameters = ref({
  fromMonth: months[1].value,
  toMonth: months[1].value,
  groupBy: null,
  splitBy: null,
  customer: null,
  budget: null,
  user: null
})
const error = ref(null)

watch(() => parameters.value.groupBy, (groupBy) => {
  if (parameters.value.splitBy === groupBy) {
    parameters.value.splitBy = null
  }
})

watch(() => parameters.value.customer, () => {
  parameters.value.budget = null
})

function closeModal () {
  emit('closeModal', true)
}

function submit () {
  const requestData = {
    exportType: 'hours-excel',
    fromMonth: parameters.value.fromMonth,
    toMonth: parameters.value.toMonth,
    groupBy: parameters.value.groupBy,
    splitBy: parameters.value.splitBy ?? undefined,
    customerId: parameters.value.customer?.id,
    budgetId: parameters.value.budget?.id,
    userId: parameters.value.user?.id
  }

  const api = getTimaticApi()
  api.$get('budgets/export-mail', { params: requestData }).then(() => {
    toast.success(t('documentSentByMail'), { duration: 5000 })
    closeModal()
  }).catch((err) => {
    error.value = err
  })
}
</script>
