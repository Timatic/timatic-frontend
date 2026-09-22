<template>
  <base-modal
    :title="title"
    width="w-11/12"
    :show-footer="!isLocked"
    :api-error="error"
    @submitModal="submit"
    @closeModal="$emit('closeModal');"
  >
    <template #content>
      <div class="w-2/5 pr-4">
        <div v-if="showDateInput" class="pb-3">
          <div class="font-roboto font-medium text-black">
            {{ $t('date') }}
          </div>
          <div class="leading-5 font-roboto">
            <VeeField v-slot="{field, errors}" name="date" rules="required" :model-value="parameters.date">
              <date-picker
                id="date"
                v-model:value="parameters.date"
                type="date"
                style="width: 100%;"
                value-type="format"
                format="DD-MM-YYYY"
                :class="errors.length > 0 ? 'is-invalid' : ''"
                :disabled-date="disabledDates"
              />
            </VeeField>
          </div>
        </div>
        <div class="times">
          <div class="font-roboto font-medium text-black">
            {{ $t('time') }}
          </div>
          <div class="flex items-center">
            <div>
              <VeeField v-slot="{field, errors}" name="startTime" rules="required" :model-value="parameters.timeStart">
                <vue-timepicker
                  v-model="parameters.timeStart"
                  :minute-interval="15"
                  manual-input
                  auto-scroll
                  input-width="5em"
                  hide-clear-button
                  input-class="skip-error-style"
                  :class="errors.length > 0 ? 'is-invalid' : ''"
                />
              </VeeField>
            </div>
            <div class="px-2 text-center">
              -
            </div>
            <VeeField v-slot="{field, errors}" name="endTime" rules="required" :model-value="parameters.timeEnd">
              <div>
                <vue-timepicker
                  v-model="parameters.timeEnd"
                  :minute-interval="15"
                  manual-input
                  auto-scroll
                  input-width="5em"
                  hide-clear-button
                  input-class="skip-error-style"
                  :class="errors.length > 0 ? 'is-invalid' : ''"
                />
              </div>
            </VeeField>
            <div class="px-2 text-center">
              =
            </div>
            <VeeField v-slot="{field, errors}" ref="durationValidator" name="duration" rules="required|duration" :model-value="duration">
              <div>
                <input
                  v-model.lazy.trim="duration"
                  type="text"
                  name="duration"
                  placeholder="03:33"
                  maxlength="5"
                  style="font-family: sans-serif; height: 2.2em"
                  class="w-full border border-dark-gray rounded px-2"
                  :class="errors.length > 0 ? 'is-invalid' : ''"
                >
              </div>
            </VeeField>
          </div>
          <div v-if="durationValidator?.errors?.length > 0" class="pt-2 text-red-600">
            {{ $t('durationError', {hours: 12}) }}
          </div>
        </div>
        <div>
          <div class="font-roboto font-medium text-black pt-3">
            {{ $t('customer') }}
          </div>
          <div class="leading-5 font-roboto">
            <VeeField v-slot="{field, errors}" name="customer" rules="required" :model-value="parameters.customer">
              <customer-select v-model="parameters.customer" :classes="errors.length > 0 ? 'is-invalid' : null" />
            </VeeField>
          </div>
        </div>
        <div class="tickets">
          <div class="flex justify-between items-center pt-3">
            <div class="font-roboto font-medium text-black w-1/3">
              {{ $t('ticket') }}
              <a v-if="parameters.ticket?.url" :href="parameters.ticket.url" target="_blank">
                <LinkIcon class="font-normal text-action-button cursor-pointer inline" />
              </a>
            </div>
            <div class="w-2/3 text-right leading-5">
              <span v-if="ticketIsOptional">{{ $t('optional') }}</span>
            </div>
          </div>
          <div class="leading-5 font-roboto">
            <VeeField v-slot="{field, errors}" name="ticket" :rules="ticketIsOptional ? '' : 'required'" :model-value="parameters.ticket">
              <ticket-select
                v-model="parameters.ticket"
                :customer="customerNotSelected ? null : parameters.customer"
                :classes="errors.length > 0 ? 'is-invalid' : null"
                :ticket-number="ticketNumber"
                @customerFromTicket="setCustomerFromTicket"
              />
            </VeeField>
          </div>
        </div>
        <div
          v-tooltip="{
            content: $t('selectCustomerWarning'),
            shown: customerNotSelected,
            triggers: [],
            placement: 'left-end',
            popperClass: 'customer-warning-popover'
          }"
        >
          <div
            class="settlement"
            :class="{'opacity-25': customerNotSelected}"
          >
            <div class="flex pt-3">
              <div class="font-roboto font-medium text-black">
                {{ $t('settlement') }}
              </div>
            </div>
            <div class="flex justify-between items-center py-2">
              <div class="w-1-8">
                <div class="radio-wrapper">
                  <VeeField name="settlement" vid="settlement">
                    <input
                      id="paid"
                      v-model="parameters.settlement"
                      class="radio"
                      type="radio"
                      value="paid"
                      name="settlement"
                      :disabled="customerNotSelected"
                    >
                    <span class="radio-checkmark" />
                  </VeeField>
                </div>
              </div>
              <div class="w-7-8">
                <VeeField
                  v-slot="{field, errors}"
                  name="budget"
                  :rules="parameters.settlement === 'paid' ? 'required':''"
                  :model-value="parameters.budget"
                >
                  <budget-select
                    ref="budgetSelect"
                    v-model="parameters.budget"
                    :classes="errors.length > 0 ? 'is-invalid' : null"
                    :disabled="parameters.settlement !== 'paid' || customerNotSelected"
                    :customer-id="customerNotSelected ? null : parameters.customer.id"
                    :ticket="parameters.ticket"
                  />
                </VeeField>
              </div>
            </div>
            <div class="flex justify-between items-center">
              <div class="w-1-8">
                <div class="radio-wrapper">
                  <input
                    id="internal"
                    v-model="parameters.settlement"
                    class="radio"
                    type="radio"
                    value="internal"
                    name="settlement"
                    :disabled="customerNotSelected"
                  >
                  <span class="radio-checkmark" />
                </div>
              </div>
              <div class="w-7-8">
                <label class="leading-5 font-roboto" for="internal">{{ $t('internal') }}</label>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="w-3/5 pl-6">
        <div class="flex justify-between items-center">
          <div class="font-roboto font-medium text-black w-1/3">
            {{ $t('description') }}
          </div>
        </div>
        <div class="description">
          <VeeField v-slot="{ field, errors }" name="description" rules="required" :model-value="parameters.description">
            <textarea
              id="description"
              v-model="parameters.description"
              name="description"
              class="w-full h-32 rounded border border-gray-600 p-2"
              :class="errors.length > 0 ? 'is-invalid' : ''"
              :placeholder="descriptionPlaceholder"
            />
          </VeeField>
        </div>
        <div class="py-2 flex items-center">
          <div class="input-wrapper">
            <input
              id="overtime"
              v-model="parameters.overtime"
              class="checkbox"
              type="checkbox"
              name="overtime"
              :class="{'cursor-not-allowed' : overtimeHours === null && !editOvertime}"
              :disabled="overtimeHours === null && !editOvertime"
            >
            <span class="checkmark" />
          </div>
          <label
            for="overtime"
            class="ml-2 mr-3"
            :class="{'opacity-25' : overtimeHours === null && !editOvertime}"
          >
            {{ $t('overtime') }}
            <span v-if="overtimeHours && !editOvertime">
              ({{ overtimeHours.start.format('HH:mm') + ' - ' + overtimeHours.end.format('HH:mm') }})
            </span>
          </label>
          <template v-if="editOvertime">
            <VeeField
              v-slot="{field, errors}"
              name="startCustomOvertime"
              rules="required|after:@startTime|before:@endCustomOvertime"
              :model-value="parameters.customOvertimeHours.start"
            >
              <vue-timepicker
                v-model="parameters.customOvertimeHours.start"
                :minute-interval="15"
                manual-input
                close-on-complete
                auto-scroll
                input-width="5em"
                hide-clear-button
                input-class="skip-error-style"
                :class="errors.length > 0 ? 'is-invalid' : ''"
              />
            </VeeField>
            <span class="px-3">-</span>
            <VeeField
              v-slot="{field, errors}"
              name="endCustomOvertime"
              rules="required|before:@endTime|after:@startCustomOvertime"
              :model-value="parameters.customOvertimeHours.end"
            >
              <vue-timepicker
                v-model="parameters.customOvertimeHours.end"
                :minute-interval="15"
                manual-input
                close-on-complete
                auto-scroll
                input-width="5em"
                hide-clear-button
                input-class="skip-error-style"
                :class="errors.length > 0 ? 'is-invalid' : ''"
              />
            </VeeField>
          </template>
          <a
            class="text-action-button cursor-pointer"
            :class="{'ml-3':editOvertime}"
            @click.prevent="toggleCustomOvertime"
          >{{ editOvertime ? $t('cancel') : $t('edit') }}</a>
        </div>
        <div class="py-2 flex items-center">
          <div class="input-wrapper">
            <input
              id="chargeCustomer"
              v-model="parameters.chargeCustomer"
              class="checkbox"
              type="checkbox"
              name="overtime"
              :class="{'cursor-not-allowed' : overtimeHours === null || settlementIsInternal}"
              :disabled="overtimeHours === null || settlementIsInternal"
            >
            <span class="checkmark" />
          </div>
          <label
            for="chargeCustomer"
            class="ml-2"
            :class="{'opacity-25' : overtimeHours === null || settlementIsInternal}"
          >
            {{ $t('chargeOvertime') }}
            <span v-if="overtimeHours && !settlementIsInternal">
              ({{ overtimeHours.start.format('HH:mm') + ' - ' + overtimeHours.end.format('HH:mm') }})
            </span>
          </label>
        </div>
      </div>
    </template>
    <template #footer-left>
      <slot name="footer-left" />
    </template>
    <template #submit-button>
      <button class="bg-action-button py-2 px-10 rounded text-white font-normal h-12" type="submit">
        <slot name="submit-button-text">
          {{ $t('addActivity') }}
        </slot>
      </button>
    </template>
    <template #side-modal>
      <client-communication-modal :ticket="parameters.ticket" :date-time="endMoment" :class="showDateInput ? 'high' : '' " />
    </template>
  </base-modal>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import moment from 'moment'
