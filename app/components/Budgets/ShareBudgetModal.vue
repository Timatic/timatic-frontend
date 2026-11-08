<template>
  <base-modal
    :title="$t('shareLink.title')"
    width="w-1/3"
    :api-error="apiError"
    :cancel-label="url ? $t('shareLink.close') : null"
    @closeModal="closeModal"
    @submitModal="createLink"
  >
    <template #content>
      <div v-if="url" class="w-full">
        <p class="pb-3">
          {{ $t('shareLink.copyNow') }}
        </p>
        <div class="flex">
          <input :value="url" readonly class="flex-1 border border-input-border rounded px-2 mr-2">
          <button class="border border-input-border py-2 px-5 rounded text-action-button" @click.prevent="copyLink">
            {{ $t('shareLink.copy') }}
          </button>
        </div>
      </div>
      <p v-else-if="!budget.showToCustomer">
        {{ $t('shareLink.hiddenFromCustomer') }}
      </p>
      <p v-else>
        {{ budget.isShared ? $t('shareLink.regenerateWarning') : $t('shareLink.explanation') }}
      </p>
    </template>
    <template #footer-left>
      <button v-if="budget.isShared && !url" type="button" @click="revokeLink">
        {{ $t('shareLink.revoke') }}
      </button>
    </template>
    <template #submit-button>
      <button
        v-if="!url"
        class="bg-action-button py-2 px-10 rounded text-white font-normal h-12"
        :class="{ 'opacity-50 cursor-default': !budget.showToCustomer }"
        :disabled="!budget.showToCustomer"
        type="submit"
      >
        {{ budget.isShared ? $t('shareLink.regenerate') : $t('shareLink.generate') }}
      </button>
    </template>
  </base-modal>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toast-notification'
import BaseModal from '../BaseModal.vue'
import { useBudgetsStore } from '~/stores/budgets'

const props = defineProps({
  budget: {
    required: true,
    type: Object
  }
})

const emit = defineEmits(['closeModal'])

const { t } = useI18n()
const toast = useToast()
const budgetsStore = useBudgetsStore()

const url = ref(null)
const apiError = ref(null)

function closeModal () {
  emit('closeModal', true)
}

function createLink () {
  // Enter in the url field submits the form again and would replace the link just copied.
  if (url.value || !props.budget.showToCustomer) {
    return
  }

  budgetsStore.createShareLink(props.budget.id)
    .then((shareUrl) => {
      apiError.value = null
      url.value = shareUrl
    })
    .catch((error) => { apiError.value = error })
}

function copyLink () {
  navigator.clipboard.writeText(url.value)
    .then(() => toast.success(t('shareLink.copied')))
    .catch(() => toast.error(t('shareLink.copyFailed')))
}

function revokeLink () {
  if (!confirm(t('shareLink.revokeConfirm'))) {
    return
  }

  budgetsStore.revokeShareLink(props.budget.id)
    .then(() => {
      apiError.value = null
      toast.success(t('shareLink.revoked'))
      closeModal()
    })
    .catch((error) => { apiError.value = error })
}
</script>
