import type { PlainMessage } from '@bufbuild/protobuf'
import { onlineManager } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import { AuctionType, type Auction } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { Token } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import type { ReactNode } from 'react'
import { useAuctionDisplayDataSources } from '~/features/Toucan/Auction/hooks/useAuctionDisplayDataSources'
import { createTDPStore, type TDPState } from '~/pages/TokenDetails/context/createTDPStore'
import { TDPStoreContext } from '~/pages/TokenDetails/context/TDPContext'
import { TokenDetailsAuctionDisplayProvider } from '~/pages/TokenDetails/context/TokenDetailsAuctionDisplayProvider'
import { TokenDetailsSourceState } from '~/pages/TokenDetails/context/tokenDetailsSourceState'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import type { TokenDetailsAuctionSource } from '~/pages/TokenDetails/hooks/useTokenDetailsAuction'
import { useTokenDetailsAuctionDisplay } from '~/pages/TokenDetails/hooks/useTokenDetailsAuctionDisplay'

vi.mock('~/features/Toucan/Auction/hooks/useAuctionDisplayDataSources', () => ({
  useAuctionDisplayDataSources: vi.fn(),
}))

const tokenA = new Token(UniverseChainId.Mainnet, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 18)
const tokenB = new Token(UniverseChainId.Base, '0x2222222222222222222222222222222222222222', 18)
const auction = {
  address: '0x1111111111111111111111111111111111111111',
  tokenAddress: tokenA.address,
  auctionType: AuctionType.CUSTOM,
  startBlock: '100',
  endBlock: '200',
} as PlainMessage<Auction>
const sources = {
  currentBlock: { status: 'success', blockNumber: 150n },
  currencyRaised: { status: 'idle' },
  pools: { status: 'loading' },
  refetchCurrentBlock: vi.fn(),
  refetchCheckpoint: vi.fn(),
} as const

function createPageState({
  token = tokenA,
  auctionSource = { status: TokenDetailsSourceState.Found, auction, auctions: [auction] },
  isPageReady = true,
}: {
  token?: Token
  auctionSource?: TokenDetailsAuctionSource
  isPageReady?: boolean
} = {}): TDPState {
  return {
    currencyChain: token.chainId === UniverseChainId.Base ? GraphQLApi.Chain.Base : GraphQLApi.Chain.Ethereum,
    currencyChainId: token.chainId as UniverseChainId,
    address: token.address,
    currency: isPageReady ? token : undefined,
    multiChainMap: {},
    selectedMultichainChainId: undefined,
    pathTokenDbAddress: token.address,
    token: undefined,
    multichainToken: undefined,
    multichainTokenLoaded: isPageReady,
    pageQueryLoading: !isPageReady,
    auctionSource,
    chainDataLoading: !isPageReady,
  }
}

function createWrapper(store: ReturnType<typeof createTDPStore>) {
  return function Wrapper({ children }: { children: ReactNode }): JSX.Element {
    return (
      <TDPStoreContext.Provider value={store}>
        <TokenDetailsAuctionDisplayProvider>{children}</TokenDetailsAuctionDisplayProvider>
      </TDPStoreContext.Provider>
    )
  }
}

describe('TokenDetailsAuctionDisplayProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    onlineManager.setOnline(true)
    vi.mocked(useAuctionDisplayDataSources).mockReturnValue(sources)
  })

  afterEach(() => onlineManager.setOnline(true))

  it('starts one shared display source before canonical content and fails open offline', () => {
    const store = createTDPStore(createPageState({ isPageReady: false }))
    const { result } = renderHook(() => [useTokenDetailsAuctionDisplay(), useTokenDetailsAuctionDisplay()], {
      wrapper: createWrapper(store),
    })

    expect(useAuctionDisplayDataSources).toHaveBeenCalledOnce()
    expect(useAuctionDisplayDataSources).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }))
    expect(result.current[0]).toBe(result.current[1])
    expect(result.current[0]?.isInitialLoading).toBe(false)

    act(() => store.setState({ currency: tokenA, pageQueryLoading: false }))
    expect(result.current[0]?.isInitialLoading).toBe(true)

    act(() => onlineManager.setOnline(false))
    expect(result.current[0]?.isInitialLoading).toBe(false)
    act(() => onlineManager.setOnline(true))
    expect(result.current[0]?.isInitialLoading).toBe(false)
  })

  it('leaves display queries disabled without an eligible auction', () => {
    const store = createTDPStore(createPageState({ auctionSource: { status: TokenDetailsSourceState.Disabled } }))
    const { result } = renderHook(() => useTokenDetailsAuctionDisplay(), { wrapper: createWrapper(store) })

    expect(useAuctionDisplayDataSources).toHaveBeenLastCalledWith(expect.objectContaining({ enabled: false }))
    expect(result.current.auction).toBeUndefined()
    expect(result.current.isInitialLoading).toBe(false)
  })

  it('keeps canonical and auction identities together across route loading and resolution', () => {
    vi.mocked(useAuctionDisplayDataSources).mockReturnValue({ ...sources, pools: { status: 'success', poolCount: 1 } })
    const store = createTDPStore(createPageState())
    const snapshots: {
      address: string
      auctionToken: string | undefined
      chainId: number
      auctionChainId: number | undefined
    }[] = []
    const { result } = renderHook(
      () => {
        const canonical = useTDPStore((state) => ({
          address: state.address,
          currency: state.currency,
          currencyChainId: state.currencyChainId,
          pageQueryLoading: state.pageQueryLoading,
        }))
        const display = useTokenDetailsAuctionDisplay()
        snapshots.push({
          address: canonical.address,
          auctionToken: display.auction?.tokenAddress,
          chainId: canonical.currencyChainId,
          auctionChainId: display.chainId,
        })
        return { canonical, display }
      },
      { wrapper: createWrapper(store) },
    )
    expect(result.current.canonical.currency).toBe(tokenA)
    expect(result.current.display.isInitialLoading).toBe(false)

    const auctionB = {
      ...auction,
      address: '0x3333333333333333333333333333333333333333',
      tokenAddress: tokenB.address,
    }
    vi.mocked(useAuctionDisplayDataSources).mockReturnValue(sources)
    act(() =>
      store.setState(
        createPageState({
          token: tokenB,
          auctionSource: { status: TokenDetailsSourceState.Found, auction: auctionB, auctions: [auctionB] },
          isPageReady: false,
        }),
      ),
    )

    expect(result.current.canonical.address).toBe(tokenB.address)
    expect(result.current.canonical.currency).toBeUndefined()
    expect(result.current.canonical.pageQueryLoading).toBe(true)
    expect(result.current.display.auction).toBe(auctionB)
    expect(result.current.display.chainId).toBe(UniverseChainId.Base)
    expect(result.current.display.isInitialLoading).toBe(false)
    expect(useAuctionDisplayDataSources).toHaveBeenLastCalledWith(
      expect.objectContaining({ chainId: UniverseChainId.Base, tokenAddress: tokenB.address, enabled: true }),
    )

    act(() => store.setState({ currency: tokenB, pageQueryLoading: false }))
    expect(result.current.canonical.currency).toBe(tokenB)
    expect(result.current.display.isInitialLoading).toBe(true)
    expect(snapshots.some(({ address }) => address === tokenA.address)).toBe(true)
    expect(snapshots.some(({ address }) => address === tokenB.address)).toBe(true)
    for (const snapshot of snapshots) {
      expect(snapshot.auctionToken).toBe(snapshot.address)
      expect(snapshot.auctionChainId).toBe(snapshot.chainId)
    }
  })

  it('keeps the chain head advancing until the last sibling auction ends', () => {
    const primary = { ...auction, chainId: UniverseChainId.Mainnet }
    const sibling = { ...primary, address: '0x4444444444444444444444444444444444444444', endBlock: '500' }
    const malformed = { ...primary, address: '0x5555555555555555555555555555555555555555', endBlock: 'later' }
    const store = createTDPStore(
      createPageState({
        auctionSource: {
          status: TokenDetailsSourceState.Found,
          auction: primary,
          auctions: [primary, sibling, malformed],
        },
      }),
    )
    renderHook(() => useTokenDetailsAuctionDisplay(), { wrapper: createWrapper(store) })

    // Without this the head freezes at the primary's end block and the ended sibling stays Live,
    // dropping silently out of the token-level raise.
    expect(useAuctionDisplayDataSources).toHaveBeenLastCalledWith(
      expect.objectContaining({ endBlock: '200', watchUntilBlock: 500n }),
    )
  })

  it('does not rearm initial loading when canonical metadata only checksums the same address', () => {
    vi.mocked(useAuctionDisplayDataSources).mockReturnValue({ ...sources, pools: { status: 'success', poolCount: 1 } })
    const store = createTDPStore({ ...createPageState(), address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' })
    const { result } = renderHook(() => useTokenDetailsAuctionDisplay(), { wrapper: createWrapper(store) })
    expect(result.current.isInitialLoading).toBe(false)

    vi.mocked(useAuctionDisplayDataSources).mockReturnValue(sources)
    act(() => store.setState({ address: tokenA.address }))
    expect(result.current.isInitialLoading).toBe(false)
  })
})
