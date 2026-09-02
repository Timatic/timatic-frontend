<template>
  <div>
    <slot />
  </div>
</template>

<script setup>
import { useUsersStore } from '~/stores/users'
import { useCustomersStore } from '~/stores/customers'
import { useBudgetsStore } from '~/stores/budgets'
import { useBudgetTypesStore } from '~/stores/budgetTypes'
import { useTeamsStore } from '~/stores/teams'

const usersStore = useUsersStore()
const customersStore = useCustomersStore()
const budgetsStore = useBudgetsStore()
const budgetTypesStore = useBudgetTypesStore()
const teamsStore = useTeamsStore()

usersStore.login()
customersStore.fetch()
budgetsStore.fetch()
budgetTypesStore.fetch()
teamsStore.fetch()
usersStore.fetch()
</script>

<style>
html {
  font-family: 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI',
    Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 16px;
  word-spacing: 1px;
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  box-sizing: border-box;
}

*,
*:before,
*:after {
  box-sizing: border-box;
  margin: 0;
}
</style>
