import { describe, expect, it } from 'vitest'
import {
  TOKEN_IMAGE_STANDARDS,
  validateTokenImageFile,
} from '~/pages/Liquidity/CreateAuction/utils/selectTokenImageFile'

// Build a File with a controlled size without allocating real bytes.
function makeFile({ type, size = 1024 }: { type: string; size?: number }): File {
  const file = new File(['x'], 'logo', { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('TOKEN_IMAGE_STANDARDS', () => {
  it('caps at 2 MB', () => {
    expect(TOKEN_IMAGE_STANDARDS.maxFileSizeBytes).toBe(2 * 1024 * 1024)
  })

  it('allows gif so animated logos survive (unlike the avatar standards)', () => {
    expect(TOKEN_IMAGE_STANDARDS.allowedTypes).toContain('image/gif')
  })
})

describe('validateTokenImageFile', () => {
  it.each(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'])('accepts %s', (type) => {
    const file = makeFile({ type })
    expect(validateTokenImageFile(file)).toEqual({ kind: 'selected', file })
  })

  it.each(['image/svg+xml', 'application/pdf', 'text/plain', ''])('rejects %s as invalid-type', (type) => {
    expect(validateTokenImageFile(makeFile({ type }))).toEqual({ kind: 'invalid-type' })
  })

  it('rejects a file over 2 MB as too-large', () => {
    const file = makeFile({ type: 'image/png', size: TOKEN_IMAGE_STANDARDS.maxFileSizeBytes + 1 })
    expect(validateTokenImageFile(file)).toEqual({ kind: 'too-large' })
  })

  it('accepts a file exactly at the 2 MB boundary', () => {
    const file = makeFile({ type: 'image/png', size: TOKEN_IMAGE_STANDARDS.maxFileSizeBytes })
    expect(validateTokenImageFile(file)).toEqual({ kind: 'selected', file })
  })

  it('reports invalid-type before too-large when a file is both', () => {
    const file = makeFile({ type: 'image/svg+xml', size: TOKEN_IMAGE_STANDARDS.maxFileSizeBytes + 1 })
    expect(validateTokenImageFile(file)).toEqual({ kind: 'invalid-type' })
  })
})
