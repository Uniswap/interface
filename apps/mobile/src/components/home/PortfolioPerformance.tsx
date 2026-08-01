import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { memo, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { ActionSheetDropdown } from 'uniswap/src/components/dropdowns/ActionSheetDropdown'
import type { MenuItemProp } from 'uniswap/src/components/modals/ActionSheetModal'
import {
  getProfitLossPeriodLabel,
  getProfitLossSince,
  PROFIT_LOSS_PERIODS,
  ProfitLossPeriod,
} from 'uniswap/src/components/WalletProfitLoss/utils'
import { WalletProfitLoss } from 'uniswap/src/components/WalletProfitLoss/WalletProfitLoss'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { useGetWalletProfitLossQuery } from 'uniswap/src/data/rest/getWalletProfitLoss'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useRestPortfolioValueModifier } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

interface PortfolioPerformanceProps {
  evmAddress: string
  chainIds: number[]
}

export const PortfolioPerformance = memo(function PortfolioPerformance({
  evmAddress,
  chainIds,
}: PortfolioPerformanceProps): JSX.Element | null {
  const { t } = useTranslation()
  const { isTestnetModeEnabled } = useEnabledChains()
  const [selectedPeriod, setSelectedPeriod] = useState<ProfitLossPeriod>(ProfitLossPeriod.ALL)
  const modifier = useRestPortfolioValueModifier(evmAddress)
  // The PortfolioChartDetails heartbeat coordinator only refreshes PnL when this flag is on —
  // otherwise this query must keep its own poll running, or PnL would never refresh.
  const isDataLivelinessEnabled = useFeatureFlag(FeatureFlags.DataLivelinessUI)

  const since = useMemo(() => getProfitLossSince(selectedPeriod), [selectedPeriod])

  const { data, isPending, isError } = useGetWalletProfitLossQuery({
    input: {
      evmAddress,
      chainIds,
      since,
      modifier,
    },
    refetchInterval: isDataLivelinessEnabled ? undefined : PollingInterval.Normal,
  })

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

  const options = useMemo<MenuItemProp[]>(
    () =>
      PROFIT_LOSS_PERIODS.map((period: ProfitLossPeriod) => ({
        key: period,
        onPress: () => setSelectedPeriod(period),
        render: () => (
          <Flex row alignItems="center" py="$spacing8" px="$spacing4">
            <Text
              allowFontScaling={false}
              numberOfLines={1}
              variant="body2"
              color={period === selectedPeriod ? '$accent1' : '$neutral1'}
            >
              {getProfitLossPeriodLabel({ period, t, verbose: true })}
            </Text>
          </Flex>
        ),
      })),
    [selectedPeriod, t],
  )

  const periodSelector = useMemo(
    () => (
      <Flex
        row
        centered
        gap="$spacing4"
        borderRadius="$roundedFull"
        borderWidth="$spacing1"
        borderColor="$surface3"
        pl="$spacing12"
        pr="$spacing8"
        py="$spacing6"
      >
        <ActionSheetDropdown showArrow options={options} styles={{ alignment: 'right', buttonPaddingY: 0 }}>
          <Text allowFontScaling={false} numberOfLines={1} variant="buttonLabel4" color="$neutral1">
            {getProfitLossPeriodLabel({ period: selectedPeriod, t, verbose: true })}
          </Text>
        </ActionSheetDropdown>
      </Flex>
    ),
    [options, selectedPeriod, t],
  )

  if (isError || isTestnetModeEnabled || (data && !profitLoss)) {
    return null
  }

  return (
    <Flex testID={TestID.PortfolioPerformance} pointerEvents="box-none" pb="$spacing16">
      <WalletProfitLoss
        unrealizedReturn={profitLoss?.unrealizedReturnUsd}
        unrealizedReturnPercent={profitLoss?.unrealizedReturnPercent}
        realizedReturn={profitLoss?.realizedReturnUsd}
        totalReturn={profitLoss?.totalReturnUsd}
        isLoading={isPending}
        periodSelector={periodSelector}
        evmAddress={evmAddress}
      />
    </Flex>
  )
})
