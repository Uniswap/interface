import { DappRequestContent } from 'src/app/features/dappRequests/DappRequestContent'
import { REQUEST_EXPIRY_TIME_MS } from 'src/app/features/dappRequests/hooks/useIsRequestStale'
import type { DappRequestStoreItem } from 'src/app/features/dappRequests/shared'
import { DappRequestStatus } from 'src/app/features/dappRequests/shared'
import type { WithMetadata } from 'src/app/features/dappRequests/slice'
import { render, screen } from 'src/test/test-utils'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { DappRequestType } from 'uniswap/src/features/dappRequests/types'

// Mock wagmi to avoid ESM import issues
jest.mock('wagmi', () => ({
  useAccountEffect: jest.fn(),
}))

// Mock the useIsRequestStale hook to control output
const mockUseIsRequestStale = jest.fn()
jest.mock('src/app/features/dappRequests/hooks/useIsRequestStale', () => ({
  ...jest.requireActual('src/app/features/dappRequests/hooks/useIsRequestStale'),
  useIsRequestStale: (createdAt: number) => mockUseIsRequestStale(createdAt),
}))

// Mock the context hook to return our mock value
let mockContextValue: any = null
jest.mock('src/app/features/dappRequests/DappRequestQueueContext', () => ({
  useDappRequestQueueContext: () => mockContextValue,
}))

// Mock hooks used by DappRequestFooter
jest.mock('src/app/features/dapp/hooks', () => ({
  useDappLastChainId: jest.fn(() => 1),
}))

jest.mock('uniswap/src/features/portfolio/api', () => ({
  useOnChainNativeCurrencyBalance: jest.fn(() => ({
    balance: { value: '1000000000000000000', currency: { symbol: 'ETH' } },
  })),
}))

jest.mock('wallet/src/features/wallet/hooks', () => ({
  useActiveAccountWithThrow: jest.fn(() => ({
    address: '0x123',
    type: 'readonly',
    timeImportedMs: Date.now(),
    pushNotificationsEnabled: false,
  })),
}))

jest.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: jest.fn(() => ({
    defaultChainId: 1,
  })),
}))

jest.mock('src/app/features/dappRequests/hooks', () => ({
  useIsDappRequestConfirming: jest.fn(() => false),
}))

// Mock the NetworkFeeFooter to avoid complex currency parsing
jest.mock('wallet/src/features/transactions/TransactionRequest/NetworkFeeFooter', () => ({
  NetworkFeeFooter: () => null,
}))

jest.mock('wallet/src/features/transactions/TransactionRequest/AddressFooter', () => ({
  AddressFooter: () => null,
}))

// Mock currency hooks that parse transaction data
jest.mock('uniswap/src/data/apiClients/tradingApi/useTradingApiSwapQuery', () => ({
  useTradingApiSwapQuery: jest.fn(() => ({
    data: undefined,
    isLoading: false,
  })),
}))

function setupMockRequestAndContext(createdAt: number, options?: { frameUrl?: string }): void {
  const request: WithMetadata<DappRequestStoreItem> = {
    dappRequest: {
      type: DappRequestType.SendTransaction,
      requestId: 'test-request-id',
      transaction: {
        from: '0x123',
        to: '0x456',
        value: '0',
        chainId: 1,
      },
    },
    senderTabInfo: {
      id: 1,
      url: 'https://example.com',
      frameUrl: options?.frameUrl,
    },
    dappInfo: {
      activeConnectedAddress: '0x123',
      lastChainId: 1,
      connectedAccounts: [
        {
          address: '0x123',
          type: AccountType.Readonly,
          timeImportedMs: Date.now(),
          pushNotificationsEnabled: false,
        },
      ],
    },
    createdAt,
    status: DappRequestStatus.Pending,
    isSidebarClosed: false,
  }

  mockContextValue = {
    forwards: true,
    increasing: true,
    request,
    currentAccount: {
      address: '0x123',
      type: AccountType.Readonly,
      timeImportedMs: Date.now(),
      pushNotificationsEnabled: false,
    },
    dappUrl: 'https://example.com',
    frameUrl: options?.frameUrl,
    dappIconUrl: '',
    currentIndex: 0,
    totalRequestCount: 1,
    onPressNext: jest.fn(),
    onPressPrevious: jest.fn(),
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  }
}

function renderDappRequestContent(options: { createdAt: number; isRequestStale: boolean; frameUrl?: string }) {
  mockUseIsRequestStale.mockReturnValue(options.isRequestStale)
  setupMockRequestAndContext(options.createdAt, { frameUrl: options.frameUrl })
  return render(<DappRequestContent title="Transaction request" confirmText="Confirm" />)
}

describe('DappRequestContent - Stale Request Rendering', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-01-01T12:00:00.000Z'))
    mockUseIsRequestStale.mockClear()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('should render Cancel and Confirm buttons for fresh requests', async () => {
    const freshCreatedAt = Date.now() - 1000

    renderDappRequestContent({ createdAt: freshCreatedAt, isRequestStale: false })

    // Verify hook was called
    expect(mockUseIsRequestStale).toHaveBeenCalledWith(freshCreatedAt)

    // Verify normal buttons are shown
    await screen.findByText('Cancel')
    await screen.findByText('Confirm')
    // Verify close button is NOT shown
    expect(screen.queryByText('Close')).toBeNull()
  })

  it('should render warning and Close button for stale requests', async () => {
    const staleCreatedAt = Date.now() - (REQUEST_EXPIRY_TIME_MS + 60000)

    renderDappRequestContent({ createdAt: staleCreatedAt, isRequestStale: true })

    // Verify hook was called
    expect(mockUseIsRequestStale).toHaveBeenCalledWith(staleCreatedAt)
    // Verify Close button is shown
    await screen.findByText('Close')
    // Verify Confirm button is NOT shown
    expect(screen.queryByText('Confirm')).toBeNull()
  })

  it('should match snapshot for fresh request', async () => {
    const freshCreatedAt = Date.now() - 1000

    const { container } = renderDappRequestContent({ createdAt: freshCreatedAt, isRequestStale: false })

    expect(container).toMatchSnapshot()
  })

  it('should match snapshot for stale request', async () => {
    const staleCreatedAt = Date.now() - (REQUEST_EXPIRY_TIME_MS + 60000)

    const { container } = renderDappRequestContent({ createdAt: staleCreatedAt, isRequestStale: true })

    expect(container).toMatchSnapshot()
  })

  it('should display iframe URL with "via" when frameUrl differs from url', async () => {
    const freshCreatedAt = Date.now() - 1000

    renderDappRequestContent({
      createdAt: freshCreatedAt,
      isRequestStale: false,
      frameUrl: 'https://app.uniswap.org',
    })

    // Should show "app.uniswap.org via example.com" in the URL label
    expect(screen.queryByText(/app\.uniswap\.org via example\.com/i)).not.toBeNull()
  })

  it('should display only top-level URL when frameUrl is not present', async () => {
    const freshCreatedAt = Date.now() - 1000

    renderDappRequestContent({ createdAt: freshCreatedAt, isRequestStale: false })

    // Should show just "example.com" (no "via")
    expect(screen.queryByText(/example\.com/i)).not.toBeNull()

    // Should NOT show "via"
    expect(screen.queryByText(/via/i)).toBeNull()
  })
})
