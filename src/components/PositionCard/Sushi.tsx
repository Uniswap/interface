import React from 'react'
import { Token } from '@uniswap/sdk-core'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components/macro'
import { Trans } from '@lingui/macro'

import { unwrappedToken } from '../../utils/unwrappedToken'
import { ButtonEmpty } from '../Button'
import { transparentize } from 'polished'
import { CardNoise } from '../earn/styled'

import { useColor } from '../../hooks/useColor'

import { LightCard } from '../Card'
import { AutoColumn } from '../Column'
import DoubleCurrencyLogo from '../DoubleLogo'
import { RowFixed, AutoRow } from '../Row'
import { Dots } from '../swap/styleds'
import { FixedHeightRow } from '.'
import Badge, { BadgeVariant } from 'components/Badge'

const StyledPositionCard = styled(LightCard)<{ bgColor: any }>`
  border: none;
  background: ${({ theme, bgColor }) =>
    `radial-gradient(91.85% 100% at 1.84% 0%, ${transparentize(0.8, bgColor)} 0%, ${theme.bg3} 100%) `};
  position: relative;
  overflow: hidden;
`

interface PositionCardProps {
  tokenA: Token
  tokenB: Token
  liquidityToken: Token
  border?: string
}

export default function SushiPositionCard({ tokenA, tokenB, liquidityToken, border }: PositionCardProps) {
  const currency0 = unwrappedToken(tokenA)
  const currency1 = unwrappedToken(tokenB)

  const backgroundColor = useColor(tokenA)

  return (
    <StyledPositionCard border={border} bgColor={backgroundColor}>
      <CardNoise />
      <AutoColumn gap="12px">
        <FixedHeightRow>
          <AutoRow gap="8px">
            <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={20} />
            <Text fontWeight={500} fontSize={20}>
              {!currency0 || !currency1 ? (
                <Dots>
                  <Trans>Loading</Trans>
                </Dots>
              ) : (
                `${currency0.symbol}/${currency1.symbol}`
              )}
            </Text>

            <Badge variant={BadgeVariant.WARNING}>Sushi</Badge>
          </AutoRow>
          <RowFixed gap="8px">
            <ButtonEmpty
              padding="0px 35px 0px 0px"
              borderRadius="12px"
              width="fit-content"
              as={Link}
              to={`/migrate/v2/${liquidityToken.address}`}
            >
              <Trans>Migrate</Trans>
            </ButtonEmpty>
          </RowFixed>
        </FixedHeightRow>
      </AutoColumn>
    </StyledPositionCard>
  )
}
