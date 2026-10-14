import { useInfiniteQuery } from '@tanstack/react-query'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { UniswapTransaction } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { TransactionEventType } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { UniverseChainId } from '@universe/chains'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { parseUniswapTransaction } from '~/data/transactions/poolTransaction'
import {
  PoolTableTransactionType,
  usePoolTransactions,
} from '~/features/Explore/state/transactions/usePoolTransactions'
import { renderHook } from '~/test-utils/render'

const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const POOL = '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640'

/**
 * Shaped after a real prod `data.v2.DataApiService/ListTransactions` row for the V3 USDC/WETH pool.
 * `amount` is signed pool-perspective: positive = the token entered the pool (was sold into it).
 */
function makeSwap({ amount0, amount1 }: { amount0: string; amount1: string }): UniswapTransaction {
  return {
    chainId: UniverseChainId.Mainnet,
    txHash: '0x079583b45ddad76014b5dd715f5c8d98b286db3c9e2b1116a15e95b82987d2c6',
    timestampMs: 1786457483000n,
    eventType: TransactionEventType.SWAP,
    protocolVersion: ProtocolVersion.V3,
    poolId: POOL,
    token0: { token: { address: USDC, symbol: 'USDC', decimals: 6 }, amount: amount0, amountUsd: 0 },
    token1: { token: { address: WETH, symbol: 'WETH', decimals: 18 }, amount: amount1, amountUsd: 0 },
    amountUsd: 1073.641222,
    walletAddress: '0x877De639Be016122bb09177e1bb0Fe44ba363ab3',
  } as unknown as UniswapTransaction
}

vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useInfiniteQuery: vi.fn(),
}))

// Kept behaving like the real factory; wrapped only so the request it is handed can be asserted on.
vi.mock('uniswap/src/data/apiClients/dataApiService/transactions/queries', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('uniswap/src/data/apiClients/dataApiService/transactions/queries')>()
  return { ...actual, getListTransactionsQueryOptions: vi.fn(actual.getListTransactionsQueryOptions) }
})

function mockListTransactions(transactions: UniswapTransaction[]) {
  vi.mocked(useInfiniteQuery).mockReturnValue({
    data: { pages: [{ transactions }], pageParams: [''] },
    isLoading: false,
    error: null,
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
  } as never)
}

function renderWithTransactions(transactions: UniswapTransaction[], token0Address: string = USDC) {
  mockListTransactions(transactions)

  return renderHook(() =>
    usePoolTransactions({
      address: POOL,
      chainId: UniverseChainId.Mainnet,
      token0Address,
    }),
  )
}

describe('parseUniswapTransaction', () => {
  it('passes signed amounts through verbatim, preserving the pool-perspective sign', () => {
    const tx = parseUniswapTransaction(makeSwap({ amount0: '1073.641222', amount1: '-0.5687271982190263' }), 0)

    expect(tx?.token0Quantity).toBe('1073.641222')
    expect(tx?.token1Quantity).toBe('-0.5687271982190263')
  })
})

