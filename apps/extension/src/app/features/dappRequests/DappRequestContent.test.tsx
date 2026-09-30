import { CurrencyAmount } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { DappRequestContent } from 'src/app/features/dappRequests/DappRequestContent'
import { REQUEST_EXPIRY_TIME_MS } from 'src/app/features/dappRequests/hooks/useIsRequestStale'
import type { DappRequestStoreItem } from 'src/app/features/dappRequests/shared'
import { DappRequestStatus } from 'src/app/features/dappRequests/shared'
import type { WithMetadata } from 'src/app/features/dappRequests/slice'
import { render, screen } from 'src/test/test-utils'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { DappRequestType } from 'uniswap/src/features/dappRequests/types'
import { getChainGasToken, useChainGasToken } from 'uniswap/src/features/gas/hooks/useChainGasToken'
import { hasSufficientGasBalance } from 'uniswap/src/features/gas/utils'

// Mock wagmi to avoid ESM import issues
vi.mock('wagmi', () => ({
  useAccountEffect: vi.fn(),
}))

// Mock the useIsRequestStale hook to control output
const mockUseIsRequestStale = vi.fn()
vi.mock('src/app/features/dappRequests/hooks/useIsRequestStale', async (importOriginal) => ({
  ...(await importOriginal<typeof import('src/app/features/dappRequests/hooks/useIsRequestStale')>()),
  useIsRequestStale: (createdAt: number) => mockUseIsRequestStale(createdAt),
}))

// Mock the context hook to return our mock value
let mockContextValue: any = null
vi.mock('src/app/features/dappRequests/DappRequestQueueContext', () => ({
  useDappRequestQueueContext: () => mockContextValue,
}))

// Mock hooks used by DappRequestFooter
vi.mock('src/app/features/dapp/hooks', () => ({
  useDappLastChainId: vi.fn(() => 1),
}))

vi.mock('uniswap/src/features/gas/hooks/useChainGasToken', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/gas/hooks/useChainGasToken')>()),
  useChainGasToken: vi.fn(),
}))

vi.mock('uniswap/src/features/gas/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/gas/utils')>()),
  hasSufficientGasBalance: vi.fn(() => true),
  hasGasEstimationFailed: vi.fn(() => false),
}))

vi.mock('wallet/src/features/wallet/hooks', () => ({
  useActiveAccountWithThrow: vi.fn(() => ({
    address: '0x123',
    type: 'readonly',
    timeImportedMs: Date.now(),
    pushNotificationsEnabled: false,
  })),
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: vi.fn(() => ({
    defaultChainId: 1,
  })),
}))

vi.mock('src/app/features/dappRequests/hooks', () => ({
  useIsDappRequestConfirming: vi.fn(() => false),
}))

// Mock the NetworkFeeFooter to avoid complex currency parsing
vi.mock('wallet/src/features/transactions/TransactionRequest/NetworkFeeFooter', () => ({
  NetworkFeeFooter: () => null,
}))

vi.mock('wallet/src/features/transactions/TransactionRequest/AddressFooter', () => ({
  AddressFooter: () => null,
}))

