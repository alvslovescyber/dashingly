<template>
  <div class="mini-chart">
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
  minValue?: number
}

const props = withDefaults(defineProps<Props>(), {
  color: '#3B82F6',
  gradientStart: 'rgba(59, 130, 246, 0.15)',
  gradientEnd: 'rgba(59, 130, 246, 0)',
  showPoints: false,
  height: 80,
  smartScale: true,
  minValue: undefined,
})


const canvas = ref<HTMLCanvasElement>()
let chart: Chart | null = null

function getYScaleConfig() {
  const minValue = props.minValue ?? 0
  if (props.smartScale) {
    return {
      suggestedMin: minValue,
      grace: '10%',
    }
  }
  return {
    min: minValue,
  }
}

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
          borderWidth: 2.5,
          fill: true,
          tension: 0.45,
          pointRadius: props.showPoints ? 4 : 0,
          pointHoverRadius: 6,
          pointBackgroundColor: props.color,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 800,
        easing: 'easeOutQuart',
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false,
          displayColors: false,
          padding: { x: 12, y: 8 },
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: 'rgba(255, 255, 255, 0.95)',
          bodyColor: 'rgba(255, 255, 255, 0.85)',
          titleFont: { size: 12, weight: 600, family: 'Inter' },
          bodyFont: { size: 14, weight: 700, family: 'Inter' },
          cornerRadius: 8,
          borderColor: 'rgba(255, 255, 255, 0.12)',
          borderWidth: 1,
          caretSize: 6,
          caretPadding: 8,
        },
      },
      // Touch-friendly events for tooltips
      events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'],
      layout: {
        padding: { left: 0, right: 0, top: 10, bottom: 0 },
      },
      scales: {
        x: {
          display: false,
          grid: { display: false },
        },
        y: {
          display: true,
          grid: {
            display: true,
            color: 'rgba(255, 255, 255, 0.06)',
            lineWidth: 1,
          },
          ticks: {
            display: true,
            color: 'rgba(255, 255, 255, 0.4)',
            font: { size: 10, family: 'Inter' },
            maxTicksLimit: 4,
            padding: 8,
          },
          border: { display: false },
          ...getYScaleConfig(),
        },
      },
      elements: {
        point: {
          radius: 0,
          hitRadius: 30, // Larger hit area for touch
          hoverRadius: 5,
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

  const dataset = chart.data.datasets[0]
  if (!dataset) {
    createChart()
    return
  }

  chart.data.labels = props.labels || props.data.map((_, i) => String(i))
  dataset.data = props.data
  applyScaleOptions()
  chart.update()
}

function applyScaleOptions() {
  if (!chart) return
  const yScale = chart.options.scales?.y as Record<string, unknown> | undefined
  if (!yScale) return

  const config = getYScaleConfig()

  // Reset values before applying new config
  delete yScale.min
  delete yScale.suggestedMin
  delete yScale.grace

  Object.assign(yScale, config)
}

watch(
  () => [props.data, props.labels],
  () => {
    refreshChart()
  },
  { deep: true }
)

watch(
  () => [props.minValue, props.smartScale],
  () => {
    applyScaleOptions()
    chart?.update()
  }
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
