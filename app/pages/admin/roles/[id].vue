<template>
  <AdminPage>
    <div class="flex justify-between items-center pb-4">
      <div class="flex items-center">
        <ArrowBack @click="router.push('/admin/roles/')" />
        <div class="text-2xl leading-8 font-bold pl-3">
          {{ role.name }}
        </div>
      </div>
      <div class="flex">
        <button
          v-if="usersStore.can('roles.delete')"
          v-tooltip="role.usersCount > 0 ? $t('admin.roles.deleteDisabled') : null"
          class="border border-input-border text-action-button py-2 px-10 rounded font-normal h-12 mr-4 disabled:opacity-50"
          :disabled="role.usersCount > 0"
          @click="deleteRole"
        >
          {{ $t('admin.roles.delete') }}
        </button>
        <button
          v-if="canUpdate"
          class="bg-action-button py-2 px-10 rounded text-white font-normal h-12"
          @click="save"
        >
          {{ $t('admin.roles.save') }}
        </button>
      </div>
    </div>

    <p v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-2 py-1 rounded mb-4">
      {{ error.response?.data?.message || error.message }}
    </p>

    <div class="bg-white box-shadow p-6">
      <div v-if="canUpdate" class="mb-6 w-1/3">
        <label for="name" class="text-sm leading-5 pb-2">{{ $t('admin.roles.name') }}</label>
        <input id="name" v-model="role.name" type="text" class="w-full border border-input-border rounded h-8 px-2">
      </div>
      <div class="text-xl leading-8 pb-4">
        {{ $t('admin.roles.permissions') }}
      </div>
      <div class="grid grid-cols-3 gap-6">
        <div v-for="(names, group) in permissionGroups" :key="group">
          <div class="font-medium pb-1">
            {{ group }}
          </div>
          <label v-for="name in names" :key="name" class="flex items-center text-sm leading-6">
            <input
              v-model="selectedPermissions"
              type="checkbox"
              :value="name"
              :disabled="!canUpdate"
              class="mr-2"
            >
            {{ name.slice(group.length + 1) || name }}
          </label>
        </div>
      </div>
    </div>
  </AdminPage>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import collect from 'collect.js'
import { useRoute, useRouter } from '#app'
import { useToast } from 'vue-toast-notification'
import { getTimaticApi } from '~/utils/timaticApi'
import { useUsersStore } from '~/stores/users'

useHead({ title: 'Role - Timatic' })

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const toast = useToast()
const usersStore = useUsersStore()

const role = ref({ name: '', usersCount: 0 })
const permissions = ref([])
const selectedPermissions = ref([])
const error = ref(null)

const canUpdate = computed(() => usersStore.can('roles.update'))
const permissionGroups = computed(() => collect(permissions.value)
  .sort()
  .groupBy(name => name.split('.')[0])
  .map(group => group.all())
  .all())

onMounted(async () => {
  const api = getTimaticApi()
  const [rolesResponse, permissionsResponse] = await Promise.all([
    api.$get('roles', { params: { include: 'permissions', page: { size: 1000 } } }),
    api.$get('permissions', { params: { page: { size: 1000 } } })
  ])

  const found = rolesResponse.data.find(item => item.id === route.params.id)
  role.value = { id: found.id, ...found.attributes }
  selectedPermissions.value = found.relationships.permissions.data.map(({ id }) => id)
  permissions.value = permissionsResponse.data.map(permission => permission.id)
})

async function save () {
  error.value = null
  try {
    await getTimaticApi().$patch('roles/' + role.value.id, {
      data: {
        type: 'roles',
        attributes: { name: role.value.name },
        relationships: {
          permissions: { data: selectedPermissions.value.map(id => ({ type: 'permissions', id })) }
        }
      }
    })
    toast.success(t('admin.roles.saved'))
  } catch (e) {
    error.value = e
  }
}

async function deleteRole () {
  if (!window.confirm(t('admin.roles.confirmDelete', { name: role.value.name }))) {
    return
  }
  error.value = null
  try {
    await getTimaticApi().$delete('roles/' + role.value.id)
    router.push('/admin/roles/')
  } catch (e) {
    error.value = e
  }
}
</script>

<style scoped>
.box-shadow {
  box-shadow: 0px 4px 6px rgba(153, 168, 184, 0.1);
}
</style>
