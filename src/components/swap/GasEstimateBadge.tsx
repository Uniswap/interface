import { Trans } from '@lingui/macro'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { AutoColumn } from 'components/Column'
import { LoadingOpacityContainer } from 'components/Loader/styled'
import { RowFixed } from 'components/Row'
import { MouseoverTooltipContent } from 'components/Tooltip'
import ReactGA from 'react-ga'
import styled from 'styled-components/macro'
import { TYPE } from 'theme'

import { ResponsiveTooltipContainer } from './styleds'

const GasWrapper = styled(RowFixed)`
  border-radius: 12px;
  padding: 4px 6px;
  height: 24px;
  color: ${({ theme }) => theme.text3};
  background-color: ${({ theme }) => theme.bg1};
  font-size: 14px;
`

export default function GasEstimateBadge({
  gasUseEstimateUSD,
  loading,
}: {
  gasUseEstimateUSD: CurrencyAmount<Token> | null // dollar amount in active chain's stabelcoin
  loading: boolean
}) {
  return (
    <MouseoverTooltipContent
      wrap={false}
      content={
        <ResponsiveTooltipContainer origin="top right" style={{ padding: '12px' }}>
          <AutoColumn gap="4px" justify="center">
            <TYPE.main fontSize="12px" textAlign="center">
              <Trans>Estimated network fee</Trans>
            </TYPE.main>
            <TYPE.body textAlign="center">
              <Trans>${gasUseEstimateUSD?.toFixed(2)}</Trans>
            </TYPE.body>
            <TYPE.main fontSize="12px" textAlign="center">
              <Trans>~30 seconds</Trans>
            </TYPE.main>
          </AutoColumn>
        </ResponsiveTooltipContainer>
      }
      placement="bottom"
      onOpen={() =>
        ReactGA.event({
          category: 'Swap',
          action: 'Transaction Details Tooltip Open',
        })
      }
    >
      <LoadingOpacityContainer $loading={loading}>
        <GasWrapper>
          <Trans>${gasUseEstimateUSD?.toFixed(2)}</Trans>
        </GasWrapper>
      </LoadingOpacityContainer>
    </MouseoverTooltipContent>
  )
}
