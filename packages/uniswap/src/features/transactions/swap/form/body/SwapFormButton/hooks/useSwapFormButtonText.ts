import { useTranslation } from 'react-i18next'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { AccountCTAsExperimentGroup, Experiments } from 'uniswap/src/features/gating/experiments'
import { useExperimentGroupName } from 'uniswap/src/features/gating/hooks'
import { NativeCurrency } from 'uniswap/src/features/tokens/NativeCurrency'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { useInterfaceWrap } from 'uniswap/src/features/transactions/swap/form/body/SwapFormButton/hooks/useInterfaceWrap'
import { useIsAmountSelectionInvalid } from 'uniswap/src/features/transactions/swap/form/body/SwapFormButton/hooks/useIsAmountSelectionInvalid'
import { useIsTokenSelectionInvalid } from 'uniswap/src/features/transactions/swap/form/body/SwapFormButton/hooks/useIsTokenSelectionInvalid'
import { useIsTradeIndicative } from 'uniswap/src/features/transactions/swap/form/body/SwapFormButton/hooks/useIsTradeIndicative'
import { useParsedSwapWarnings } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings'
import { getActionName } from 'uniswap/src/features/transactions/swap/review/SubmitSwapButton'
import { CurrencyField } from 'uniswap/src/types/currency'

export const useSwapFormButtonText = (): string => {
  const { isInterfaceWrap } = useInterfaceWrap()
  const { t } = useTranslation()
  const { swapRedirectCallback } = useTransactionModalContext()
  const {
    derivedSwapInfo: { currencies, wrapType, chainId },
  } = useSwapFormContext()
  const isTokenSelectionInvalid = useIsTokenSelectionInvalid()
  const isAmountSelectionInvalid = useIsAmountSelectionInvalid()

  const accountsCTAExperimentGroup = useExperimentGroupName(Experiments.AccountCTAs)
  const { insufficientBalanceWarning, blockingWarning, insufficientGasFundsWarning } = useParsedSwapWarnings()

  const isSignIn = accountsCTAExperimentGroup === AccountCTAsExperimentGroup.SignInSignUp
  const isLogIn = accountsCTAExperimentGroup === AccountCTAsExperimentGroup.LogInCreateAccount

  const nativeCurrency = NativeCurrency.onChain(chainId)

  const isIndicative = useIsTradeIndicative()

  const activeAccount = useAccountMeta()

  if (swapRedirectCallback) {
    return t('common.getStarted')
  }

  if (isIndicative) {
    return t('swap.finalizingQuote')
  }

  if (!activeAccount) {
    return isSignIn ? t('nav.signIn.button') : isLogIn ? t('nav.logIn.button') : t('common.connectWallet.button')
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
    return getActionName(t, wrapType)
  }

  return t('swap.button.review')
}
