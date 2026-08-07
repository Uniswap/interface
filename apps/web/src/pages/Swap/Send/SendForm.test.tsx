import { render, screen } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { TamaguiProvider } from 'ui/src'
import config from 'ui/src/tamagui.config'
import { SendForm } from '~/pages/Swap/Send/SendForm'

const {
  mockUseSendContext,
  mockUseTransactionModalContext,
  mockUseIsPermissionedSendBlocked,
  mockUseCurrencyInfo,
  mockUseRecentTransfersByAddress,
  mockUseIsSmartContractAddress,
  mockUseActiveAddress,
  mockUseConnectionStatus,
  mockUseEnabledChains,
  mockUseDismissedCompatibleAddressWarnings,
  mockUseModalState,
  mockUseAccountDrawer,
  mockUseAccount,
  mockUseSendCallback,
  mockSetScreen,
} = vi.hoisted(() => ({
  mockUseSendContext: vi.fn(),
  mockUseTransactionModalContext: vi.fn(),
  mockUseIsPermissionedSendBlocked: vi.fn(),
  mockUseCurrencyInfo: vi.fn(),
  mockUseRecentTransfersByAddress: vi.fn(),
  mockUseIsSmartContractAddress: vi.fn(),
  mockUseActiveAddress: vi.fn(),
  mockUseConnectionStatus: vi.fn(),
  mockUseEnabledChains: vi.fn(),
  mockUseDismissedCompatibleAddressWarnings: vi.fn(),
  mockUseModalState: vi.fn(),
  mockUseAccountDrawer: vi.fn(),
  mockUseAccount: vi.fn(),
  mockUseSendCallback: vi.fn(),
  mockSetScreen: vi.fn(),
}))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...actual,
    useMutation: () => ({ mutate: vi.fn(), isPending: false }),
  }
})

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && typeof opts === 'object') {
        const tokenSymbol = (opts as { tokenSymbol?: string }).tokenSymbol
        if (tokenSymbol !== undefined) {
          return `${key}:${tokenSymbol}`
        }
      }
      return key
    },
  }),
}))

vi.mock('~/pages/Swap/Send/state/SendContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/pages/Swap/Send/state/SendContext')>()
  return {
    ...actual,
    useSendContext: () => mockUseSendContext(),
  }
})

vi.mock(
  'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext',
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import('uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext')
      >()
    return {
      ...actual,
      useTransactionModalContext: () => mockUseTransactionModalContext(),
    }
  },
)

vi.mock('uniswap/src/features/permissionedTokens/useIsPermissionedSendBlocked', () => ({
  useIsPermissionedSendBlocked: (...args: unknown[]) => mockUseIsPermissionedSendBlocked(...args),
}))

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({
  useCurrencyInfo: (...args: unknown[]) => mockUseCurrencyInfo(...args),
}))

vi.mock('uniswap/src/features/send/useRecentTransfersByAddress', () => ({
  useRecentTransfersByAddress: (...args: unknown[]) => mockUseRecentTransfersByAddress(...args),
}))

vi.mock('uniswap/src/features/address/useIsSmartContractAddress', () => ({
  useIsSmartContractAddress: (...args: unknown[]) => mockUseIsSmartContractAddress(...args),
}))

vi.mock('uniswap/src/features/accounts/store/hooks', () => ({
  useActiveAddress: (...args: unknown[]) => mockUseActiveAddress(...args),
  useConnectionStatus: () => mockUseConnectionStatus(),
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: () => mockUseEnabledChains(),
}))

vi.mock('uniswap/src/features/tokens/warnings/slice/hooks', () => ({
  useDismissedCompatibleAddressWarnings: (...args: unknown[]) => mockUseDismissedCompatibleAddressWarnings(...args),
}))

vi.mock('~/hooks/useModalState', () => ({
  useModalState: (...args: unknown[]) => mockUseModalState(...args),
}))

vi.mock('~/components/AccountDrawer/MiniPortfolio/hooks', () => ({
  useAccountDrawer: () => mockUseAccountDrawer(),
}))

vi.mock('~/hooks/useAccount', () => ({
  useAccount: () => mockUseAccount(),
}))

vi.mock('~/features/Swap/hooks/useSendCallback', () => ({
  useSendCallback: (...args: unknown[]) => mockUseSendCallback(...args),
}))

