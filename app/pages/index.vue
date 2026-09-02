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
            <VMenu
              :distance="16"
              popper-class="suggestions-popover"
            >
              <div class="tooltip-target b3 ml-3 text-filter-text cursor-pointer">
                <InfoIcon />
              </div>
              <template #popper>
                <div
                  class="relative general-popover-wrapper bg-tooltip text-white z-50 rounded general-tooltip-arrow"
                >
                  <div class="popover-header border-b border-tooltip-border">
                    <div class="py-2 px-4 flex justify-between">
                      <p class="font-medium text-lg">
                        {{ $t('suggestedActivities') }}
                      </p>
                      <div v-close-popper class="cursor-pointer">
                        <CloseIcon class="x w-6 h-6" />
                      </div>
                    </div>
                  </div>
                  <div class="popover-content pb-2 px-4">
                    <p class="py-2">
                      When you save an incident in TOPdesk with a memo or with time spent, it will show up as a suggestion.<br>
                      <br>
                      If you had help with a TOPdesk incident, you can create a suggestion for your colleague.
                      You need to mention him/her and add a tag <code>#time</code>.
                      Both you and the tagged persons will get a suggestion.
                      For example submit <code>#time @ludob @martijnb</code> in a private memo.<br>
                      <br>
                      The items in your Outlook Calendar are also shown as suggestions.<br>
                      These suggestions can be improved in four ways by adding data to the calendar event.<br>
                    </p>
                    <ul class="list-disc pl-4">
                      <li>Add the ticket number to the title, body or location.</li>
                      <li>Add a customer tag in the body<br>e.g. <code>#customer-50340</code> for that customer.</li>
                      <li>Add a budget tag or intern tag in the body<br>e.g. <code>#budget-123</code> or <code>#intern</code>.</li>
                      <li>Add a hashtag <code>#ignore</code> to the body to make sure it won't generate a suggestion.</li>
                    </ul>
                  </div>
                </div>
              </template>
            </VMenu>
          </div>
          <div>
            <p class="text-label mr-5">
              {{ $t('suggestionsExplainer') }}
            </p>
            <div class="flex items-center mr-4">
              <div class="input-wrapper mr-2">
                <input
                  id="closed"
                  v-model="showHiddenSuggestions"
                  class="checkbox"
                  type="checkbox"
                  name="closed"
                  @click="showHiddenSuggestions = !showHiddenSuggestions"
                >
                <span class="checkmark" />
              </div>
              <label for="closed">{{ $t('showHiddenSuggestions', {count: hiddenSuggestions.count() }) }}</label>
              <InfoIcon
                v-tooltip="{
                  content: $t('hiddenSuggestionsExplainer'),
                  trigger: 'hover'
                }"
                class="inline-block text-filter-text ml-3"
              />
            </div>
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
import InfoIcon from '~/assets/svg/info.svg'
import CloseIcon from '~/assets/svg/close.svg'
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
const showModal = ref({ create: false, suggestion: false, update: false })
const showHiddenSuggestions = ref(false)
const reload = ref(0)
const selectedEntry = ref(null)
const selectedSuggestion = ref(null)
const calendarEventDeleteFunction = ref(null)
const calendarEvent = ref(null)

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

const suggestions = computed(() => suggestionsStore.collection.where('date', shortDisplayDate.value))

const hiddenSuggestions = computed(() => {
  const ticketIds = entriesForDisplayDate.value.where('isBasedOnSuggestion', false).pluck('ticketId').all()
  return suggestions.value.filter((suggestion) => {
    return suggestion.ticketId !== null && ticketIds.includes(suggestion.ticketId)
  })
})

const visibleSuggestions = computed(() => {
  if (showHiddenSuggestions.value) return suggestions.value
  const ids = hiddenSuggestions.value.pluck('id')
  return suggestions.value
    .reject(suggestion => ids.contains(suggestion.id))
    .sortBy(suggestion => suggestion.activities.first().startedAt)
})

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

<style>
.suggestions-popover .v-popper__inner {
  width: 365px;
}
</style>
<style scoped>
.tooltip:focus {
  outline: none;
}

.general-tooltip-arrow::after {
  content: "";
  height: 50px;
  width: 50px;
  position: absolute;
  top: 30px;
  left: -20px;
  transform: rotate(45deg);
  border-radius: 4px;
  background-color: #253749;
  z-index: -1;
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
