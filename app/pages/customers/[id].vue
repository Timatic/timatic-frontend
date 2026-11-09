<template>
  <div class="font-body">
    <app-bar />
    <div class="bg-background">
      <div class="page-margins page-width text-page-title pt-8 px-8">
        <div class="flex justify-between mb-8">
          <div class="flex-grow flex justify-start items-center">
            <ArrowBack @click="linkBack" />
            <div class="text-2xl flex-1 text-page-title leading-8 font-bold text-rubik pl-3">
              <span class="inline-block w-4 h-4 rounded-full mr-2" :style="{ backgroundColor: '#' + customer.color }" />
              <span :class="{archived: customer.isArchived} ">{{ customer.name }}</span>
              {{ customer.isArchived ? '- Archived' : '' }}
            </div>
          </div>
          <div class="flex">
            <button
              v-if="usersStore.can('customers.delete')"
              class="border border-input-border text-action-button py-2 px-10 rounded font-normal h-12 mr-4"
              @click="deleteCustomer"
            >
              {{ $t('customerForm.delete') }}
            </button>
            <button
              v-if="usersStore.can('customers.update')"
              class="bg-action-button py-2 px-10 rounded text-white font-normal h-12"
              @click="showModal.customer = true"
            >
              {{ $t('edit') }}
            </button>
          </div>
        </div>

        <div class="flex my-4 p-6 box-shadow justify-between bg-white">
          <div class="w-1/3">
            <div class="flex justify-start items-center text-page-title">
              <div class="w-1/2 font-medium">{{ $t('contact') }}</div>
              <div class="w-1/2">{{ accountManager.fullName || $t('none') }}</div>
            </div>
            <div class="flex justify-start items-center text-page-title">
              <div class="w-1/2 font-medium">{{ $t('externalId') }}</div>
              <div class="w-1/2">
                {{ customer.externalId }}
                <InfoIcon
                  v-tooltip="{ content: $t('customerExternalIdForSuggestions'), trigger: 'hover' }"
                  class="inline-block text-filter-text"
                />
              </div>
            </div>
            <div class="flex justify-start items-center text-page-title">
              <div class="w-1/2 font-medium">{{ $t('hourlyRate') }}</div>
              <div class="w-1/2">
                <template v-if="customer.hourlyRate !== null">&euro; {{ customer.hourlyRate }}</template>
                <template v-else>&euro; {{ settingsStore.settings.defaultHourlyRate }} ({{ $t('customerForm.defaultRate') }})</template>
              </div>
            </div>
          </div>
        </div>

        <div class="py-8 text-page-title">
          <div class="text-xl text-table-title leading-8 pb-4">{{ $t('budgets') }}</div>
          <vue-good-table
            :columns="budgetColumns"
            :rows="customerBudgets"
            @row-click="onBudgetClick"
          />
        </div>

        <div class="pb-8 text-page-title">
          <div class="flex justify-between items-center pb-4">
            <div class="text-xl text-table-title leading-8">{{ $t('trackedDomains.title') }}</div>
            <button
              v-if="usersStore.can('customers.update')"
              class="border border-input-border text-action-button py-2 px-10 rounded font-normal h-12"
              @click="showModal.trackedDomain = true"
            >
              {{ $t('trackedDomains.add') }}
            </button>
          </div>
          <vue-good-table :columns="trackedDomainColumns" :rows="trackedDomainRows">
            <template #table-row="props">
              <button
                v-if="props.column.field === 'actions'"
                class="text-action-button"
                @click="deleteTrackedDomain(props.row)"
              >
                {{ $t('customerForm.delete') }}
              </button>
              <span v-else>{{ props.formattedRow[props.column.field] }}</span>
            </template>
          </vue-good-table>
        </div>
      </div>
    </div>
    <CustomerModal
      v-if="showModal.customer"
      :customer="customer"
      @closeModal="showModal.customer = false"
      @saved="showModal.customer = false"
    />
    <TrackedDomainModal
      v-if="showModal.trackedDomain"
      :customer-id="route.params.id"
      @closeModal="showModal.trackedDomain = false"
      @saved="onTrackedDomainSaved"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from '#app'
import InfoIcon from '~/assets/svg/info.svg'
import { useCustomersStore } from '~/stores/customers'
import { useBudgetsStore } from '~/stores/budgets'
import { useUsersStore } from '~/stores/users'
import { useSettingsStore } from '~/stores/settings'
import { getTimaticApi } from '~/utils/timaticApi'

useHead({ title: 'Customer - Timatic' })

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const customersStore = useCustomersStore()
const budgetsStore = useBudgetsStore()
const usersStore = useUsersStore()
const settingsStore = useSettingsStore()

const customer = computed(() => customersStore.collection.firstWhere('id', route.params.id) || { name: 'loading' })
const customerBudgets = computed(() => budgetsStore.collection ? budgetsStore.collection.where('customerId', route.params.id).all() : [])
const accountManager = computed(() => usersStore.collection.firstWhere('id', customer.value.accountManagerUserId || null) || {})

const budgetColumns = computed(() => [
  { label: t('description'), field: 'title' },
  { label: t('budgetType'), field: 'budgetTypeId' }
])

const showModal = ref({ customer: false, trackedDomain: false })
const trackedDomains = ref([])

const trackedDomainColumns = computed(() => [
  { label: t('trackedDomains.domain'), field: 'url' },
  { label: t('settlement'), field: 'settlement' },
  ...(usersStore.can('tracked-domains.delete') ? [{ label: '', field: 'actions', sortable: false }] : [])
])
const trackedDomainRows = computed(() => trackedDomains.value.map(trackedDomain => ({
  ...trackedDomain,
  url: trackedDomain.domain + (trackedDomain.path ?? ''),
  settlement: trackedDomain.isInternal
    ? t('internal')
    : (trackedDomain.budgetId
        ? budgetsStore.collection.firstWhere('id', String(trackedDomain.budgetId))?.title
        : t('trackedDomains.paidPerHour'))
})))

onMounted(async () => {
  const response = await getTimaticApi().$get('tracked-domains', {
    params: { filter: { customerId: route.params.id, shared: 1 }, page: { size: 1000 } }
  })
  trackedDomains.value = response.data.map(item => ({ id: item.id, ...item.attributes }))
})

function onTrackedDomainSaved (trackedDomain) {
  trackedDomains.value = [...trackedDomains.value, { id: trackedDomain.id, ...trackedDomain.attributes }]
  showModal.value.trackedDomain = false
}

async function deleteTrackedDomain (trackedDomain) {
  if (!window.confirm(t('trackedDomains.confirmDelete', { domain: trackedDomain.url }))) {
    return
  }
  await getTimaticApi().$delete('tracked-domains/' + trackedDomain.id)
  trackedDomains.value = trackedDomains.value.filter(item => item.id !== trackedDomain.id)
}

async function deleteCustomer () {
  if (!window.confirm(t('customerForm.confirmDelete', { name: customer.value.name }))) {
    return
  }
  await customersStore.remove(customer.value.id)
  router.push({ path: '/customers/' })
}

function linkBack () {
  router.push({ path: '/customers/' })
}

function onBudgetClick (params) {
  router.push({ path: '/budgets/' + params.row.id + '/' })
}
</script>

<style scoped>
.box-shadow {
  box-shadow: 0px 4px 6px rgba(153, 168, 184, 0.1);
}
</style>
