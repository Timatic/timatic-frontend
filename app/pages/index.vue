<template>
  <div ref="rootEl" class="font-body">
    <app-bar />
    <div class="bg-background">
      <div class="min-h-screen flex px-8 pt-8 text-page-title page-margins page-width h-activity-body overflow-hidden">
        <div class="w-col-sm pt-4">
          <div class="flex justify-start">
            <h3 class="text-2xl leading-6 pb-2 font-bold">
              {{ $t('suggestedActivities') }}
            </h3>
          </div>
          <div class="flex items-center justify-between mr-4">
            <p class="text-label mr-5">
              {{ activeIntegrationCount ? $t('trackingSources', { active: activeIntegrationCount, total: integrations.length }) : $t('noActiveSources') }}
            </p>
            <button
              class="border border-input-border py-2 px-5 rounded font-normal h-12 text-action-button whitespace-nowrap"
              @click="showModal.integrations = true"
            >
              {{ $t('manageSources') }}
            </button>
          </div>
          <div class="overflow-auto h-90 pr-4 pt-2">
            <transition-group name="suggestions" tag="div">
              <div v-for="suggestion in visibleSuggestions" :key="suggestion.id" class="suggestions-item">
                <suggestion-card :suggestion="suggestion" @modal="showSuggestionModal" />
              </div>
              <div v-if="visibleSuggestions.count() === 0" key="empty" class="mt-4">
                <p>{{ $t('noFurtherSuggestions') }}</p>
              </div>
            </transition-group>
          </div>
        </div>
        <div class="w-col-lg pl-8 z-0">
          <div class="flex pl-65 justify-between items-center mb-4">
            <div class="w-1/3">
              <h3 class="text-2xl leading-7 font-body font-bold text-page-title">
                {{ $t('timesheets') }}
              </h3>
              <p class="text-page-title text-sm text-label leading-4">
                {{ longDisplayDate }}
              </p>
            </div>
            <div class="w-2/3 px-2">
              <date-picker ref="datepicker" v-model="displayDate" />
            </div>
          </div>
          <div class="flex pl-65">
            <div class="w-2/3">
              <progressbar :entries="entriesForDisplayDate" />
            </div>
            <div class="w-1/3 pl-4">
              <button
                class="px-10 pt-3 rounded w-full flex justify-center text-center text-white font-medium h-12"
                :class="{'cursor-not-allowed bg-divider-gray': displayDateIsLocked, 'bg-action-button': !displayDateIsLocked}"
                @click="calendarEvent=null; showModal.create=!displayDateIsLocked"
              >
                {{ $t('addActivity') }}
                <PlusIcon class="plus w-6 h-6" />
              </button>
            </div>
          </div>
          <div class="pt-4 h-81">
            <div id="calendar-container" class="h-full">
              <vue-cal
                :key="reload"
                active-view="day"
                :disable-views="['years', 'year', 'month', 'week']"
                hide-view-selector
                hide-title-bar
                :selected-date="displayDate.format('YYYY-MM-DD')"
                :events="calendarEvents"
                :editable-events="{ title: false, drag: false, resize: false, delete: false, create: !displayDateIsLocked }"
                :drag-to-create-threshold="15"
                :snap-to-time="15"
                :on-event-create="onCalendarEventCreate"
                :on-event-click="showUpdateEntryModal"
                :time-step="30"
                :time-cell-height="50"
                @event-drag-create="openEventCreateModalFromCalendar"
                @event-duration-change="onEventDurationChange"
                @event-drop="onEventMoved"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    <create-modal
      v-if="showModal.create"
      ref="createEntryModal"
      :date="displayDate"
      :start="calendarEvent ? calendarEvent.start : null"
      :end="calendarEvent ? calendarEvent.end : null"
      @entrySaved="onEntrySaved($event);"
      @closeModal="showModal.create=false"
    />
    <suggestion-entry-modal
      v-if="showModal.suggestion"
      :suggestion="selectedSuggestion"
      @entrySaved="onEntrySaved($event)"
      @closeModal="showModal.suggestion=false"
    />
    <update-entry-modal
      v-if="showModal.update"
      :entry="selectedEntry"
      @closeModal="showModal.update=false"
    />
    <integrations-modal
      v-if="showModal.integrations"
      :integrations="integrations"
      @closeModal="showModal.integrations=false"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import moment from 'moment'
import { useRoute, useRouter } from 'vue-router'
import { useCustomersStore } from '~/stores/customers'
import { useSuggestionsStore } from '~/stores/suggestions'
import { useEntriesStore } from '~/stores/entries'
import { useUsersStore } from '~/stores/users'
import { getTimaticApi } from '~/utils/timaticApi'
import PlusIcon from '~/assets/svg/plus.svg'

useHead({ title: 'Activity - Timatic' })

const route = useRoute()
const router = useRouter()

const customersStore = useCustomersStore()
const suggestionsStore = useSuggestionsStore()
const entriesStore = useEntriesStore()
const usersStore = useUsersStore()

const rootEl = ref(null)
const datepicker = ref(null)
const showModal = ref({ create: false, suggestion: false, update: false, integrations: false })
const reload = ref(0)
const selectedEntry = ref(null)
const selectedSuggestion = ref(null)
const calendarEventDeleteFunction = ref(null)
const calendarEvent = ref(null)
const integrations = ref([])

