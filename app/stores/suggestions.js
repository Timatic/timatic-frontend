import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import collect from 'collect.js'
import moment from 'moment'
import { getTimaticApi } from '~/utils/timaticApi'

export const useSuggestionsStore = defineStore('suggestions', () => {
  const suggestions = ref(collect())

  const collection = computed(() => suggestions.value)

  async function fetch (params) {
    const api = getTimaticApi()
    const response = await api.$get('entry-suggestions', {
      params: {
        page: { size: 1000 },
        filter: params,
        include: 'activities.events.source'
      }
    })

    const rawActivities = collect(response.included).where('type', 'activities')
    const rawEvents = collect(response.included).where('type', 'events')
    const activities = getTransformedActivities(rawActivities, rawEvents)

    let newSuggestions = collect(response.data).transform((suggestion) => {
      const activityIds = collect(suggestion.relationships.activities.data).pluck('id')
      return {
        id: suggestion.id,
        ...suggestion.attributes,
        date: suggestion.attributes.date,
        activities: activities.whereIn('id', activityIds.all())
      }
    })

    if (newSuggestions.count()) {
      const ids = suggestions.value.pluck('id')
      newSuggestions = newSuggestions.reject(suggestion => ids.contains(suggestion.id))
    }

    suggestions.value = suggestions.value.merge(newSuggestions.all())
  }

  async function deleteSuggestion (params) {
    suggestions.value = suggestions.value.reject(suggestion => suggestion.id === params.suggestionId)
    const api = getTimaticApi()
    await api.$delete('entry-suggestions/' + params.suggestionId)
  }

  return { suggestions, collection, fetch, deleteSuggestion }
})

function getTransformedActivities (rawActivities, rawEvents) {
  return rawActivities.transform((activity) => {
    const eventIds = collect(activity.relationships.events.data).pluck('id')
    const events = rawEvents.whereIn('id', eventIds.all()).transform((event) => ({ ...event.attributes }))

    return {
      id: activity.id,
      ...activity.attributes,
      startedAt: moment(activity.attributes.startedAt),
      endedAt: moment(activity.attributes.endedAt),
      events
    }
  })
}
