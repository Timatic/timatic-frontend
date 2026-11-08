<template>
  <div class="font-body">
    <app-bar />
    <div class="bg-background">
      <div class="page-margins page-width min-h-screen flex text-page-title p-8">
        <nav class="w-48 shrink-0 pr-8">
          <div class="text-2xl leading-8 font-bold pb-4">
            {{ $t('admin.title') }}
          </div>
          <NuxtLink
            v-for="item in menu"
            :key="item.path"
            :to="item.path"
            class="block py-1 text-filter-text"
            active-class="font-bold text-page-title"
          >
            {{ $t(item.label) }}
          </NuxtLink>
        </nav>
        <div class="flex-1">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const menu = [
  { path: '/admin/users/', label: 'admin.users.title' },
  { path: '/admin/roles/', label: 'admin.roles.title' }
]
</script>
