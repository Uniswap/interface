import { Trans } from '@lingui/macro'
import { Token } from '@uniswap/sdk-core'
import Badge, { BadgeVariant } from 'components/Badge'
import { transparentize } from 'polished'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components'

import { FixedHeightRow } from '.'
import { useColor } from '../../hooks/useColor'
import { unwrappedToken } from '../../utils/unwrappedToken'
import { ButtonEmpty } from '../Button'
import { LightCard } from '../Card'
import { AutoColumn } from '../Column'
import DoubleCurrencyLogo from '../DoubleLogo'
import { CardNoise } from '../earn/styled'
import { AutoRow, RowFixed } from '../Row'
import { Dots } from '../swap/styled'

const StyledPositionCard = styled(LightCard)<{ bgColor: any }>`
  border: none;
  background: ${({ theme, bgColor }) =>
    `radial-gradient(91.85% 100% at 1.84% 0%, ${transparentize(0.8, bgColor)} 0%, ${theme.surface2} 100%) `};
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
      <AutoColumn gap="md">
        <FixedHeightRow>
          <AutoRow gap="8px">
            <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={20} />
            <Text fontWeight={535} fontSize={20}>
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
              $borderRadius="12px"
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
