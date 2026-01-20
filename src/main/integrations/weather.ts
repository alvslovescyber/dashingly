import { getDatabase, getSetting, setSetting, setLastSync } from '../db/database'
import type { WeatherSettings, WeatherStatus } from '../../shared/types'

const WEATHER_SETTINGS_KEY = 'weather_settings'
const WEATHER_TTL_MS = 60 * 60 * 1000 // 60 minutes

interface WeatherCacheRow {
  payload: string
  fetched_at: number
}

interface GeocodeResult {
  latitude: number
  longitude: number
  name: string
}

interface RawWeatherResponse {
  latitude: number
  longitude: number
  timezone: string
  current_weather?: {
    temperature: number
    weathercode: number
  }
  daily?: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    weathercode: number[]
  }
}

export function getDefaultWeatherSettings(): WeatherSettings {
  return {
    locationMode: 'city',
    cityName: 'New York',
    units: 'metric',
  }
}

export function getWeatherSettings(): WeatherSettings {
  return getSetting<WeatherSettings>(WEATHER_SETTINGS_KEY, getDefaultWeatherSettings())
}

export function saveWeatherSettings(settings: WeatherSettings): void {
  setSetting(WEATHER_SETTINGS_KEY, settings)
}

function mapWeatherCodeToCondition(code: number): { label: string; icon: string } {
  const mapping: Record<number, { label: string; icon: string }> = {
    0: { label: 'Clear sky', icon: 'sun' },
    1: { label: 'Mainly clear', icon: 'sun-cloud' },
    2: { label: 'Partly cloudy', icon: 'sun-cloud' },
    3: { label: 'Overcast', icon: 'cloud' },
    45: { label: 'Fog', icon: 'fog' },
    48: { label: 'Depositing rime fog', icon: 'fog' },
    51: { label: 'Light drizzle', icon: 'drizzle' },
    53: { label: 'Drizzle', icon: 'drizzle' },
    55: { label: 'Dense drizzle', icon: 'drizzle' },
    56: { label: 'Freezing drizzle', icon: 'drizzle' },
    57: { label: 'Freezing drizzle', icon: 'drizzle' },
    61: { label: 'Slight rain', icon: 'rain' },
    63: { label: 'Rain', icon: 'rain' },
    65: { label: 'Heavy rain', icon: 'rain' },
    66: { label: 'Freezing rain', icon: 'rain' },
    67: { label: 'Freezing rain', icon: 'rain' },
    71: { label: 'Light snow', icon: 'snow' },
    73: { label: 'Snow', icon: 'snow' },
    75: { label: 'Heavy snow', icon: 'snow' },
    77: { label: 'Snow grains', icon: 'snow' },
    80: { label: 'Rain showers', icon: 'rain' },
    81: { label: 'Rain showers', icon: 'rain' },
    82: { label: 'Violent rain showers', icon: 'rain' },
    85: { label: 'Snow showers', icon: 'snow' },
    86: { label: 'Snow showers', icon: 'snow' },
    95: { label: 'Thunderstorm', icon: 'storm' },
    96: { label: 'Thunderstorm w/ hail', icon: 'storm' },
    99: { label: 'Thunderstorm w/ hail', icon: 'storm' },
  }

  return (
    mapping[code] || {
      label: 'Cloudy',
      icon: 'cloud',
    }
  )
}

function getCacheKey(lat: number, lon: number, units: string): string {
  return `${lat.toFixed(2)},${lon.toFixed(2)}:${units}`
}

function readCache(cacheKey: string): { status: WeatherStatus; fetchedAt: number } | null {
  const db = getDatabase()
  const row = db
    .prepare(
      `
      SELECT payload, fetched_at
      FROM weather_cache
      WHERE cache_key = ?
    `
    )
    .get(cacheKey) as WeatherCacheRow | undefined

  if (!row) return null

  try {
    const parsed = JSON.parse(row.payload) as WeatherStatus
    return { status: parsed, fetchedAt: row.fetched_at }
  } catch (error) {
    console.warn('Failed to parse weather cache', error)
  }
  return null
}

