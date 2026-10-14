import { UniverseChainId } from '@universe/chains'
import { TransactionScreen } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import {
  createPrepareSwap,
  getReviewGateActionType,
} from 'uniswap/src/features/transactions/swap/services/prepareSwapService'
import type { WarningService } from 'uniswap/src/features/transactions/swap/services/warningService'
import { CurrencyField } from 'uniswap/src/types/currency'

vi.mock('uniswap/src/features/telemetry/send', () => ({ sendAnalyticsEvent: vi.fn() }))
vi.mock('uniswap/src/features/transactions/swap/plan/prefetchedPlanStore', () => ({ prefetchPlan: vi.fn() }))

function createWarningService(): WarningService {
  return {
    getSkipBridgingWarning: () => false,
    getSkipMaxTransferWarning: () => false,
    getSkipTokenProtectionWarning: () => false,
    getSkipBridgedAssetWarning: () => false,
    setSkipBridgedAssetWarning: vi.fn(),
    setSkipBridgingWarning: vi.fn(),
    setSkipMaxTransferWarning: vi.fn(),
    setSkipTokenProtectionWarning: vi.fn(),
    reset: vi.fn(),
  }
}

function createCtx(
  overrides: Partial<Parameters<typeof createPrepareSwap>[0]> = {},
): Parameters<typeof createPrepareSwap>[0] {
  return {
    swapRedirectCallback: undefined,
    isConnected: true,
    onConnectWallet: vi.fn(),
    isViewOnlyWallet: false,
    currencies: { [CurrencyField.INPUT]: undefined, [CurrencyField.OUTPUT]: undefined },
    exactAmountToken: '1',
    exactCurrencyField: CurrencyField.INPUT,
    chainId: UniverseChainId.Mainnet,
    needsTokenProtectionWarning: false,
    needsBridgingWarning: false,
    needsLowNativeBalanceWarning: false,
    needsBridgedAssetWarning: false,
    handleShowViewOnlyModal: vi.fn(),
    handleShowTokenWarningModal: vi.fn(),
    handleShowBridgingWarningModal: vi.fn(),
    handleShowMaxNativeTransferModal: vi.fn(),
    handleShowBridgedAssetModal: vi.fn(),
    updateSwapForm: vi.fn(),
    setScreen: vi.fn(),
    warningService: createWarningService(),
    ...overrides,
  }
}

describe(getReviewGateActionType, () => {
  const base = { swapRedirectCallback: undefined, isConnected: true, onConnectWallet: vi.fn(), isViewOnlyWallet: false }

  it('returns undefined for a connected signer', () => {
    expect(getReviewGateActionType(base)).toBeUndefined()
  })

  it('prefers REDIRECT over CONNECT_WALLET and SHOW_VIEW_ONLY', () => {
    expect(
      getReviewGateActionType({ ...base, swapRedirectCallback: vi.fn(), isConnected: false, isViewOnlyWallet: true }),
    ).toBe('REDIRECT')
  })

  it('prefers CONNECT_WALLET over SHOW_VIEW_ONLY', () => {
    expect(getReviewGateActionType({ ...base, isConnected: false, isViewOnlyWallet: true })).toBe('CONNECT_WALLET')
  })

  it('skips CONNECT_WALLET when there is no connect handler', () => {
    expect(getReviewGateActionType({ ...base, isConnected: false, onConnectWallet: undefined })).toBeUndefined()
  })

  it('returns SHOW_VIEW_ONLY for a view-only wallet', () => {
    expect(getReviewGateActionType({ ...base, isViewOnlyWallet: true })).toBe('SHOW_VIEW_ONLY')
  })
})

describe(createPrepareSwap, () => {
  it('calls the redirect callback with the form state when set', () => {
    const swapRedirectCallback = vi.fn()
    const ctx = createCtx({ swapRedirectCallback, isConnected: false })
    createPrepareSwap(ctx)()
    expect(swapRedirectCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        typedValue: '1',
        independentField: CurrencyField.INPUT,
        chainId: UniverseChainId.Mainnet,
      }),
    )
    expect(ctx.onConnectWallet).not.toHaveBeenCalled()
  })

  it('opens the connect flow for the chain platform when disconnected', () => {
    const ctx = createCtx({ isConnected: false, isViewOnlyWallet: true })
    createPrepareSwap(ctx)()
    expect(ctx.onConnectWallet).toHaveBeenCalledWith('evm')
    expect(ctx.handleShowViewOnlyModal).not.toHaveBeenCalled()
  })

  it('shows the view-only modal ahead of pre-review warnings', () => {
    const ctx = createCtx({ isViewOnlyWallet: true, needsTokenProtectionWarning: true })
    createPrepareSwap(ctx)()
    expect(ctx.handleShowViewOnlyModal).toHaveBeenCalledTimes(1)
    expect(ctx.handleShowTokenWarningModal).not.toHaveBeenCalled()
  })

  it('shows pre-review warnings once past the gate', () => {
    const ctx = createCtx({ needsTokenProtectionWarning: true })
    createPrepareSwap(ctx)()
    expect(ctx.handleShowTokenWarningModal).toHaveBeenCalledTimes(1)
    expect(ctx.setScreen).not.toHaveBeenCalled()
  })

  it('proceeds to review and resets the warning service', () => {
    const ctx = createCtx()
    createPrepareSwap(ctx)()
    expect(ctx.setScreen).toHaveBeenCalledWith(TransactionScreen.Review)
    expect(ctx.warningService.reset).toHaveBeenCalledTimes(1)
  })
})
