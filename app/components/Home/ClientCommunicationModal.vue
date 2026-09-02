<template>
  <div class="modal communication-modal flex items-center justify-center z-30">
    <div class="modal-container bg-white w-11/12 md:max-w-3xl mx-auto rounded shadow-lg z-30">
      <div class="modal-header py-4 px-5 text-left border-b border-input-border">
        <div class="flex justify-between items-center">
          <p class="font-roboto text-xl leading-8 font-medium">
            {{ $t('communication') }}
          </p>
        </div>
      </div>
      <div class="modal-content mt-4 px-6 text-page-title overflow-auto mr-2">
        <p v-if="!ticket">
          {{ $t('selectTicket') }}
        </p>
        <p v-else-if="error">
          {{ $t('communicationLoadingError') }}
        </p>
        <template v-for="message in messages" v-else-if="!loading" :key="message.id">
          <div
            v-if="message.date"
            class="sticky top-0 bg-white text-center"
          >
            <span class="border rounded-full text-sm px-4 py-2 mb-6 inline-block">
              {{ message.date }}
            </span>
          </div>
          <div class="flex justify-between messages-center text-page-title relative">
            <div class="absolute" style="top: -62px" :class="{ 'in-past': message.inPast }" />
            <div class="w-1/12">
              <div class="text-center initials text-sm text-label bg-avatar w-8 h-8 rounded-full">
                {{ initials(message.name) }}
              </div>
            </div>
            <div class="w-2/3 font-medium">
              {{ message.name }}
            </div>
            <div class="w-1/6 text-sm text-filter-text text-right">
              {{ message.createdAt.format('HH:mm') }}
            </div>
          </div>
          <div class="margin-content text-sm text-label pb-4 whitespace-pre-line break-words">
            {{ message.content }}
          </div>
        </template>
        <div v-else-if="loading">
          <div v-for="i in [1,2,3]" :key="i" class="mb-4 animate-pulse">
            <div class="flex justify-between items-center">
              <div class="w-1/12">
                <div class="text-center initials text-sm text-label bg-gray-300 w-8 h-8 rounded-full" />
              </div>
              <div class="w-2/3 h-4 bg-gray-300 rounded" />
              <div class="w-1/6 h-4 bg-gray-300 rounded" />
            </div>
            <div class="margin-content h-3 bg-gray-300 rounded mb-2" />
            <div class="margin-content h-3 bg-gray-300 rounded" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import collect from 'collect.js'
import moment from 'moment'
import { getTimaticApi } from '~/utils/timaticApi'
import { initials } from '~/utils/filters'

const props = defineProps({
  ticket: {
    type: Object,
    required: false,
    default: null
  },
  dateTime: {
    type: Object,
    required: false,
    default: null
  }
})

const rootEl = ref(null)
const messages = ref(collect())
const loading = ref(true)
const error = ref(false)

watch(() => props.ticket, () => {
  loadMessages()
})

watch(() => props.dateTime, () => {
  scrollToDateTime(true)
})

onMounted(() => {
  if (props.ticket) {
    loadMessages()
  }
})

function loadMessages () {
  error.value = false
  messages.value = collect()

  if (!props.ticket) return

  const url = 'tickets/' + props.ticket.id
  const api = getTimaticApi()

  api.$get(url)
    .then((response) => {
      const ticket = response.data
      const includes = collect(response.included)

      let name = 'unknown'
      if (ticket.relationships.contacts.data) {
        const caller = includes.where('type', 'contacts').firstWhere('id', ticket.relationships.contacts.data.id)
        name = caller.attributes.name ?? caller.attributes.dynamicName
      } else if (ticket.relationships.customers.data) {
        const customer = includes.where('type', 'customers').firstWhere('id', ticket.relationships.customers.data.id)
        name = customer.attributes.name
      }

      messages.value.push({
        name,
        createdAt: moment.utc(ticket.attributes.creationDate).local(),
        content: ticket.attributes.title
      })

      includes.where('type', 'actions').where('attributes.text', '!==', '').each((action) => {
        const message = action.attributes
        const messageDate = moment.utc(message.entryDate).local()

        messages.value.push({
          name: (message.person !== null ? message.person : message.operator),
          content: message.text,
          createdAt: messageDate,
          id: message.id,
          inPast: null
        })
      })

      messages.value.transform((message) => {
        message.name = message.name.split(',').reverse().join(' ')
        return message
      })

      messages.value = messages.value.sortByDesc(message => message.createdAt.format('X'))

      let lastMessage = null
      messages.value.transform((message) => {
        if (lastMessage == null || message.createdAt.diff(lastMessage.createdAt, 'days') !== 0) {
          message.date = message.createdAt.format('dddd D MMMM YYYY')
        } else {
          message.date = false
        }
        lastMessage = message
        return message
      })

      loading.value = false
      scrollToDateTime()
    })
    .catch((err) => { console.log(err); error.value = true })
}

function scrollToDateTime (smoothly = false) {
  messages.value.transform((message) => {
    message.inPast = message.createdAt.isSameOrBefore(props.dateTime, 'minute')
    return message
  })

  nextTick(() => {
    const el = document.querySelector('.communication-modal .in-past')
    if (el) {
      el.scrollIntoView({ behavior: smoothly ? 'smooth' : 'instant' })
    }
  })
}
</script>

<style scoped>
.modal {
  transition: opacity 0.25s ease;
}

.communication-modal {
  width: 435px;
}

.modal-container {
  height: 530px;
}
.communication-modal.high .modal-container {
  height: 602px;
}
.margin-content{
  margin-left: 45px;
}
.modal-content {
  height: 415px;
}
.initials {
  line-height: 2rem;
}
</style>
