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
      <div class="leading-5 mb-1 text-page-title text-lg font-medium">
        <p v-for="(event, key) in activity.events" :key="key">
          {{ event.title }}
        </p>
      </div>
      <div class="flex my-1">
        <div class="flex-grow leading-5 mt-1">
          {{ $t('eventNames.' + activity.eventTypeId) }}
        </div>
        <div v-if="activity.eventTypeId === 'ticket_tagged'" class="flex-grow text-right tagged">
          <span class="circle">@</span> tagged
        </div>
      </div>
    </div>
    <div class="w-8 flex flex-col justify-between m-4 relative gap-2">
      <img :src="iconLink" :alt="activity.sourceId" style="height:20px">
    </div>
  </div>
</template>

<script setup>
import moment from 'moment'
import { computed } from 'vue'
import { useRuntimeConfig } from '#app'

const props = defineProps({
  activity: {
    required: true,
    type: Object
  }
})

const config = useRuntimeConfig()

const timeStart = computed(() => props.activity.startedAt.format('HH:mm'))
const timeEnd = computed(() => props.activity.endedAt.format('HH:mm'))
const duration = computed(() => {
  const dur = moment.duration(props.activity.endedAt.diff(props.activity.startedAt))
  if (dur.asHours() >= 1) {
    return Math.round(dur.asHours() * 10) / 10 + 'h'
  } else {
    return Math.ceil(dur.asMinutes()) + 'm'
  }
})
const iconLink = computed(() => (config.app.baseURL || '/') + 'icon-' + props.activity.sourceId + '.svg')
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
