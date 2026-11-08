<template>
  <base-modal
    :title="$t('admin.users.editRoles', { name: user.email })"
    width="w-1/2"
    :api-error="error"
    @closeModal="$emit('closeModal')"
    @submitModal="submit"
  >
    <template #content>
      <div class="w-full mb-4">
        <label for="roles" class="text-sm leading-5 pb-2">{{ $t('admin.users.roles') }}</label>
        <vue-select
          id="roles"
          v-model="selectedRoles"
          :options="roles"
          label="name"
          multiple
        />
      </div>
    </template>
  </base-modal>
</template>

<script setup>
import { ref } from 'vue'
import VueSelect from 'vue-select'
import { getTimaticApi } from '~/utils/timaticApi'

const props = defineProps({
  user: { type: Object, required: true },
  roles: { type: Array, required: true }
})

const emit = defineEmits(['closeModal', 'saved'])

const selectedRoles = ref([...props.user.roles])
const error = ref(null)

async function submit () {
  error.value = null
  try {
    await getTimaticApi().$patch('users/' + props.user.id, {
      data: {
        type: 'users',
        relationships: {
          roles: { data: selectedRoles.value.map(role => ({ type: 'roles', id: role.id })) }
        }
      }
    })
    emit('saved', { ...props.user, roles: selectedRoles.value })
  } catch (e) {
    error.value = e
  }
}
</script>