// Mock currency hooks that parse transaction data
vi.mock('uniswap/src/data/apiClients/tradingApi/useTradingApiSwapQuery', () => ({
  useTradingApiSwapQuery: vi.fn(() => ({
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
    onPressNext: vi.fn(),
    onPressPrevious: vi.fn(),
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  }
}

function renderDappRequestContent(options: { createdAt: number; isRequestStale: boolean; frameUrl?: string }) {
  mockUseIsRequestStale.mockReturnValue(options.isRequestStale)
  setupMockRequestAndContext(options.createdAt, { frameUrl: options.frameUrl })
  return render(<DappRequestContent title="Transaction request" confirmText="Confirm" />)
}

beforeEach(() => {
  const gasToken = getChainGasToken(UniverseChainId.Mainnet)
  vi.mocked(useChainGasToken).mockReturnValue({
    gasToken,
    gasBalance: CurrencyAmount.fromRawAmount(gasToken, '1000000000000000000'),
    isLoading: false,
  })
  vi.mocked(hasSufficientGasBalance).mockReturnValue(true)
})

describe('DappRequestContent - Payment and Gas Balance', () => {
  beforeEach(async () => {
    const actual = await vi.importActual<typeof import('uniswap/src/features/gas/utils')>(
      'uniswap/src/features/gas/utils',
    )
    vi.mocked(hasSufficientGasBalance).mockImplementation(actual.hasSufficientGasBalance)
    mockUseIsRequestStale.mockReturnValue(false)
    setupMockRequestAndContext(Date.now())
  })

  it.each([
    { chainId: UniverseChainId.Arc, balance: '1000000', value: '0xde0b6b3a7640000', disabled: true },
    { chainId: UniverseChainId.Arc, balance: '1001000', value: '0xde0b6b3a7640000', disabled: false },
    { chainId: UniverseChainId.Mainnet, balance: '1000000000000000000', value: '1000000000000000000', disabled: true },
    { chainId: UniverseChainId.Mainnet, balance: '1001000000000000000', value: '1000000000000000000', disabled: false },
    { chainId: UniverseChainId.Arc, balance: '1000', value: undefined, disabled: false },
  ])('checks payment plus gas on $chainId with balance $balance', ({ chainId, balance, value, disabled }) => {
    const gasToken = getChainGasToken(chainId)
    vi.mocked(useChainGasToken).mockReturnValue({
      gasToken,
      gasBalance: CurrencyAmount.fromRawAmount(gasToken, balance),
      isLoading: false,
    })
    mockContextValue.request.dappRequest.transaction = { chainId, value }

    render(
      <DappRequestContent
        title="Transaction request"
        confirmText="Confirm"
        transactionGasFeeResult={{ value: '1000000000000000', isLoading: false, error: null }}
      />,
    )

    expect(screen.getByRole('button', { name: 'Confirm' })).toHaveProperty('disabled', disabled)
  })

  it.each([
    { callCount: 1, balance: '10000000000000000', disabled: true },
    { callCount: 1, balance: '1000000000000000000', disabled: false },
    { callCount: 2, balance: '10000000000000000', disabled: true },
    { callCount: 2, balance: '1000000000000000000', disabled: false },
    { callCount: 1, balance: '0', value: '0x', disabled: false },
    { callCount: 2, balance: '0', value: '0x', disabled: false },
  ])(
    'checks first of $callCount sponsored calls with balance $balance',
    ({ callCount, balance, value = '0xde0b6b3a7640000', disabled }) => {
      const chainId = UniverseChainId.Mainnet
      const gasToken = getChainGasToken(chainId)
      vi.mocked(useChainGasToken).mockReturnValue({
        gasToken,
        gasBalance: CurrencyAmount.fromRawAmount(gasToken, balance),
        isLoading: false,
      })
      mockContextValue.request.dappRequest = {
        type: DappRequestType.SendCalls,
        requestId: 'test-request-id',
        version: '2.0.0',
        chainId: `0x${chainId.toString(16)}`,
        calls: Array.from({ length: callCount }, (_, index) => ({
          to: '0x1234567890123456789012345678901234567890',
          value: index === 0 ? value : '0x0',
        })),
      }

      render(
        <DappRequestContent
          chainId={chainId}
          title="Transaction request"
          confirmText="Confirm"
          transactionGasFeeResult={{ value: '0', isLoading: false, error: null }}
        />,
      )

      expect(screen.getByRole('button', { name: 'Confirm' })).toHaveProperty('disabled', disabled)
    },
  )

  it('allows a sponsored batch to unwrap WETH before sending the ETH', () => {
    const chainId = UniverseChainId.Mainnet
    const gasToken = getChainGasToken(chainId)
    vi.mocked(useChainGasToken).mockReturnValue({
      gasToken,
      gasBalance: CurrencyAmount.fromRawAmount(gasToken, '10000000000000000'), // 0.01 ETH initially
      isLoading: false,
    })
    mockContextValue.request.dappRequest = {
      type: DappRequestType.SendCalls,
      requestId: 'test-request-id',
      version: '2.0.0',
      chainId: `0x${chainId.toString(16)}`,
      calls: [
        {
          to: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          // WETH.withdraw(1 ETH), funded by the wallet's existing WETH balance.
          data: '0x2e1a7d4d0000000000000000000000000000000000000000000000000de0b6b3a7640000',
          value: '0x0',
        },
        {
          to: '0x1234567890123456789012345678901234567890',
          value: '0xde0b6b3a7640000',
        },
      ],
    }

    render(
      <DappRequestContent
        chainId={chainId}
        title="Transaction request"
        confirmText="Confirm"
        transactionGasFeeResult={{ value: '0', isLoading: false, error: null }}
      />,
    )

    expect(screen.getByRole('button', { name: 'Confirm' })).toHaveProperty('disabled', false)
  })
})

describe('DappRequestContent - Stale Request Rendering', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T12:00:00.000Z'))
    mockUseIsRequestStale.mockClear()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
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