import { defineRule } from 'vee-validate'
import { useI18n } from 'vue-i18n'
import VueTimepicker from 'vue3-timepicker'
import DatePicker from 'vue-datepicker-next'
import TicketSelect from '../FormElements/TicketSelect.vue'
import CustomerSelect from '../FormElements/CustomerSelect.vue'
import BudgetSelect from '../FormElements/BudgetSelect.vue'
import BaseModal from '../BaseModal.vue'
import ClientCommunicationModal from './ClientCommunicationModal.vue'
import LinkIcon from '~/assets/svg/external-link.svg'
import { useEntriesStore } from '~/stores/entries'
import { useBudgetTypesStore } from '~/stores/budgetTypes'
import { useUsersStore } from '~/stores/users'
import { useCustomersStore } from '~/stores/customers'

defineRule('duration', (value) => {
  const duration = moment.duration(value)
  return (duration.hours() * 60 + duration.minutes()) <= 60 * 12
})

defineRule('before', (value, [target]) => {
  const endMoment = moment(value, 'HH:mm')
  const startMoment = moment(target, 'HH:mm')
  return endMoment.isSameOrBefore(startMoment)
})

defineRule('after', (value, [target]) => {
  const endMoment = moment(value, 'HH:mm')
  const startMoment = moment(target, 'HH:mm')
  return endMoment.isSameOrAfter(startMoment)
})

