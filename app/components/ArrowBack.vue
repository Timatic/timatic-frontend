<template>
  <div
    class="w-10 h-10 border border-input-border rounded-full text-center
        text-icon-text font-bold hover:bg-input-border cursor-pointer relative"
    @click="$emit('click')"
  >
    <div class="absolute back-arrow">
      <ArrowLeftSmall class="chevron-left w-6 h-6" />
    </div>
  </div>
</template>

<script setup>
import ArrowLeftSmall from '~/assets/svg/arrow-left-small.svg'

defineEmits(['click'])
</script>

<style scoped>
.back-arrow {
  transform: translate(6px, 7px);
}
</style>
