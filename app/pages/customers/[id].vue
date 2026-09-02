<template>
  <div class="font-body">
    <app-bar />
    <div class="bg-background">
      <div class="page-margins page-width text-page-title pt-8 px-8">
        <div class="flex justify-between mb-8">
          <div class="flex-grow flex justify-start items-center">
            <ArrowBack @click="linkBack" />
            <div class="text-2xl flex-1 text-page-title leading-8 font-bold text-rubik pl-3">
              <span :class="{archived: customer.isArchived} ">{{ customer.name }}</span>
              {{ customer.isArchived ? '- Archived' : '' }}
            </div>
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
              <div class="w-1/2">&euro; {{ customer.hourlyRate }}</div>
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from '#app'
import InfoIcon from '~/assets/svg/info.svg'
import { useCustomersStore } from '~/stores/customers'
import { useBudgetsStore } from '~/stores/budgets'
import { useUsersStore } from '~/stores/users'

useHead({ title: 'Customer - Timatic' })

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const customersStore = useCustomersStore()
const budgetsStore = useBudgetsStore()
const usersStore = useUsersStore()

const customer = computed(() => customersStore.collection.firstWhere('id', route.params.id) || { name: 'loading' })
const customerBudgets = computed(() => budgetsStore.collection ? budgetsStore.collection.where('customerId', route.params.id).all() : [])
const accountManager = computed(() => usersStore.collection.firstWhere('id', customer.value.accountManagerUserId || null) || {})

const budgetColumns = computed(() => [
  { label: t('description'), field: 'title' },
  { label: t('budgetType'), field: 'budgetTypeId' }
])

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
