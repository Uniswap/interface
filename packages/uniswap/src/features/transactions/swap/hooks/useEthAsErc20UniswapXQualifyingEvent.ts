import {
  EthAsErc20UniswapXProperties,
  Experiments,
  useExperimentValueWithExposureLoggingDisabled,
} from '@universe/gating'
import { useEffect, useRef } from 'react'
import { useWalletCheckDelegationQuery } from 'uniswap/src/data/apiClients/tradingApi/useWalletCheckDelegationQuery'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { logExperimentQualifyingEvent } from 'uniswap/src/features/telemetry/utils/logExperimentQualifyingEvent'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { toTradingApiSupportedChainId } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { CurrencyField } from 'uniswap/src/types/currency'
import { logger } from 'utilities/src/logger/logger'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

const ELIGIBLE_CHAIN_IDS = new Set<UniverseChainId>([
  UniverseChainId.Mainnet,
  UniverseChainId.ArbitrumOne,
  UniverseChainId.Base,
])

type MinUsdThresholdsByChain = { mainnet: number; base: number; arbitrum: number }

const DEFAULT_MIN_USD_THRESHOLDS: MinUsdThresholdsByChain = { mainnet: 300, base: 1000, arbitrum: 300 }

const CHAIN_KEY_TO_ID: Record<keyof MinUsdThresholdsByChain, UniverseChainId> = {
  mainnet: UniverseChainId.Mainnet,
  base: UniverseChainId.Base,
  arbitrum: UniverseChainId.ArbitrumOne,
}

function statsigThresholdsObjectToChainIdObject(
  object: Record<keyof MinUsdThresholdsByChain, number>,
): Partial<Record<UniverseChainId, number>> {
  const result: Partial<Record<UniverseChainId, number>> = {}
  for (const key of Object.keys(CHAIN_KEY_TO_ID) as Array<keyof MinUsdThresholdsByChain>) {
    result[CHAIN_KEY_TO_ID[key]] = object[key]
  }
  return result
}

function useMinUsdThresholds(): Partial<Record<UniverseChainId, number>> {
  const thresholds = useExperimentValueWithExposureLoggingDisabled({
    experiment: Experiments.EthAsErc20UniswapX,
    param: EthAsErc20UniswapXProperties.MinEthErc20USDValueThresholdByChain,
    defaultValue: DEFAULT_MIN_USD_THRESHOLDS,
  })

  try {
    return statsigThresholdsObjectToChainIdObject(thresholds)
  } catch (error) {
    logger.error(error, {
      tags: {
        file: 'useEthAsErc20UniswapXQualifyingEvent',
        function: 'useMinUsdThresholds',
      },
      extra: {
        thresholds,
      },
    })
  }

  return statsigThresholdsObjectToChainIdObject(DEFAULT_MIN_USD_THRESHOLDS)
}

/**
 * Checks synchronous eligibility conditions (no I/O).
 * Returns true only if all non-async conditions pass.
 */
function checkBasicEligibility({
  derivedSwapInfo,
  hasWallet,
  minUsdByChain,
}: {
  derivedSwapInfo: DerivedSwapInfo
  hasWallet: boolean
  minUsdByChain: Partial<Record<UniverseChainId, number>>
}): boolean {
  if (!hasWallet) {
    return false
  }

  const { chainId, currencies, currencyAmountsUSDValue, trade } = derivedSwapInfo
  const inputCurrency = currencies[CurrencyField.INPUT]?.currency
  const outputCurrency = currencies[CurrencyField.OUTPUT]?.currency

  // Must have a valid trade/quote
  if (!trade.trade) {
    return false
  }

  // Must have both currencies
  if (!inputCurrency || !outputCurrency) {
    return false
  }

  // Input must be native ETH
  if (!inputCurrency.isNative) {
    return false
  }

  // Must be same-chain swap
  if (inputCurrency.chainId !== outputCurrency.chainId) {
    return false
  }

  // Chain must be eligible
  if (!ELIGIBLE_CHAIN_IDS.has(chainId)) {
    return false
  }

  // USD amount must exceed per-chain threshold
  const inputUsdValue = currencyAmountsUSDValue[CurrencyField.INPUT]
  if (!inputUsdValue) {
    return false
  }
  const usdAmount = Number(inputUsdValue.toExact())
  const minUsd = minUsdByChain[chainId]
  if (minUsd === undefined || usdAmount <= minUsd) {
    return false
  }

  // User must have sufficient balance for the swap amount
  const inputAmount = derivedSwapInfo.currencyAmounts[CurrencyField.INPUT]
  const inputBalance = derivedSwapInfo.currencyBalances[CurrencyField.INPUT]
  if (!inputAmount || !inputBalance || inputBalance.lessThan(inputAmount)) {
    return false
  }

  return true
}

