<template>
  <div class="container">
    <canvas id="budgetUsageChart" width="400" height="220" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Chart from 'chart.js/auto'
import collect from 'collect.js'
import 'chartjs-adapter-moment'
import { getTimaticApi } from '~/utils/timaticApi'

const props = defineProps({
  budget: {
    type: Object,
    default: null
  }
})

const periodUnit = computed(() => {
  const budgetDurationInWeeks = props.budget.endedAt.diff(props.budget.startedAt, 'week')
  return budgetDurationInWeeks > 20 ? 'month' : 'week'
})

onMounted(() => {
  const chart = new Chart(document.getElementById('budgetUsageChart'), {
    type: 'line',
    data: {
      datasets: [
        {
          data: [],
          borderColor: '#3081b8',
          fill: false,
          borderWidth: 1,
          tension: 0.3
        },
        {
          data: [
            { x: props.budget.startedAt, y: props.budget.initialMinutes / 60 },
            { x: props.budget.endedAt, y: 0 }
          ]
        }
      ]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: periodUnit.value,
            displayFormats: { month: 'MMM \'YY' },
            tooltipFormat: 'MMM YYYY'
          }
        },
        y: {
          title: { text: 'Remaining Hours', display: true },
          grid: {
            color (context) {
              return context.tick.value === 0 ? '#ABC1D9' : '#EAF0F6'
            }
          }
        }
      }
    }
  })

  const api = getTimaticApi()
  api.$get('budget-time-spent-totals/', {
    params: {
      filter: { budgetId: props.budget.id },
      periodUnit: periodUnit.value,
      page: { size: 100 }
    }
  }).then((response) => {
    const dataPoints = collect(response.data).transform(item => item.attributes)
    chart.data.datasets[0].data = dataPoints.map((point) => ({
      x: point.start,
      y: point.remainingMinutes / 60
    })).all()
    chart.update()
  })
})
</script>
