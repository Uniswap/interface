/* eslint-disable complexity */
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, Button, ColorTokens, Flex, SpinningLoader, Text, isWeb, useIsShortMobileDevice } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
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
import { useParsedSwapWarnings } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { isWrapAction } from 'uniswap/src/features/transactions/swap/utils/wrap'
import { useIsBlocked } from 'uniswap/src/features/trm/hooks'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { CurrencyField } from 'uniswap/src/types/currency'
import { createTransactionId } from 'uniswap/src/utils/createTransactionId'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

const KEEP_OPEN_MSG_DELAY = 3 * ONE_SECOND_MS
export const SWAP_BUTTON_TEXT_VARIANT = 'buttonLabel1'

export function SwapFormButton(): JSX.Element {
  const { t } = useTranslation()
  const isShortMobileDevice = useIsShortMobileDevice()

  const activeAccount = useAccountMeta()
  const { walletNeedsRestore, setScreen } = useTransactionModalContext()
  const { derivedSwapInfo, isSubmitting, updateSwapForm, exactAmountFiat, exactAmountToken } = useSwapFormContext()
  const { blockingWarning, insufficientBalanceWarning, insufficientGasFundsWarning } = useParsedSwapWarnings()

  const [showViewOnlyModal, setShowViewOnlyModal] = useState(false)

  const { wrapType, trade, currencies, chainId } = derivedSwapInfo

  const { isBlocked, isBlockedLoading } = useIsBlocked(activeAccount?.address)

  const noValidSwap = !isWrapAction(wrapType) && !trade.trade && !trade.indicativeTrade

  const nativeCurrency = NativeCurrency.onChain(chainId)

  const reviewButtonDisabled =
    noValidSwap || !!blockingWarning || isBlocked || isBlockedLoading || walletNeedsRestore || isSubmitting

  const isViewOnlyWallet = activeAccount?.type === AccountType.Readonly

  const { onConnectWallet } = useUniswapContext()

  const onReviewPress = useCallback(() => {
    // Active account will only ever be undefined on web
    if (!activeAccount && onConnectWallet) {
      onConnectWallet()
    } else if (isViewOnlyWallet) {
      setShowViewOnlyModal(true)
    } else {
      updateSwapForm({ txId: createTransactionId() })
      setScreen(TransactionScreen.Review)
    }
  }, [activeAccount, isViewOnlyWallet, onConnectWallet, setScreen, updateSwapForm])

  // TODO(WEB-4821): Remove uniswapx submission logic since this component will no longer be rendered during submission
  const showUniswapXSubmittingUI = trade.trade && isUniswapX(trade?.trade) && isSubmitting

  const invalidTokenSelection = Object.values(currencies).some((currency) => !currency)
  const invalidAmountSelection = !exactAmountFiat && !exactAmountToken

  const isBlockingWithCustomMessage =
    invalidTokenSelection || invalidAmountSelection || insufficientBalanceWarning || insufficientGasFundsWarning

  const accountsCTAExperimentGroup = useExperimentGroupName(Experiments.AccountCTAs)
  const isSignIn = accountsCTAExperimentGroup === AccountCTAsExperimentGroup.SignInSignUp
  const isLogIn = accountsCTAExperimentGroup === AccountCTAsExperimentGroup.LogInCreateAccount

  const getButtonText = (): string => {
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

    return t('swap.button.review')
  }

  const buttonProps: {
    backgroundColor: ColorTokens
    buttonTextColor: ColorTokens
    buttonText: string
  } = {
    backgroundColor:
      !activeAccount || isSubmitting ? '$accent2' : isBlockingWithCustomMessage ? '$surface2' : '$accent1',
    buttonTextColor: !activeAccount ? '$accent1' : isBlockingWithCustomMessage ? '$neutral2' : '$white',
    buttonText: getButtonText(),
  }

  return (
    <Flex alignItems="center" gap={isShortMobileDevice ? '$spacing8' : '$spacing16'}>
      <Trace logPress element={ElementName.SwapReview}>
        <Button
          hapticFeedback
          // Custom styles are matched with our theme hover opacities - can remove this when we implement full theme support in Button
          pressStyle={{ backgroundColor: buttonProps.backgroundColor, opacity: 0.7 }}
          hoverStyle={{ backgroundColor: buttonProps.backgroundColor, opacity: 0.9 }}
          backgroundColor={buttonProps.backgroundColor}
          disabled={!!activeAccount && reviewButtonDisabled && !isViewOnlyWallet}
          icon={showUniswapXSubmittingUI ? <SpinningLoader color="$accent1" size={iconSizes.icon24} /> : undefined}
          // use opacity 1 for states with error text, because surface2 is hard to read with default disabled opacity
          opacity={isViewOnlyWallet ? 0.4 : isBlockingWithCustomMessage ? 1 : undefined}
          size={isShortMobileDevice ? 'small' : isWeb ? 'medium' : 'large'}
          testID={TestID.ReviewSwap}
          width="100%"
          onPress={onReviewPress}
        >
          {showUniswapXSubmittingUI ? (
            <SubmittingText />
          ) : (
            <Text color={buttonProps.buttonTextColor} variant={SWAP_BUTTON_TEXT_VARIANT}>
              {buttonProps.buttonText}
            </Text>
          )}
        </Button>
      </Trace>
      <ViewOnlyModal isOpen={showViewOnlyModal} onDismiss={(): void => setShowViewOnlyModal(false)} />
    </Flex>
  )
}

export function SubmittingText(): JSX.Element {
  const { t } = useTranslation()
  const [showKeepOpenMessage, setShowKeepOpenMessage] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setShowKeepOpenMessage(true), KEEP_OPEN_MSG_DELAY)
    return () => clearTimeout(timeout)
  }, [])

  // Use different key to re-trigger animation when message changes
  const key = showKeepOpenMessage ? 'submitting-text-msg1' : 'submitting-text-msg2'

  return (
    <AnimatePresence key={key}>
      <Flex animateEnterExit="fadeInDownOutDown" animation="quicker">
        <Text color="$accent1" flex={1} textAlign="center" variant={SWAP_BUTTON_TEXT_VARIANT}>
          {showKeepOpenMessage ? t('swap.button.submitting.keep.open') : t('swap.button.submitting')}
        </Text>
      </Flex>
    </AnimatePresence>
  )
}
