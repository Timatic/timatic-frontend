<template>
  <div class="border-b border-input-border bg-white">
    <div class="flex items-center justify-between px-8 leading-11 text-page-title page-margins page-width">
      <div class="mr-3 text-2xl leading-8 font-bold">
        <img src="/logo.svg" alt="Logo" class="h-8">
      </div>
      <div class="w-3/4 flex text-sm leading-6 text-filter-text items-center justify-start ml-2">
        <div
          class="mx-2 cursor-pointer"
          :class="{ 'active-menu' : currentRoute('/') }"
          @click="link('/')"
        >
          {{ $t('activity') }}
        </div>
        <div
          class="mx-2 cursor-pointer"
          :class="{ 'active-menu' : (currentRoute('/budgets/') || currentRoute(`/budgets/${route.params.id}/`)) }"
          @click="link('/budgets/')"
        >
          {{ $t('budgets') }}
        </div>
        <div
          class="mx-2 cursor-pointer"
          :class="{ 'active-menu' : (currentRoute('/overtime/') || currentRoute(`/overtime/${route.params.id}/`)) }"
          @click="link(overtimeLink)"
        >
          {{ $t('overtime') }}
        </div>
        <div
          class="mx-2 cursor-pointer"
          :class="{ 'active-menu' : currentRoute('/team-statistics/') }"
          @click="link('/team-statistics/')"
        >
          {{ $t('teamOverview') }}
        </div>
        <div
          class="mx-2 cursor-pointer"
          :class="{ 'active-menu' : (currentRoute('/customers/') || currentRoute(`/customers/${route.params.id}/`)) }"
          @click="link('/customers/')"
        >
          {{ $t('customers') }}
        </div>
        <div
          class="mx-2 cursor-pointer"
          :class="{ 'active-menu' : (currentRoute('/entries/') || currentRoute(`/entries/${route.params.id}/`)) }"
          @click="link('/entries/')"
        >
          {{ $t('entries') }}
        </div>
      </div>
      <div class="w-1/4 mb-3 flex justify-end items-center pt-1">
        <div class="flex items-center">
          <div class="flex justify-center text-label items-center bg-avatar w-12 h-12 rounded-full mr-3">
            <span>{{ initials(userFullName) }}</span>
          </div>
          <div class="">
            <p>{{ userFullName }}</p>
            <p class="text-sm text-label leading-5">
              {{ position }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from '#app'
import { initials } from '~/utils/filters'
import { useUsersStore } from '~/stores/users'

const router = useRouter()
const route = useRoute()
const usersStore = useUsersStore()

const position = ref('')

const userFullName = computed(() => {
  const user = usersStore.getCurrentUser
  if (user.id) {
    return user.givenName + ' ' + user.familyName
  }
  return ''
})

const overtimeLink = computed(() => {
  const url = '/overtime/'
  if (usersStore.canApproveOvertime) {
    return url
  } else {
    return url + usersStore.getCurrentUser.teamId + '/'
  }
})

function link (href) {
  router.push({ path: href })
}

function currentRoute (href) {
  return route.path === href
}
</script>
