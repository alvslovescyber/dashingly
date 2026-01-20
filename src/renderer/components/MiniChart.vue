<template>
  <div class="mini-chart" ref="chartContainer">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
} from 'chart.js'

// Register Chart.js components
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip
)

interface Props {
  data: number[]
  labels?: string[]
  color?: string
  gradientStart?: string
  gradientEnd?: string
  showPoints?: boolean
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  color: '#3B82F6',
  gradientStart: 'rgba(59, 130, 246, 0.3)',
  gradientEnd: 'rgba(59, 130, 246, 0)',
  showPoints: false,
  height: 80,
})

const chartContainer = ref<HTMLElement>()
const canvas = ref<HTMLCanvasElement>()
let chart: Chart | null = null

function createChart() {
  if (!canvas.value) return

  const ctx = canvas.value.getContext('2d')
  if (!ctx) return

  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, props.height)
  gradient.addColorStop(0, props.gradientStart)
  gradient.addColorStop(1, props.gradientEnd)

  // Destroy existing chart
  if (chart) {
    chart.destroy()
  }

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: props.labels || props.data.map((_, i) => String(i)),
      datasets: [
        {
          data: props.data,
          borderColor: props.color,
          backgroundColor: gradient,
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: props.showPoints ? 3 : 0,
          pointHoverRadius: 5,
          pointBackgroundColor: props.color,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleFont: { size: 12 },
          bodyFont: { size: 11 },
          padding: 8,
          cornerRadius: 8,
        },
      },
      scales: {
        x: {
          display: false,
        },
        y: {
          display: false,
          beginAtZero: true,
        },
      },
      interaction: {
        intersect: false,
        mode: 'index',
      },
      animation: {
        duration: 500,
        easing: 'easeOutCubic',
      },
    },
  })
}

watch(() => props.data, createChart, { deep: true })

onMounted(() => {
  createChart()
})

onUnmounted(() => {
  if (chart) {
    chart.destroy()
    chart = null
  }
})
</script>

<style scoped>
.mini-chart {
  width: 100%;
  height: v-bind('props.height + "px"');
  position: relative;
}

.mini-chart canvas {
  width: 100% !important;
  height: 100% !important;
}
</style>
