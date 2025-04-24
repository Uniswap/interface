import React from 'react'
import styled from 'styled-components'
import { PositionsResponse } from 'hooks/useTotalPositions'
import { useCurrency } from 'hooks/Tokens'
import { getAddress } from 'viem'
import { Percent } from '@uniswap/sdk-core'
import { Trans } from 'i18n'
import { Link } from 'react-router-dom'
import { ThemedText } from 'theme/components'
import { DoubleCurrencyLogo } from 'components/DoubleLogo'
import HoverInlineText from 'components/HoverInlineText'
import { useFormatter } from 'utils/formatNumbers'

const LinkRow = styled(Link)`
  align-items: center;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px;
  text-decoration: none;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    flex-direction: column;
    row-gap: 12px;
    width: 100%;
  `};
`

const RowBetween = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
`

const PrimaryPositionIdData = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  > * {
    margin-right: 8px;
  }
`

const FeeTierText = styled(ThemedText.SubHeader)`
  margin-left: 8px !important;
  line-height: 12px;
  color: ${({ theme }) => theme.neutral3};
`

export default function StakingPositionListItem({ position }: { position: PositionsResponse & { reward?: string } }) {
  const positionSummaryLink = `/pool/${position.id}`
  const currency0 = useCurrency(getAddress(position.pool.token0?.id ?? ''))
  const currency1 = useCurrency(getAddress(position.pool.token1?.id ?? ''))
  const { formatDelta, formatTickPrice } = useFormatter()

  return (
    <LinkRow to={positionSummaryLink}>
      <RowBetween>
        <PrimaryPositionIdData>
          <DoubleCurrencyLogo currencies={[currency0, currency1]} size={18} />
          <ThemedText.SubHeader>
            {position.pool.token0?.symbol} / {position.pool.token1?.symbol}
          </ThemedText.SubHeader>
          <FeeTierText> {formatDelta(parseFloat(new Percent(position.pool.feeTier, 1_000_000).toSignificant()))}</FeeTierText>
        </PrimaryPositionIdData>
        <ThemedText.BodyPrimary>
          <Trans i18nKey="common.rewards" />: {position.reward}
        </ThemedText.BodyPrimary>
      </RowBetween>

      {/* <RangeLineItem>
        <RangeText>
          <ExtentsText>
            <Trans i18nKey="pool.min.label" />
            &nbsp;
          </ExtentsText>
          <span>{position.tickLower.tickIdx}</span>
          <Trans
            i18nKey="common.xPerY"
            components={{
              x: <HoverInlineText text={position.token0.symbol} />,
              y: <HoverInlineText text={position.token1.symbol} />,
            }}
          />
        </RangeText>
        <HideSmall>
          <DoubleArrow>↔</DoubleArrow>
        </HideSmall>
        <SmallOnly>
          <DoubleArrow>↔</DoubleArrow>
        </SmallOnly>
        <RangeText>
          <ExtentsText>
            <Trans i18nKey="pool.max.label" />
            &nbsp;
          </ExtentsText>
          <span>{position.tickUpper.tickIdx}</span>
          <Trans
            i18nKey="common.xPerY"
            components={{
              x: <HoverInlineText text={position.token0.symbol} />,
              y: <HoverInlineText text={position.token1.symbol} />,
            }}
          />
        </RangeText>
      </RangeLineItem> */}
    </LinkRow>
  )
} 