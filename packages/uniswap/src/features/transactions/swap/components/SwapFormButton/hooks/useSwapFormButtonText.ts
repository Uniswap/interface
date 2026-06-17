import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useTranslation } from 'react-i18next'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { useConnectionStatus } from 'uniswap/src/features/accounts/store/hooks'
import { useShowGetStarted } from 'uniswap/src/features/passkey/ShowGetStartedContext'
import { isSVMChain } from 'uniswap/src/features/platforms/utils/chains'
import { useIsWebFORNudgeEnabled } from 'uniswap/src/features/providers/webForNudgeProvider'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { useIsAmountSelectionInvalid } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsAmountSelectionInvalid'
import { useIsMissingPlatformWallet } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsMissingPlatformWallet'
import { useIsTokenSelectionInvalid } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsTokenSelectionInvalid'
import { useIsTradeIndicative } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsTradeIndicative'
import { useNeedsGeoAcknowledgment } from 'uniswap/src/features/transactions/swap/hooks/useGeoRestrictionAcknowledgment'
import { useParsedSwapWarnings } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/useSwapWarnings'
import { getActionText } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapReviewFooter/SubmitSwapButton'
import { useSwapFormStoreDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { CurrencyField } from 'uniswap/src/types/currency'

export const useSwapFormButtonText = (): string => {
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
  const needsGeoAcknowledgment = useNeedsGeoAcknowledgment()

  const showGetStarted = useShowGetStarted()

  const nativeCurrency = nativeOnChain(chainId)

  const isIndicative = useIsTradeIndicative()
  const isWebFORNudgeEnabled = useIsWebFORNudgeEnabled()
  const isWrap = wrapType !== WrapType.NotApplicable

  if (swapRedirectCallback) {
    return t('common.getStarted')
  }

  // Geo acknowledgement overrides the blocked-token CTA: prompt the user to Review,
  // which opens the attestation modal instead of showing a blocking message.
  if (needsGeoAcknowledgment) {
    return t('swap.button.review')
  }

  if (blockingWarning?.buttonText) {
    return blockingWarning.buttonText
  }

  if (isWebFORNudgeEnabled) {
    return t('empty.swap.button.text')
  }

  if (isIndicative) {
    return t('swap.finalizingQuote')
  }

  if (isDisconnected) {
    if (showGetStarted) {
      return t('common.getStarted')
    }
    return isEmbeddedWalletEnabled ? t('common.connect.button') : t('common.connectWallet.button')
  }

  if (isMissingPlatformWallet) {
    return t('common.connectTo', { platform: isSVMChain(chainId) ? 'Solana' : 'Ethereum' })
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

  if (isWrap) {
    return getActionText({ t, wrapType })
  }

  return t('swap.button.review')
}