function writeCache(cacheKey: string, status: WeatherStatus): void {
  const db = getDatabase()
  db.prepare(
    `
      INSERT OR REPLACE INTO weather_cache (cache_key, payload, fetched_at)
      VALUES (?, ?, ?)
    `
  ).run(cacheKey, JSON.stringify(status), Date.now())
}

async function geocodeCity(city: string): Promise<GeocodeResult | null> {
  if (!city) return null

  const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
  url.searchParams.set('name', city)
  url.searchParams.set('count', '1')
  url.searchParams.set('language', 'en')
  url.searchParams.set('format', 'json')

  const response = await fetch(url.toString())
  if (!response.ok) {
    console.warn('Failed to geocode city', city, response.status)
    return null
  }

  const json = (await response.json()) as {
    results?: Array<{ name: string; country?: string; latitude: number; longitude: number }>
  }
  const result = json.results?.[0]
  if (!result) return null

  const name = result.country ? `${result.name}, ${result.country}` : result.name
  return {
    latitude: result.latitude,
    longitude: result.longitude,
    name,
  }
}

async function fetchWeatherData(
  latitude: number,
  longitude: number,
  units: 'metric' | 'imperial'
): Promise<RawWeatherResponse | null> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current_weather: 'true',
    daily: 'temperature_2m_max,temperature_2m_min,weathercode',
    timezone: 'auto',
  })

  if (units === 'imperial') {
    params.set('temperature_unit', 'fahrenheit')
  }

  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`
  const response = await fetch(url)
  if (!response.ok) {
    console.warn('Failed to fetch weather data', response.status)
    return null
  }

  return (await response.json()) as RawWeatherResponse
}

function buildForecast(raw?: RawWeatherResponse) {
  if (!raw?.daily) return undefined

  const formatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' })
  const forecast = raw.daily.time.slice(0, 3).map((isoDate: string, index: number) => {
    const date = new Date(isoDate)
    const code = raw.daily?.weathercode?.[index] ?? 3
    const { icon } = mapWeatherCodeToCondition(code)

    return {
      day: formatter.format(date),
      high: raw.daily?.temperature_2m_max?.[index] ?? null,
      low: raw.daily?.temperature_2m_min?.[index] ?? null,
      icon,
    }
  })

  return forecast
}

export async function getWeatherStatus(): Promise<WeatherStatus | null> {
  let cached: { status: WeatherStatus; fetchedAt: number } | null = null
  try {
    const settings = getWeatherSettings()
    let latitude: number | undefined
    let longitude: number | undefined
    let locationName = settings.cityName

    if (settings.locationMode === 'latlon' && settings.latitude && settings.longitude) {
      latitude = settings.latitude
      longitude = settings.longitude
      locationName = `${settings.latitude.toFixed(2)}, ${settings.longitude.toFixed(2)}`
    } else if (settings.cityName) {
      const geo = await geocodeCity(settings.cityName)
      if (!geo) return null
      latitude = geo.latitude
      longitude = geo.longitude
      locationName = geo.name
    }

    if (latitude === undefined || longitude === undefined) {
      return null
    }

    const cacheKey = getCacheKey(latitude, longitude, settings.units)
    cached = readCache(cacheKey)
    if (cached && Date.now() - cached.fetchedAt < WEATHER_TTL_MS) {
      return cached.status
    }

    const raw = await fetchWeatherData(latitude, longitude, settings.units)
    if (!raw?.current_weather) {
      return cached?.status ?? null
    }

    const condition = mapWeatherCodeToCondition(raw.current_weather.weathercode)

    const status: WeatherStatus = {
      locationName: locationName || 'Selected location',
      temperature: raw.current_weather.temperature ?? null,
      high: raw.daily?.temperature_2m_max?.[0] ?? null,
      low: raw.daily?.temperature_2m_min?.[0] ?? null,
      condition: condition.label,
      icon: condition.icon,
      lastUpdated: Date.now(),
      forecast: buildForecast(raw),
    }

    writeCache(cacheKey, status)
    setLastSync('weather', Date.now())
    return status
  } catch (error) {
    console.error('Weather fetch failed:', error)
    return cached?.status ?? null
  }
}
