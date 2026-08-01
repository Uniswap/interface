import type { Currency } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { useMemo } from 'react'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { useTokenProjects } from 'uniswap/src/features/dataApi/tokenProjects/tokenProjects'
import { useEarnVaults } from 'uniswap/src/features/earn/hooks/useEarnVaults'
import { useIsEarnEnabled } from 'uniswap/src/features/earn/hooks/useIsEarnEnabled'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { selectEarnVaultForToken } from 'uniswap/src/features/earn/utils'
import type { UseTradeArgs } from 'uniswap/src/features/transactions/swap/types/trade'
import { getChainedActionsSupportedChainIds } from 'uniswap/src/features/transactions/swap/utils/chainedActions'
import { toTradingApiSupportedChainId } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { buildWrappedNativeCurrencyId, currencyId } from 'uniswap/src/utils/currencyId'

type UseSwapEarnIntentParams = {
  currencyIn: Maybe<Currency>
  currencyOut: Maybe<Currency>
  enabled?: boolean
}

type UseSwapEarnIntentResult = {
  earnIntent: TradingApi.EarnIntent | undefined
  isEligible: boolean
  quoteOutputOverride: UseTradeArgs['quoteOutputOverride'] | undefined
  vault: EarnVaultInfo | undefined
}

export function useSwapEarnIntent({
  currencyIn,
  currencyOut,
  enabled = true,
}: UseSwapEarnIntentParams): UseSwapEarnIntentResult {
  const isEarnEnabled = useIsEarnEnabled()
  const inputChainId = toSupportedChainId(currencyIn?.chainId)
  const outputChainId = toSupportedChainId(currencyOut?.chainId)
  const chainedActionsSupportedChainIds = getChainedActionsSupportedChainIds()

  const canEvaluateVaults =
    enabled &&
    isEarnEnabled &&
    !!currencyIn &&
    !!currencyOut &&
    !currencyIn.equals(currencyOut) &&
    !!inputChainId &&
    !!outputChainId &&
    inputChainId === outputChainId &&
    chainedActionsSupportedChainIds.includes(outputChainId)

  const directOutputCurrencyId = useMemo(() => currencyId(currencyOut), [currencyOut])
  const wrappedOutputCurrencyId = useMemo(
    () => (currencyOut?.isNative && outputChainId ? buildWrappedNativeCurrencyId(outputChainId) : undefined),
    [currencyOut, outputChainId],
  )

  const projectQueryIds = useMemo(
    () => [directOutputCurrencyId, wrappedOutputCurrencyId].filter((id): id is string => Boolean(id)),
    [directOutputCurrencyId, wrappedOutputCurrencyId],
  )

  // TokenProjects expands assets across chains, so e.g. Unichain USDC can match the Mainnet USDC vault
  // and let the backend plan swap -> bridge -> deposit.
  const tokenProjects = useTokenProjects(canEvaluateVaults ? projectQueryIds : [])
  const { vaults } = useEarnVaults({ enabled: canEvaluateVaults })

  const tokenCurrencyIds = useMemo(() => {
    const ids = new Set(projectQueryIds)
    tokenProjects.data?.forEach((currencyInfo) => ids.add(currencyInfo.currencyId))
    return Array.from(ids)
  }, [projectQueryIds, tokenProjects.data])

  const vault = useMemo(() => {
    return canEvaluateVaults ? selectEarnVaultForToken({ tokenCurrencyIds, vaults }) : undefined
  }, [canEvaluateVaults, tokenCurrencyIds, vaults])

  const earnIntent = useMemo<TradingApi.EarnIntent | undefined>(() => {
    const chainId = vault ? toTradingApiSupportedChainId(vault.chainId) : undefined
    if (!vault || !chainId) {
      return undefined
    }

    return {
      action: TradingApi.EarnAction.DEPOSIT,
      vault: vault.vaultAddress,
      chainId,
    }
  }, [vault])

  const quoteOutputOverride = useMemo<UseTradeArgs['quoteOutputOverride'] | undefined>(() => {
    const chainId = vault ? toTradingApiSupportedChainId(vault.chainId) : undefined
    if (!vault || !chainId) {
      return undefined
    }

    return {
      tokenOutAddress: vault.vaultAddress,
      tokenOutChainId: Number(chainId),
    }
  }, [vault])

  return {
    earnIntent,
    isEligible: canEvaluateVaults && !!earnIntent,
    quoteOutputOverride,
    vault,
  }
}