const props = defineProps({
  isLocked: { required: false, type: Boolean, default: false },
  showDateInput: { required: false, type: Boolean, default: false },
  date: { required: true, type: Object },
  title: { required: true, type: String },
  timeStart: { default: null, type: String },
  timeEnd: { default: null, type: String },
  customer: { default: null, type: Object },
  ticketNumber: { default: null, type: String },
  description: { default: null, type: String },
  budget: { default: null, type: Object },
  overtime: { default: null, type: Boolean },
  chargeCustomer: { default: null, type: Boolean },
  settlement: { default: null, type: String },
  customOvertimeHours: { default: null, type: Object },
  entryId: { default: null, type: String },
  suggestionId: { default: null, type: String },
  userId: { default: null, type: String }
})

const emit = defineEmits(['closeModal', 'entrySaved'])

const entriesStore = useEntriesStore()
const budgetTypesStore = useBudgetTypesStore()
const usersStore = useUsersStore()
const customersStore = useCustomersStore()

const durationValidator = ref(null)
const parameters = ref({
  date: '',
  timeStart: '',
  timeEnd: '',
  customer: null,
  ticket: null,
  description: '',
  budget: null,
  overtime: false,
  chargeCustomer: false,
  settlement: 'paid',
  customOvertimeHours: { start: null, end: null }
})
const duration = ref('')
const error = ref(null)
const editOvertime = ref(false)