// Stub child components and trace HOC to keep the test focused on the gating banner.
vi.mock('~/pages/Swap/Send/SendCurrencyInputForm', () => ({
  SendCurrencyInputForm: () => null,
}))

vi.mock('~/pages/Swap/Send/SendRecipientForm', () => ({
  SendRecipientForm: () => null,
}))

vi.mock('~/pages/Swap/Send/SelfSendSpeedBump', () => ({
  SelfSendSpeedBumpModal: () => null,
}))

vi.mock('~/pages/Swap/Send/SmartContractSpeedBump', () => ({
  SmartContractSpeedBumpModal: () => null,
}))

vi.mock('~/pages/Swap/Send/NewAddressSpeedBump', () => ({
  NewAddressSpeedBumpModal: () => null,
}))

vi.mock('~/pages/Swap/Send/SendReviewModal', () => ({
  SendReviewModalInner: () => null,
}))

vi.mock('uniswap/src/features/transactions/modals/CompatibleAddressModal', () => ({
  CompatibleAddressModal: () => null,
}))

vi.mock('uniswap/src/components/dialog/GetHelpHeader', () => ({
  GetHelpHeader: () => null,
}))

vi.mock('uniswap/src/features/telemetry/Trace', () => ({
  default: ({ children }: PropsWithChildren) => <>{children}</>,
}))

function ThemeWrapper({ children }: PropsWithChildren): JSX.Element {
  return (
    <TamaguiProvider config={config} defaultTheme="light">
      {children}
    </TamaguiProvider>
  )
}

const renderWithTheme = (ui: React.ReactElement): ReturnType<typeof render> => render(ui, { wrapper: ThemeWrapper })

const PERMISSIONED_ADDRESS = '0x0000000000000000000000000000000000534c4e'
const ETHEREUM = 1

const permissionedCurrency = {
  isNative: false,
  address: PERMISSIONED_ADDRESS,
  chainId: ETHEREUM,
  symbol: 'SLINK',
  decimals: 18,
  equals: () => false,
} as never

const nonPermissionedCurrency = {
  isNative: false,
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  chainId: ETHEREUM,
  symbol: 'USDC',
  decimals: 6,
  equals: () => false,
} as never

function setupDefaults(): void {
  // Default: no input currency selected.
  mockUseSendContext.mockReturnValue({
    sendState: {
      exactAmountToken: undefined,
      exactAmountFiat: '',
      recipient: '',
      inputCurrency: undefined,
      inputInFiat: true,
    },
    derivedSendInfo: {
      parsedTokenAmount: undefined,
      recipientData: undefined,
      inputError: undefined,
      transaction: undefined,
      gasFee: undefined,
    },
    setSendState: vi.fn(),
  })
  mockUseTransactionModalContext.mockReturnValue({
    screen: 'Form',
    setScreen: mockSetScreen,
  })
  mockUseIsPermissionedSendBlocked.mockReturnValue({
    isPermissionedSendBlocked: false,
    isPermissionedSendBlockedLoading: false,
    blockedTokenSymbol: undefined,
  })
  mockUseCurrencyInfo.mockReturnValue(undefined)
  mockUseRecentTransfersByAddress.mockReturnValue({ transfers: [], loading: false })
  mockUseIsSmartContractAddress.mockReturnValue({ isSmartContractAddress: false, loading: false })
  mockUseActiveAddress.mockReturnValue(undefined)
  mockUseConnectionStatus.mockReturnValue({ isDisconnected: false })
  mockUseEnabledChains.mockReturnValue({ defaultChainId: ETHEREUM })
  mockUseDismissedCompatibleAddressWarnings.mockReturnValue({ tokenWarningDismissed: true })
  mockUseModalState.mockReturnValue({ closeModal: vi.fn(), openModal: vi.fn(), isOpen: false })
  mockUseAccountDrawer.mockReturnValue({ open: vi.fn(), close: vi.fn(), isOpen: false })
  mockUseAccount.mockReturnValue({ connector: undefined })
  mockUseSendCallback.mockReturnValue(vi.fn())
}

