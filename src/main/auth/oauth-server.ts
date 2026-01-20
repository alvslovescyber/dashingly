import express, { Request, Response, NextFunction } from 'express'
import { networkInterfaces } from 'os'
import QRCode from 'qrcode'
import { getSetting, setSetting } from '../db/database'
import { validateHealthPayload } from '../../shared/schemas'
import type { OAuthTokens } from '../../shared/types'

let server: ReturnType<typeof express.application.listen> | null = null
const app = express()

// Middleware
app.use(express.json())

// Get local IP address
function getLocalIP(): string {
  const nets = networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address
      }
    }
  }
  return '127.0.0.1'
}

// ============================================
// STRAVA OAUTH
// ============================================

app.get('/oauth/strava/start', (_req: Request, res: Response) => {
  const clientId = process.env.STRAVA_CLIENT_ID
  if (!clientId) {
    return res.status(500).send('Strava client ID not configured')
  }

  const ip = getLocalIP()
  const port = process.env.AUTH_SERVER_PORT || '3847'
  const redirectUri = `http://${ip}:${port}/oauth/strava/callback`

  const authUrl = new URL('https://www.strava.com/oauth/authorize')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('scope', 'read,activity:read_all')
  authUrl.searchParams.set('approval_prompt', 'auto')

  res.redirect(authUrl.toString())
})

app.get('/oauth/strava/callback', async (req: Request, res: Response) => {
  const { code, error } = req.query

  if (error) {
    return res.send(`
      <html>
        <body style="font-family: system-ui; padding: 40px; text-align: center;">
          <h1>Authorization Failed</h1>
          <p>Error: ${error}</p>
          <p>You can close this window.</p>
        </body>
      </html>
    `)
  }

  if (!code || typeof code !== 'string') {
    return res.status(400).send('Missing authorization code')
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    })

    const tokens = await tokenResponse.json()

    if (!tokenResponse.ok) {
      throw new Error(tokens.message || 'Token exchange failed')
    }

    // Store tokens securely
    const oauthTokens: OAuthTokens = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expires_at * 1000, // Convert to ms
      scope: tokens.scope,
    }

    setSetting('strava_tokens', oauthTokens)
    setSetting('strava_connected', true)
    setSetting('strava_athlete', tokens.athlete)

    res.send(`
      <html>
        <body style="font-family: system-ui; padding: 40px; text-align: center; background: #000; color: #fff;">
          <h1 style="color: #22c55e;">✓ Connected to Strava!</h1>
          <p>Welcome, ${tokens.athlete?.firstname || 'Athlete'}!</p>
          <p style="color: #888;">You can close this window and return to your dashboard.</p>
        </body>
      </html>
    `)
  } catch (err) {
    console.error('Strava OAuth error:', err)
    res.status(500).send(`
      <html>
        <body style="font-family: system-ui; padding: 40px; text-align: center;">
          <h1>Connection Failed</h1>
          <p>${err instanceof Error ? err.message : 'Unknown error'}</p>
        </body>
      </html>
    `)
  }
})

// ============================================
// SPOTIFY OAUTH
// ============================================

app.get('/oauth/spotify/start', (_req: Request, res: Response) => {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  if (!clientId) {
    return res.status(500).send('Spotify client ID not configured')
  }

  const ip = getLocalIP()
  const port = process.env.AUTH_SERVER_PORT || '3847'
  const redirectUri = `http://${ip}:${port}/oauth/spotify/callback`

  const authUrl = new URL('https://accounts.spotify.com/authorize')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('scope', 'user-read-currently-playing user-read-playback-state')

  res.redirect(authUrl.toString())
})

app.get('/oauth/spotify/callback', async (req: Request, res: Response) => {
  const { code, error } = req.query

  if (error) {
    return res.send(`
      <html>
        <body style="font-family: system-ui; padding: 40px; text-align: center;">
          <h1>Authorization Failed</h1>
          <p>Error: ${error}</p>
          <p>You can close this window.</p>
        </body>
      </html>
    `)
  }

  if (!code || typeof code !== 'string') {
    return res.status(400).send('Missing authorization code')
  }

  try {
    const ip = getLocalIP()
    const port = process.env.AUTH_SERVER_PORT || '3847'
    const redirectUri = `http://${ip}:${port}/oauth/spotify/callback`

    // Exchange code for tokens
    const credentials = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString('base64')

    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    })

    const tokens = await tokenResponse.json()

    if (!tokenResponse.ok) {
      throw new Error(tokens.error_description || 'Token exchange failed')
    }

    // Store tokens
    const oauthTokens: OAuthTokens = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
      scope: tokens.scope,
    }

    setSetting('spotify_tokens', oauthTokens)
    setSetting('spotify_connected', true)

    res.send(`
      <html>
        <body style="font-family: system-ui; padding: 40px; text-align: center; background: #000; color: #fff;">
          <h1 style="color: #1DB954;">✓ Connected to Spotify!</h1>
          <p style="color: #888;">You can close this window and return to your dashboard.</p>
        </body>
      </html>
    `)
  } catch (err) {
    console.error('Spotify OAuth error:', err)
    res.status(500).send(`
      <html>
        <body style="font-family: system-ui; padding: 40px; text-align: center;">
          <h1>Connection Failed</h1>
          <p>${err instanceof Error ? err.message : 'Unknown error'}</p>
        </body>
      </html>
    `)
  }
})

