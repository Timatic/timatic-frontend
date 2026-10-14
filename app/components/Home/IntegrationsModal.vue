<template>
  <base-modal :title="$t('integrations')" width="w-11/12" :show-footer="false" @closeModal="$emit('closeModal')">
    <template #content>
      <div class="w-full">
        <div v-for="integration in integrations" :key="integration.id" class="border-b border-input-border last:border-b-0">
          <div class="flex items-center justify-between py-3 cursor-pointer" @click="toggle(integration.id)">
            <div class="flex items-center">
              <arrow-down class="mr-3" :class="{'rotate-180': expandedId === integration.id}" />
              <img :src="integration.iconUrl" :alt="integration.label" class="mr-2" style="height:20px">
              <span class="font-medium">{{ integration.label }}</span>
            </div>
            <div class="flex items-center">
              <a
                v-if="!integration.isActive && integration.connectUrl"
                :href="integration.connectUrl"
                class="text-action-button text-sm mr-4"
                @click.stop
              >
                {{ $t('connect') }}
              </a>
              <span v-if="integration.isCompanyManaged" class="text-xs text-label mr-2">{{ $t('managedByCompany') }}</span>
              <span
                class="border rounded text-xs uppercase px-1.5 py-0.5"
                :class="integration.isActive ? 'border-green-500 text-green-600' : 'border-input-border text-label'"
              >
                {{ integration.isActive ? $t('active') : $t('inactive') }}
              </span>
            </div>
          </div>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div v-if="expandedId === integration.id" class="integration-instructions pb-4 pl-8" v-html="integration.instructions" />
        </div>
      </div>
    </template>
  </base-modal>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import BaseModal from '../BaseModal.vue'
import ArrowDown from '~/assets/svg/arrow-down.svg'
import { getTimaticApi } from '~/utils/timaticApi'

defineEmits(['closeModal'])

const integrations = ref([])
const expandedId = ref(null)

onMounted(() => {
  getTimaticApi().$get('suggestion-integrations').then((response) => {
    integrations.value = response.data.map(integration => ({ id: integration.id, ...integration.attributes }))
  }).catch((err) => {
    console.error('Error loading integrations:', err)
  })
})

function toggle (id) {
  expandedId.value = expandedId.value === id ? null : id
}
</script>

<style scoped>
.integration-instructions :deep(p) {
  margin-bottom: 0.5rem;
}
</style>
