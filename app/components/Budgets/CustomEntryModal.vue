<template>
  <base-modal :title=" $t('createCustomEntry')" width="w-11/12" :api-error="error" @submitModal="submit" @closeModal="closeModal">
    <template #content>
      <div class="w-2/5 pr-4">
        <div>
          <div class="font-roboto text-black">
            <label for="hours" class="">{{ $t('hoursAmount') }}*</label>
          </div>
          <div class="pt-1 flex justify-start items-center">
            <input
              id="hours"
              v-model="parameters.hours"
              type="number"
              name="hours"
              class="border border-input-border rounded h-8 px-2 px-2 text-right w-full"
              step=".01"
            >
            <InfoIcon
              v-tooltip="{
                content: $t('customEntryExplainer'),
                trigger: 'hover'
              }"
            />
          </div>
        </div>
        <div class="pt-3">
          <div class="font-roboto text-black">
            <label for="date" class="">{{ $t('date') }}</label>
          </div>
          <VeeField v-slot="{errors}" name="date" rules="required" :model-value="parameters.date">
            <date-picker
              id="date"
              v-model="parameters.date"
              type="date"
              style="width: 100%"
              value-type="format"
              format="DD-MM-YYYY"
              :disabled-date="disabledDates"
              :class="errors.length > 0 ? 'invalid' : ''"
            />
          </VeeField>
        </div>
        <div class="pt-3">
          <div class="flex justify-between items-center pt-3">
            <div class="font-roboto font-medium text-black w-1/3">
              {{ $t('ticket') }}
            </div>
            <div class="w-2/3 text-right leading-5">
              {{ $t('optional') }}
            </div>
          </div>
          <div class="leading-5 font-roboto">
            <ticket-select v-model="parameters.ticket" :customer="customer" />
          </div>
        </div>
        <div v-if="canCreateEntriesForOthers" class="pt-3">
          <div class="font-roboto text-black">
            {{ $t('nameOnEntry') }}
          </div>
          <div class="leading-5 font-roboto">
            <input
              v-model="parameters.userFullName"
              type="text"
              :placeholder="userFullName"
              class="border border-input-border rounded h-8 px-2 px-2 w-full"
            >
          </div>
        </div>
      </div>
      <div class="w-3/5 pl-6">
        <div class="">
          <label for="description" class="text-sm pb-1">{{ $t('description') }}</label>
          <VeeField v-slot="{errors}" name="description" rules="required" :model-value="parameters.description">
            <textarea
              id="description"
              v-model="parameters.description"
              name="description"
              class="w-full rounded border border-gray-600 p-2"
              :class="errors.length > 0 ? 'invalid' : ''"
              rows="3"
            />
          </VeeField>
        </div>
      </div>
    </template>
  </base-modal>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import DatePicker from 'vue-datepicker-next'
import moment from 'moment'
import BaseModal from '../BaseModal.vue'
import TicketSelect from '../FormElements/TicketSelect.vue'
import InfoIcon from '~/assets/svg/info-outline.svg'
import { useEntriesStore } from '~/stores/entries'
import { useUsersStore } from '~/stores/users'

const props = defineProps({
  dateMin: { type: Object, required: true },
  dateMax: { type: Object, required: true },
  customer: { type: Object, required: true },
  budget: { type: Object, required: true }
})

const emit = defineEmits(['closeModal', 'entrySaved'])

const entriesStore = useEntriesStore()
const usersStore = useUsersStore()

const parameters = ref({
  date: '30-06-2020',
  description: '',
  ticket: null,
  hours: 0,
  userFullName: ''
})
const error = ref(null)

const userFullName = computed(() => usersStore.getCurrentUser.givenName + ' ' + usersStore.getCurrentUser.familyName)
const canCreateEntriesForOthers = computed(() => usersStore.canCreateEntriesForOthers)

onMounted(() => {
  if (moment().isAfter(props.dateMax)) {
    parameters.value.date = props.dateMax.clone().subtract(1, 'day').format('DD-MM-YYYY')
  } else {
    parameters.value.date = moment().format('DD-MM-YYYY')
  }
})

function closeModal () {
  emit('closeModal', true)
}

function disabledDates (date) {
  return date < props.dateMin || date > props.dateMax
}

function submit () {
  const date = moment(parameters.value.date, 'DD-MM-YYYY')
  const entryFields = {
    description: parameters.value.description,
    ticket: parameters.value.ticket,
    userFullName: parameters.value.userFullName,
    type: 'custom',
    startedAt: moment(date),
    endedAt: moment(date).add(parameters.value.hours, 'hours'),
    customer: props.customer,
    settlement: 'paid',
    budget: props.budget
  }

  entriesStore.save(entryFields)
    .then(() => {
      closeModal()
      emit('entrySaved', parameters.value)
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
</style>
