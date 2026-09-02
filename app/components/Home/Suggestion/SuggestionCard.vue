<template>
  <div class="relative" :class="{'mb-4': !isInsideModal && !isStacked, 'mb-8': !isInsideModal && isStacked}">
    <template v-if="isStacked && !isInsideModal">
      <div class="stack-tile stack-tile-back" aria-hidden="true" />
      <div class="stack-tile stack-tile-front" aria-hidden="true" />
    </template>
    <div
      ref="card"
      class="relative flex activity-card bg-white rounded-t font-body"
      :class="{'rounded-b': !isInsideModal, 'shadow-standard': !isInsideModal && !isStacked, 'shadow-stack': !isInsideModal && isStacked}"
    >
      <div
        class="delete-suggestion rounded-full absolute border border-input-border flex content-center cursor-pointer z-10"
        @click="deleteSuggestion"
      >
        <TrashIcon :class="['block','m-auto']" />
      </div>
      <div class="font-light flex flex-col justify-center items-center m-4 text-filter-text text-sm">
        <template v-if="hasOnlyOneActivity">
          <div>
            {{ timeStart }}
          </div>
          <div class="text-dark-gray">
            |
          </div>
          <div>
            {{ timeEnd }}
          </div>
          <template v-if="suggestion.ticketNumber">
            <div class="w-1/2 py-1 text-xs">
              <hr>
            </div>
            <div>
              {{ duration }}
            </div>
          </template>
        </template>
        <div v-else>
          &plusmn;{{ duration }}
        </div>
      </div>
      <div class="flex-1 my-4 relative">
        <div class="leading-5 mb-1 text-page-title text-lg font-medium">
          <p style="word-break: break-word">
            {{ title }}
          </p>
        </div>
        <div v-if="suggestion.customerId !== null" class="flex my-1">
          <div class="rounded-full flex justify-start px-2 py-1 my-1 bar-gradient">
            <ContactIcon />
            <div class="text-page-title pl-2">
              {{ customer ? customer.name : 'loading...' }}
            </div>
          </div>
        </div>
        <div class="flex leading-5 mt-1">
          <div v-if="suggestion.ticketNumber" class="flex-grow">
            {{ suggestion.ticketNumber }}
            <a v-if="suggestion.ticketUrl" :href="suggestion.ticketUrl" target="_blank">
              <LinkIcon class="font-normal text-action-button cursor-pointer inline" />
            </a>
          </div>
          <div v-else-if="hasOnlyOneActivity" class="flex-grow">
            {{ $t('eventNames.' + firstActivity.eventTypeId) }}
          </div>
          <div v-if="hasOnlyOneActivity && firstActivity.eventTypeId === 'ticket_tagged'" class="flex-grow text-right tagged">
            <span class="circle">@</span> tagged
          </div>
        </div>
      </div>
      <div class="w-8 flex flex-col justify-between m-4 relative gap-2">
        <template v-if="hasOnlyOneActivity">
          <img :src="iconLink(firstActivity)" :alt="firstActivity.sourceId" style="height:20px">
        </template>
        <template v-else>
          <div class="cursor-pointer select-none" style="padding-left:5px;" @click="caretClicked">
            <arrow-down :class="{'rotate-180':!isInsideModal}" />
          </div>
        </template>
        <div class="w-8 h-8 border pt-1 text-center rounded cursor-pointer text-action-button border-input-border">
          <div class="relative" @click="$emit('modal', suggestion)">
            <PlusIcon :class="['m-auto']" />
          </div>
        </div>
      </div>
    </div>
    <stack-modal
      v-if="showStackModal && !isInsideModal"
      :suggestion="suggestion"
      @closeModal="showStackModal=false"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import moment from 'moment'
import { useI18n } from 'vue-i18n'
import { useRuntimeConfig } from '#app'
import StackModal from './StackModal.vue'
import ContactIcon from '~/assets/svg/contact.svg'
import LinkIcon from '~/assets/svg/external-link.svg'
import PlusIcon from '~/assets/svg/plus.svg'
import TrashIcon from '~/assets/svg/trash.svg'
import ArrowDown from '~/assets/svg/arrow-down.svg'
import { useCustomersStore } from '~/stores/customers'
import { useSuggestionsStore } from '~/stores/suggestions'

const props = defineProps({
  suggestion: {
    required: true,
    type: Object
  },
  position: {
    type: String,
    default: 'relative'
  },
  isInsideModal: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['closeModal', 'modal'])

const { t } = useI18n()
const config = useRuntimeConfig()
const customersStore = useCustomersStore()
const suggestionsStore = useSuggestionsStore()

const showStackModal = ref(false)

const hasOnlyOneActivity = computed(() => props.suggestion.activities.count() === 1)
const isStacked = computed(() => !hasOnlyOneActivity.value)
const firstActivity = computed(() => props.suggestion.activities.first())
const title = computed(() => props.suggestion.ticketTitle || firstActivity.value.events.first().title)
const customer = computed(() => customersStore.getById(props.suggestion.customerId))
const timeStart = computed(() => firstActivity.value.startedAt.format('HH:mm'))
const timeEnd = computed(() => firstActivity.value.endedAt.format('HH:mm'))
const duration = computed(() => {
  const dur = moment.duration()
  props.suggestion.activities.each((activity) => {
    dur.add(moment.duration(activity.endedAt.diff(activity.startedAt)))
  })
  if (dur.asHours() >= 1) {
    return Math.round(dur.asHours() * 10) / 10 + 'h'
  } else {
    return Math.round(dur.asMinutes()) + 'm'
  }
})

function iconLink (activity) {
  return (config.app.baseURL || '/') + 'icon-' + activity.sourceId + '.svg'
}

function caretClicked () {
  if (props.isInsideModal) {
    emit('closeModal', true)
  } else {
    showStackModal.value = true
  }
}

function deleteSuggestion () {
  if (confirm(t('deleteSuggestionConfirm'))) {
    suggestionsStore.deleteSuggestion({ suggestionId: props.suggestion.id })
  }
}
</script>

<style>
.bar-gradient {
  background: linear-gradient(270deg, #FFFFFF -10.18%, rgba(255, 255, 255, 0) 93.36%), #F0F5F9;
}

.tagged {
  color: #8E44AD;
}

.tagged > span {
  background-color: #8E44AD;
  color: white;
  display: inline-block;
  border-radius: 10px;
  width: 19px;
  height: 19px;
  line-height: 18px;
  text-align: center;
}

.delete-suggestion {
  width: 27px;
  height: 27px;
  top: -5px;
  right: -5px;
  background: white;
  opacity: 0;
  transition: opacity 0.5s;
}

.activity-card:hover .delete-suggestion{
  opacity: 1;
}

.stack-tile {
  position: absolute;
  height: 24px;
  background: white;
  border-radius: 5px;
  box-shadow: 0 4px 4px 1px rgba(153, 168, 184, 0.3);
}

.stack-tile-front {
  bottom: -8px;
  left: 15px;
  right: 15px;
}

.stack-tile-back {
  bottom: -15px;
  left: 31px;
  right: 29px;
}
</style>
