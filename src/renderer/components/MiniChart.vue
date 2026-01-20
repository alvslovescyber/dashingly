<template>
  <div ref="chartContainer" class="mini-chart">
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
  smartScale?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  color: '#3B82F6',
  gradientStart: 'rgba(59, 130, 246, 0.15)',
  gradientEnd: 'rgba(59, 130, 246, 0)',
  showPoints: false,
  height: 80,
  smartScale: true,
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
      animation: { duration: 600 },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false,
          displayColors: false,
          padding: 10,
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleColor: 'rgba(255, 255, 255, 0.95)',
          bodyColor: 'rgba(255, 255, 255, 0.85)',
          titleFont: { size: 13, weight: 'bold', family: 'Inter' },
          bodyFont: { size: 12, family: 'Inter' },
          cornerRadius: 8,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
        },
      },
      layout: {
        padding: { left: -8, right: -8, top: 10, bottom: 0 },
      },
      scales: {
        x: {
          display: false,
          grid: { display: false },
        },
        y: {
          display: false,
          grid: { display: false },
          ...(props.smartScale
            ? {
                grace: '10%', // Add 10% padding to top/bottom
              }
            : {
                min: 0,
              }),
        },
      },
      elements: {
        point: {
          radius: 0,
          hitRadius: 20,
          hoverRadius: 4,
          backgroundColor: props.color,
          borderWidth: 2,
          borderColor: '#FFF',
        },
        line: {
          borderWidth: 2.5,
          tension: 0.45,
          borderCapStyle: 'round',
          borderJoinStyle: 'round',
        },
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false,
      },
    },
  })
}

function refreshChart() {
  if (!chart) {
    createChart()
    return
  }

  chart.data.labels = props.labels || props.data.map((_, i) => String(i))
  chart.data.datasets[0].data = props.data
  chart.update()
}

watch(
  () => [props.data, props.labels],
  () => {
    refreshChart()
  },
  { deep: true }
)

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
