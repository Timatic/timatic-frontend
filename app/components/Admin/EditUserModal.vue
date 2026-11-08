<template>
  <base-modal
    :title="$t('admin.users.edit', { name: user.email })"
    width="w-1/2"
    :api-error="error"
    @closeModal="$emit('closeModal')"
    @submitModal="submit"
  >
    <template #content>
      <div class="w-full mb-4">
        <label for="team" class="text-sm leading-5 pb-2">{{ $t('admin.users.team') }}</label>
        <select id="team" v-model="teamId" class="w-full border border-input-border rounded h-8 px-2 mb-4">
          <option :value="null">
            {{ $t('none') }}
          </option>
          <option v-for="team in teams" :key="team.id" :value="team.id">
            {{ team.name }}
          </option>
        </select>
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
  roles: { type: Array, required: true },
  teams: { type: Array, required: true }
})

const emit = defineEmits(['closeModal', 'saved'])

const teamId = ref(props.user.teamId)
const selectedRoles = ref([...props.user.roles])
const error = ref(null)

async function submit () {
  error.value = null
  try {
    await getTimaticApi().$patch('users/' + props.user.id, {
      data: {
        type: 'users',
        relationships: {
          team: { data: teamId.value ? { type: 'teams', id: teamId.value } : null },
          roles: { data: selectedRoles.value.map(role => ({ type: 'roles', id: role.id })) }
        }
      }
    })
    emit('saved', { ...props.user, teamId: teamId.value, roles: selectedRoles.value })
  } catch (e) {
    error.value = e
  }
}
</script>
