import { Currency, TradeType } from '@uniswap/sdk-core'
import { LoadingOpacityContainer } from 'components/Loader/styled'
import { RowFixed } from 'components/Row'
import { MouseoverTooltip, TooltipSize } from 'components/Tooltip'
import { InterfaceTrade } from 'state/routing/types'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { ReactComponent as GasIcon } from '../../assets/images/gas-icon.svg'
import SwapRoute from './SwapRoute'

const StyledGasIcon = styled(GasIcon)`
  margin-right: 4px;
  height: 18px;
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
      // TODO(WEB-XXXX)
      // Most of Swap-related components accept either `syncing`, `loading` or both props at the same time.
      // We are often using them interchangeably, but they are not the same. We should clarify the naming
      // and usage of these props to avoid any confusion and UI misbehavior.
      text={<SwapRoute trade={trade} syncing={loading} />}
      placement="bottom"
    >
      <LoadingOpacityContainer $loading={loading}>
        <RowFixed>
          <StyledGasIcon />
          <ThemedText.BodySmall color="textSecondary">{formattedGasPriceString}</ThemedText.BodySmall>
        </RowFixed>
      </LoadingOpacityContainer>
    </MouseoverTooltip>
  )
}
