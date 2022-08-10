import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Token, TradeType } from '@uniswap/sdk-core'
import { RowBetween } from 'components/Row'
import { MouseoverTooltipContent } from 'components/Tooltip'
import { Info } from 'react-feather'
import { InterfaceTrade } from 'state/routing/types'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { ResponsiveTooltipContainer } from './styleds'

const Wrapper = styled.div`
  background-color: ${({ theme }) => theme.deprecated_bg1};
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  padding: 14px;
  margin-top: -20px;
  padding-top: 32px;
`

const StyledInfoIcon = styled(Info)`
  stroke: ${({ theme }) => theme.deprecated_text3};
`

/**
 * @returns Dropdown card for showing edge case warnings outside of button
 */
export default function SwapWarningDropdown({
  fiatValueInput,
  trade,
}: {
  fiatValueInput: CurrencyAmount<Token> | null
  trade: InterfaceTrade<Currency, Currency, TradeType> | undefined
}) {
  // gas cost estimate is more than half of input value
  const showNetworkFeeWarning = Boolean(
    fiatValueInput &&
      trade?.gasUseEstimateUSD &&
      parseFloat(trade.gasUseEstimateUSD.toSignificant(6)) > parseFloat(fiatValueInput.toFixed(6)) / 2
  )

  if (!showNetworkFeeWarning) {
    return null
  }

  return (
    <Wrapper>
      {showNetworkFeeWarning ? (
        <RowBetween>
          <ThemedText.DeprecatedMain fontSize="14px" color="text3">
            <Trans>Network fees exceed 50% of the swap amount!</Trans>
          </ThemedText.DeprecatedMain>
          <MouseoverTooltipContent
            wrap={false}
            content={
              <ResponsiveTooltipContainer origin="top right" style={{ padding: '12px' }}>
                <ThemedText.DeprecatedMain fontSize="12px" color="text3" maxWidth="200px">
                  <Trans>
                    The cost of sending this transaction is more than half of the value of the input amount.
                  </Trans>
                </ThemedText.DeprecatedMain>
                <ThemedText.DeprecatedMain fontSize="12px" color="text3" maxWidth="200px" mt="8px">
                  <Trans>You might consider waiting until the network fees go down to complete this transaction.</Trans>
                </ThemedText.DeprecatedMain>
              </ResponsiveTooltipContainer>
            }
            placement="bottom"
          >
            <StyledInfoIcon size={16} />
          </MouseoverTooltipContent>
        </RowBetween>
      ) : null}
    </Wrapper>
  )
}
