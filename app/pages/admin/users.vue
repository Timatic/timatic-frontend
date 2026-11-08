<template>
  <AdminPage>
    <div class="text-2xl leading-8 font-bold pb-4">
      {{ $t('admin.users.title') }}
    </div>
    <vue-good-table
      :columns="columns"
      :rows="rows"
      :sort-options="{ enabled: true, initialSortBy: { field: 'email', type: 'asc' } }"
      @row-click="editUser"
    >
      <template #table-row="props">
        <span v-if="props.column.field === 'roleNames'">
          <span
            v-for="role in props.row.roles"
            :key="role.id"
            class="inline-block bg-avatar rounded px-2 mr-1 text-sm"
          >{{ role.name }}</span>
        </span>
        <span v-else>{{ props.formattedRow[props.column.field] }}</span>
      </template>
    </vue-good-table>

    <EditUserModal
      v-if="selectedUser"
      :user="selectedUser"
      :roles="roles"
      :teams="teamsStore.collection.sortBy('name').all()"
      @closeModal="selectedUser = null"
      @saved="onSaved"
    />
  </AdminPage>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import collect from 'collect.js'
import { useToast } from 'vue-toast-notification'
import { getTimaticApi } from '~/utils/timaticApi'
import { useUsersStore } from '~/stores/users'
import { useTeamsStore } from '~/stores/teams'

useHead({ title: 'Users - Timatic' })

const { t } = useI18n()
const toast = useToast()
const usersStore = useUsersStore()
const teamsStore = useTeamsStore()

const users = ref([])
const roles = ref([])
const selectedUser = ref(null)

const columns = computed(() => [
  { label: t('admin.users.email'), field: 'email', filterOptions: { enabled: true } },
  { label: t('admin.users.firstName'), field: 'givenName', filterOptions: { enabled: true } },
  { label: t('admin.users.lastName'), field: 'familyName', filterOptions: { enabled: true } },
  {
    label: t('admin.users.team'),
    field: 'teamName',
    filterOptions: {
      enabled: true,
      filterDropdownItems: teamsStore.collection.pluck('name').sort().all()
    }
  },
  {
    label: t('admin.users.roles'),
    field: 'roleNames',
    sortable: false,
    filterOptions: {
      enabled: true,
      filterDropdownItems: roles.value.map(role => role.name).sort(),
      filterFn: (roleNames, roleName) => roleNames.split(' ').includes(roleName)
    }
  }
])

const rows = computed(() => users.value.map(user => ({
  ...user,
  roleNames: user.roles.map(role => role.name).join(' '),
  teamName: teamsStore.getById(user.teamId)?.name ?? ''
})))

onMounted(async () => {
  const api = getTimaticApi()
  const [usersResponse, rolesResponse] = await Promise.all([
    api.$get('users', { params: { include: 'roles,team', page: { size: 1000 } } }),
    api.$get('roles', { params: { page: { size: 1000 } } })
  ])

  roles.value = rolesResponse.data.map(role => ({ id: role.id, name: role.attributes.name }))
  const includedRoles = collect(usersResponse.included).where('type', 'roles')
  users.value = usersResponse.data.map(user => ({
    id: user.id,
    ...user.attributes,
    teamId: user.relationships.team.data?.id ?? null,
    roles: user.relationships.roles.data.map(({ id }) => ({ id, name: includedRoles.firstWhere('id', id).attributes.name }))
  }))
})

function editUser ({ row }) {
  if (usersStore.can('users.update')) {
    selectedUser.value = users.value.find(user => user.id === row.id)
  }
}

function onSaved (savedUser) {
  users.value = users.value.map(user => user.id === savedUser.id ? savedUser : user)
  selectedUser.value = null
  toast.success(t('admin.users.saved'))
}
</script>
