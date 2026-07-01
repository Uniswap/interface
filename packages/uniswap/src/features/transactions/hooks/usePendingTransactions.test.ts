import { TradingApi } from '@universe/api'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { usePendingTransactions } from 'uniswap/src/features/transactions/hooks/usePendingTransactions'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { TEST_WALLET } from 'uniswap/src/test/fixtures/wallet/addresses'
import { transactionDetails, uniswapXOrderDetails } from 'uniswap/src/test/fixtures/wallet/transactions'
import { renderHook } from 'uniswap/src/test/test-utils'

describe('usePendingTransactions', () => {
  it('excludes limit orders from the pending list', () => {
    const limit = uniswapXOrderDetails({
      id: '0xlimit',
      orderHash: '0xlimit',
      chainId: UniverseChainId.Mainnet,
      from: TEST_WALLET,
      routing: TradingApi.Routing.DUTCH_LIMIT,
      status: TransactionStatus.Pending,
    })
    const classic = transactionDetails({
      id: '0xclassic',
      hash: '0xclassic',
      chainId: UniverseChainId.Mainnet,
      from: TEST_WALLET,
      status: TransactionStatus.Pending,
    })
    const preloadedState = {
      transactions: {
        [TEST_WALLET]: { [UniverseChainId.Mainnet]: { '0xlimit': limit, '0xclassic': classic } },
      },
    }

    const { result } = renderHook(() => usePendingTransactions({ evmAddress: TEST_WALLET, svmAddress: null }), {
      preloadedState,
    })

    expect(result.current?.some((tx) => tx.id === '0xclassic')).toBe(true)
    expect(result.current?.some((tx) => tx.id === '0xlimit')).toBe(false)
  })
})
