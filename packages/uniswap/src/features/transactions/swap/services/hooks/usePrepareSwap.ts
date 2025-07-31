import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { useInterfaceWrap } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useInterfaceWrap'
import { useSwapFormWarningStoreActions } from 'uniswap/src/features/transactions/swap/form/stores/swapFormWarningStore/useSwapFormWarningStore'
import { useNeedsBridgingWarning } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/useNeedsBridgingWarning'
import { useNeedsLowNativeBalanceWarning } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/useNeedsLowNativeBalanceWarning'
import { usePrefilledNeedsTokenProtectionWarning } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/usePrefilledNeedsTokenProtectionWarning'
import { createPrepareSwap } from 'uniswap/src/features/transactions/swap/services/prepareSwapService'
import type { WarningService } from 'uniswap/src/features/transactions/swap/services/warningService'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { AccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'

const getIsViewOnlyWallet = (activeAccount?: AccountDetails): boolean => {
  return activeAccount?.accountType === AccountType.Readonly
}

export function usePrepareSwap(ctx: { warningService: WarningService }): () => void {
  const {
    handleShowTokenWarningModal,
    handleShowBridgingWarningModal,
    handleShowMaxNativeTransferModal,
    handleShowViewOnlyModal,
  } = useSwapFormWarningStoreActions()
  const { isInterfaceWrap, onInterfaceWrap } = useInterfaceWrap()
  const { derivedSwapInfo, updateSwapForm, exactAmountToken, prefilledCurrencies, isMax } = useSwapFormStore((s) => ({
    derivedSwapInfo: s.derivedSwapInfo,
    updateSwapForm: s.updateSwapForm,
    exactAmountToken: s.exactAmountToken,
    prefilledCurrencies: s.prefilledCurrencies,
    isMax: s.isMax,
  }))
  const { currencies, exactCurrencyField, chainId } = derivedSwapInfo
  const { swapRedirectCallback, setScreen } = useTransactionModalContext()
  const activeAccount = useWallet().evmAccount
  const { onConnectWallet } = useUniswapContext()

  // needsTokenProtectionWarning is only true in interface, where swap component might be prefilled with a token that has a protection warning
  const { needsTokenProtectionWarning } = usePrefilledNeedsTokenProtectionWarning(derivedSwapInfo, prefilledCurrencies)

  const needsLowNativeBalanceWarning = useNeedsLowNativeBalanceWarning({ derivedSwapInfo, isMax })

  const needsBridgingWarning = useNeedsBridgingWarning(derivedSwapInfo)

  const isViewOnlyWallet = getIsViewOnlyWallet(activeAccount)

  return useEvent(
    createPrepareSwap({
      // getAction
      activeAccount,
      isViewOnlyWallet,
      isInterfaceWrap,
      currencies,
      exactAmountToken,
      exactCurrencyField,
      chainId,
      needsTokenProtectionWarning,
      needsBridgingWarning,
      needsLowNativeBalanceWarning,
      // handleEventAction
      handleShowViewOnlyModal,
      handleShowTokenWarningModal,
      handleShowBridgingWarningModal,
      handleShowMaxNativeTransferModal,
      onInterfaceWrap,
      updateSwapForm,
      setScreen,
      // shared
      swapRedirectCallback,
      onConnectWallet,
      // ctx
      warningService: ctx.warningService,
      logger,
    }),
  )
}
