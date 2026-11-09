<template>
  <AdminPage>
    <div class="flex justify-between items-center pb-4">
      <div class="text-2xl leading-8 font-bold">
        {{ $t('admin.roles.title') }}
      </div>
      <button
        v-if="usersStore.can('roles.create')"
        class="bg-action-button py-2 px-10 rounded text-white font-normal h-12"
        @click="showCreateModal = true"
      >
        {{ $t('admin.roles.create') }}
      </button>
    </div>
    <vue-good-table
      :columns="columns"
      :rows="roles"
      :sort-options="{ enabled: true, initialSortBy: { field: 'name', type: 'asc' } }"
      @row-click="({ row }) => router.push('/admin/roles/' + row.id + '/')"
    />

    <base-modal
      v-if="showCreateModal"
      :title="$t('admin.roles.create')"
      width="w-1/2"
      :api-error="error"
      @closeModal="showCreateModal = false"
      @submitModal="createRole"
    >
      <template #content>
        <div class="w-full mb-4">
          <VeeField v-slot="{ errors }" name="name" rules="required" :model-value="newRoleName">
            <label for="name" class="text-sm leading-5 pb-2">{{ $t('admin.roles.name') }} *</label>
            <input
              id="name"
              v-model="newRoleName"
              type="text"
              class="w-full border border-input-border rounded h-8 px-2"
              :class="errors.length > 0 ? 'invalid' : ''"
            >
          </VeeField>
        </div>
      </template>
    </base-modal>
  </AdminPage>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from '#app'
import { getTimaticApi } from '~/utils/timaticApi'
import { useUsersStore } from '~/stores/users'

useHead({ title: 'Roles - Timatic' })

const { t } = useI18n()
const router = useRouter()
const usersStore = useUsersStore()

const roles = ref([])
const showCreateModal = ref(false)
const newRoleName = ref('')
const error = ref(null)

const columns = [
  { label: t('admin.roles.name'), field: 'name' },
  { label: t('admin.roles.usersCount'), field: 'usersCount', type: 'number' }
]

onMounted(async () => {
  const response = await getTimaticApi().$get('roles', { params: { page: { size: 1000 } } })
  roles.value = response.data.map(role => ({ id: role.id, ...role.attributes }))
})

async function createRole () {
  error.value = null
  try {
    const response = await getTimaticApi().$post('roles', {
      data: { type: 'roles', attributes: { name: newRoleName.value } }
    })
    router.push('/admin/roles/' + response.data.id + '/')
  } catch (e) {
    error.value = e
  }
}
</script>