function setInputCurrency(
  currency: unknown,
  { withValidAmountAndRecipient = false }: { withValidAmountAndRecipient?: boolean } = {},
): void {
  mockUseSendContext.mockReturnValue({
    sendState: {
      exactAmountToken: withValidAmountAndRecipient ? '1' : undefined,
      exactAmountFiat: withValidAmountAndRecipient ? undefined : '',
      recipient: withValidAmountAndRecipient ? '0xRecipient' : '',
      inputCurrency: currency,
      inputInFiat: !withValidAmountAndRecipient,
    },
    derivedSendInfo: {
      parsedTokenAmount: withValidAmountAndRecipient ? ({ toExact: () => '1', currency } as unknown) : undefined,
      recipientData: withValidAmountAndRecipient ? ({ address: '0xRecipient' } as unknown) : undefined,
      inputError: undefined,
      transaction: undefined,
      gasFee: undefined,
    },
    setSendState: vi.fn(),
  })
  mockUseCurrencyInfo.mockReturnValue({ currency, isBridged: false })
}

function setSendBlockedMock({
  isPermissionedSendBlocked,
  blockedTokenSymbol,
  reason,
}: {
  isPermissionedSendBlocked: boolean
  blockedTokenSymbol?: string
  reason?: 'sender' | 'recipient'
}): void {
  mockUseIsPermissionedSendBlocked.mockReturnValue({
    isPermissionedSendBlocked,
    isPermissionedSendBlockedLoading: false,
    blockedTokenSymbol,
    permissionedSendBlockReason: reason,
  })
}

describe('SendForm: permissioned gating (sender + recipient allowlist)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupDefaults()
  })

  it('hides the banner and enables the Send button when the input token is not permissioned', () => {
    setInputCurrency(nonPermissionedCurrency, { withValidAmountAndRecipient: true })
    setSendBlockedMock({ isPermissionedSendBlocked: false })

    renderWithTheme(<SendForm />)

    expect(screen.queryByText(/permissionedPool\.send/u)).toBeNull()
    const sendButton = document.querySelector('[dd-action-name="common.send.button"]')
    expect(sendButton).not.toBeNull()
    expect(sendButton?.getAttribute('aria-disabled')).not.toBe('true')
  })

  it('shows the recipient-not-allowlisted banner and disables Review when Send is blocked', () => {
    setInputCurrency(permissionedCurrency, { withValidAmountAndRecipient: true })
    setSendBlockedMock({ isPermissionedSendBlocked: true, blockedTokenSymbol: 'SLINK' })

    renderWithTheme(<SendForm />)

    expect(screen.getByText('permissionedPool.send.recipientNotAllowlisted.title')).toBeTruthy()
    expect(screen.getByText('permissionedPool.send.recipientNotAllowlisted.message:SLINK')).toBeTruthy()
    const sendButton = document.querySelector('[dd-action-name="common.send.button"]')
    expect(sendButton?.getAttribute('aria-disabled')).toBe('true')
  })

  it('shows the sender-not-allowlisted banner when the holder is no longer verified', () => {
    setInputCurrency(permissionedCurrency, { withValidAmountAndRecipient: true })
    setSendBlockedMock({ isPermissionedSendBlocked: true, blockedTokenSymbol: 'SLINK', reason: 'sender' })

    renderWithTheme(<SendForm />)

    expect(screen.getByText('permissionedPool.send.senderNotAllowlisted.title')).toBeTruthy()
    expect(screen.getByText('permissionedPool.send.senderNotAllowlisted.message:SLINK')).toBeTruthy()
    const sendButton = document.querySelector('[dd-action-name="common.send.button"]')
    expect(sendButton?.getAttribute('aria-disabled')).toBe('true')
  })

  it('hides the banner when no input currency is selected (pre-token-selection)', () => {
    renderWithTheme(<SendForm />)

    expect(screen.queryByText(/permissionedPool\.send/u)).toBeNull()
  })

  it('interpolates the token symbol into the banner message', () => {
    const tptCurrency = {
      isNative: false,
      address: PERMISSIONED_ADDRESS,
      chainId: ETHEREUM,
      symbol: 'TPT',
      decimals: 18,
      equals: () => false,
    } as never
    setInputCurrency(tptCurrency, { withValidAmountAndRecipient: true })
    setSendBlockedMock({ isPermissionedSendBlocked: true, blockedTokenSymbol: 'TPT' })

    renderWithTheme(<SendForm />)

    expect(screen.getByText('permissionedPool.send.recipientNotAllowlisted.message:TPT')).toBeTruthy()
  })
})
