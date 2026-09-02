<template>
  <base-modal :title=" $t('export')" width="w-11/12" @closeModal="closeModal" @submitModal="submit">
    <template #content>
      <div class="w-1/2">
        <div class="leading-5 font-normal">
          {{ $t('exportType') }}*
        </div>
        <VeeField v-slot="{errors}" name="exportType" rules="required" :model-value="parameters.exportType">
          <div v-for="type in exportTypes" :key="type.key" class="flex justify-start items-center my-4">
            <div class="radio-wrapper">
              <input
                :id="type.key"
                v-model="parameters.exportType"
                type="radio"
                name="file-type"
                class="radio mr-2"
                :value="type"
                :class="errors.length > 0 ? 'invalid' : ''"
              >
              <span class="radio-checkmark" />
            </div>
            <label :for="type.key" class="text-label">{{ type.label }}</label>
            <span class="border border-input-border rounded text-xs text-label uppercase px-1.5 py-0.5 ml-2">{{ type.extension }}</span>
          </div>
        </VeeField>
      </div>
      <div v-show="parameters.exportType?.periodOptions !== 'none'" class="w-1/2">
        <div class="leading-5 font-normal">
          {{ $t('period') }}*
        </div>
        <div class="flex justify-start items-center my-4">
          <vue-select
            v-model="parameters.date"
            :options="months"
            :clearable="false"
            :select-on-tab="true"
            class="w-7-8"
          />
        </div>
      </div>
    </template>
  </base-modal>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import moment from 'moment'
import { useI18n } from 'vue-i18n'
import { useRuntimeConfig } from '#app'
import VueSelect from 'vue-select'
import { useToast } from 'vue-toast-notification'
import BaseModal from '../BaseModal.vue'
import { getTimaticApi } from '~/utils/timaticApi'

const emit = defineEmits(['closeModal'])

const { t } = useI18n()
const toast = useToast()
const config = useRuntimeConfig()

const parameters = ref({
  exportType: null,
  date: null
})

const exportTypes = ref([])

const months = computed(() => {
  const result = []
  const date = moment().set('date', 1)
  const isLockedAfterDays = config.public.isLockedAfterDays
  const finalDate = moment().subtract(isLockedAfterDays, 'days')

  for (let i = 0; i < 24; i++) {
    let label = date.format('MMMM YYYY')

    if (date.clone().endOf('month').diff(finalDate, 'days') > 0) {
      label += ' (' + t('preliminary') + ')'
    }

    if ((date.month() === 11 || result.length === 0) && parameters.value.exportType?.periodOptions === 'monthly-and-yearly') {
      const year = date.clone().year()
      let yearLabel = String(year)
      if (year === moment().year()) {
        yearLabel += ' (' + t('preliminary') + ')'
      }
      result.push({ year, label: yearLabel })
    }

    result.push({
      month: date.format('M'),
      year: date.format('YYYY'),
      label
    })

    date.subtract(1, 'months')
  }

  return result
})

onMounted(() => {
  parameters.value.date = months.value[1]

  const api = getTimaticApi()
  api.$get('export-formats').then((response) => {
    exportTypes.value = response.data.map(format => ({
      key: format.id,
      label: format.attributes.label,
      periodOptions: format.attributes.periodOptions,
      extension: format.attributes.extension
    })).sort((a, b) => a.label.localeCompare(b.label))
  }).catch((err) => {
    console.error('Error loading export formats:', err)
  })
})

function closeModal () {
  emit('closeModal', true)
}

function submit () {
  if (!parameters.value.exportType) {
    console.error('Export type is missing.')
    return
  }

  const requestData = {
    exportType: parameters.value.exportType.key
  }

  if (parameters.value.exportType.periodOptions !== 'none') {
    if (!parameters.value.date.year) {
      console.error('Year is missing from date.')
      return
    }
    requestData.year = parameters.value.date.year
    requestData.month = parameters.value.date.month
  }

  const api = getTimaticApi()
  api.$get('budgets/export-mail', { params: requestData }).then(() => {
    setTimeout(() => {
      toast.success(t('documentSentByMail'), { duration: 5000 })
    }, 500)
    closeModal()
  }).catch((err) => {
    console.error('Error exporting data:', err)
    toast.error('Sorry, there was an error processing your request. Please try again.')
  })
}
</script>

<style scoped>
.modal {
  transition: opacity 0.25s ease;
}
</style>
