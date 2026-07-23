import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TokenProfitLoss } from 'uniswap/src/components/TokenProfitLoss/TokenProfitLoss'
import { useGetWalletTokenProfitLossQuery } from 'uniswap/src/data/rest/getWalletTokenProfitLoss'
import { useConnectionStatus } from 'uniswap/src/features/accounts/store/hooks'
import { DEFAULT_NATIVE_ADDRESS } from 'uniswap/src/features/chains/evm/rpc'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isStablecoinAddress } from 'uniswap/src/features/chains/utils'
import { useRestPortfolioValueModifier } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useActiveAddresses } from '~/features/accounts/store/hooks'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { useMultichainTokenEntries } from '~/pages/TokenDetails/hooks/useMultichainTokenEntries'
import { useTDPEffectiveCurrency } from '~/pages/TokenDetails/hooks/useTDPEffectiveCurrency'

export function TokenPerformance(): JSX.Element | null {
  const { t } = useTranslation()
  const { isDisconnected } = useConnectionStatus()
  const { multiChainMap, selectedMultichainChainId } = useTDPStore((s) => ({
    multiChainMap: s.multiChainMap,
    selectedMultichainChainId: s.selectedMultichainChainId,
  }))
  const effectiveCurrency = useTDPEffectiveCurrency()
  const multichainEntries = useMultichainTokenEntries(multiChainMap)
  const isMultiChainAsset = multichainEntries.length > 1
  const showMultichainAggregation = isMultiChainAsset && selectedMultichainChainId === undefined

  const multichainRequestFlag = useMemo((): boolean | undefined => {
    if (isMultiChainAsset) {
      return showMultichainAggregation
    }
    return true
  }, [isMultiChainAsset, showMultichainAggregation])

  const { evmAddress, svmAddress } = useActiveAddresses()
  const modifier = useRestPortfolioValueModifier(evmAddress ?? svmAddress)

  const chainId = effectiveCurrency.chainId as UniverseChainId
  const tokenAddress = effectiveCurrency.isNative ? DEFAULT_NATIVE_ADDRESS : effectiveCurrency.address
  const isStablecoin = isStablecoinAddress(chainId, tokenAddress)

  const { data, isError } = useGetWalletTokenProfitLossQuery({
    input: {
      evmAddress,
      svmAddress,
      chainId,
      tokenAddress,
      modifier,
      multichain: multichainRequestFlag,
    },
    enabled: !isDisconnected && !isStablecoin,
  })

  const profitLoss = data?.profitLoss

  useEffect(() => {
    if (!profitLoss) {
      return
    }

    sendAnalyticsEvent(UniswapEventName.PnlTokenReport, {
      average_cost_usd: profitLoss.averageCostUsd,
      unrealized_return_usd: profitLoss.unrealizedReturnUsd,
      unrealized_return_percent: profitLoss.unrealizedReturnPercent,
      realized_return_usd: profitLoss.realizedReturnUsd,
      realized_return_percent: profitLoss.realizedReturnPercent,
      token_address: tokenAddress,
      chain_id: chainId,
    })
  }, [profitLoss, tokenAddress, chainId])

  if (isDisconnected || !profitLoss || isStablecoin || isError) {
    return null
  }

  return (
    <TokenProfitLoss
      title={t('pnl.title.allTime')}
      averageCost={profitLoss.averageCostUsd}
      unrealizedReturn={profitLoss.unrealizedReturnUsd}
      unrealizedReturnPercent={profitLoss.unrealizedReturnPercent}
      realizedReturn={profitLoss.realizedReturnUsd}
      realizedReturnPercent={profitLoss.realizedReturnPercent}
      totalReturn={profitLoss.unrealizedReturnUsd + profitLoss.realizedReturnUsd}
    />
  )
}
