import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const TAG_LENGTH = 16

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) throw new Error('ENCRYPTION_KEY is not set')
  // Derive 32-byte key from the env string
  return createHash('sha256').update(key).digest()
}

export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()

  // Format: iv(12) + tag(16) + encrypted
  const combined = Buffer.concat([iv, tag, encrypted])
  return combined.toString('base64')
}

export function decrypt(ciphertext: string): string {
  const key = getKey()
  const combined = Buffer.from(ciphertext, 'base64')

  const iv = combined.subarray(0, IV_LENGTH)
  const tag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH)
  const encrypted = combined.subarray(IV_LENGTH + TAG_LENGTH)

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ])
  return decrypted.toString('utf8')
}
