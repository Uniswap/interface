import { GraphQLApi } from '@universe/api'
import { useContext, useEffect } from 'react'
import { useParams } from 'react-router'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { createTDPStore } from '~/pages/TokenDetails/context/createTDPStore'
import { TDPStoreContext } from '~/pages/TokenDetails/context/TDPContext'
import { TDPStoreContextProvider } from '~/pages/TokenDetails/context/TDPStoreContextProvider'
import { useCreateTDPContext } from '~/pages/TokenDetails/context/useCreateTDPContext'
import { mocked } from '~/test-utils/mocked'
import { render, waitFor } from '~/test-utils/render'
import { validTokenProjectResponse } from '~/test-utils/tokens/fixtures'

const TOKEN_A = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const TOKEN_B = '0x6B175474E89094C44Da98b954EedeAC495271d0F'

function createDerivedState(overrides: {
  address: string
  tokenQuery?: { loading: boolean; data?: unknown }
  tokenColor?: string
  balanceError?: Error
}) {
  return {
    state: {
      currencyChain: GraphQLApi.Chain.Ethereum,
      currencyChainId: UniverseChainId.Mainnet,
      address: overrides.address,
      tokenQuery: overrides.tokenQuery ?? {
        loading: false,
        data: validTokenProjectResponse.data,
      },
      multiChainMap: {},
      balanceError: overrides.balanceError,
      selectedMultichainChainId: undefined,
      tokenColor: overrides.tokenColor,
      currency: undefined,
    },
    balancesRefetch: vi.fn(),
  }
}

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()
  return {
    ...actual,
    useParams: vi.fn(),
  }
})

vi.mock('~/pages/TokenDetails/context/useCreateTDPContext', () => ({
  useCreateTDPContext: vi.fn(),
}))

/** Captures the TDP store from context into a ref for assertions */
function StoreCapture({ storeRef }: { storeRef: React.MutableRefObject<ReturnType<typeof createTDPStore> | null> }) {
  const store = useContext(TDPStoreContext)
  useEffect(() => {
    storeRef.current = store
  }, [store, storeRef])
  return null
}

function mockHeartbeat(overrides: Parameters<typeof createDerivedState>[0]) {
  mocked(useCreateTDPContext).mockReturnValue(
    createDerivedState(overrides) as unknown as ReturnType<typeof useCreateTDPContext>,
  )
}

describe('TDPStoreContextProvider', () => {
  beforeEach(() => {
    mocked(useParams).mockReturnValue({
      tokenAddress: TOKEN_A,
      chainName: 'ethereum',
    })
    mockHeartbeat({ address: TOKEN_A })
  })

  it('replaces full store state when identity changes (navigate to different token)', async () => {
    const storeRef = { current: null as ReturnType<typeof createTDPStore> | null }
    const { rerender } = render(
      <TDPStoreContextProvider>
        <StoreCapture storeRef={storeRef} />
      </TDPStoreContextProvider>,
    )

    await waitFor(() => {
      expect(storeRef.current).not.toBeNull()
    })
    expect(storeRef.current?.getState().address).toBe(TOKEN_A)

    // Simulate navigation to a different token: new URL params + new derived state
    mocked(useParams).mockReturnValue({
      tokenAddress: TOKEN_B,
      chainName: 'ethereum',
    })
    mockHeartbeat({ address: TOKEN_B })
    rerender(
      <TDPStoreContextProvider>
        <StoreCapture storeRef={storeRef} />
      </TDPStoreContextProvider>,
    )

    // Identity change path: effect runs setState({ ...derivedState }), so store is fully replaced
    await waitFor(() => {
      expect(storeRef.current?.getState().address).toBe(TOKEN_B)
    })
  })

  it('applies partial updates when identity is unchanged but derived state changes', async () => {
    const initialTokenQuery = { loading: false, data: validTokenProjectResponse.data }
    const updatedTokenQuery = { loading: false, data: { ...validTokenProjectResponse.data } }
    mockHeartbeat({ address: TOKEN_A, tokenQuery: initialTokenQuery })

    const storeRef = { current: null as ReturnType<typeof createTDPStore> | null }
    const { rerender } = render(
      <TDPStoreContextProvider>
        <StoreCapture storeRef={storeRef} />
      </TDPStoreContextProvider>,
    )

    await waitFor(() => {
      expect(storeRef.current).not.toBeNull()
    })
    expect(storeRef.current?.getState().address).toBe(TOKEN_A)

    // Same identity (params unchanged), but derived state has new tokenQuery reference
    mockHeartbeat({ address: TOKEN_A, tokenQuery: updatedTokenQuery })
    rerender(
      <TDPStoreContextProvider>
        <StoreCapture storeRef={storeRef} />
      </TDPStoreContextProvider>,
    )

    // Partial update path: address unchanged, tokenQuery updated via setTokenQuery
    await waitFor(() => {
      expect(storeRef.current?.getState().address).toBe(TOKEN_A)
      expect(storeRef.current?.getState().tokenQuery).toEqual(updatedTokenQuery)
    })
  })

  it('updates only tokenColor when only tokenColor changes (same identity)', async () => {
    mockHeartbeat({ address: TOKEN_A, tokenColor: undefined })

    const storeRef = { current: null as ReturnType<typeof createTDPStore> | null }
    const { rerender } = render(
      <TDPStoreContextProvider>
        <StoreCapture storeRef={storeRef} />
      </TDPStoreContextProvider>,
    )

    await waitFor(() => {
      expect(storeRef.current).not.toBeNull()
    })
    expect(storeRef.current?.getState().tokenColor).toBeUndefined()

    mockHeartbeat({ address: TOKEN_A, tokenColor: '#FF0000' })
    rerender(
      <TDPStoreContextProvider>
        <StoreCapture storeRef={storeRef} />
      </TDPStoreContextProvider>,
    )

    await waitFor(() => {
      expect(storeRef.current?.getState().address).toBe(TOKEN_A)
      expect(storeRef.current?.getState().tokenColor).toBe('#FF0000')
    })
  })

  it('updates the raw balance query error when identity is unchanged', async () => {
    mockHeartbeat({ address: TOKEN_A, balanceError: undefined })

    const storeRef = { current: null as ReturnType<typeof createTDPStore> | null }
    const { rerender } = render(
      <TDPStoreContextProvider>
        <StoreCapture storeRef={storeRef} />
      </TDPStoreContextProvider>,
    )

    await waitFor(() => {
      expect(storeRef.current).not.toBeNull()
    })
    expect(storeRef.current?.getState().balanceError).toBeUndefined()

    mockHeartbeat({ address: TOKEN_A, balanceError: new Error('Network error') })
    rerender(
      <TDPStoreContextProvider>
        <StoreCapture storeRef={storeRef} />
      </TDPStoreContextProvider>,
    )

    await waitFor(() => {
      expect(storeRef.current?.getState().balanceError).toEqual(expect.any(Error))
    })
  })
})
