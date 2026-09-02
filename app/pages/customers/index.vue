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
            </vue-good-table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from '#app'
import { useCustomersStore } from '~/stores/customers'

useHead({ title: 'Customers - Timatic' })

const { t } = useI18n()
const router = useRouter()
const customersStore = useCustomersStore()

const columns = [
  {
    label: t('name'),
    field: 'name',
    filterOptions: { enabled: true }
  }
]

watch(() => customersStore.collection, (newVal) => {
  const externalId = router.currentRoute.value.query.externalId
  if (externalId) {
    const customer = customersStore.getByExternalId(externalId)
    router.push({ path: '/customers/' + customer.id + '/' })
  }
})

function selectCustomer (row) {
  router.push({ path: '/customers/' + row.row.id + '/' })
}
</script>
