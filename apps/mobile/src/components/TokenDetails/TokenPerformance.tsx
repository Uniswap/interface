import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { memo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { Flex, Separator } from 'ui/src'
import { TokenProfitLoss } from 'uniswap/src/components/TokenProfitLoss/TokenProfitLoss'
import { useGetWalletTokenProfitLossQuery } from 'uniswap/src/data/rest/getWalletTokenProfitLoss'
import { DEFAULT_NATIVE_ADDRESS } from 'uniswap/src/features/chains/evm/rpc'
import { isStablecoinAddress } from 'uniswap/src/features/chains/utils'
import { useRestPortfolioValueModifier } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { useActiveAddresses } from 'wallet/src/features/accounts/store/hooks'

export const TokenPerformance = memo(function TokenPerformance(): JSX.Element | null {
  const { t } = useTranslation()
  const isProfitLossEnabled = useFeatureFlag(FeatureFlags.ProfitLoss)
  const multichainTokenUxEnabled = useFeatureFlag(FeatureFlags.MultichainTokenUx)
  const { address, chainId } = useTokenDetailsContext()
  const { evmAddress, svmAddress } = useActiveAddresses()
  const modifier = useRestPortfolioValueModifier(evmAddress ?? svmAddress)

  const tokenAddress = isNativeCurrencyAddress(chainId, address) ? DEFAULT_NATIVE_ADDRESS : address
  const isStablecoin = isStablecoinAddress(chainId, tokenAddress)

  const { data, isError } = useGetWalletTokenProfitLossQuery({
    input: {
      evmAddress,
      svmAddress,
      chainId,
      tokenAddress,
      modifier,
      multichain: multichainTokenUxEnabled || undefined,
    },
    enabled: isProfitLossEnabled && !isStablecoin,
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

  if (!isProfitLossEnabled || !profitLoss || isStablecoin || isError) {
    return null
  }

  return (
    <Flex gap="$spacing24" px="$spacing16">
      <TokenProfitLoss
        title={t('pnl.title.allTime')}
        averageCost={profitLoss.averageCostUsd}
        unrealizedReturn={profitLoss.unrealizedReturnUsd}
        unrealizedReturnPercent={profitLoss.unrealizedReturnPercent}
        realizedReturn={profitLoss.realizedReturnUsd}
        realizedReturnPercent={profitLoss.realizedReturnPercent}
        totalReturn={profitLoss.unrealizedReturnUsd + profitLoss.realizedReturnUsd}
      />
      <Separator />
    </Flex>
  )
})
