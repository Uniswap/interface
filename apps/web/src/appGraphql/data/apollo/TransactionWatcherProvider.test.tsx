import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render as rtlRender } from '@testing-library/react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { vi } from 'vitest'
import { apolloClient } from '~/appGraphql/data/apollo/client'
import { TransactionWatcherProvider } from '~/appGraphql/data/apollo/TransactionWatcherProvider'
import { useAccount } from '~/hooks/useAccount'
import { useWatchTransactionsCallback } from '~/state/sagas/transactions/watcherSaga'
import { usePendingTransactions } from '~/state/transactions/hooks'
import { PendingTransactionDetails } from '~/state/transactions/types'
import { mocked } from '~/test-utils/mocked'
import { screen } from '~/test-utils/render'

vi.mock('~/hooks/useAccount')
vi.mock('~/state/transactions/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/state/transactions/hooks')>()
  return {
    ...actual,
    usePendingTransactions: vi.fn(),
  }
})
vi.mock('~/state/sagas/transactions/watcherSaga', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/state/sagas/transactions/watcherSaga')>()
  return {
    ...actual,
    useWatchTransactionsCallback: vi.fn(),
  }
})

const address = '0x0000000000000000000000000000000000000000'

function createPendingTransaction(id: string): PendingTransactionDetails {
  return {
    id,
    hash: id,
    chainId: UniverseChainId.Mainnet,
    status: TransactionStatus.Pending,
    addedTime: Date.now(),
    from: address,
    transactionOriginType: TransactionOriginType.Internal,
    typeInfo: {
      type: TransactionType.Approve,
      tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      spender: '0x0000000000000000000000000000000000000001',
      approvalAmount: '1000000',
    },
  } as PendingTransactionDetails
}

function renderTransactionWatcherProvider(queryClient = new QueryClient()) {
  const renderUi = () => (
    <QueryClientProvider client={queryClient}>
      <TransactionWatcherProvider>
        <div>child content</div>
      </TransactionWatcherProvider>
    </QueryClientProvider>
  )

  const result = rtlRender(renderUi())

  return {
    ...result,
    rerender: () => result.rerender(renderUi()),
  }
}

describe('TransactionWatcherProvider', () => {
  const mockWatchTransactions = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    mocked(useAccount).mockReturnValue({
      address,
      chainId: UniverseChainId.Mainnet,
      status: 'connected',
    } as unknown as ReturnType<typeof useAccount>)

    mocked(usePendingTransactions).mockReturnValue([])
    mocked(useWatchTransactionsCallback).mockReturnValue(mockWatchTransactions)
  })

  it('renders children', () => {
    renderTransactionWatcherProvider()

    expect(screen.getByText('child content')).toBeInTheDocument()
  })

  it('does not watch transactions when the account address is missing', () => {
    mocked(useAccount).mockReturnValue({
      address: undefined,
      chainId: UniverseChainId.Mainnet,
      status: 'disconnected',
    } as unknown as ReturnType<typeof useAccount>)

    const tx1 = createPendingTransaction('0x111')
    mocked(usePendingTransactions).mockReturnValueOnce([tx1]).mockReturnValueOnce([])

    const { rerender } = renderTransactionWatcherProvider()
    rerender()

    expect(mockWatchTransactions).not.toHaveBeenCalled()
  })

  it('does not watch transactions when the account chainId is missing', () => {
    mocked(useAccount).mockReturnValue({
      address,
      chainId: undefined,
      status: 'connected',
    } as unknown as ReturnType<typeof useAccount>)

    const tx1 = createPendingTransaction('0x111')
    mocked(usePendingTransactions).mockReturnValueOnce([tx1]).mockReturnValueOnce([])

    const { rerender } = renderTransactionWatcherProvider()
    rerender()

    expect(mockWatchTransactions).not.toHaveBeenCalled()
  })

  it('does not watch transactions on the initial render', () => {
    const tx1 = createPendingTransaction('0x111')
    mocked(usePendingTransactions).mockReturnValue([tx1])

    renderTransactionWatcherProvider()

    expect(mockWatchTransactions).not.toHaveBeenCalled()
  })

  it('does not watch transactions when the pending list is unchanged', () => {
    const tx1 = createPendingTransaction('0x111')
    mocked(usePendingTransactions).mockReturnValue([tx1])

    const { rerender } = renderTransactionWatcherProvider()
    rerender()

    expect(mockWatchTransactions).not.toHaveBeenCalled()
  })

  it('watches transactions when a pending transaction is removed', () => {
    const tx1 = createPendingTransaction('0x111')
    const tx2 = createPendingTransaction('0x222')
    mocked(usePendingTransactions).mockReturnValueOnce([tx1, tx2]).mockReturnValueOnce([tx2])

    const queryClient = new QueryClient()
    const { rerender } = renderTransactionWatcherProvider(queryClient)

    rerender()

    expect(mockWatchTransactions).toHaveBeenCalledTimes(1)
    expect(mockWatchTransactions).toHaveBeenCalledWith({
      address,
      chainId: UniverseChainId.Mainnet,
      pendingDiff: [tx1],
      apolloClient,
      queryClient,
    })
  })

  it('watches transactions when all pending transactions are cleared', () => {
    const tx1 = createPendingTransaction('0x111')
    mocked(usePendingTransactions).mockReturnValueOnce([tx1]).mockReturnValueOnce([])

    const queryClient = new QueryClient()
    const { rerender } = renderTransactionWatcherProvider(queryClient)

    rerender()

    expect(mockWatchTransactions).toHaveBeenCalledTimes(1)
    expect(mockWatchTransactions).toHaveBeenCalledWith({
      address,
      chainId: UniverseChainId.Mainnet,
      pendingDiff: [tx1],
      apolloClient,
      queryClient,
    })
  })
})
