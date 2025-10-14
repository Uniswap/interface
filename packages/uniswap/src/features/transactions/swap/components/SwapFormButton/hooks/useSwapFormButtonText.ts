import { useTranslation } from 'react-i18next'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { useConnectionStatus } from 'uniswap/src/features/accounts/store/hooks'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { isSVMChain } from 'uniswap/src/features/platforms/utils/chains'
import { useIsWebFORNudgeEnabled } from 'uniswap/src/features/providers/webForNudgeProvider'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { useInterfaceWrap } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useInterfaceWrap'
import { useIsAmountSelectionInvalid } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsAmountSelectionInvalid'
import { useIsMissingPlatformWallet } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsMissingPlatformWallet'
import { useIsTokenSelectionInvalid } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsTokenSelectionInvalid'
import { useIsTradeIndicative } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsTradeIndicative'
import { useParsedSwapWarnings } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/useSwapWarnings'
import { getActionText } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapReviewFooter/SubmitSwapButton'
import { useSwapFormStoreDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { CurrencyField } from 'uniswap/src/types/currency'

export const useSwapFormButtonText = (): string => {
  const { isInterfaceWrap } = useInterfaceWrap()
  const { t } = useTranslation()
  const { swapRedirectCallback } = useTransactionModalContext()
  const { currencies, wrapType, chainId } = useSwapFormStoreDerivedSwapInfo((s) => ({
    currencies: s.currencies,
    wrapType: s.wrapType,
    chainId: s.chainId,
  }))
  const isTokenSelectionInvalid = useIsTokenSelectionInvalid()
  const isAmountSelectionInvalid = useIsAmountSelectionInvalid()

  const { isDisconnected } = useConnectionStatus()
  const isMissingPlatformWallet = useIsMissingPlatformWallet(chainId)

  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)
  const { insufficientBalanceWarning, blockingWarning, insufficientGasFundsWarning } = useParsedSwapWarnings()

  const isLogIn = isEmbeddedWalletEnabled

  const nativeCurrency = nativeOnChain(chainId)

  const isIndicative = useIsTradeIndicative()
  const isWebFORNudgeEnabled = useIsWebFORNudgeEnabled()

  if (swapRedirectCallback) {
    return t('common.getStarted')
  }

  if (isWebFORNudgeEnabled) {
    return t('empty.swap.button.text')
  }

  if (isIndicative) {
    return t('swap.finalizingQuote')
  }

  if (isDisconnected) {
    return isLogIn ? t('nav.logIn.button') : t('common.connectWallet.button')
  }

  if (isMissingPlatformWallet) {
    return t('common.connectTo', { platform: isSVMChain(chainId) ? 'Solana' : 'Ethereum' })
  }

  if (blockingWarning?.buttonText) {
    return blockingWarning.buttonText
  }

  if (isTokenSelectionInvalid) {
    return t('common.selectToken.label')
  }

  if (isAmountSelectionInvalid) {
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
    return getActionText({ t, wrapType })
  }

  return t('swap.button.review')
}
