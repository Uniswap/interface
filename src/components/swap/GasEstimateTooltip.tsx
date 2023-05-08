import { Currency, TradeType } from '@uniswap/sdk-core'
import { LoadingOpacityContainer } from 'components/Loader/styled'
import { RowFixed } from 'components/Row'
import { MouseoverTooltip, TooltipSize } from 'components/Tooltip'
import { InterfaceTrade } from 'state/routing/types'
import styled from 'styled-components/macro'

import { ReactComponent as GasIcon } from '../../assets/images/gas-icon.svg'
import SwapRoute from './SwapRoute'

const GasWrapper = styled(RowFixed)`
  border-radius: 8px;
  padding: 4px 6px;
  height: 24px;
  color: ${({ theme }) => theme.textTertiary};
  background-color: ${({ theme }) => theme.deprecated_bg1};
  font-size: 14px;
  font-weight: 500;
  user-select: none;
`
const StyledGasIcon = styled(GasIcon)`
  margin-right: 4px;
  height: 14px;
  & > * {
    stroke: ${({ theme }) => theme.textTertiary};
  }
`

export default function GasEstimateTooltip({
  trade,
  loading,
  disabled,
}: {
  trade: InterfaceTrade<Currency, Currency, TradeType> // dollar amount in active chain's stablecoin
  loading: boolean
  disabled?: boolean
}) {
  const formattedGasPriceString = trade?.gasUseEstimateUSD
    ? trade.gasUseEstimateUSD.toFixed(2) === '0.00'
      ? '<$0.01'
      : '$' + trade.gasUseEstimateUSD.toFixed(2)
    : undefined

  return (
    <MouseoverTooltip
      disabled={disabled}
      size={TooltipSize.Large}
      text={<SwapRoute trade={trade} syncing={loading} />}
      placement="bottom"
    >
      <LoadingOpacityContainer $loading={loading}>
        <GasWrapper>
          <StyledGasIcon />
          {formattedGasPriceString}
        </GasWrapper>
      </LoadingOpacityContainer>
    </MouseoverTooltip>
  )
}
