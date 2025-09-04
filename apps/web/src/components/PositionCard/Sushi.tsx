import { Token } from '@uniswap/sdk-core'
import { CardNoise } from 'components/earn/styled'
import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import { useColor } from 'hooks/useColor'
import { transparentize } from 'polished'
import { Trans } from 'react-i18next'
import { Link } from 'react-router'
import { Text } from 'rebass'
import { Button, Flex, useSporeColors } from 'ui/src'
import Badge, { BadgeVariant } from 'uniswap/src/components/badge/Badge'
import { unwrappedToken } from 'utils/unwrappedToken'

interface PositionCardProps {
  tokenA: Token
  tokenB: Token
  liquidityToken: Token
}

export default function SushiPositionCard({ tokenA, tokenB, liquidityToken }: PositionCardProps) {
  const currency0 = unwrappedToken(tokenA)
  const currency1 = unwrappedToken(tokenB)

  const colors = useSporeColors()
  const backgroundColor = useColor(tokenA)

  return (
    <Flex
      p="$spacing16"
      borderRadius="$rounded16"
      $platform-web={{
        background: `radial-gradient(91.85% 100% at 1.84% 0%, ${transparentize(0.8, backgroundColor)} 0%, ${colors.surface2.val} 100%) `,
      }}
    >
      <CardNoise />
      <Flex gap="md">
        <Flex row justifyContent="space-between">
          <Flex row gap="8px" alignItems="center">
            <DoubleCurrencyLogo currencies={[currency0, currency1]} size={20} />
            <Text fontWeight={535} fontSize={20}>
              {`${currency0.symbol}/${currency1.symbol}`}
            </Text>
            <Badge badgeVariant={BadgeVariant.WARNING}>Sushi</Badge>
          </Flex>
          <Link to={`/migrate/v2/${liquidityToken.address}`} style={{ textDecoration: 'none' }}>
            <Button variant="branded" emphasis="tertiary" fill={false}>
              <Trans i18nKey="common.migrate" />
            </Button>
          </Link>
        </Flex>
      </Flex>
    </Flex>
  )
}
