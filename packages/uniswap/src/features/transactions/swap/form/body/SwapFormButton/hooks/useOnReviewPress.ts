import { useCallback } from 'react'
import { useAccountMeta, useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { AccountMeta, AccountType } from 'uniswap/src/features/accounts/types'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import {
  TransactionScreen,
  useTransactionModalContext,
} from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import {
  useNeedsBridgingWarning,
  useNeedsLowNativeBalanceWarning,
  usePrefilledNeedsTokenProtectionWarning,
} from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings'
import { CurrencyField } from 'uniswap/src/types/currency'
import { createTransactionId } from 'uniswap/src/utils/createTransactionId'
import { isInterface } from 'utilities/src/platform'

const getIsViewOnlyWallet = (activeAccount?: AccountMeta): boolean => {
  return activeAccount?.type === AccountType.Readonly
}

type BooleanArgs = Record<'isInterfaceWrap', boolean>

type FunctionArgs = Record<
  | 'handleShowViewOnlyModal'
  | 'handleShowTokenWarningModal'
  | 'handleShowBridgingWarningModal'
  | 'handleShowMaxNativeTransferModal'
  | 'handleHideMaxNativeTransferModal'
  | 'handleHideTokenWarningModal',
  () => void
>

type MaybeFunctionArgs = Record<'onInterfaceWrap', undefined | (() => void)>

type CallbackArgs = Record<'skipBridgingWarning' | 'skipTokenProtectionWarning' | 'skipMaxTransferWarning', boolean>

export type OnReviewPress = (options: CallbackArgs) => void

type PressHandler = () => void

type UseOnReviewPress = (props: BooleanArgs & FunctionArgs & MaybeFunctionArgs) => {
  onReviewPress: OnReviewPress
  handleOnReviewPress: PressHandler
  handleOnAcknowledgeTokenWarningPress: PressHandler
  handleOnAcknowledgeLowNativeBalancePress: PressHandler
}

export const useOnReviewPress: UseOnReviewPress = ({
  handleShowViewOnlyModal,
  handleShowTokenWarningModal,
  handleShowBridgingWarningModal,
  handleShowMaxNativeTransferModal,
  handleHideMaxNativeTransferModal,
  handleHideTokenWarningModal,
  onInterfaceWrap,
  isInterfaceWrap,
}) => {
  const { derivedSwapInfo, updateSwapForm, exactAmountToken, prefilledCurrencies, isMax } = useSwapFormContext()
  const { currencies, exactCurrencyField, chainId } = derivedSwapInfo
  const { swapRedirectCallback, setScreen } = useTransactionModalContext()
  const activeAccount = useAccountMeta()
  const { onConnectWallet } = useUniswapContext()

  // needsTokenProtectionWarning is only true in interface, where swap component might be prefilled with a token that has a protection warning
  const { needsTokenProtectionWarning } = usePrefilledNeedsTokenProtectionWarning(derivedSwapInfo, prefilledCurrencies)

  const needsLowNativeBalanceWarning = useNeedsLowNativeBalanceWarning({ derivedSwapInfo, isMax })

  const needsBridgingWarning = useNeedsBridgingWarning(derivedSwapInfo)

  const isViewOnlyWallet = getIsViewOnlyWallet(activeAccount)

  const onReviewPress: OnReviewPress = useCallback(
    ({ skipBridgingWarning, skipTokenProtectionWarning, skipMaxTransferWarning }) => {
      if (swapRedirectCallback) {
        swapRedirectCallback({
          inputCurrency: currencies[CurrencyField.INPUT]?.currency,
          outputCurrency: currencies[CurrencyField.OUTPUT]?.currency,
          typedValue: exactAmountToken,
          independentField: exactCurrencyField,
          chainId,
        })
        // Active account will only ever be undefined on web
      } else if (!activeAccount && onConnectWallet) {
        onConnectWallet()
      } else if (isViewOnlyWallet) {
        handleShowViewOnlyModal()
      } else if (isInterfaceWrap) {
        // TODO(WEB-5012): Align interface wrap UX into SwapReviewScreen
        onInterfaceWrap?.()
      } else if (needsTokenProtectionWarning && !skipTokenProtectionWarning) {
        handleShowTokenWarningModal()
      } else if (needsBridgingWarning && !skipBridgingWarning) {
        handleShowBridgingWarningModal()
      } else if (needsLowNativeBalanceWarning && !skipMaxTransferWarning && !isInterface) {
        handleShowMaxNativeTransferModal()
        sendAnalyticsEvent(WalletEventName.LowNetworkTokenInfoModalOpened, { location: 'swap' })
      } else {
        updateSwapForm({ txId: createTransactionId() })
        setScreen(TransactionScreen.Review)
      }
    },
    [
      activeAccount,
      chainId,
      currencies,
      exactAmountToken,
      exactCurrencyField,
      handleShowBridgingWarningModal,
      handleShowMaxNativeTransferModal,
      handleShowTokenWarningModal,
      handleShowViewOnlyModal,
      isInterfaceWrap,
      isViewOnlyWallet,
      needsBridgingWarning,
      needsLowNativeBalanceWarning,
      needsTokenProtectionWarning,
      onConnectWallet,
      onInterfaceWrap,
      setScreen,
      swapRedirectCallback,
      updateSwapForm,
    ],
  )

  const handleOnReviewPress: PressHandler = useCallback(() => {
    onReviewPress({
      skipBridgingWarning: false,
      skipMaxTransferWarning: false,
      skipTokenProtectionWarning: false,
    })
  }, [onReviewPress])

  const handleOnAcknowledgeTokenWarningPress: PressHandler = useCallback(() => {
    handleHideTokenWarningModal()
    onReviewPress({
      skipBridgingWarning: false,
      skipMaxTransferWarning: false,
      skipTokenProtectionWarning: true,
    })
  }, [handleHideTokenWarningModal, onReviewPress])

  const handleOnAcknowledgeLowNativeBalancePress: PressHandler = useCallback(() => {
    handleHideMaxNativeTransferModal()
    onReviewPress({
      skipBridgingWarning: true,
      skipMaxTransferWarning: true,
      skipTokenProtectionWarning: true,
    })
  }, [handleHideMaxNativeTransferModal, onReviewPress])

  return {
    onReviewPress,
    handleOnReviewPress,
    handleOnAcknowledgeTokenWarningPress,
    handleOnAcknowledgeLowNativeBalancePress,
  }
}