/**
 * Logs a qualifying event for the EthAsErc20UniswapX experiment once per
 * unique quote, when all eligibility conditions are met:
 *
 * 1. EVM wallet is connected
 * 2. Input token is native ETH
 * 3. Same-chain swap (not cross-chain/bridge)
 * 4. Chain is one of `ELIGIBLE_CHAIN_IDS`.
 * 5. Input USD value higher than `DEFAULT_MIN_USD_THRESHOLDS` (configurable via Statsig)
 * 6. Wallet has sufficient balance for the swap input amount
 * 7. Wallet is delegated to Uniswap (via /check_delegation API)
 *
 * This logic originally included this additional check, but it was removed because otherwise exposure was never logged for the Control variant. See SWAP-2520.
 * 8. Wallet has native allowance > 0 for the ERC20 ETH contract (on-chain check)
 */
export function useEthAsErc20UniswapXQualifyingEvent(derivedSwapInfo: DerivedSwapInfo): void {
  const { evmAccount } = useWallet()
  const walletAddress = evmAccount?.address
  const { chainId } = derivedSwapInfo

  const inputCurrencyId = derivedSwapInfo.currencies[CurrencyField.INPUT]?.currencyId
  const outputCurrencyId = derivedSwapInfo.currencies[CurrencyField.OUTPUT]?.currencyId
  const pairKey = inputCurrencyId && outputCurrencyId ? `${inputCurrencyId}|${outputCurrencyId}` : undefined

  // 1. Check cheap synchronous conditions
  const minUsdByChain = useMinUsdThresholds()
  const basicEligible = checkBasicEligibility({ derivedSwapInfo, hasWallet: !!walletAddress, minUsdByChain })

  // 2. Check delegation (async, via /check_delegation API)
  const tradingApiChainId = toTradingApiSupportedChainId(chainId)
  const { data: delegationResponse } = useWalletCheckDelegationQuery({
    params:
      basicEligible && walletAddress && tradingApiChainId
        ? { walletAddresses: [walletAddress], chainIds: [tradingApiChainId] }
        : undefined,
    staleTime: 5 * ONE_MINUTE_MS,
  })

  const isDelegated = walletAddress
    ? delegationResponse?.delegationDetails[walletAddress]?.[String(chainId)]?.isWalletDelegatedToUniswap === true
    : false

  const allConditionsMet = basicEligible && isDelegated

  // Fire exactly once per token pair using a ref for deduplication.
  // This helps us avoid spamming our analytics while polling.
  // Depends on [allConditionsMet, pairKey] so it re-runs when:
  //   - The token pair changes (pairKey changes), OR
  //   - Async conditions resolve (allConditionsMet flips true)
  const lastLoggedPairKeyRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!allConditionsMet || !pairKey || pairKey === lastLoggedPairKeyRef.current) {
      return
    }

    lastLoggedPairKeyRef.current = pairKey
    logExperimentQualifyingEvent({ experiment: Experiments.EthAsErc20UniswapX })
  }, [allConditionsMet, pairKey])
}
