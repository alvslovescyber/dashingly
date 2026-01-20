import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'
import type { BrightnessSupport, BrightnessSchedule } from '../../shared/types'

// Backlight sysfs paths to check
const BACKLIGHT_PATHS = [
  '/sys/class/backlight/rpi_backlight',
  '/sys/class/backlight/10-0045',
  '/sys/class/backlight',
]

// Brightness state
let backlightPath: string | null = null
let maxBrightness = 255
let isSupported = false

/**
 * Initialize brightness control
 * Detects available backlight device at runtime
 */
export function initBrightness(): BrightnessSupport {
  // Try each known path
  for (const basePath of BACKLIGHT_PATHS) {
    if (existsSync(basePath)) {
      // Check if it's a backlight directory with devices
      if (basePath === '/sys/class/backlight') {
        try {
          const devices = readdirSync(basePath)
          if (devices.length > 0) {
            backlightPath = join(basePath, devices[0])
          }
        } catch {
          continue
        }
      } else {
        backlightPath = basePath
      }

      if (backlightPath) {
        // Check if brightness file is writable
        const brightnessFile = join(backlightPath, 'brightness')
        const maxBrightnessFile = join(backlightPath, 'max_brightness')

        if (existsSync(brightnessFile) && existsSync(maxBrightnessFile)) {
          try {
            // Read max brightness
            maxBrightness = parseInt(readFileSync(maxBrightnessFile, 'utf8').trim(), 10)

            // Try to read current brightness (test read access)
            const current = parseInt(readFileSync(brightnessFile, 'utf8').trim(), 10)

            isSupported = true
            console.log(`Brightness control initialized: ${backlightPath}`)
            console.log(`Max brightness: ${maxBrightness}, Current: ${current}`)

            return {
              supported: true,
              path: backlightPath,
              maxBrightness,
              currentBrightness: Math.round((current / maxBrightness) * 100),
            }
          } catch (err) {
            console.warn(`Cannot access brightness at ${backlightPath}:`, err)
          }
        }
      }
    }
  }

  console.log('Hardware brightness control not available')
  return { supported: false }
}

/**
 * Get current brightness (0-100)
 */
export function getBrightness(): number | null {
  if (!isSupported || !backlightPath) return null

  try {
    const brightnessFile = join(backlightPath, 'brightness')
    const current = parseInt(readFileSync(brightnessFile, 'utf8').trim(), 10)
    return Math.round((current / maxBrightness) * 100)
  } catch (err) {
    console.error('Failed to read brightness:', err)
    return null
  }
}

/**
 * Set brightness (0-100)
 */
export function setBrightness(percent: number): boolean {
  if (!isSupported || !backlightPath) return false

  // Clamp value
  percent = Math.max(0, Math.min(100, percent))

  // Convert to raw value
  const rawValue = Math.round((percent / 100) * maxBrightness)

  try {
    const brightnessFile = join(backlightPath, 'brightness')
    writeFileSync(brightnessFile, String(rawValue))
    return true
  } catch (err) {
    console.error('Failed to set brightness:', err)
    return false
  }
}

/**
 * Animate brightness change with smooth fade
 */
export async function animateBrightness(
  targetPercent: number,
  durationMs: number = 500
): Promise<void> {
  if (!isSupported || !backlightPath) return

  const currentPercent = getBrightness()
  if (currentPercent === null) return

  const steps = Math.max(10, Math.floor(durationMs / 50))
  const stepDuration = durationMs / steps
  const stepSize = (targetPercent - currentPercent) / steps

  for (let i = 1; i <= steps; i++) {
    const value = currentPercent + stepSize * i
    setBrightness(Math.round(value))
    await sleep(stepDuration)
  }

  // Ensure we hit the exact target
  setBrightness(targetPercent)
}

/**
 * Check if current time is within night hours
 */
export function isNightTime(nightStart: string, nightEnd: string): boolean {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const [startHour, startMin] = nightStart.split(':').map(Number)
  const [endHour, endMin] = nightEnd.split(':').map(Number)

  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin

  // Handle overnight spans (e.g., 22:00 to 07:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes
  }

  return currentMinutes >= startMinutes && currentMinutes < endMinutes
}

/**
 * Apply scheduled brightness based on current time
 */
export function applyScheduledBrightness(schedule: BrightnessSchedule): void {
  if (!schedule.enabled || !isSupported) return

  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  // Find the most recent applicable entry
  let applicableEntry = schedule.entries[0]

  for (const entry of schedule.entries) {
    const [hour, min] = entry.time.split(':').map(Number)
    const entryMinutes = hour * 60 + min

    if (entryMinutes <= currentMinutes) {
      applicableEntry = entry
    }
  }

  if (applicableEntry) {
    setBrightness(applicableEntry.brightness)
  }
}

/**
 * Get brightness control support status
 */
export function getBrightnessSupport(): BrightnessSupport {
  if (!isSupported || !backlightPath) {
    return { supported: false }
  }

  return {
    supported: true,
    path: backlightPath,
    maxBrightness,
    currentBrightness: getBrightness() ?? undefined,
  }
}

/**
 * Get fix instructions for non-writable backlight
 */
export function getBrightnessFix(): string {
  return `
To enable hardware brightness control on Raspberry Pi:

1. Add user to video group:
   sudo usermod -aG video $USER

2. Create udev rule for backlight permissions:
   sudo nano /etc/udev/rules.d/99-backlight.rules
   
   Add this line:
   SUBSYSTEM=="backlight", RUN+="/bin/chmod 666 /sys/class/backlight/%k/brightness"

3. Reload udev rules:
   sudo udevadm control --reload-rules
   sudo udevadm trigger

4. Reboot:
   sudo reboot

After rebooting, brightness control should work.
`.trim()
}

// Helper
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