const displayDate = ref(moment().startOf('day'))

// Initialise from query param (replaces created())
if (route.query.date) {
  displayDate.value = moment(route.query.date)
}

const longDisplayDate = computed(() => displayDate.value.format('dddd D MMMM'))
const shortDisplayDate = computed(() => displayDate.value.format('YYYY-MM-DD'))

const entriesForDisplayDate = computed(() => {
  const startedAt = displayDate.value.clone().endOf('day')
  const endedAt = displayDate.value.clone().startOf('day')

  return entriesStore.collection.filter((entry) => {
    return entry.startedAt.isBefore(startedAt) && entry.endedAt.isAfter(endedAt)
  }).map((entry) => {
    entry.duration = entry.endedAt.diff(entry.startedAt, 'minutes')
    return entry
  })
})

const calendarEvents = computed(() => {
  return entriesForDisplayDate.value.map((entry) => {
    let customer = customersStore.collection.first(customer => customer.id === entry.customerId)
    if (!customer) { customer = { name: 'loading...', color: 'grey' } }

    return {
      start: entry.startedAt.format('YYYY-MM-DD HH:mm'),
      end: entry.endedAt.format('YYYY-MM-DD HH:mm'),
      content: customer.name + ' - ' + entry.description,
      class: 'bg-' + customer.color,
      id: entry.id
    }
  }).all()
})

const visibleSuggestions = computed(() => suggestionsStore.collection
  .where('date', shortDisplayDate.value)
  .sortBy(suggestion => suggestion.activities.first().startedAt)
)

const activeIntegrationCount = computed(() => integrations.value.filter(integration => integration.isActive).length)

const displayDateIsLocked = computed(() =>
  displayDate.value.isBefore(moment(usersStore.entryLockDate))
)

watch(() => usersStore.getCurrentUser, () => loadEntriesAndSuggestions())

watch(displayDate, (newValue) => {
  loadEntriesAndSuggestions()
  router.replace({ path: '/', query: { date: newValue.format('YYYY-MM-DD') } })
})

onMounted(() => {
  loadEntriesAndSuggestions()

  getTimaticApi().$get('suggestion-integrations').then((response) => {
    integrations.value = response.data.map(integration => ({ id: integration.id, ...integration.attributes }))
  }).catch((err) => {
    console.error('Error loading integrations:', err)
  })

  nextTick(() => {
    const selector = '#calendar-container .vuecal__body > div > div'
    rootEl.value.querySelector(selector).scrollTop = 8 * 2 * 50
  })
})

function onCalendarEventCreate (event, deleteFunction) {
  calendarEventDeleteFunction.value = deleteFunction
  calendarEvent.value = event
  return event
}

function openEventCreateModalFromCalendar () {
  showModal.value.create = true
  calendarEventDeleteFunction.value()
}

function onEventDurationChange (event) {
  entriesStore.updateStartEnd(event.event)
}

function onEventMoved (event) {
  entriesStore.updateStartEnd(event.event)
}

function showSuggestionModal (activity) {
  if (displayDateIsLocked.value) return
  selectedSuggestion.value = (activity instanceof Event ? null : activity)
  showModal.value.suggestion = true
}

function showUpdateEntryModal (event) {
  selectedEntry.value = entriesForDisplayDate.value.firstWhere('id', event.id)
  showModal.value.update = true
}

function loadEntriesAndSuggestions () {
  if (usersStore.getCurrentUser.id) {
    const date = displayDate.value.clone().format('YYYY-MM-DD')
    entriesStore.fetch({ date: displayDate.value })
    suggestionsStore.fetch({ date: { gte: date, lte: date } })
  }
}

function onEntrySaved (entry) {
  const [hour, minutes] = entry.timeStart.split(':')
  const nthChild = hour * 2 + (minutes > 30 ? 1 : 0)
  rootEl.value.querySelector(`.vuecal__time-cell:nth-child(${nthChild || 1})`)
    .scrollIntoView({ behavior: 'smooth', block: 'center' })

  datepicker.value.loadProgressAndSuggestions()
}
</script>

<style scoped>
.tooltip:focus {
  outline: none;
}

:deep(.vuecal__event--static) {
  opacity: 0.4;
}
:deep(.vuecal__event-content) {
  color: white;
  text-align: left;
  padding: 5px 0 0 10px;
}

:deep(.vuecal) {
  box-shadow: none;
}

:deep(.vuecal__cells.day-view) {
  background-color: white;
}

:deep(.vuecal__time-column .vuecal__time-cell-line:before) {
  left: 65px;
}
.pl-65 {
  padding-left:65px;
}

:deep(.vuecal__time-column .vuecal__time-cell) {
  text-align: left;
}

:deep(.vuecal__time-column) {
  width: 65px;
}

/* Animated suggestion list */
.suggestions-item {
  transition: all 1s;
  display: block;
}
.suggestions-enter-from, .suggestions-leave-to
{
  opacity: 0;
  transform: translateY(30px);
}
.suggestions-leave-active {
  position: absolute;
}

code {
  white-space: nowrap;
  background-color: rgba(255,255,255,0.15);
  padding: 2px 4px;
}
</style>
