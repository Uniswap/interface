import { Trans } from '@lingui/macro'
import { Currency, TradeType } from '@uniswap/sdk-core'
import { sendEvent } from 'components/analytics'
import { AutoColumn } from 'components/Column'
import { LoadingOpacityContainer } from 'components/Loader/styled'
import { RowFixed } from 'components/Row'
import { MouseoverTooltipContent } from 'components/Tooltip'
import { InterfaceTrade } from 'state/routing/types'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { ReactComponent as GasIcon } from '../../assets/images/gas-icon.svg'
import { ResponsiveTooltipContainer } from './styleds'
import SwapRoute from './SwapRoute'

const GasWrapper = styled(RowFixed)`
  border-radius: 8px;
  padding: 4px 6px;
  height: 24px;
  color: ${({ theme }) => theme.deprecated_text3};
  background-color: ${({ theme }) => theme.deprecated_bg1};
  font-size: 14px;
  font-weight: 500;
  user-select: none;
`
const StyledGasIcon = styled(GasIcon)`
  margin-right: 4px;
  height: 14px;
  & > * {
    stroke: ${({ theme }) => theme.deprecated_text3};
  }
`

export default function GasEstimateBadge({
  trade,
  loading,
  showRoute,
  disableHover,
}: {
  trade: InterfaceTrade<Currency, Currency, TradeType> | undefined | null // dollar amount in active chain's stablecoin
  loading: boolean
  showRoute?: boolean // show route instead of gas estimation summary
  disableHover?: boolean
}) {
  const formattedGasPriceString = trade?.gasUseEstimateUSD
    ? trade.gasUseEstimateUSD.toFixed(2) === '0.00'
      ? '<$0.01'
      : '$' + trade.gasUseEstimateUSD.toFixed(2)
    : undefined

  return (
    <MouseoverTooltipContent
      wrap={false}
      disableHover={disableHover}
      content={
        loading ? null : (
          <ResponsiveTooltipContainer
            origin="top right"
            style={{
              padding: showRoute ? '0' : '12px',
              border: 'none',
              borderRadius: showRoute ? '16px' : '12px',
              maxWidth: '400px',
            }}
          >
            {showRoute ? (
              trade ? (
                <SwapRoute trade={trade} syncing={loading} fixedOpen={showRoute} />
              ) : null
            ) : (
              <AutoColumn gap="4px" justify="center">
                <ThemedText.DeprecatedMain fontSize="12px" textAlign="center">
                  <Trans>Estimated network fee</Trans>
                </ThemedText.DeprecatedMain>
                <ThemedText.DeprecatedBody textAlign="center" fontWeight={500} style={{ userSelect: 'none' }}>
                  <Trans>${trade?.gasUseEstimateUSD?.toFixed(2)}</Trans>
                </ThemedText.DeprecatedBody>
                <ThemedText.DeprecatedMain fontSize="10px" textAlign="center" maxWidth="140px" color="text3">
                  <Trans>Estimate may differ due to your wallet gas settings</Trans>
                </ThemedText.DeprecatedMain>
              </AutoColumn>
            )}
          </ResponsiveTooltipContainer>
        )
      }
      placement="bottom"
      onOpen={() =>
        sendEvent({
          category: 'Gas',
          action: 'Gas Details Tooltip Open',
        })
      }
    >
      <LoadingOpacityContainer $loading={loading}>
        <GasWrapper>
          <StyledGasIcon />
          {formattedGasPriceString ?? null}
        </GasWrapper>
      </LoadingOpacityContainer>
    </MouseoverTooltipContent>
  )
}
