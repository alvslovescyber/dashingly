// Scaling tuned for 4.5\" Pi display (around 800x400/480)
// Smaller design surface keeps text legible on the tiny panel.
export const DESIGN_WIDTH = 1100
export const DESIGN_HEIGHT = 650

export const VIEWPORT_WIDTH = 800
export const VIEWPORT_HEIGHT = 480

// Calculate the scale factor (min to maintain aspect ratio)
export const SCALE = Math.min(VIEWPORT_WIDTH / DESIGN_WIDTH, VIEWPORT_HEIGHT / DESIGN_HEIGHT)
// SCALE ≈ 0.533

// Calculate offset for centering
export const OFFSET_X = (VIEWPORT_WIDTH - DESIGN_WIDTH * SCALE) / 2
export const OFFSET_Y = (VIEWPORT_HEIGHT - DESIGN_HEIGHT * SCALE) / 2

// CSS for the scaled container
export function getScalingStyles(): string {
  return `
    .scaled-container {
      width: ${DESIGN_WIDTH}px;
      height: ${DESIGN_HEIGHT}px;
      transform: scale(${SCALE});
      transform-origin: top left;
      position: absolute;
      left: ${OFFSET_X}px;
      top: ${OFFSET_Y}px;
      overflow: hidden;
    }

    .viewport-wrapper {
      width: ${VIEWPORT_WIDTH}px;
      height: ${VIEWPORT_HEIGHT}px;
      position: relative;
      overflow: hidden;
      background: #000;
    }
  `.trim()
}

// Helper to convert design pixels to viewport pixels
export function toViewport(designPx: number): number {
  return designPx * SCALE
}

// Helper to convert viewport pixels to design pixels
export function toDesign(viewportPx: number): number {
  return viewportPx / SCALE
}

// Check if we're running in kiosk mode (800x480)
export function isKioskMode(): boolean {
  return window.innerWidth <= VIEWPORT_WIDTH && window.innerHeight <= VIEWPORT_HEIGHT
}

// Get appropriate scale for current window size
export function getDynamicScale(): number {
  const scale = Math.min(window.innerWidth / DESIGN_WIDTH, window.innerHeight / DESIGN_HEIGHT)
  return Math.min(scale, 1)
}