describe('usePoolTransactions buy/sell derivation', () => {
  // Pins the sign convention end to end: a positive token0 amount means token0 entered the pool,
  // i.e. the maker sold token0. Inverting the convention flips every row's label.
  it('labels a positive token0 amount as SELL (token0 was sold into the pool)', () => {
    const { result } = renderWithTransactions([makeSwap({ amount0: '1073.641222', amount1: '-0.5687271982190263' })])

    expect(result.current.transactions).toHaveLength(1)
    expect(result.current.transactions[0]?.type).toBe(PoolTableTransactionType.SELL)
  })

  it('labels a negative token0 amount as BUY (token0 left the pool)', () => {
    const { result } = renderWithTransactions([makeSwap({ amount0: '-1073.641222', amount1: '0.5687271982190263' })])

    expect(result.current.transactions).toHaveLength(1)
    expect(result.current.transactions[0]?.type).toBe(PoolTableTransactionType.BUY)
  })

  // token0Address arrives as the NATIVE_CHAIN_ID sentinel for a native-token0 pool, and the parser
  // represents a native leg as an absent address (see ParsedToken) — the two must still
  // resolve to the same wrapped-native address or every swap on the pool mislabels as BUY.
  it('labels a sold native token0 as SELL (native leg matches the wrapped-native token0 address)', () => {
    const nativeSwap = {
      ...makeSwap({ amount0: '1073.641222', amount1: '-0.5687271982190263' }),
      token0: { token: { symbol: 'ETH', decimals: 18 }, amount: '1073.641222', amountUsd: 0 },
    } as unknown as UniswapTransaction

    const { result } = renderWithTransactions([nativeSwap], NATIVE_CHAIN_ID)

    expect(result.current.transactions).toHaveLength(1)
    expect(result.current.transactions[0]?.type).toBe(PoolTableTransactionType.SELL)
    // The table's column mapping compares this id against the wrapped-native address (see
    // comparePoolTokens); leaving it null here — the raw, unresolved leg address — would make
    // that comparison always false and swap the amount columns even though the label is correct.
    expect(result.current.transactions[0]?.pool.token0.id).toBe(WETH)
  })

  // The data API sends a v4 native leg with the zero address, not an absent one.
  describe('v4 native leg with the zero address', () => {
    const nativeLeg = { address: ZERO_ADDRESS, symbol: 'ETH', decimals: 18 }
    const makeNativeSwap = ({ amount0, amount1 }: { amount0: string; amount1: string }) =>
      ({
        ...makeSwap({ amount0, amount1 }),
        protocolVersion: ProtocolVersion.V4,
        token0: { token: nativeLeg, amount: amount0, amountUsd: 0 },
        token1: { token: { address: USDC, symbol: 'USDC', decimals: 6 }, amount: amount1, amountUsd: 0 },
      }) as unknown as UniswapTransaction

    it('resolves the native leg id to the wrapped-native address', () => {
      const { result } = renderWithTransactions(
        [makeNativeSwap({ amount0: '0.0238', amount1: '-58.686798' })],
        NATIVE_CHAIN_ID,
      )

      expect(result.current.transactions[0]?.pool.token0.id).toBe(WETH)
      expect(result.current.transactions[0]?.pool.token1.id).toBe(USDC)
    })

    it('labels ETH sold into the pool as SELL', () => {
      const { result } = renderWithTransactions(
        [makeNativeSwap({ amount0: '0.0238', amount1: '-58.686798' })],
        NATIVE_CHAIN_ID,
      )

      expect(result.current.transactions[0]?.type).toBe(PoolTableTransactionType.SELL)
    })

    it('labels ETH bought from the pool as BUY', () => {
      const { result } = renderWithTransactions(
        [makeNativeSwap({ amount0: '-0.0238', amount1: '58.686798' })],
        NATIVE_CHAIN_ID,
      )

      expect(result.current.transactions[0]?.type).toBe(PoolTableTransactionType.BUY)
    })
  })
})

function renderPoolTransactions({
  token0Address,
  isPoolDataLoading,
}: {
  token0Address?: string
  isPoolDataLoading?: boolean
}) {
  return renderHook(() =>
    usePoolTransactions({
      address: POOL,
      chainId: UniverseChainId.Mainnet,
      token0Address,
      isPoolDataLoading,
    }),
  )
}

describe('usePoolTransactions labelling while pool data is unresolved', () => {
  // token0 arrives from the same pool query as protocolVersion. Until it does, a swap's input token
  // matches nothing, so an unguarded derivation labels every swap BUY — including this row, which
  // sold token0 into the pool and must read SELL once the pool resolves.
  const soldToken0 = { amount0: '1073.641222', amount1: '-0.5687271982190263' }

  it('withholds data-api v2 rows until token0 resolves', () => {
    mockListTransactions([makeSwap(soldToken0)])

    const { result } = renderPoolTransactions({
      token0Address: undefined,
      isPoolDataLoading: true,
    })

    expect(result.current.transactions).toEqual([])
    expect(result.current.loading).toBe(true)
  })

  // The withhold above must not be able to outlive the pool query. If it settles without a token0
  // (it errored, or the pool does not exist) the hook has to stop claiming `loading`, otherwise the
  // table is pinned in skeletons forever and its error/empty state is never reachable.
  it('stops reporting loading once the pool query settles without a token0', () => {
    mockListTransactions([makeSwap(soldToken0)])

    const { result } = renderPoolTransactions({
      token0Address: undefined,
      isPoolDataLoading: false,
    })

    expect(result.current.loading).toBe(false)
    // Still never labelled from an unresolved token0 — the table shows its empty state instead.
    expect(result.current.transactions).toEqual([])
  })
})
