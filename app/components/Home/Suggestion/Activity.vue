<template>
  <div class="flex bg-white border-t-2">
    <div
      class="font-light flex flex-col justify-center items-center m-4 text-filter-text text-sm"
    >
      <div>
        {{ timeStart }}
      </div>
      <div class="text-dark-gray">
        |
      </div>
      <div>
        {{ timeEnd }}
      </div>
      <template v-if="duration">
        <div class="w-1/2 py-1 text-xs">
          <hr>
        </div>
        <div>
          {{ duration }}
        </div>
      </template>
    </div>
    <div class="flex-1 my-4 relative">
      <p class="leading-5 mb-1 text-page-title text-lg font-medium" style="word-break: break-word">
        {{ activity.title }}
      </p>
      <div v-if="eventTitles.length" class="text-filter-text text-sm leading-5" style="word-break: break-word">
        <p v-for="eventTitle in eventTitles.slice(0, 3)" :key="eventTitle">
          {{ eventTitle }}
        </p>
        <p v-if="eventTitles.length > 3">
          {{ $t('moreCount', { count: eventTitles.length - 3 }) }}
        </p>
      </div>
      <div class="flex my-1">
        <div class="flex-grow leading-5 mt-1">
          {{ activity.eventTypeName }}
        </div>
        <div v-if="activity.eventTypeId === 'ticket_tagged'" class="flex-grow text-right tagged">
          <span class="circle">@</span> tagged
        </div>
      </div>
    </div>
    <div class="w-8 flex flex-col items-center m-4 relative">
      <img
        v-for="(source, index) in sources"
        :key="source.sourceId"
        :src="source.iconUrl"
        :alt="source.sourceId"
        style="height:20px"
        :class="{'-mt-1': index > 0}"
      >
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  activity: {
    required: true,
    type: Object
  }
})

const timeStart = computed(() => props.activity.startedAt.format('HH:mm'))
const timeEnd = computed(() => props.activity.endedAt.format('HH:mm'))
const sources = computed(() => [props.activity, ...props.activity.events.all()].filter((source, index, all) => all.findIndex(other => other.sourceId === source.sourceId) === index))
const eventTitles = computed(() => props.activity.events.pluck('title').unique().reject(title => title === props.activity.title).all())
const duration = computed(() => durationLabel(Math.round(props.activity.endedAt.diff(props.activity.startedAt, 'minutes', true))))
</script>

<style scoped>
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
</style>
