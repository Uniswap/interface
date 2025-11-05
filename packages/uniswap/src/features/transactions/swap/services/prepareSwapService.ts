import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { chainIdToPlatform } from 'uniswap/src/features/platforms/utils/chains'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import type { SwapRedirectFn } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { TransactionScreen } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import type { WarningService } from 'uniswap/src/features/transactions/swap/services/warningService'
import type { SwapFormState } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/types'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { CurrencyField } from 'uniswap/src/types/currency'
import { createTransactionId } from 'uniswap/src/utils/createTransactionId'
import type { logger } from 'utilities/src/logger/logger'

// this will be in swapService
export function createPrepareSwap(
  ctx: HandleEventActionContext & GetActionContext & { warningService: WarningService; logger?: typeof logger },
): () => void {
  function prepareSwap(): void {
    try {
      const getAction = createGetAction(ctx)
      const handleEventAction = createHandleEventAction(ctx)

      const action = getAction({
        skipBridgingWarning: ctx.warningService.getSkipBridgingWarning(),
        skipMaxTransferWarning: ctx.warningService.getSkipMaxTransferWarning(),
        skipTokenProtectionWarning: ctx.warningService.getSkipTokenProtectionWarning(),
        skipBridgedAssetWarning: ctx.warningService.getSkipBridgedAssetWarning(),
      })

      handleEventAction(action)
    } catch (error) {
      ctx.logger?.error(error, {
        tags: {
          file: 'useOnReviewPress',
          function: 'prepareSwap',
        },
      })
    }
    // always reset the warning service after the action is handled
    ctx.warningService.reset()
  }
  return prepareSwap
}

interface GetActionContext {
  swapRedirectCallback?: SwapRedirectFn
  isConnected: boolean
  onConnectWallet?: (platform?: Platform) => void
  isViewOnlyWallet: boolean
  currencies: DerivedSwapInfo['currencies']
  exactAmountToken?: string
  exactCurrencyField: CurrencyField
  chainId: number
  needsTokenProtectionWarning: boolean
  needsBridgingWarning: boolean
  needsLowNativeBalanceWarning: boolean
  needsBridgedAssetWarning: boolean
}

const ReviewActionType = {
  REDIRECT: 'REDIRECT' as const,
  CONNECT_WALLET: 'CONNECT_WALLET' as const,
  SHOW_VIEW_ONLY: 'SHOW_VIEW_ONLY' as const,
  SHOW_TOKEN_WARNING: 'SHOW_TOKEN_WARNING' as const,
  SHOW_BRIDGING_WARNING: 'SHOW_BRIDGING_WARNING' as const,
  SHOW_LOW_BALANCE: 'SHOW_LOW_BALANCE' as const,
  PROCEED_TO_REVIEW: 'PROCEED_TO_REVIEW' as const,
  SHOW_BRIDGED_ASSET_WARNING: 'SHOW_BRIDGED_ASSET_WARNING' as const,
}

type RedirectActionPayload = Parameters<SwapRedirectFn>[0]

type LowBalanceActionPayload = {
  location: 'swap' | 'send'
}

type ConnectWalletActionPayload = {
  platform?: Platform
}

type ReviewAction =
  | { type: typeof ReviewActionType.REDIRECT; payload: RedirectActionPayload }
  | { type: typeof ReviewActionType.CONNECT_WALLET; payload: ConnectWalletActionPayload }
  | { type: typeof ReviewActionType.SHOW_VIEW_ONLY }
  | { type: typeof ReviewActionType.SHOW_TOKEN_WARNING }
  | { type: typeof ReviewActionType.SHOW_BRIDGING_WARNING }
  | { type: typeof ReviewActionType.SHOW_LOW_BALANCE; payload: LowBalanceActionPayload }
  | { type: typeof ReviewActionType.PROCEED_TO_REVIEW }
  | { type: typeof ReviewActionType.SHOW_BRIDGED_ASSET_WARNING }

type CallbackArgs = Record<
  'skipBridgingWarning' | 'skipTokenProtectionWarning' | 'skipMaxTransferWarning' | 'skipBridgedAssetWarning',
  boolean
>

