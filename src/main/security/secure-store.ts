import { safeStorage } from 'electron'
import { Buffer } from 'node:buffer'
import { deleteSetting, getSetting, setSetting } from '../db/database'

type SecurePayload = {
  encrypted: boolean
  value: string
}

const SECURE_PREFIX = 'secure:'

function buildKey(key: string): string {
  return `${SECURE_PREFIX}${key}`
}

export function saveSecureValue(key: string, secret: string): void {
  const storageKey = buildKey(key)

  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(secret)
    setSetting(storageKey, {
      encrypted: true,
      value: encrypted.toString('base64'),
    } satisfies SecurePayload)
    return
  }

  setSetting(storageKey, {
    encrypted: false,
    value: secret,
  } satisfies SecurePayload)
}

export function getSecureValue(key: string): string | null {
  const storageKey = buildKey(key)
  const payload = getSetting<SecurePayload | null>(storageKey, null)

  if (!payload) {
    return null
  }

  if (!payload.encrypted) {
    return payload.value
  }

  try {
    const buffer = Buffer.from(payload.value, 'base64')
    return safeStorage.decryptString(buffer)
  } catch (error) {
    console.error(`Failed to decrypt secure setting "${key}"`, error)
    return null
  }
}

export function hasSecureValue(key: string): boolean {
  return getSecureValue(key) !== null
}

export function clearSecureValue(key: string): void {
  deleteSetting(buildKey(key))
}