// ============================================
// HEALTH DATA ENDPOINT
// ============================================

app.post('/health', (req: Request, res: Response) => {
  // Verify shared secret
  const authHeader = req.headers.authorization
  const expectedSecret = process.env.HEALTH_SYNC_SHARED_SECRET

  if (!expectedSecret) {
    return res.status(500).json({ error: 'Health sync not configured' })
  }

  if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Validate payload
  const result = validateHealthPayload(req.body)
  if (!result.success) {
    return res.status(400).json({
      error: 'Invalid payload',
      details: result.error.issues,
    })
  }

  try {
    const { getDatabase } = require('../db/database')
    const db = getDatabase()

    // Insert health snapshot
    db.prepare(
      `
      INSERT INTO health_snapshots (ts, steps, active_cals, sleep_minutes, raw_json)
      VALUES (?, ?, ?, ?, ?)
    `
    ).run(
      result.data.timestamp,
      result.data.steps,
      result.data.activeCalories,
      result.data.sleepMinutes,
      JSON.stringify(req.body)
    )

    // Update sync status
    const { setLastSync } = require('../db/database')
    setLastSync('health', Date.now())

    res.json({ success: true, timestamp: result.data.timestamp })
  } catch (err) {
    console.error('Health data save error:', err)
    res.status(500).json({ error: 'Failed to save health data' })
  }
})

// ============================================
// QR CODE GENERATION
// ============================================

app.get('/qr/:service', async (req: Request, res: Response) => {
  const { service } = req.params
  const ip = getLocalIP()
  const port = process.env.AUTH_SERVER_PORT || '3847'

  let url: string
  switch (service) {
    case 'strava':
      url = `http://${ip}:${port}/oauth/strava/start`
      break
    case 'spotify':
      url = `http://${ip}:${port}/oauth/spotify/start`
      break
    case 'health':
      url = `http://${ip}:${port}/health-info`
      break
    default:
      return res.status(404).send('Unknown service')
  }

  try {
    const qr = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
    res.json({ url, qr })
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate QR code' })
  }
})

// Health endpoint info page
app.get('/health-info', (_req: Request, res: Response) => {
  const ip = getLocalIP()
  const port = process.env.AUTH_SERVER_PORT || '3847'

  res.send(`
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: system-ui; padding: 20px; background: #000; color: #fff; }
          code { background: #333; padding: 2px 8px; border-radius: 4px; }
          pre { background: #333; padding: 16px; border-radius: 8px; overflow-x: auto; }
        </style>
      </head>
      <body>
        <h1>Health Sync Endpoint</h1>
        <p><strong>URL:</strong> <code>http://${ip}:${port}/health</code></p>
        <p><strong>Method:</strong> POST</p>
        <p><strong>Headers:</strong></p>
        <pre>Authorization: Bearer YOUR_SHARED_SECRET
Content-Type: application/json</pre>
        <p><strong>Body:</strong></p>
        <pre>{
  "steps": 8000,
  "activeCalories": 450,
  "sleepMinutes": 420,
  "timestamp": 1705766400000
}</pre>
        <p style="color: #888;">Configure your iPhone Shortcuts app to POST to this endpoint.</p>
      </body>
    </html>
  `)
})

// ============================================
// SERVER CONTROL
// ============================================

export function startAuthServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    const port = parseInt(process.env.AUTH_SERVER_PORT || '3847', 10)

    server = app.listen(port, '0.0.0.0', () => {
      console.log(`Auth server listening on http://0.0.0.0:${port}`)
      console.log(`Local IP: ${getLocalIP()}`)
      resolve()
    })

    server.on('error', err => {
      console.error('Auth server error:', err)
      reject(err)
    })
  })
}

export function stopAuthServer(): Promise<void> {
  return new Promise(resolve => {
    if (server) {
      server.close(() => {
        server = null
        resolve()
      })
    } else {
      resolve()
    }
  })
}

export function getAuthServerInfo() {
  const ip = getLocalIP()
  const port = process.env.AUTH_SERVER_PORT || '3847'
  return {
    ip,
    port: parseInt(port, 10),
    baseUrl: `http://${ip}:${port}`,
  }
}
