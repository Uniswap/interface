import { useQuery } from '@tanstack/react-query'
import { type Currency, type CurrencyAmount } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import {
  getTempoFeeToken,
  getTempoFeeTokenPreferenceQueryOptions,
} from 'uniswap/src/features/gas/tempoFeeToken/tempoFeeToken'
import { useOnChainCurrencyBalance } from 'uniswap/src/features/portfolio/api'

/**
 * Returns the default gas token for a given chain (pure function, no hooks).
 *
 * Chains that pay gas in a non-native token declare it via `gasTokenOverride` in
 * their chain info (e.g. Tempo pathUSD, Arc USDC). All other chains pay gas in the
 * native currency.
 */
export function getChainGasToken(chainId: UniverseChainId): Currency {
  return getChainInfo(chainId).gasTokenOverride ?? nativeOnChain(chainId)
}

function isTempoFeeTokenStablecoin(currency: Currency): boolean {
  return getChainInfo(UniverseChainId.Tempo).tokens.stablecoins.some((stablecoin) => stablecoin.equals(currency))
}

export function useAccountGasToken({
  chainId,
  accountAddress,
  sendCurrency,
}: {
  chainId: UniverseChainId | undefined
  accountAddress?: Address
  sendCurrency?: Currency
}): { gasToken: Currency | undefined; isLoading: boolean } {
  const isFeeTokenPreferenceEnabled = useFeatureFlag(FeatureFlags.TempoFeeTokenPreference)
  const shouldReadPreference = isFeeTokenPreferenceEnabled && chainId === UniverseChainId.Tempo && !!accountAddress

  const { data: preferredFeeTokenAddress, isLoading } = useQuery(
    getTempoFeeTokenPreferenceQueryOptions(shouldReadPreference ? accountAddress : undefined),
  )

  const gasToken = useMemo(() => {
    if (chainId === undefined) {
      return undefined
    }
    if (shouldReadPreference && preferredFeeTokenAddress) {
      return getTempoFeeToken(preferredFeeTokenAddress)
    }
    if (
      shouldReadPreference &&
      preferredFeeTokenAddress === null &&
      sendCurrency &&
      isTempoFeeTokenStablecoin(sendCurrency)
    ) {
      return sendCurrency
    }
    return getChainGasToken(chainId)
  }, [chainId, shouldReadPreference, preferredFeeTokenAddress, sendCurrency])

  return {
    gasToken,
    isLoading: shouldReadPreference && isLoading,
  }
}

/**
 * Returns the gas token and its on-chain balance for a given chain.
 *
 * On Tempo, gas is paid in the account's fee token (pathUSD by default, not a native token). This hook abstracts
 * that difference so consumers don't need chain-specific gas logic.
 */
export function useChainGasToken({
  chainId,
  accountAddress,
  sendCurrency,
}: {
  chainId: UniverseChainId
  accountAddress?: Address
  sendCurrency?: Currency
}): {
  gasToken: Currency
  gasBalance: CurrencyAmount<Currency> | undefined
  isLoading: boolean
} {
  const { gasToken: accountGasToken, isLoading: isGasTokenLoading } = useAccountGasToken({
    chainId,
    accountAddress,
    sendCurrency,
  })
  const gasToken = accountGasToken ?? getChainGasToken(chainId)

  const { balance: gasBalance, isLoading: isBalanceLoading } = useOnChainCurrencyBalance(
    accountAddress && !isGasTokenLoading ? gasToken : undefined,
    accountAddress,
  )

  return { gasToken, gasBalance, isLoading: isGasTokenLoading || isBalanceLoading }
}
