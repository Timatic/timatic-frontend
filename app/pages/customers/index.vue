<template>
  <div class="font-body">
    <app-bar />

    <div class="bg-background">
      <div class="page-margins page-width min-h-screen">
        <div class="text-page-title">
          <div class="p-8">
            <div class="flex justify-between items-center pb-4">
              <div class="text-2xl leading-8 text-page-title font-bold w-1/3">
                {{ $t('customers') }}
              </div>
              <button
                v-if="usersStore.can('customers.create')"
                class="bg-action-button py-2 px-10 rounded text-white font-normal h-12"
                @click="showCreateModal = true"
              >
                {{ $t('customerForm.create') }}
              </button>
            </div>
            <vue-good-table
              :columns="columns"
              :rows="customersStore.collection.sortBy('name').all()"
              @row-click="selectCustomer"
            >
              <template #table-column="props">
                <div class="text-sm leading-5 text-label font-normal">
                  {{ props.column.label }}
                </div>
              </template>
              <template #table-row="props">
                <span
                  v-if="props.column.field === 'trackedDomainsCount' && props.row.trackedDomainsCount === 0"
                  v-tooltip="{ content: $t('trackedDomains.noneTracked'), trigger: 'hover' }"
                  class="inline-flex items-center"
                >
                  <WarningIcon class="mr-1" /> 0
                </span>
                <span v-else>{{ props.formattedRow[props.column.field] }}</span>
              </template>
            </vue-good-table>
            <CustomerModal
              v-if="showCreateModal"
              @closeModal="showCreateModal = false"
              @saved="onCreated"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from '#app'
import WarningIcon from '~/assets/svg/warning.svg'
import { useCustomersStore } from '~/stores/customers'
import { useUsersStore } from '~/stores/users'

useHead({ title: 'Customers - Timatic' })

const { t } = useI18n()
const router = useRouter()
const customersStore = useCustomersStore()
const usersStore = useUsersStore()
const showCreateModal = ref(false)

const columns = [
  {
    label: t('name'),
    field: 'name',
    filterOptions: { enabled: true }
  },
  {
    label: t('trackedDomains.count'),
    field: 'trackedDomainsCount',
    type: 'number'
  }
]

watch(() => customersStore.collection, (newVal) => {
  const externalId = router.currentRoute.value.query.externalId
  if (externalId) {
    const customer = customersStore.getByExternalId(externalId)
    router.push({ path: '/customers/' + customer.id + '/' })
  }
})

function onCreated (customer) {
  showCreateModal.value = false
  router.push({ path: '/customers/' + customer.id + '/' })
}

function selectCustomer (row) {
  router.push({ path: '/customers/' + row.row.id + '/' })
}
</script>
