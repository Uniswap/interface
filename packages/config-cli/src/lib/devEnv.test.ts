import dotenv from 'dotenv'
import { describe, expect, it } from 'vitest'
import { reconcileDevEnv } from './devEnv'

const HEADER = `# This file contains the minimal dev-env configs required to run this app.
# It should not be modified directly.
`

describe('reconcileDevEnv', () => {
  it('updates the value of an existing key and preserves the header comments', () => {
    const existing = `${HEADER}APP_ID="web"\nALCHEMY_API_KEY="old"\n`

    const { content, updatedKeys } = reconcileDevEnv(existing, { APP_ID: 'web', ALCHEMY_API_KEY: 'new' })

    expect(content).toBe(`${HEADER}APP_ID="web"\nALCHEMY_API_KEY="new"\n`)
    expect(updatedKeys).toEqual(['ALCHEMY_API_KEY'])
  })

  it('does not add keys that exist only in the fetched config', () => {
    const existing = `${HEADER}APP_ID="web"\n`

    const { content, updatedKeys } = reconcileDevEnv(existing, { APP_ID: 'web', BRAND_NEW_KEY: 'nope' })

    expect(dotenv.parse(content)).toEqual({ APP_ID: 'web' })
    expect(content).not.toContain('BRAND_NEW_KEY')
    expect(updatedKeys).toEqual([])
  })

  it('leaves existing keys absent from the fetched config untouched', () => {
    const existing = `${HEADER}APP_ID="web"\nLOCAL_ONLY="keep"\n`

    const { content, updatedKeys } = reconcileDevEnv(existing, { APP_ID: 'changed' })

    expect(content).toBe(`${HEADER}APP_ID="changed"\nLOCAL_ONLY="keep"\n`)
    expect(updatedKeys).toEqual(['APP_ID'])
  })

  it('reports nothing and leaves content byte-identical when all values match', () => {
    const existing = `${HEADER}APP_ID="web"\nINFURA_KEY="abc"\n`

    const { content, updatedKeys } = reconcileDevEnv(existing, { APP_ID: 'web', INFURA_KEY: 'abc' })

    expect(content).toBe(existing)
    expect(updatedKeys).toEqual([])
  })

  it('preserves comments, blank lines, and key ordering while updating values', () => {
    const existing = `${HEADER}APP_ID="web"\n\n# section comment\nINFURA_KEY="old"\n`

    const { content, updatedKeys } = reconcileDevEnv(existing, { APP_ID: 'web', INFURA_KEY: 'fresh' })

    expect(content).toBe(`${HEADER}APP_ID="web"\n\n# section comment\nINFURA_KEY="fresh"\n`)
    expect(updatedKeys).toEqual(['INFURA_KEY'])
  })

  it('escapes multi-line updated values so they round-trip through dotenv', () => {
    const existing = `${HEADER}TOKEN="old"\n`

    const { content } = reconcileDevEnv(existing, { TOKEN: 'line1\nline2' })

    expect(dotenv.parse(content).TOKEN).toBe('line1\nline2')
  })
})
