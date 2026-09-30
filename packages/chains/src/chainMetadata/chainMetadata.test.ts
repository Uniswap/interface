import { describe, expect, it } from 'vitest'
import { UniverseChainId } from '../rpc/types'
import { CHAIN_METADATA, getChainMetadata } from './chainMetadata'

// Beyond table sanity, this test's job is being an import of the module in a
// non-DOM, non-react-native runtime — it fails if a heavyweight dependency
// ever creeps into the module graph.
describe('CHAIN_METADATA', () => {
  const ids = Object.values(UniverseChainId).filter((v): v is UniverseChainId => typeof v === 'number')

  it('every entry id matches its key', () => {
    for (const id of ids) {
      expect(CHAIN_METADATA[id].id).toBe(id)
    }
  })

  it('urlParams are unique', () => {
    const params = ids.map((id) => CHAIN_METADATA[id].urlParam)
    expect(new Set(params).size).toBe(params.length)
  })

  it('labels are unique', () => {
    const labels = ids.map((id) => CHAIN_METADATA[id].label)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('explorer urls have no trailing slash', () => {
    for (const id of ids) {
      expect(CHAIN_METADATA[id].explorer.url, CHAIN_METADATA[id].label).not.toMatch(/\/$/)
    }
  })

  it('getChainMetadata round-trips every id', () => {
    for (const id of ids) {
      expect(getChainMetadata(id)).toBe(CHAIN_METADATA[id])
    }
  })
})
