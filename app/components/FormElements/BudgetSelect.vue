<template>
  <div class="budgetSelectContainer">
    <vue-select
      id="budgetInput"
      ref="budgetInput"
      v-model="currentValue"
      :options="options"
      :placeholder="$t('selectBudget')"
      name="budgets"
      label="title"
      :clearable="false"
      :select-on-tab="true"
      :class="classes"
      :disabled="disabled"
      :selectable="option => ! option.expired && ! option.startsInFuture"
      :no-drop="options.length === 1"
      :searchable="options.length > 1"
    >
      <template #option="option">
        <span>{{ option.budgetType.title }}</span>
        <span v-if="option.budgetType.title !== option.title">- {{ option.title }}</span>
      </template>
    </vue-select>
    <WarningIcon
      v-show="showPaidPerHourWarning"
      v-tooltip="{
        content: $t('paidPerHourWarning'),
        trigger: 'hover'
      }"
    />
    <InfoImage
      v-show="!!currentValue && currentValue.id !== 'paidPerHour'"
      v-tooltip="{
        content: budgetTooltip,
        trigger: 'hover'
      }"
      class="inline-block text-filter-text ml-3"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import collect from 'collect.js'
import { useI18n } from 'vue-i18n'
import VueSelect from 'vue-select'
import WarningIcon from '~/assets/svg/warning.svg'
import InfoImage from '~/assets/svg/info.svg'
import { timeFormat } from '~/utils/filters'
import { useBudgetsStore } from '~/stores/budgets'
import { useBudgetTypesStore } from '~/stores/budgetTypes'
import { useUsersStore } from '~/stores/users'
import { useCustomersStore } from '~/stores/customers'

const props = defineProps({
  classes: {
    type: Object,
    default: null
  },
  customerId: {
    type: String,
    required: false,
    default: null
  },
  modelValue: {
    type: Object,
    default: null
  },
  disabled: {
    type: Boolean,
    default: false
  },
  ticket: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const budgetsStore = useBudgetsStore()
const budgetTypesStore = useBudgetTypesStore()
const usersStore = useUsersStore()
const customersStore = useCustomersStore()

const budgetInput = ref(null)
const currentValue = ref('')
const budgets = ref(null)

const customerIsOwnOrganisation = computed(() => customersStore.getById(props.customerId)?.isOwnOrganization === true)

const showPaidPerHourWarning = computed(() => {
  if (currentValue.value?.id !== 'paidPerHour') return false
  const supportBudgets = collect(options.value)
    .whereIn('budgetTypeId', ['sla', 'prepaid', 'forti', 'patching'])
    .reject(budget => budget.expired)
    .reject(budget => budget.startsInFuture)
  return supportBudgets.count() > 0
})

const options = computed(() => {
  if (!budgets.value) return []

  let opts = budgets.value
    .filter((budget) => {
      return budget.allowedUsers.length === 0 || budget.allowedUsers.find(user => user.id === usersStore.getCurrentUser.id)
    })
    .map((budget) => {
      const option = { ...budget }
      option.budgetType = budgetTypesStore.collection.firstWhere('id', budget.budgetTypeId)

      if (budget.expired) {
        option.title += ' - ' + t('expired')
      }
      if (budget.startsInFuture) {
        option.title += ` - ${t('validFrom')} ${budget.startedAt.format('D-M-YYYY')}`
      }
      return option
    })
    .sortBy('title')
    .sortBy('budgetType.title')

  if (props.ticket?.number && budgets.value.where('changeId', '==', props.ticket?.number).count()) {
    opts = opts.filter(budget => budget.changeId === props.ticket.number)
  }

  if (!customerIsOwnOrganisation.value) {
    opts.push({
      budgetType: { title: t('paidPerHour') },
      title: t('paidPerHour'),
      id: 'paidPerHour'
    })
  }
  return opts.all()
})

const budgetTooltip = computed(() => {
  if (!currentValue.value) return ''
  const description = currentValue.value?.description?.replace(/(\r\n|\r|\n)/g, '<br>')
  const remainingTime = timeFormat(currentValue.value.lastPeriod?.remainingMinutes)
  let html = `<strong>Description: </strong> ${description || '-'}`
  if (currentValue.value.initialMinutes > 0) {
    html += `<br><br><strong>Remaining time:</strong> ${remainingTime}`
  }
  return html
})

watch(currentValue, (val) => {
  emit('update:modelValue', val)
})

watch(() => props.customerId, (val) => {
  if (val) loadBudgets()
})

watch(() => props.modelValue, (newVal) => {
  currentValue.value = newVal
})

watch(() => props.ticket, () => {
  selectMatchingChangeBudget()
})

watch(() => budgetsStore.loadingState, () => {
  budgetInput.value?.toggleLoading(false)
})

onMounted(() => {
  budgetInput.value?.toggleLoading(budgetsStore.loadingState)
})

function loadBudgets () {
  currentValue.value = null
  budgets.value = budgetsStore.getActiveBudgetsFromCustomer(props.customerId)

  if (budgets.value.count() === 0) {
    currentValue.value = options.value[0]
  } else {
    selectMatchingChangeBudget()
  }
}

function selectMatchingChangeBudget () {
  if (
    props.ticket?.number &&
    budgets.value?.where('changeId', '==', props.ticket?.number).count() === 1
  ) {
    currentValue.value = budgets.value.where('changeId', '===', props.ticket.number).first()
  }
}
</script>

<style scoped>
.budgetSelectContainer {
  position: relative;
}

svg {
  position: absolute;
  top: 5px;
  right: 27px;
  z-index: 50;
}
</style>
