/* eslint-disable complexity */
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ColorTokens,
  DeprecatedButton,
  Flex,
  SpinningLoader,
  Text,
  getHoverCssFilter,
  useIsDarkMode,
  useIsShortMobileDevice,
} from 'ui/src'
import { opacify, validColor } from 'ui/src/theme'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { useAccountMeta, useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { AccountCTAsExperimentGroup, Experiments } from 'uniswap/src/features/gating/experiments'
import { useExperimentGroupName } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName, WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { NativeCurrency } from 'uniswap/src/features/tokens/NativeCurrency'
import TokenWarningModal from 'uniswap/src/features/tokens/TokenWarningModal'
import {
  TransactionScreen,
  useTransactionModalContext,
} from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { ViewOnlyModal } from 'uniswap/src/features/transactions/modals/ViewOnlyModal'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { useSwapTxContext } from 'uniswap/src/features/transactions/swap/contexts/SwapTxContext'
import {
  useNeedsBridgingWarning,
  useNeedsLowNativeBalanceWarning,
  useParsedSwapWarnings,
  usePrefilledNeedsTokenProtectionWarning,
} from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings'
import { BridgingModal } from 'uniswap/src/features/transactions/swap/modals/BridgingModal'
import { LowNativeBalanceModal } from 'uniswap/src/features/transactions/swap/modals/LowNativeBalanceModal'
import { getActionName } from 'uniswap/src/features/transactions/swap/review/SubmitSwapButton'
import { WrapCallback } from 'uniswap/src/features/transactions/swap/types/wrapCallback'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { isWrapAction } from 'uniswap/src/features/transactions/swap/utils/wrap'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { useIsBlocked } from 'uniswap/src/features/trm/hooks'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { CurrencyField } from 'uniswap/src/types/currency'
import { getContrastPassingTextColor } from 'uniswap/src/utils/colors'
import { createTransactionId } from 'uniswap/src/utils/createTransactionId'
import { isInterface } from 'utilities/src/platform'

export const SWAP_BUTTON_TEXT_VARIANT = 'buttonLabel1'

export function SwapFormButton({
  wrapCallback,
  tokenColor,
}: {
  wrapCallback?: WrapCallback
  tokenColor?: string
}): JSX.Element {
  const { t } = useTranslation()
  const isShortMobileDevice = useIsShortMobileDevice()
  const isDarkMode = useIsDarkMode()

  const activeAccount = useAccountMeta()
  const { walletNeedsRestore, setScreen, swapRedirectCallback } = useTransactionModalContext()
  const {
    derivedSwapInfo,
    prefilledCurrencies,
    isSubmitting,
    updateSwapForm,
    exactAmountFiat,
    exactAmountToken,
    isMax,
  } = useSwapFormContext()
  const { blockingWarning, insufficientBalanceWarning, insufficientGasFundsWarning } = useParsedSwapWarnings()

  // needsTokenProtectionWarning is only true in interface, where swap component might be prefilled with a token that has a protection warning
  const { needsTokenProtectionWarning, currenciesWithProtectionWarnings } = usePrefilledNeedsTokenProtectionWarning(
    derivedSwapInfo,
    prefilledCurrencies,
  )
  const [showTokenWarningModal, setShowTokenWarningModal] = useState(false)

  const needsBridgingWarning = useNeedsBridgingWarning(derivedSwapInfo)
  const [showBridgingWarningModal, setShowBridgingWarningModal] = useState(false)

  const needsLowNativeBalanceWarning = useNeedsLowNativeBalanceWarning({ derivedSwapInfo, isMax })
  const [showMaxNativeTransferModal, setShowMaxNativeTransferModal] = useState(false)

  const [showViewOnlyModal, setShowViewOnlyModal] = useState(false)

  const { wrapType, trade, currencies, chainId, exactCurrencyField } = derivedSwapInfo

  const { isBlocked: isBlockedAccount, isBlockedLoading: isBlockedAccountLoading } = useIsBlocked(
    activeAccount?.address,
  )

  const noValidSwap = !isWrapAction(wrapType) && !trade.trade

  const indicative = !trade.trade && (trade.indicativeTrade || trade.isIndicativeLoading)

  const nativeCurrency = NativeCurrency.onChain(chainId)

  const reviewButtonDisabled =
    noValidSwap ||
    !!blockingWarning ||
    isBlockedAccount ||
    isBlockedAccountLoading ||
    walletNeedsRestore ||
    isSubmitting

  const isViewOnlyWallet = activeAccount?.type === AccountType.Readonly

  const { onConnectWallet } = useUniswapContext()

  const { isInterfaceWrap, onInterfaceWrap } = useInterfaceWrap(wrapCallback)

  /**
   * TODO(WALL-5600): refactor this so all previous warnings are skipped
   *
   * Order of modals:
   * 1. Token protection warning
   * 2. Bridging warning
   * 3. Low native balance warning
   *
   * When skipping, ensure the previous modals are skipped as well to prevent an infinite loop
   * (eg if you skip bridging warning, you should also skip token protection warning)
   */
  const onReviewPress = useCallback(
    ({
      skipBridgingWarning,
      skipTokenProtectionWarning,
      skipMaxTransferWarning,
    }: {
      skipBridgingWarning: boolean
      skipTokenProtectionWarning: boolean
      skipMaxTransferWarning: boolean
    }) => {
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
      } else if (needsTokenProtectionWarning && !skipTokenProtectionWarning) {
        setShowTokenWarningModal(true)
      } else if (needsBridgingWarning && !skipBridgingWarning) {
        setShowBridgingWarningModal(true)
      } else if (needsLowNativeBalanceWarning && !skipMaxTransferWarning && !isInterface) {
        setShowMaxNativeTransferModal(true)
        sendAnalyticsEvent(WalletEventName.LowNetworkTokenInfoModalOpened, { location: 'swap' })
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
      needsTokenProtectionWarning,
      needsLowNativeBalanceWarning,
    ],
  )

  const bridgingModalActionCallback = useCallback(
    (accepted: boolean) => {
      setShowBridgingWarningModal(false)
      if (accepted) {
        onReviewPress({ skipBridgingWarning: true, skipMaxTransferWarning: false, skipTokenProtectionWarning: true })
      }
    },
    [onReviewPress],
  )

  const invalidTokenSelection = Object.values(currencies).some((currency) => !currency)
  const invalidAmountSelection = !exactAmountFiat && !exactAmountToken

  const isBlockingWithCustomMessage =
    invalidTokenSelection ||
    invalidAmountSelection ||
    insufficientBalanceWarning ||
    insufficientGasFundsWarning ||
    indicative

  const accountsCTAExperimentGroup = useExperimentGroupName(Experiments.AccountCTAs)
  const isSignIn = accountsCTAExperimentGroup === AccountCTAsExperimentGroup.SignInSignUp
  const isLogIn = accountsCTAExperimentGroup === AccountCTAsExperimentGroup.LogInCreateAccount

  // TODO(WEB-5090): Simplify logic, deduplicate disabled vs reviewButtonDisabled
  const disabled = !!activeAccount && reviewButtonDisabled && !isViewOnlyWallet && !swapRedirectCallback

  const getButtonText = (): string => {
    if (swapRedirectCallback) {
      return t('common.getStarted')
    }
    if (indicative) {
      return t('swap.finalizingQuote')
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

  const { validTokenColor, tokenColorText, lightTokenColor, hoveredLightTokenColor } = useMemo(() => {
    const validatedColor = validColor(tokenColor)
    return {
      validTokenColor: validatedColor,
      tokenColorText: tokenColor ? getContrastPassingTextColor(tokenColor) : undefined,
      lightTokenColor: tokenColor ? opacify(12, validatedColor) : undefined,
      hoveredLightTokenColor: tokenColor ? opacify(24, validatedColor) : undefined,
    }
  }, [tokenColor])

  const buttonProps: {
    backgroundColor: ColorTokens
    hoverBackgroundColor: ColorTokens
    buttonTextColor: ColorTokens
    buttonText: string
    opacity: number | undefined
  } = {
    backgroundColor:
      !activeAccount || isSubmitting
        ? lightTokenColor ?? '$accent2'
        : (isBlockingWithCustomMessage || disabled) && !swapRedirectCallback
          ? '$surface2'
          : validTokenColor ?? '$accent1',
    hoverBackgroundColor:
      !activeAccount || isSubmitting
        ? hoveredLightTokenColor ?? '$accent2Hovered'
        : (isBlockingWithCustomMessage || disabled) && !swapRedirectCallback
          ? '$surface2'
          : validTokenColor ?? '$accent1Hovered',
    buttonTextColor: !activeAccount
      ? validTokenColor ?? '$accent1'
      : (isBlockingWithCustomMessage || disabled) && !swapRedirectCallback
        ? '$neutral2'
        : tokenColorText ?? '$white',
    buttonText: getButtonText(),
    opacity: getButtonOpacity(),
  }

  const filter =
    buttonProps.hoverBackgroundColor === validTokenColor && buttonProps.backgroundColor === validTokenColor
      ? getHoverCssFilter(isDarkMode)
      : undefined

  return (
    <Flex alignItems="center" gap={isShortMobileDevice ? '$spacing8' : '$spacing16'}>
      <Trace
        logPress
        element={ElementName.SwapReview}
        properties={{ chainId, tokenAmount: exactAmountToken, fiatAmount: exactAmountFiat }}
      >
        <LowNativeBalanceModal
          isOpen={showMaxNativeTransferModal}
          onClose={() => setShowMaxNativeTransferModal(false)}
          onAcknowledge={() => {
            setShowMaxNativeTransferModal(false)
            onReviewPress({
              skipBridgingWarning: true,
              skipTokenProtectionWarning: true,
              skipMaxTransferWarning: true,
            })
          }}
        />
        <DeprecatedButton
          animation="fast"
          // Custom styles are matched with our theme hover opacities - can remove this when we implement full theme support in DeprecatedButton
          pressStyle={{ backgroundColor: buttonProps.backgroundColor, scale: 0.98 }}
          hoverStyle={{ backgroundColor: buttonProps.hoverBackgroundColor, filter }}
          icon={indicative ? <SpinningLoader color="$neutral2" size={iconSizes.icon20} /> : undefined}
          backgroundColor={buttonProps.backgroundColor}
          isDisabled={disabled}
          opacity={buttonProps.opacity}
          size={isShortMobileDevice ? 'small' : 'large'}
          testID={TestID.ReviewSwap}
          width="100%"
          onPress={() =>
            onReviewPress({
              skipBridgingWarning: false,
              skipMaxTransferWarning: false,
              skipTokenProtectionWarning: false,
            })
          }
        >
          <Text color={buttonProps.buttonTextColor} variant={SWAP_BUTTON_TEXT_VARIANT}>
            {buttonProps.buttonText}
          </Text>
        </DeprecatedButton>
      </Trace>
      <ViewOnlyModal isOpen={showViewOnlyModal} onDismiss={(): void => setShowViewOnlyModal(false)} />
      <BridgingModal
        isOpen={showBridgingWarningModal}
        derivedSwapInfo={derivedSwapInfo}
        onContinue={() => bridgingModalActionCallback(true)}
        onClose={() => bridgingModalActionCallback(false)}
      />
      {currenciesWithProtectionWarnings.length > 0 && currenciesWithProtectionWarnings[0] && (
        <TokenWarningModal
          isVisible={showTokenWarningModal}
          currencyInfo0={currenciesWithProtectionWarnings[0]}
          currencyInfo1={currenciesWithProtectionWarnings.length > 1 ? currenciesWithProtectionWarnings[1] : undefined}
          closeModalOnly={() => setShowTokenWarningModal(false)}
          onAcknowledge={() => {
            setShowTokenWarningModal(false)
            onReviewPress({
              skipBridgingWarning: false,
              skipMaxTransferWarning: false,
              skipTokenProtectionWarning: true,
            })
          }}
        />
      )}
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
