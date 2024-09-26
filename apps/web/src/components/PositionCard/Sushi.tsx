import { Token } from '@uniswap/sdk-core'
import Badge, { BadgeVariant } from 'components/Badge/Badge'
import { ButtonEmpty } from 'components/Button/buttons'
import { LightCard } from 'components/Card/cards'
import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import { FixedHeightRow } from 'components/PositionCard'
import { AutoColumn } from 'components/deprecated/Column'
import { AutoRow, RowFixed } from 'components/deprecated/Row'
import { CardNoise } from 'components/earn/styled'
import { Dots } from 'components/swap/styled'
import { useColor } from 'hooks/useColor'
import styled from 'lib/styled-components'
import { transparentize } from 'polished'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'
import { Trans } from 'uniswap/src/i18n'
import { unwrappedToken } from 'utils/unwrappedToken'

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
            <DoubleCurrencyLogo currencies={[currency0, currency1]} size={20} />
            <Text fontWeight={535} fontSize={20}>
              {!currency0 || !currency1 ? (
                <Dots>
                  <Trans i18nKey="common.loading" />
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
              <Trans i18nKey="common.migrate" />
            </ButtonEmpty>
          </RowFixed>
        </FixedHeightRow>
      </AutoColumn>
    </StyledPositionCard>
  )
}
