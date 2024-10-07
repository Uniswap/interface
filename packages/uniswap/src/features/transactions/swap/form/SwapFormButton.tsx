/* eslint-disable complexity */
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, ColorTokens, Flex, Text, useIsShortMobileDevice } from 'ui/src'
import { useAccountMeta, useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { AccountCTAsExperimentGroup, Experiments } from 'uniswap/src/features/gating/experiments'
import { useExperimentGroupName } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { NativeCurrency } from 'uniswap/src/features/tokens/NativeCurrency'
import {
  TransactionScreen,
  useTransactionModalContext,
} from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { ViewOnlyModal } from 'uniswap/src/features/transactions/modals/ViewOnlyModal'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { useSwapTxContext } from 'uniswap/src/features/transactions/swap/contexts/SwapTxContext'
import {
  useNeedsBridgingWarning,
  useParsedSwapWarnings,
} from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings'
import { BridgingModal } from 'uniswap/src/features/transactions/swap/modals/BridgingModal'
import { getActionName } from 'uniswap/src/features/transactions/swap/review/SubmitSwapButton'
import { WrapCallback } from 'uniswap/src/features/transactions/swap/types/wrapCallback'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { isWrapAction } from 'uniswap/src/features/transactions/swap/utils/wrap'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { useIsBlocked } from 'uniswap/src/features/trm/hooks'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { CurrencyField } from 'uniswap/src/types/currency'
import { createTransactionId } from 'uniswap/src/utils/createTransactionId'
import { isInterface } from 'utilities/src/platform'

export const SWAP_BUTTON_TEXT_VARIANT = 'buttonLabel1'

export function SwapFormButton({ wrapCallback }: { wrapCallback?: WrapCallback }): JSX.Element {
  const { t } = useTranslation()
  const isShortMobileDevice = useIsShortMobileDevice()

  const activeAccount = useAccountMeta()
  const { walletNeedsRestore, setScreen, swapRedirectCallback } = useTransactionModalContext()
  const { derivedSwapInfo, isSubmitting, updateSwapForm, exactAmountFiat, exactAmountToken } = useSwapFormContext()
  const { blockingWarning, insufficientBalanceWarning, insufficientGasFundsWarning } = useParsedSwapWarnings()

  const needsBridgingWarning = useNeedsBridgingWarning(derivedSwapInfo)
  const [showBridgingWarningModal, setShowBridgingWarningModal] = useState(false)

  const [showViewOnlyModal, setShowViewOnlyModal] = useState(false)

  const { wrapType, trade, currencies, chainId, exactCurrencyField } = derivedSwapInfo

  const { isBlocked, isBlockedLoading } = useIsBlocked(activeAccount?.address)

  const noValidSwap = !isWrapAction(wrapType) && !trade.trade && !trade.indicativeTrade

  const nativeCurrency = NativeCurrency.onChain(chainId)

  const reviewButtonDisabled =
    noValidSwap || !!blockingWarning || isBlocked || isBlockedLoading || walletNeedsRestore || isSubmitting

  const isViewOnlyWallet = activeAccount?.type === AccountType.Readonly

  const { onConnectWallet } = useUniswapContext()

  const { isInterfaceWrap, onInterfaceWrap } = useInterfaceWrap(wrapCallback)

  const onReviewPress = useCallback(
    ({ skipBridgingWarning }: { skipBridgingWarning: boolean }) => {
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
        setShowViewOnlyModal(true)
      } else if (isInterfaceWrap) {
        // TODO(WEB-5012): Align interface wrap UX into SwapReviewScreen
        onInterfaceWrap?.()
      } else if (needsBridgingWarning && !skipBridgingWarning) {
        setShowBridgingWarningModal(true)
      } else {
        updateSwapForm({ txId: createTransactionId() })
        setScreen(TransactionScreen.Review)
      }
    },
    [
      swapRedirectCallback,
      activeAccount,
      onConnectWallet,
      isViewOnlyWallet,
      isInterfaceWrap,
      needsBridgingWarning,
      currencies,
      exactAmountToken,
      exactCurrencyField,
      chainId,
      onInterfaceWrap,
      updateSwapForm,
      setScreen,
    ],
  )

  const bridgingModalActionCallback = useCallback(
    (accepted: boolean) => {
      setShowBridgingWarningModal(false)
      if (accepted) {
        onReviewPress({ skipBridgingWarning: true })
      }
    },
    [onReviewPress],
  )

  const invalidTokenSelection = Object.values(currencies).some((currency) => !currency)
  const invalidAmountSelection = !exactAmountFiat && !exactAmountToken

  const isBlockingWithCustomMessage =
    invalidTokenSelection || invalidAmountSelection || insufficientBalanceWarning || insufficientGasFundsWarning

  const accountsCTAExperimentGroup = useExperimentGroupName(Experiments.AccountCTAs)
  const isSignIn = accountsCTAExperimentGroup === AccountCTAsExperimentGroup.SignInSignUp
  const isLogIn = accountsCTAExperimentGroup === AccountCTAsExperimentGroup.LogInCreateAccount

  // TODO(WEB-5090): Simplify logic, deduplicate disabled vs reviewButtonDisabled
  const disabled = !!activeAccount && reviewButtonDisabled && !isViewOnlyWallet && !swapRedirectCallback

  const getButtonText = (): string => {
    if (swapRedirectCallback) {
      return t('common.getStarted')
    }
    if (!activeAccount) {
      return isSignIn ? t('nav.signIn.button') : isLogIn ? t('nav.logIn.button') : t('common.connectWallet.button')
    }
    if (blockingWarning?.buttonText) {
      return blockingWarning.buttonText
    }
    if (invalidTokenSelection) {
      return t('common.selectToken.label')
    }
    if (invalidAmountSelection) {
      return t('common.noAmount.error')
    }
    if (insufficientBalanceWarning) {
      return t('common.insufficientTokenBalance.error.simple', {
        tokenSymbol: currencies[CurrencyField.INPUT]?.currency.symbol ?? '',
      })
    }
    if (insufficientGasFundsWarning) {
      return t('common.insufficientTokenBalance.error.simple', { tokenSymbol: nativeCurrency.symbol ?? '' })
    }
    if (isInterfaceWrap) {
      return getActionName(t, wrapType)
    }

    return t('swap.button.review')
  }

  const getButtonOpacity = (): number | undefined => {
    switch (true) {
      case isViewOnlyWallet:
        return 0.4
      case !!isBlockingWithCustomMessage:
      case !!disabled:
        // use opacity 1 for blocking states, because surface2 is hard to read with default disabled opacity
        return 1
      default:
        return 1
    }
  }

  const buttonProps: {
    backgroundColor: ColorTokens
    hoverBackgroundColor: ColorTokens
    buttonTextColor: ColorTokens
    buttonText: string
    opacity: number | undefined
  } = {
    backgroundColor:
      !activeAccount || isSubmitting
        ? '$accent2'
        : (isBlockingWithCustomMessage || disabled) && !swapRedirectCallback
          ? '$surface2'
          : '$accent1',
    hoverBackgroundColor:
      !activeAccount || isSubmitting
        ? '$accent2Hovered'
        : (isBlockingWithCustomMessage || disabled) && !swapRedirectCallback
          ? '$surface2'
          : '$accent1Hovered',
    buttonTextColor: !activeAccount
      ? '$accent1'
      : (isBlockingWithCustomMessage || disabled) && !swapRedirectCallback
        ? '$neutral2'
        : '$white',
    buttonText: getButtonText(),
    opacity: getButtonOpacity(),
  }

  return (
    <Flex alignItems="center" gap={isShortMobileDevice ? '$spacing8' : '$spacing16'}>
      <Trace logPress element={ElementName.SwapReview}>
        <Button
          hapticFeedback
          animation="fast"
          // Custom styles are matched with our theme hover opacities - can remove this when we implement full theme support in Button
          pressStyle={{ backgroundColor: buttonProps.backgroundColor, scale: 0.98 }}
          hoverStyle={{ backgroundColor: buttonProps.hoverBackgroundColor }}
          backgroundColor={buttonProps.backgroundColor}
          disabled={disabled}
          opacity={buttonProps.opacity}
          size={isShortMobileDevice ? 'small' : 'large'}
          testID={TestID.ReviewSwap}
          width="100%"
          onPress={() => onReviewPress({ skipBridgingWarning: false })}
        >
          <Text color={buttonProps.buttonTextColor} variant={SWAP_BUTTON_TEXT_VARIANT}>
            {buttonProps.buttonText}
          </Text>
        </Button>
      </Trace>
      <ViewOnlyModal isOpen={showViewOnlyModal} onDismiss={(): void => setShowViewOnlyModal(false)} />
      <BridgingModal
        isOpen={showBridgingWarningModal}
        derivedSwapInfo={derivedSwapInfo}
        onContinue={() => bridgingModalActionCallback(true)}
        onClose={() => bridgingModalActionCallback(false)}
      />
    </Flex>
  )
}

