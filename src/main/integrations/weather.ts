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
  country?: string
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

function normalizeCityQuery(city: string): string {
  return city.replace(/[,_]+/g, ' ').replace(/\s+/g, ' ').trim()
}

function tokenizeQuery(city: string): string[] {
  const tokens = normalizeCityQuery(city).toLowerCase().split(' ').filter(Boolean)
  return Array.from(new Set(tokens))
}

function scoreCandidate(
  candidate: string,
  country: string | undefined,
  tokens: string[],
  normalizedQuery: string
): number {
  const candidateStr = candidate.toLowerCase()
  const countryStr = country?.toLowerCase() ?? ''
  let score = 0

  for (const token of tokens) {
    if (candidateStr.includes(token)) {
      score += token.length * 2
    } else if (countryStr.includes(token)) {
      score += token.length
    }
  }

  if (countryStr && normalizedQuery.includes(countryStr)) {
    score += 10
  }

  return score
}

function pickBestLocation<T>(
  entries: T[],
  getName: (entry: T) => string,
  getCountry: (entry: T) => string | undefined,
  tokens: string[],
  normalizedQuery: string
): T | null {
  let best: T | null = null
  let bestScore = -Infinity

  for (const entry of entries) {
    const name = getName(entry)
    const country = getCountry(entry)
    const score = scoreCandidate(name, country, tokens, normalizedQuery)
    if (score > bestScore) {
      bestScore = score
      best = entry
    }
  }

  return best
}

function buildDisplayName(parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(', ')
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

  const normalized = normalizeCityQuery(city)
  if (!normalized) return null

  const normalizedLower = normalized.toLowerCase()
  const tokens = tokenizeQuery(city)

  const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
  url.searchParams.set('name', normalized)
  url.searchParams.set('count', '5')
  url.searchParams.set('language', 'en')
  url.searchParams.set('format', 'json')

  const response = await fetch(url.toString())
  if (!response.ok) {
    console.warn('Failed to geocode city', city, response.status)
    return null
  }

  const json = (await response.json()) as {
    results?: Array<{
      name: string
      admin1?: string
      country?: string
      latitude: number
      longitude: number
    }>
  }

  const primaryResults: GeocodeResult[] =
    json.results?.map(r => ({
      name: buildDisplayName([r.name, r.admin1, r.country]),
      latitude: r.latitude,
      longitude: r.longitude,
      country: r.country,
    })) ?? []

  let result: GeocodeResult | null =
    pickBestLocation(
      primaryResults,
      entry => entry.name,
      entry => entry.country,
      tokens,
      normalizedLower
    ) ?? null

  if (!result) {
    let fallback = await searchCities(normalized)

    if (!fallback.length && normalized.includes(' ')) {
      const [firstWord] = normalized.split(' ')
      if (firstWord && firstWord.length >= 2) {
        fallback = await searchCities(firstWord)
      }
    }

    result =
      pickBestLocation(
        fallback,
        entry => entry.name,
        entry => entry.country,
        tokens,
        normalizedLower
      ) ?? null
  }

  return result
}

export async function searchCities(query: string): Promise<GeocodeResult[]> {
  if (!query || query.length < 2) return []

  const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
  url.searchParams.set('name', query)
  url.searchParams.set('count', '5')
  url.searchParams.set('language', 'en')
  url.searchParams.set('format', 'json')

  try {
    const response = await fetch(url.toString())
    if (!response.ok) return []

    const json = (await response.json()) as {
      results?: Array<{
        name: string
        country?: string
        admin1?: string
        latitude: number
        longitude: number
      }>
    }

    if (!json.results) return []

    return json.results.map(r => ({
      name: buildDisplayName([r.name, r.admin1, r.country]),
      latitude: r.latitude,
      longitude: r.longitude,
      country: r.country,
    }))
  } catch (error) {
    console.error('City search failed:', error)
    return []
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
