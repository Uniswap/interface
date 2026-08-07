import { renderHook } from '@testing-library/react'
import { useLocation, useParams } from 'react-router'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useAssetShelfChainId } from '~/pages/Explore/hooks/useAssetShelfChainId'
import { mocked } from '~/test-utils/mocked'

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()
  return {
    ...actual,
    useParams: vi.fn(),
    useLocation: vi.fn(),
  }
})

function setRoute({ pathname, tab, chainName }: { pathname: string; tab?: string; chainName?: string }): void {
  mocked(useParams).mockReturnValue({ tab, chainName })
  mocked(useLocation).mockReturnValue({ pathname, search: '', hash: '', state: null, key: 'test' })
}

describe('useAssetShelfChainId', () => {
  it('returns the chain filter on the Tokens tab', () => {
    setRoute({ pathname: '/explore/tokens/ethereum', tab: 'tokens', chainName: 'ethereum' })

    const { result } = renderHook(() => useAssetShelfChainId())

    expect(result.current).toBe(UniverseChainId.Mainnet)
  })

  it('returns the chain filter on chain-only explore URLs', () => {
    setRoute({ pathname: '/explore/ethereum', tab: 'ethereum' })

    const { result } = renderHook(() => useAssetShelfChainId())

    expect(result.current).toBe(UniverseChainId.Mainnet)
  })

  it('ignores the chain filter on the Auctions tab', () => {
    setRoute({ pathname: '/explore/auctions/base', tab: 'auctions', chainName: 'base' })

    const { result } = renderHook(() => useAssetShelfChainId())

    expect(result.current).toBeUndefined()
  })

  it('ignores the chain filter on the Pools tab', () => {
    setRoute({ pathname: '/explore/pools/base', tab: 'pools', chainName: 'base' })

    const { result } = renderHook(() => useAssetShelfChainId())

    expect(result.current).toBeUndefined()
  })

  it('ignores the chain filter on the Transactions tab', () => {
    setRoute({ pathname: '/explore/transactions/base', tab: 'transactions', chainName: 'base' })

    const { result } = renderHook(() => useAssetShelfChainId())

    expect(result.current).toBeUndefined()
  })

  it('returns undefined when no chain filter is set', () => {
    setRoute({ pathname: '/explore/auctions', tab: 'auctions' })

    const { result } = renderHook(() => useAssetShelfChainId())

    expect(result.current).toBeUndefined()
  })
})