const customerNotSelected = computed(() => parameters.value.customer === null)
const settlementIsInternal = computed(() => parameters.value.settlement === 'internal')
const customerIsOwnOrganisation = computed(() => parameters.value.customer?.isOwnOrganization === true)

const startMoment = computed(() => {
  const [startHour, startMinute] = parameters.value.timeStart.split(':')
  return moment(parameters.value.date, 'DD-MM-YYYY').add(startHour, 'hours').add(startMinute, 'minutes')
})

const endMoment = computed(() => {
  const [endHour, endMinute] = parameters.value.timeEnd.split(':')
  const end = moment(parameters.value.date, 'DD-MM-YYYY').add(endHour, 'hours').add(endMinute, 'minutes')
  if (end.isBefore(startMoment.value)) {
    end.add(1, 'day')
  }
  return end
})

const overtimeHours = computed(() => {
  if (parameters.value.timeStart === '' || parameters.value.timeEnd === '') return null

  const businessStart = moment(props.date).add(8, 'hours')
  const businessEnd = moment(props.date).add(18, 'hours')

  const startIsOverTime = startMoment.value.isBefore(businessStart, 'minute') || startMoment.value.isAfter(businessEnd, 'minute')
  const endIsOverTime = endMoment.value.isBefore(businessStart, 'minute') || endMoment.value.isAfter(businessEnd, 'minute')

  if ((startIsOverTime && endIsOverTime) || startMoment.value.isoWeekday() >= 6) {
    return { start: startMoment.value, end: endMoment.value }
  }
  if (startIsOverTime) return { start: startMoment.value, end: businessStart }
  if (endIsOverTime) return { end: endMoment.value, start: businessEnd }
  return null
})

const ticketIsOptional = computed(() => {
  if (parameters.value.budget && parameters.value.budget.id !== 'paidPerHour') {
    const budgetType = budgetTypesStore.collection.firstWhere('id', parameters.value.budget.budgetTypeId)
    if (budgetType?.ticketIsRequired === false) return true
  }
  return customerIsOwnOrganisation.value || settlementIsInternal.value
})

const descriptionPlaceholder = computed(() => {
  if (!customerIsOwnOrganisation.value) {
    if (settlementIsInternal.value) return ''
    if (parameters.value.budget?.id === 'paidPerHour') return ''
  }
  return ''
})

watch(() => parameters.value.timeEnd, () => calculateDuration())
watch(() => parameters.value.timeStart, () => calculateDuration())

watch(duration, (newValue) => {
  const timeEnd = moment(parameters.value.timeEnd, 'HH:mm')
  if (newValue.includes(':')) {
    const dur = moment.duration(newValue)
    parameters.value.timeStart = timeEnd.subtract(dur).format('HH:mm')
  } else {
    parameters.value.timeStart = timeEnd.subtract(newValue, 'minutes').format('HH:mm')
  }
})