function createGetAction(ctx: GetActionContext): (args: CallbackArgs) => ReviewAction {
  const {
    swapRedirectCallback,
    isConnected,
    onConnectWallet,
    isViewOnlyWallet,
    currencies,
    exactAmountToken,
    exactCurrencyField,
    chainId,
    needsTokenProtectionWarning,
    needsBridgingWarning,
    needsLowNativeBalanceWarning,
    needsBridgedAssetWarning,
  } = ctx
  function getAction(args: CallbackArgs): ReviewAction {
    if (swapRedirectCallback) {
      const redirectPayload: RedirectActionPayload = {
        inputCurrency: currencies[CurrencyField.INPUT]?.currency,
        outputCurrency: currencies[CurrencyField.OUTPUT]?.currency,
        typedValue: exactAmountToken,
        independentField: exactCurrencyField,
        chainId,
      }
      return {
        type: ReviewActionType.REDIRECT,
        payload: redirectPayload,
      }
    } else if (!isConnected && onConnectWallet) {
      return { type: ReviewActionType.CONNECT_WALLET, payload: { platform: chainIdToPlatform(chainId) } }
    } else if (isViewOnlyWallet) {
      return { type: ReviewActionType.SHOW_VIEW_ONLY }
    } else if (needsTokenProtectionWarning && !args.skipTokenProtectionWarning) {
      return { type: ReviewActionType.SHOW_TOKEN_WARNING }
    } else if (needsBridgingWarning && !args.skipBridgingWarning) {
      return { type: ReviewActionType.SHOW_BRIDGING_WARNING }
    } else if (needsLowNativeBalanceWarning && !args.skipMaxTransferWarning) {
      const lowBalancePayload: LowBalanceActionPayload = { location: 'swap' }
      return {
        type: ReviewActionType.SHOW_LOW_BALANCE,
        payload: lowBalancePayload,
      }
    } else if (needsBridgedAssetWarning && !args.skipBridgedAssetWarning) {
      return { type: ReviewActionType.SHOW_BRIDGED_ASSET_WARNING }
    }
    return { type: ReviewActionType.PROCEED_TO_REVIEW }
  }

  return getAction
}

interface HandleEventActionContext {
  handleShowViewOnlyModal: () => void
  handleShowTokenWarningModal: () => void
  handleShowBridgingWarningModal: () => void
  handleShowMaxNativeTransferModal: () => void
  handleShowBridgedAssetModal: () => void
  swapRedirectCallback?: SwapRedirectFn
  onConnectWallet?: (platform?: Platform) => void
  updateSwapForm: (newState: Partial<SwapFormState>) => void
  setScreen: (screen: TransactionScreen) => void
}

function createHandleEventAction(ctx: HandleEventActionContext): (action: ReviewAction) => void {
  const {
    handleShowViewOnlyModal,
    handleShowTokenWarningModal,
    handleShowBridgingWarningModal,
    handleShowMaxNativeTransferModal,
    handleShowBridgedAssetModal,
    swapRedirectCallback,
    onConnectWallet,
    updateSwapForm,
    setScreen,
  } = ctx
  function handleEventAction(action: ReviewAction): void {
    switch (action.type) {
      case ReviewActionType.REDIRECT:
        swapRedirectCallback?.(action.payload)
        break
      case ReviewActionType.CONNECT_WALLET:
        onConnectWallet?.(action.payload.platform)
        break
      case ReviewActionType.SHOW_VIEW_ONLY:
        handleShowViewOnlyModal()
        break
      case ReviewActionType.SHOW_TOKEN_WARNING:
        handleShowTokenWarningModal()
        break
      case ReviewActionType.SHOW_BRIDGING_WARNING:
        handleShowBridgingWarningModal()
        break
      case ReviewActionType.SHOW_LOW_BALANCE:
        handleShowMaxNativeTransferModal()
        sendAnalyticsEvent(UniswapEventName.LowNetworkTokenInfoModalOpened, action.payload)
        break
      case ReviewActionType.SHOW_BRIDGED_ASSET_WARNING:
        handleShowBridgedAssetModal()
        break
      case ReviewActionType.PROCEED_TO_REVIEW:
        updateSwapForm({ txId: createTransactionId() })
        setScreen(TransactionScreen.Review)
        break
    }
  }
  return handleEventAction
}
