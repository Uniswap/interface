import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import {
  getProfitLossPeriodLabel,
  getProfitLossSince,
  PROFIT_LOSS_PERIODS,
  ProfitLossPeriod,
} from 'uniswap/src/components/WalletProfitLoss/utils'
import { WalletProfitLoss } from 'uniswap/src/components/WalletProfitLoss/WalletProfitLoss'
import { useGetWalletProfitLossQuery } from 'uniswap/src/data/rest/getWalletProfitLoss'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useRestPortfolioValueModifier } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { Dropdown, InternalMenuItem } from '~/components/Dropdowns/Dropdown'
import { usePortfolioRoutes } from '~/pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { usePortfolioAddresses } from '~/pages/Portfolio/hooks/usePortfolioAddresses'
import { useShowDemoView } from '~/pages/Portfolio/hooks/useShowDemoView'

export const PortfolioPerformance = memo(function PortfolioPerformance() {
  const { t } = useTranslation()
  const isDemoView = useShowDemoView()
  const { chainId } = usePortfolioRoutes()
  const { evmAddress, svmAddress } = usePortfolioAddresses()
  const { chains: allChainIds, isTestnetModeEnabled } = useEnabledChains()
  const modifier = useRestPortfolioValueModifier(evmAddress ?? svmAddress)

  const [selectedPeriod, setSelectedPeriod] = useState<ProfitLossPeriod>(ProfitLossPeriod.ALL)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const filterChainIds = useMemo(() => (chainId ? [chainId] : allChainIds), [chainId, allChainIds])

  const since = useMemo(() => getProfitLossSince(selectedPeriod), [selectedPeriod])

  const { data, isPending, isError } = useGetWalletProfitLossQuery({
    input: {
      evmAddress,
      svmAddress,
      chainIds: filterChainIds,
      since,
      modifier,
    },
    enabled: !isDemoView,
  })

  const handlePeriodSelect = useCallback((period: ProfitLossPeriod) => {
    setSelectedPeriod(period)
    setIsDropdownOpen(false)
  }, [])

  const profitLoss = data?.profitLoss

  useEffect(() => {
    if (!profitLoss) {
      return
    }

    sendAnalyticsEvent(UniswapEventName.PnlPortfolioReport, {
      unrealized_return_usd: profitLoss.unrealizedReturnUsd,
      unrealized_return_percent: profitLoss.unrealizedReturnPercent,
      realized_return_usd: profitLoss.realizedReturnUsd,
      total_return_usd: profitLoss.totalReturnUsd,
      period: selectedPeriod,
    })
  }, [profitLoss, selectedPeriod])

  if (isDemoView || isError || isTestnetModeEnabled || (data && !profitLoss)) {
    return null
  }

  const showDisclaimer = !chainId && !!svmAddress

  const periodSelector = (
    <Dropdown
      isOpen={isDropdownOpen}
      toggleOpen={setIsDropdownOpen}
      menuLabel={<Text variant="buttonLabel4">{getProfitLossPeriodLabel({ period: selectedPeriod, t })}</Text>}
      buttonStyle={{ height: 28, borderRadius: '$rounded12', borderWidth: '$spacing1', borderColor: '$surface3' }}
      containerStyle={{ width: 'fit-content' }}
      dropdownStyle={{ minWidth: 100 }}
      chevronSize="$icon.16"
      alignRight
    >
      {PROFIT_LOSS_PERIODS.map((period) => (
        <InternalMenuItem key={period} onPress={() => handlePeriodSelect(period)}>
          <Text variant="buttonLabel4" color={period === selectedPeriod ? '$accent1' : '$neutral1'}>
            {getProfitLossPeriodLabel({ period, t })}
          </Text>
        </InternalMenuItem>
      ))}
    </Dropdown>
  )

  return (
    <Flex mt="$spacing8">
      <WalletProfitLoss
        unrealizedReturn={profitLoss?.unrealizedReturnUsd}
        unrealizedReturnPercent={profitLoss?.unrealizedReturnPercent}
        realizedReturn={profitLoss?.realizedReturnUsd}
        totalReturn={profitLoss?.totalReturnUsd}
        isLoading={isPending}
        disclaimer={showDisclaimer ? t('pnl.noSolana') : undefined}
        periodSelector={periodSelector}
        evmAddress={evmAddress}
      />
    </Flex>
  )
})
