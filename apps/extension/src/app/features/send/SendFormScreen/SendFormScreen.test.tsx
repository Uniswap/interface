import { render as rtlRender, screen } from '@testing-library/react'
import React from 'react'
import { TamaguiProvider } from 'ui/src'
import config from 'ui/src/tamagui.config'

function ThemeWrapper({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <TamaguiProvider config={config} defaultTheme="light">
      {children}
    </TamaguiProvider>
  )
}

const render = (ui: React.ReactElement): ReturnType<typeof rtlRender> => rtlRender(ui, { wrapper: ThemeWrapper })

// All mocks must be declared before importing the SUT.

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => (opts?.['tokenSymbol'] ? `${key}:${opts['tokenSymbol']}` : key),
  }),
}))

vi.mock('react-redux', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-redux')>()),
  useSelector: vi.fn(),
}))

vi.mock('wallet/src/features/transactions/contexts/SendContext', () => ({
  useSendContext: vi.fn(),
}))

vi.mock('uniswap/src/features/accounts/store/hooks', () => ({
  useActiveAccount: vi.fn(),
}))

vi.mock('@universe/compliance', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/compliance')>()),
  useIsBlockedAddress: vi.fn(),
}))

vi.mock('wallet/src/features/compliance/hooks', () => ({
  useIsBlockedActiveAddress: vi.fn(),
}))

vi.mock(
  'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext',
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import('uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext')
    >()),
    useTransactionModalContext: vi.fn(),
  }),
)

vi.mock('uniswap/src/features/transactions/hooks/useUSDCPrice', () => ({
  useUSDCValue: vi.fn(),
}))

vi.mock('uniswap/src/features/transactions/hooks/useUSDTokenUpdater', () => ({
  useUSDTokenUpdater: vi.fn(),
}))

vi.mock('wallet/src/features/transactions/send/hooks/useShowSendNetworkNotification', () => ({
  useShowSendNetworkNotification: vi.fn(),
}))

vi.mock('uniswap/src/features/permissionedTokens/PermissionedTokenTooltip', () => ({
  PermissionedTokenTooltip: ({ baseText, trigger }: { baseText: string; trigger?: React.ReactNode }) => (
    <div data-testid="permissioned-tooltip" data-base-text={baseText}>
      {trigger}
    </div>
  ),
}))

vi.mock('src/app/features/send/SendFormScreen/ReviewButton', () => ({
  ReviewButton: ({ disabled, onPress }: { disabled?: boolean; onPress?: () => void }) => (
    <button data-testid="review-button" disabled={disabled} onClick={onPress}>
      Review
    </button>
  ),
}))

vi.mock('wallet/src/features/transactions/send/TokenSelectorPanel', () => ({
  TokenSelectorPanel: () => <div data-testid="token-selector-panel" />,
}))

vi.mock('wallet/src/features/transactions/send/SendAmountInput', () => ({
  SendAmountInput: () => <div data-testid="send-amount-input" />,
}))

vi.mock('wallet/src/features/transactions/send/SendReviewDetails', () => ({
  SendReviewDetails: () => <div data-testid="send-review-details" />,
}))

vi.mock('wallet/src/features/transactions/send/GasFeeRow', () => ({
  GasFeeRow: () => <div data-testid="gas-fee-row" />,
}))

vi.mock(
  'uniswap/src/features/transactions/components/InsufficientNativeTokenWarning/InsufficientNativeTokenWarning',
  () => ({
    InsufficientNativeTokenWarning: () => <div data-testid="insufficient-native-warning" />,
  }),
)

vi.mock('uniswap/src/features/transactions/modals/BlockedAddressWarning', () => ({
  BlockedAddressWarning: () => <div data-testid="blocked-address-warning" />,
}))

vi.mock('uniswap/src/features/transactions/modals/LowNativeBalanceModal', () => ({
  LowNativeBalanceModal: () => <div data-testid="low-native-balance-modal" />,
}))

vi.mock('src/app/features/send/SendFormScreen/RecipientPanel', () => ({
  RecipientPanel: () => <div data-testid="recipient-panel" />,
}))

vi.mock('uniswap/src/components/modals/Modal', () => ({
  Modal: ({ children, isModalOpen }: { children: React.ReactNode; isModalOpen: boolean }) =>
    isModalOpen ? <div data-testid="send-review-modal">{children}</div> : null,
}))

vi.mock('uniswap/src/features/telemetry/Trace', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('wallet/src/features/transactions/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('wallet/src/features/transactions/utils')>()),
  isAmountGreaterThanZero: vi.fn().mockReturnValue(true),
}))

