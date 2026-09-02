<template>
  <VeeForm ref="observer" tag="form" @submit="submit">
    <div class="modal fixed w-full h-full top-0 left-0 flex items-center justify-center z-40">
      <div
        class="modal-close absolute top-0 right-0 cursor-pointer flex flex-col items-center mt-4 mr-4 text-white text-sm z-50"
        @click="$emit('closeModal', true)"
      >
        <CloseIcon />
        <span class="text-sm">(Esc)</span>
      </div>

      <div class="modal-overlay absolute w-full h-full bg-gray-900 opacity-50" />
      <div class="modal-container bg-white md:max-w-3xl rounded shadow-lg z-40" :class="width">
        <div class="modal-header py-4 px-6 text-left border-b border-input-border">
          <div class="flex justify-between items-center">
            <p class="font-roboto text-xl leading-8 font-medium">
              {{ title }}
            </p>
            <div class="modal-close cursor-pointer z-50" @click="$emit('closeModal', true)">
              <CloseIcon />
            </div>
          </div>
        </div>
        <div class="modal-content bg-white py-4 px-6 text-page-title">
          <div class=" flex justify-between">
            <slot name="content" />
          </div>
          <div v-show="errors.length > 0" class="api-errors py-3">
            <p v-for="(error,key) in errors" :key="key" class="bg-red-100 border border-red-400 text-red-700 px-2 py-1 rounded">
              {{ error }}
            </p>
          </div>
        </div>
        <div v-if="showFooter" class="modal-footer bg-background rounded-b">
          <div
            class="flex p-6 items-center"
            :class="{'justify-between':hasFooterButtonsLeftSlot, 'justify-end':!hasFooterButtonsLeftSlot}"
          >
            <div v-if="hasFooterButtonsLeftSlot" class="w-1/4 text-action-button leading-4">
              <slot name="footer-left" />
            </div>
            <div class="flex justify-end" :class="{'w-1/2':hasFooterButtonsLeftSlot}">
              <button
                class="border border-input-border text-action-button py-2 px-10 rounded font-normal h-12 mr-4"
                @click.prevent="$emit('closeModal')"
              >
                {{ $t('cancel') }}
              </button>
              <slot name="submit-button">
                <button class="bg-action-button py-2 px-10 rounded text-white font-normal h-12" type="submit">
                  {{ $t('submit') }}
                </button>
              </slot>
            </div>
          </div>
        </div>
      </div>
      <slot name="side-modal" />
    </div>
  </VeeForm>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useSlots } from 'vue'
import CloseIcon from '~/assets/svg/close.svg'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  width: {
    type: String,
    required: true
  },
  showFooter: {
    type: Boolean,
    required: false,
    default: true
  },
  apiError: {
    type: Error,
    required: false,
    default: null
  }
})

const emit = defineEmits(['closeModal', 'submitModal'])

const slots = useSlots()
const observer = ref(null)
const errors = ref([])

const hasFooterButtonsLeftSlot = computed(() => !!slots['footer-left'])

watch(() => props.apiError, (apiError) => {
  errors.value = []

  if (!apiError.response) {
    errors.value = [apiError.request?.status ?? 'Unknown error']
    return
  }

  if (!apiError.response.data.errors) {
    if (apiError.response.status === 403) {
      errors.value = ['You don\'t have the required permissions for this action']
    } else {
      errors.value = [apiError.response.status + ' API error']
    }
    return
  }

  const apiErrors = apiError.response.data.errors
  for (const err of apiErrors) {
    const error = err.source.pointer.replace('/data/attributes/', '') + ': ' +
      err.detail.replace('validation.', '')
    errors.value.push(error)
  }
})

onMounted(() => {
  window.addEventListener('keyup', (e) => {
    if (e.code === 'Escape') {
      emit('closeModal', true)
    }
  })
})

async function submit () {
  const result = await observer.value.validate()
  if (result.valid) {
    emit('submitModal')
  }
}
</script>
