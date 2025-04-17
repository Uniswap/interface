import { AccountMeta } from 'uniswap/src/features/accounts/types'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import {
  SwapRedirectFn,
  TransactionScreen,
} from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { SwapFormState } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { WarningService } from 'uniswap/src/features/transactions/swap/services/warningService'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { CurrencyField } from 'uniswap/src/types/currency'
import { createTransactionId } from 'uniswap/src/utils/createTransactionId'
import { logger } from 'utilities/src/logger/logger'

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
  activeAccount?: AccountMeta
  onConnectWallet?: () => void
  isViewOnlyWallet: boolean
  isInterfaceWrap: boolean
  currencies: DerivedSwapInfo['currencies']
  exactAmountToken?: string
  exactCurrencyField: CurrencyField
  chainId: number
  needsTokenProtectionWarning: boolean
  needsBridgingWarning: boolean
  needsLowNativeBalanceWarning: boolean
}

const ReviewActionType = {
  REDIRECT: 'REDIRECT' as const,
  CONNECT_WALLET: 'CONNECT_WALLET' as const,
  SHOW_VIEW_ONLY: 'SHOW_VIEW_ONLY' as const,
  INTERFACE_WRAP: 'INTERFACE_WRAP' as const,
  SHOW_TOKEN_WARNING: 'SHOW_TOKEN_WARNING' as const,
  SHOW_BRIDGING_WARNING: 'SHOW_BRIDGING_WARNING' as const,
  SHOW_LOW_BALANCE: 'SHOW_LOW_BALANCE' as const,
  PROCEED_TO_REVIEW: 'PROCEED_TO_REVIEW' as const,
}

type RedirectActionPayload = Parameters<SwapRedirectFn>[0]

type LowBalanceActionPayload = {
  location: 'swap' | 'send'
}

type ReviewAction =
  | { type: typeof ReviewActionType.REDIRECT; payload: RedirectActionPayload }
  | { type: typeof ReviewActionType.CONNECT_WALLET }
  | { type: typeof ReviewActionType.SHOW_VIEW_ONLY }
  | { type: typeof ReviewActionType.INTERFACE_WRAP }
  | { type: typeof ReviewActionType.SHOW_TOKEN_WARNING }
  | { type: typeof ReviewActionType.SHOW_BRIDGING_WARNING }
  | { type: typeof ReviewActionType.SHOW_LOW_BALANCE; payload: LowBalanceActionPayload }
  | { type: typeof ReviewActionType.PROCEED_TO_REVIEW }

type CallbackArgs = Record<'skipBridgingWarning' | 'skipTokenProtectionWarning' | 'skipMaxTransferWarning', boolean>

function createGetAction(ctx: GetActionContext): (args: CallbackArgs) => ReviewAction {
  const {
    swapRedirectCallback,
    activeAccount,
    onConnectWallet,
    isViewOnlyWallet,
    isInterfaceWrap,
    currencies,
    exactAmountToken,
    exactCurrencyField,
    chainId,
    needsTokenProtectionWarning,
    needsBridgingWarning,
    needsLowNativeBalanceWarning,
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
    } else if (!activeAccount && onConnectWallet) {
      return { type: ReviewActionType.CONNECT_WALLET }
    } else if (isViewOnlyWallet) {
      return { type: ReviewActionType.SHOW_VIEW_ONLY }
    } else if (isInterfaceWrap) {
      return { type: ReviewActionType.INTERFACE_WRAP }
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
  swapRedirectCallback?: SwapRedirectFn
  onConnectWallet?: () => void
  onInterfaceWrap?: () => void
  updateSwapForm: (newState: Partial<SwapFormState>) => void
  setScreen: (screen: TransactionScreen) => void
}

function createHandleEventAction(ctx: HandleEventActionContext): (action: ReviewAction) => void {
  const {
    handleShowViewOnlyModal,
    handleShowTokenWarningModal,
    handleShowBridgingWarningModal,
    handleShowMaxNativeTransferModal,
    swapRedirectCallback,
    onConnectWallet,
    onInterfaceWrap,
    updateSwapForm,
    setScreen,
  } = ctx
  function handleEventAction(action: ReviewAction): void {
    switch (action.type) {
      case ReviewActionType.REDIRECT:
        swapRedirectCallback?.(action.payload)
        break
      case ReviewActionType.CONNECT_WALLET:
        onConnectWallet?.()
        break
      case ReviewActionType.SHOW_VIEW_ONLY:
        handleShowViewOnlyModal()
        break
      case ReviewActionType.INTERFACE_WRAP:
        onInterfaceWrap?.()
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
      case ReviewActionType.PROCEED_TO_REVIEW:
        updateSwapForm({ txId: createTransactionId() })
        setScreen(TransactionScreen.Review)
        break
    }
  }
  return handleEventAction
}