watch(() => parameters.value.customer, () => {
  if (customerIsOwnOrganisation.value) {
    parameters.value.settlement = 'internal'
  }
})

watch(() => props.customer, (newCustomer) => {
  parameters.value.customer = newCustomer
  nextTick(() => {
    if (props.budget) parameters.value.budget = props.budget
  })
})

watch(overtimeHours, (newValue) => {
  if (newValue === null) {
    parameters.value.chargeCustomer = false
    if (!editOvertime.value) {
      parameters.value.overtime = false
    }
  }
})

// Initialize
parameters.value.date = props.date.format('DD-MM-YYYY')
if (props.timeStart) parameters.value.timeStart = props.timeStart
if (props.timeEnd) parameters.value.timeEnd = props.timeEnd
if (props.customer) parameters.value.customer = props.customer
if (props.description) parameters.value.description = props.description
if (props.overtime) parameters.value.overtime = props.overtime
if (props.chargeCustomer) parameters.value.chargeCustomer = props.chargeCustomer
if (props.settlement) parameters.value.settlement = props.settlement
if (props.customOvertimeHours) {
  parameters.value.customOvertimeHours = props.customOvertimeHours
  editOvertime.value = true
}
nextTick(() => {
  if (props.budget) parameters.value.budget = props.budget
})
calculateDuration()

function calculateDuration () {
  const startTime = moment(parameters.value.timeStart, 'HH:mm')
  const endTime = moment(parameters.value.timeEnd, 'HH:mm')
  duration.value = moment(endTime.diff(startTime)).utc().format('HH:mm')
}

function submit () {
  const entryFields = {
    ...parameters.value,
    type: 'regular',
    startedAt: startMoment.value,
    endedAt: endMoment.value
  }

  if (editOvertime.value) {
    const [startHour, startMinute] = parameters.value.customOvertimeHours.start.split(':')
    const startOvertime = startMoment.value.clone().startOf('day').add(startHour, 'hours').add(startMinute, 'minutes')

    const [endHour, endMinute] = parameters.value.customOvertimeHours.end.split(':')
    const endOvertime = endMoment.value.clone().startOf('day').add(endHour, 'hours').add(endMinute, 'minutes')

    entryFields.overtimeHours = { start: startOvertime, end: endOvertime }
  }

  if (props.entryId) {
    entryFields.id = props.entryId
    entryFields.userId = props.userId
  }

  if (props.suggestionId) {
    entryFields.suggestionId = props.suggestionId
  }

  entriesStore.save(entryFields)
    .then((response) => {
      emit('entrySaved', parameters.value)
    }).catch((err) => {
      error.value = err
    })
}

function toggleCustomOvertime () {
  editOvertime.value = !editOvertime.value
  if (overtimeHours.value) {
    parameters.value.customOvertimeHours.start = overtimeHours.value.start.format('HH:mm')
    parameters.value.customOvertimeHours.end = overtimeHours.value.end.format('HH:mm')
  } else {
    parameters.value.customOvertimeHours.start = parameters.value.timeStart
    parameters.value.customOvertimeHours.end = parameters.value.timeEnd
  }
}

function setCustomerFromTicket (data) {
  let customer
  if (data.id) {
    customer = customersStore.getById(data.id)
  } else if (data.externalId) {
    customer = customersStore.getByExternalId(data.externalId)
  }

  if (customer) {
    parameters.value.customer = customer
    return customer
  }
}

function disabledDates (date) {
  const minDate = moment(usersStore.entryLockDate)
  return minDate.isSameOrAfter(date)
}
</script>

<style scoped>
.modal {
  transition: opacity 0.25s ease;
}

:deep(.vue__time-picker input.display-time) {
  border-radius: 4px;
}

:deep(#budgetInput .vs__dropdown-menu) {
  min-width: 690px;
}
:deep(.vs__selected-options) {
  width: 100%;
  min-width: 0;
}

:deep(.mx-input) {
  font-size: 1em;
  height: 35px;
}
</style>