import { useIsBlockedAddress } from '@universe/compliance'
import { useSelector } from 'react-redux'
import { SendFormScreen } from 'src/app/features/send/SendFormScreen/SendFormScreen'
import { WarningAction, WarningLabel, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { useActiveAccount } from 'uniswap/src/features/accounts/store/hooks'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { useUSDTokenUpdater } from 'uniswap/src/features/transactions/hooks/useUSDTokenUpdater'
// Real-imports after the mocks are registered.
import { useIsBlockedActiveAddress } from 'wallet/src/features/compliance/hooks'
import { useSendContext } from 'wallet/src/features/transactions/contexts/SendContext'
import { useShowSendNetworkNotification } from 'wallet/src/features/transactions/send/hooks/useShowSendNetworkNotification'

const mockUseSendContext = vi.mocked(useSendContext)
const mockUseActiveAccount = vi.mocked(useActiveAccount)
const mockUseIsBlockedAddress = vi.mocked(useIsBlockedAddress)
const mockUseIsBlockedActiveAddress = vi.mocked(useIsBlockedActiveAddress)
const mockUseTransactionModalContext = vi.mocked(useTransactionModalContext)
const mockUseUSDCValue = vi.mocked(useUSDCValue)
const mockUseUSDTokenUpdater = vi.mocked(useUSDTokenUpdater)
const mockUseShowSendNetworkNotification = vi.mocked(useShowSendNetworkNotification)
const mockUseSelector = vi.mocked(useSelector)

const TPT2 = '0x7B7C6A29368eEbe78BFab9eAE09d958Da5cAD9a4'
const ETHEREUM = 1

function setupSendContext(overrides: Record<string, unknown> = {}): void {
  mockUseSendContext.mockReturnValue({
    derivedSendInfo: {
      currencyInInfo: { currency: { chainId: ETHEREUM, isNative: false, address: TPT2, symbol: 'TPT2' } },
      currencyBalances: {},
      currencyAmounts: {},
      chainId: ETHEREUM,
      exactAmountFiat: undefined,
    },
    selectingCurrencyField: undefined,
    exactAmountToken: '1',
    isFiatInput: false,
    warnings: { warnings: [], insufficientGasFundsWarning: undefined },
    gasFee: { value: undefined },
    showRecipientSelector: false,
    recipient: '0xRecipient',
    updateSendForm: vi.fn(),
    onSelectCurrency: vi.fn(),
    isMax: false,
    ...overrides,
  } as never)
}

function setupDefaults(): void {
  setupSendContext()
  mockUseActiveAccount.mockReturnValue({ address: '0xWallet' } as never)
  mockUseIsBlockedAddress.mockReturnValue({ isBlocked: false, isBlockedLoading: false } as never)
  mockUseIsBlockedActiveAddress.mockReturnValue({ isBlocked: false, isBlockedLoading: false } as never)
  mockUseTransactionModalContext.mockReturnValue({ screen: 'Form', setScreen: vi.fn() } as never)
  // Production selector under test (`selectHasDismissedLowNetworkTokenWarning`) reads
  // `state.uniswapBehaviorHistory.hasDismissedLowNetworkTokenWarning`. Run a real selector
  // through a stub state shape so calls that aren't this one don't silently inherit `true`
  // and mask `.foo` access bugs on the real state shape.
  mockUseSelector.mockImplementation((selector: unknown) => {
    if (typeof selector === 'function') {
      const fakeState = { uniswapBehaviorHistory: { hasDismissedLowNetworkTokenWarning: true } }
      return (selector as (s: unknown) => unknown)(fakeState)
    }
    return undefined
  })
  mockUseUSDCValue.mockReturnValue(undefined as never)
  mockUseUSDTokenUpdater.mockReturnValue(undefined as never)
  mockUseShowSendNetworkNotification.mockReturnValue(undefined as never)
}

describe('SendFormScreen — permissioned-token gating', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupDefaults()
  })

  it('wraps the Review button with PermissionedTokenTooltip when Send is blocked for a permissioned token', () => {
    // SendBlockingWarnings reads the blocked state from warnings.blockingWarning, matching
    // the swap side's useIsBlockedByPermissionedPool — single source of truth via warnings.
    setupSendContext({
      warnings: {
        warnings: [],
        blockingWarning: {
          type: WarningLabel.PermissionedPool,
          severity: WarningSeverity.Blocked,
          action: WarningAction.DisableReview,
        },
      },
    })

    render(<SendFormScreen />)

    const tooltip = screen.getByTestId('permissioned-tooltip')
    expect(tooltip.getAttribute('data-base-text')).toBe('permissionedPool.surface.disabled.tooltip:TPT2')
    const reviewButton = screen.getByTestId('review-button')
    expect(reviewButton).toBeTruthy()
    expect(reviewButton.hasAttribute('disabled')).toBe(true)
  })

  it('does not wrap with tooltip when the token is not permissioned', () => {
    setupSendContext({
      derivedSendInfo: {
        currencyInInfo: {
          currency: { chainId: ETHEREUM, isNative: false, address: '0xUSDC', symbol: 'USDC' },
        },
        currencyBalances: {},
        currencyAmounts: {},
        chainId: ETHEREUM,
        exactAmountFiat: undefined,
      },
    })
    // Hook short-circuits: non-permissioned token → not blocked.

    render(<SendFormScreen />)

    expect(screen.queryByTestId('permissioned-tooltip')).toBeNull()
    expect(screen.getByTestId('review-button')).toBeTruthy()
  })

  // Note: the "no wallet → no tooltip" behavior lives in `useIsPermissionedSendBlocked`, which
  // gates on wallet address before any PermissionedPool warning enters `warnings`. That gating
  // is covered in the hook's own tests; this test asserts only that the consumer renders the
  // tooltip when `warnings.blockingWarning.type === WarningLabel.PermissionedPool`.
})