// TODO(WEB-5012): Align interface wrap UX into SwapReviewScreen
function useInterfaceWrap(wrapCallback?: WrapCallback): {
  isInterfaceWrap: boolean
  onInterfaceWrap?: () => void
} {
  const account = useAccountMeta()
  const { derivedSwapInfo, updateSwapForm } = useSwapFormContext()
  const swapTxContext = useSwapTxContext()

  const { currencyAmounts, txId, wrapType } = derivedSwapInfo
  const isInterfaceWrap = isInterface && wrapType !== WrapType.NotApplicable

  const onInterfaceWrap = useMemo(() => {
    const inputCurrencyAmount = currencyAmounts[CurrencyField.INPUT]
    const txRequest = isUniswapX(swapTxContext) ? undefined : swapTxContext.txRequest
    if (!wrapCallback || !txRequest || !isInterfaceWrap || !account || !inputCurrencyAmount) {
      return undefined
    }

    const onSuccess = (): void =>
      updateSwapForm({ exactAmountFiat: undefined, exactAmountToken: '', isSubmitting: false })
    const onFailure = (): void => updateSwapForm({ isSubmitting: false })

    return () => {
      updateSwapForm({ isSubmitting: true })
      wrapCallback({
        account,
        inputCurrencyAmount,
        onSuccess,
        onFailure,
        txRequest,
        txId,
        wrapType,
        gasEstimates: swapTxContext.gasFeeEstimation.wrapEstimates,
      })
    }
  }, [account, currencyAmounts, isInterfaceWrap, swapTxContext, txId, updateSwapForm, wrapCallback, wrapType])

  return { isInterfaceWrap, onInterfaceWrap }
}
