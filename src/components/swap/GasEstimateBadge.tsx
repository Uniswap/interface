import { Trans } from '@lingui/macro'
import { Currency, TradeType } from '@uniswap/sdk-core'
import { AutoColumn } from 'components/Column'
import { LoadingOpacityContainer } from 'components/Loader/styled'
import { RowFixed } from 'components/Row'
import { MouseoverTooltipContent } from 'components/Tooltip'
import ReactGA from 'react-ga'
import { InterfaceTrade } from 'state/routing/types'
import styled from 'styled-components/macro'
import { TYPE } from 'theme'

import { ReactComponent as GasIcon } from '../../assets/images/gas-icon.svg'
// import { ReactComponent as GasIcon } from '../../assets/images/router-icon-grey.svg'
import { ResponsiveTooltipContainer } from './styleds'
import SwapRoute from './SwapRoute'

const GasWrapper = styled(RowFixed)`
  border-radius: 8px;
  padding: 4px 6px;
  height: 24px;
  color: ${({ theme }) => theme.text3};
  background-color: ${({ theme }) => theme.bg2};
  font-size: 14px;
  font-weight: 500;
  user-select: none;
`
const StyledGasIcon = styled(GasIcon)`
  margin-right: 4px;
  height: 14px;
  & > * {
    stroke: ${({ theme }) => theme.text3};
  }
`

export default function GasEstimateBadge({
  trade,
  loading,
  showRoute,
}: {
  trade: InterfaceTrade<Currency, Currency, TradeType> | undefined | null // dollar amount in active chain's stabelcoin
  loading: boolean
  showRoute?: boolean // show route instead of gas estimation summary
}) {
  return (
    <MouseoverTooltipContent
      wrap={false}
      content={
        loading ? null : (
          <ResponsiveTooltipContainer origin="top right" style={{ padding: '12px', maxWidth: '400px' }}>
            {showRoute ? (
              trade ? (
                <SwapRoute trade={trade} syncing={loading} fixedOpen={showRoute} />
              ) : null
            ) : (
              <AutoColumn gap="4px" justify="center">
                <TYPE.main fontSize="12px" textAlign="center">
                  <Trans>Estimated network fee</Trans>
                </TYPE.main>
                <TYPE.body textAlign="center" fontWeight={500} style={{ userSelect: 'none' }}>
                  <Trans>${trade?.gasUseEstimateUSD?.toFixed(2)}</Trans>
                </TYPE.body>
                <TYPE.main fontSize="10px" textAlign="center" maxWidth="140px" color="text3">
                  <Trans>Estimate may differ due to your wallet gas settings</Trans>
                </TYPE.main>
              </AutoColumn>
            )}
          </ResponsiveTooltipContainer>
        )
      }
      placement="bottom"
      onOpen={() =>
        ReactGA.event({
          category: 'Gas',
          action: 'Gas Details Tooltip Open',
        })
      }
    >
      <LoadingOpacityContainer $loading={loading}>
        <GasWrapper>
          <StyledGasIcon />
          {trade?.gasUseEstimateUSD ? <Trans>${trade.gasUseEstimateUSD?.toFixed(2)}</Trans> : null}
        </GasWrapper>
      </LoadingOpacityContainer>
    </MouseoverTooltipContent>
  )
}
