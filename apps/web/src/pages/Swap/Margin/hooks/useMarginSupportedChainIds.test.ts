import { UniverseChainId } from '@universe/chains'
import { describe, expect, it } from 'vitest'
import { resolveMarginSupportedChainIds } from '~/pages/Swap/Margin/hooks/useMarginSupportedChainIds'

describe('resolveMarginSupportedChainIds', () => {
  it('passes through the configured chains', () => {
    expect(resolveMarginSupportedChainIds([UniverseChainId.Mainnet, UniverseChainId.Base])).toEqual([
      UniverseChainId.Mainnet,
      UniverseChainId.Base,
    ])
  })

  it('drops a chain the app does not know', () => {
    expect(resolveMarginSupportedChainIds([UniverseChainId.Base, 999_999])).toEqual([UniverseChainId.Base])
  })

  it('falls back to mainnet when nothing usable is configured', () => {
    expect(resolveMarginSupportedChainIds([])).toEqual([UniverseChainId.Mainnet])
    expect(resolveMarginSupportedChainIds([999_999])).toEqual([UniverseChainId.Mainnet])
  })
})
