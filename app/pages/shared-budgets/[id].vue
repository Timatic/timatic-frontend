<template>
  <budget-detail is-public />
</template>

<script setup>
import { setShareToken } from '~/utils/timaticApi'

definePageMeta({ public: true })
useHead({ meta: [{ name: 'robots', content: 'noindex' }] })

// The token travels in the fragment, so it never reaches a server log.
setShareToken(useRoute().hash.slice(1))
onBeforeUnmount(() => setShareToken(null))
</script>
