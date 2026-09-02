<template>
  <div class="ticket-select-container">
    <vue-select
      id="ticketInput"
      ref="ticketInput"
      v-model="currentValue"
      v-tooltip.bottom="(!!currentValue ? currentValue.title : false)"
      :options="options"
      :clearable="true"
      :select-on-tab="false"
      :placeholder="$t('selectTicket')"
      :class="classes"
      @search="searchTickets"
    >
      <template #option="option">
        <span class="mr-5">{{ option.createdAt }}</span>
        <span class="mr-5">{{ option.key }}</span>
        <span>{{ option.title }}</span>
      </template>
      <template #no-options>
        <span v-if="customer === null">
          {{ $t('selectCustomerOrTypeTicketNumber') }}
        </span>
        <span v-else>
          {{ $t('noTicketsFoundForCustomer') }}
        </span>
      </template>
    </vue-select>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import collect from 'collect.js'
import moment from 'moment'
import { debounce } from 'lodash'
import { useI18n } from 'vue-i18n'
import VueSelect from 'vue-select'
import { getTimaticApi } from '~/utils/timaticApi'
import { useCustomersStore } from '~/stores/customers'

const props = defineProps({
  customer: {
    type: Object,
    required: false,
    default: null
  },
  ticketNumber: {
    type: String,
    required: false,
    default: null
  },
  modelValue: {
    type: Object,
    default: null
  },
  classes: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'customerFromTicket'])

const { t } = useI18n()
const customersStore = useCustomersStore()

const ticketInput = ref(null)
const currentValue = ref('')
const tickets = ref(collect())
const ticketsLoaded = ref(false)

const options = computed(() => tickets.value.sortByDesc('key').all())

watch(currentValue, (val) => {
  emit('update:modelValue', val)
})

watch(() => props.customer, async (val) => {
  if (val) {
    tickets.value = collect()
    await fetchTickets()
    selectOnTicketNumber()
  }
})

watch(() => props.modelValue, (newVal) => {
  currentValue.value = newVal
})

onMounted(async () => {
  if (props.customer) {
    currentValue.value = null
    await fetchTickets()
    selectOnTicketNumber()
  }
})

function selectOnTicketNumber () {
  if (!props.ticketNumber) return
  fetchTickets(props.ticketNumber).then(() => {
    currentValue.value = tickets.value.where('key', props.ticketNumber).first()
  })
}

function fetchTickets (search = null, loading = null) {
  const isSearch = search !== null

  if (isSearch) {
    if (search.length < 3) return Promise.resolve()
    const cached = tickets.value.where('key', search).first()
    if (cached) return Promise.resolve(cached)
  } else {
    currentValue.value = null
    ticketInput.value?.toggleLoading(true)
  }

  if (loading) loading(true)

  const params = { page: { size: 100 } }
  if (props.customer?.id) params.filter = { customerId: props.customer.id }
  if (isSearch) params.filter = { ...(params.filter ?? {}), search }

  const api = getTimaticApi()
  return api.$get('tickets', { params })
    .then((response) => {
      if (isSearch) {
        const customer = collect(response.included).firstWhere('type', 'customers')
        if (customer && !customersStore.getById(props.customer?.id)) {
          emit('customerFromTicket', { id: customer.id })
        }
      }

      const currentIds = tickets.value.pluck('id')
      const newTickets = collect(response.data)
        .reject(ticket => currentIds.contains(ticket.id))
        .reject(ticket => !isSearch && ticket.attributes.closedAt && moment().diff(moment(ticket.attributes.closedAt), 'days') > 30)
        .transform(ticket => ({
          id: ticket.id,
          createdAt: moment(ticket.attributes.createdAt).format('DD-MM-YYYY'),
          title: ticket.attributes.title,
          key: ticket.attributes.key,
          label: ticket.attributes.key + ' ' + ticket.attributes.title,
          type: 'ticket',
          url: ticket.attributes.url
        }))
      tickets.value = tickets.value.merge(newTickets.all())

      if (!isSearch) {
        ticketInput.value?.toggleLoading(false)
        ticketsLoaded.value = true
      }
      if (loading) loading(false)
    })
    .catch(() => {
      if (!isSearch) alert(t('ticketsLoadingWarning'))
    })
}

const searchTickets = debounce(fetchTickets, 300)
</script>

<style scoped>
:deep(.vs__dropdown-menu) {
  min-width: 900px;
}
:deep(.vs__selected-options) {
  width: 100%;
  min-width: 0;
}

.ticket-select-container {
  position: relative;
}

small {
  position: absolute;
  top: -21px;
  right: 0;
}
</style>
