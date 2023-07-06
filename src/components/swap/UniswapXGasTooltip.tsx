import { Trans } from '@lingui/macro'
import Column from 'components/Column'
import Row from 'components/Row'
import { DutchOrderTrade } from 'state/routing/types'
import styled from 'styled-components/macro'
import { Divider, ThemedText } from 'theme'

import { ReactComponent as GasIcon } from '../../assets/images/gas-icon.svg'

const Container = styled(Column)`
  gap: 16px;
`

const PromotionalText = styled.span`
  background: linear-gradient(91.39deg, #4673fa -101.76%, #9646fa 101.76%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  mix-blend-mode: normal;
  font-weight: 400;
  font-size: 12px;
`

const InlineSubheaderSmall = styled(ThemedText.SubHeaderSmall)`
  display: inline;
`

const InlineCaption = styled(ThemedText.Caption)`
  display: inline;
`

export default function UniswapXGasTooltip({ trade }: { trade: DutchOrderTrade }) {
  const formattedGasPriceString = trade?.classicGasUseEstimateUSD
    ? trade.classicGasUseEstimateUSD === 0
      ? '<$0.01'
      : '$' + trade.classicGasUseEstimateUSD.toFixed(2)
    : '$0'
  return (
    <Container>
      <Column gap="sm">
        <ThemedText.SubHeaderSmall color="textSecondary">
          <Trans>A similar swap usually costs:</Trans>
        </ThemedText.SubHeaderSmall>
        <Row gap="xs">
          <GasIcon />
          <ThemedText.SubHeaderSmall color="textSecondary">
            <Trans>
              <InlineSubheaderSmall color="textPrimary">{formattedGasPriceString}</InlineSubheaderSmall> in network fees
            </Trans>
          </ThemedText.SubHeaderSmall>
        </Row>
      </Column>
      <Divider />
      <ThemedText.Caption color="textSecondary">
        <Trans>
          <PromotionalText>UniswapX</PromotionalText> broadcasts an off-chain order to a network of fulfillers.{' '}
          <InlineCaption color="textPrimary">
            Network fees are included in the quote and no gas is required to swap.
          </InlineCaption>
        </Trans>
      </ThemedText.Caption>
    </Container>
  )
}
