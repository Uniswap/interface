import { type Currency, type CurrencyAmount } from '@uniswap/sdk-core'
import { type ChainedQuoteResponse, type DiscriminatedQuoteResponse, type GasFeeResult } from '@universe/api'
import { isWebPlatform } from '@universe/environment'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  type Warning,
  WarningAction,
  WarningLabel,
  WarningSeverity,
} from 'uniswap/src/components/modals/WarningModal/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useChainGasToken } from 'uniswap/src/features/gas/hooks/useChainGasToken'
import { hasSufficientGasBalance } from 'uniswap/src/features/gas/utils'
import { isChainedQuoteResponse } from 'uniswap/src/features/transactions/swap/utils/routing'
import { tradingApiToUniverseChainId } from 'uniswap/src/features/transactions/swap/utils/tradingApi'

export type EarnGasWarningFlow = 'deposit' | 'withdraw'

type EarnQuoteGasFeeCheck = {
  chainId: UniverseChainId
  gasFee: string
}

const MAX_EARN_GAS_WARNING_CHAINS = 2

function addGasFeeByChain({
  checksByChain,
  chainId,
  gasFee,
}: {
  checksByChain: Map<UniverseChainId, bigint>
  chainId: UniverseChainId | undefined
  gasFee: string | undefined
}): void {
  if (!chainId || !gasFee) {
    return
  }
  checksByChain.set(chainId, (checksByChain.get(chainId) ?? BigInt(0)) + BigInt(gasFee))
}

export function getEarnQuoteGasFeeChecks(quote: ChainedQuoteResponse['quote'] | undefined): EarnQuoteGasFeeCheck[] {
  if (!quote) {
    return []
  }

  const quoteChainId = tradingApiToUniverseChainId(quote.tokenInChainId)
  const isSameChain = quote.tokenInChainId === quote.tokenOutChainId
  if (isSameChain) {
    return quoteChainId && quote.gasFee ? [{ chainId: quoteChainId, gasFee: quote.gasFee }] : []
  }

  const checksByChain = new Map<UniverseChainId, bigint>()
  quote.gasEstimates?.forEach((estimate, index) => {
    const step = quote.steps?.[index]
    addGasFeeByChain({
      checksByChain,
      chainId: tradingApiToUniverseChainId(step?.tokenInChainId),
      gasFee: estimate.gasFee,
    })
  })

  // Earn routes currently pay gas on at most the source and vault chains. Keep this fixed so the
  // hook below can call useChainGasToken a stable number of times.
  return Array.from(checksByChain.entries())
    .slice(0, MAX_EARN_GAS_WARNING_CHAINS)
    .map(([chainId, gasFee]) => ({
      chainId,
      gasFee: gasFee.toString(),
    }))
}

function getGasTokenTransactionAmount({
  gasToken,
  inputAmount,
  chainId,
}: {
  gasToken: Currency
  inputAmount: CurrencyAmount<Currency> | null | undefined
  chainId: UniverseChainId
}): CurrencyAmount<Currency> | undefined {
  return inputAmount?.currency.chainId === chainId && inputAmount.currency.equals(gasToken) ? inputAmount : undefined
}

export function getInsufficientGasWarning({
  chainId,
  gasBalance,
  gasFee,
  gasToken,
  inputAmount,
  t,
}: {
  chainId: UniverseChainId
  gasBalance: CurrencyAmount<Currency> | undefined
  gasFee: string | undefined
  gasToken: Currency
  inputAmount: CurrencyAmount<Currency> | null | undefined
  t: ReturnType<typeof useTranslation>['t']
}): Warning | undefined {
  if (!gasBalance) {
    return undefined
  }

  if (!gasFee) {
    return undefined
  }

  const hasGasFunds = hasSufficientGasBalance({
    chainId,
    gasBalance,
    gasFee,
    gasTokenTransactionAmount: getGasTokenTransactionAmount({ gasToken, inputAmount, chainId }),
  })
  if (hasGasFunds) {
    return undefined
  }

  const currencySymbol = gasBalance.currency.symbol ?? ''
  return {
    type: WarningLabel.InsufficientGasFunds,
    severity: WarningSeverity.Medium,
    action: WarningAction.DisableSubmit,
    title: t('swap.warning.insufficientGas.title', { currencySymbol }),
    buttonText: isWebPlatform ? t('swap.warning.insufficientGas.button', { currencySymbol }) : undefined,
    currency: gasBalance.currency,
  }
}

export function useEarnInsufficientGasWarning({
  accountAddress,
  fallbackChainId,
  flow,
  inputAmount,
  quote,
}: {
  accountAddress: Address | undefined
  fallbackChainId: UniverseChainId
  flow: EarnGasWarningFlow
  inputAmount: CurrencyAmount<Currency> | null | undefined
  quote: DiscriminatedQuoteResponse | null | undefined
}): {
  flow: EarnGasWarningFlow
  gasFee: GasFeeResult
  hasInsufficientGas: boolean
  warning: Warning | undefined
  warnings: Warning[]
} {
  const { t } = useTranslation()
  const chainedQuote = isChainedQuoteResponse(quote) ? quote.quote : undefined
  const gasFeeChecks = useMemo(() => getEarnQuoteGasFeeChecks(chainedQuote), [chainedQuote])
  const primaryGasFeeCheck = gasFeeChecks[0]
  const secondaryGasFeeCheck = gasFeeChecks[1]

  const primaryChainId = primaryGasFeeCheck?.chainId ?? fallbackChainId
  const secondaryChainId = secondaryGasFeeCheck?.chainId ?? fallbackChainId
  const primaryGas = useChainGasToken({ chainId: primaryChainId, accountAddress })
  const secondaryGas = useChainGasToken({ chainId: secondaryChainId, accountAddress })

  const insufficientGas = useMemo(() => {
    const primaryWarning = getInsufficientGasWarning({
      chainId: primaryChainId,
      gasBalance: primaryGas.gasBalance,
      gasFee: primaryGasFeeCheck?.gasFee,
      gasToken: primaryGas.gasToken,
      inputAmount,
      t,
    })
    if (primaryWarning) {
      return { warning: primaryWarning, gasFee: primaryGasFeeCheck?.gasFee }
    }

    const secondaryWarning = getInsufficientGasWarning({
      chainId: secondaryChainId,
      gasBalance: secondaryGas.gasBalance,
      gasFee: secondaryGasFeeCheck?.gasFee,
      gasToken: secondaryGas.gasToken,
      inputAmount,
      t,
    })
    return secondaryWarning ? { warning: secondaryWarning, gasFee: secondaryGasFeeCheck?.gasFee } : undefined
  }, [
    inputAmount,
    primaryChainId,
    primaryGas.gasBalance,
    primaryGas.gasToken,
    primaryGasFeeCheck?.gasFee,
    secondaryChainId,
    secondaryGas.gasBalance,
    secondaryGas.gasToken,
    secondaryGasFeeCheck?.gasFee,
    t,
  ])

  const gasFee = useMemo<GasFeeResult>(
    () => ({
      value: insufficientGas?.gasFee,
      isLoading: false,
      error: null,
    }),
    [insufficientGas?.gasFee],
  )

  return {
    flow,
    gasFee,
    hasInsufficientGas: insufficientGas !== undefined,
    warning: insufficientGas?.warning,
    warnings: insufficientGas ? [insufficientGas.warning] : [],
  }
}
