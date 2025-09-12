import { CurrencyAmount, Percent, Token } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { CardNoise } from 'components/earn/styled'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import { BIG_INT_ZERO } from 'constants/misc'
import { useAccount } from 'hooks/useAccount'
import { useColor } from 'hooks/useColor'
import { useTotalSupply } from 'hooks/useTotalSupply'
import JSBI from 'jsbi'
import { transparentize } from 'polished'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useTokenBalance } from 'state/connection/hooks'
import { Button, Flex, Text, useSporeColors } from 'ui/src'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { unwrappedToken } from 'utils/unwrappedToken'

interface PositionCardProps {
  pair: Pair
  showUnwrapped?: boolean
  stakedBalance?: CurrencyAmount<Token> // optional balance to indicate that liquidity is deposited in mining pool
}

export default function MigrateV2PositionCard({ pair, stakedBalance }: PositionCardProps) {
  const account = useAccount()
  const { t } = useTranslation()
  const colors = useSporeColors()

  const currency0 = unwrappedToken(pair.token0)
  const currency1 = unwrappedToken(pair.token1)

  const [showMore, setShowMore] = useState(false)

  const userDefaultPoolBalance = useTokenBalance(account.address, pair.liquidityToken)
  const totalPoolTokens = useTotalSupply(pair.liquidityToken)

  // if staked balance balance provided, add to standard liquidity amount
  const userPoolBalance = stakedBalance ? userDefaultPoolBalance?.add(stakedBalance) : userDefaultPoolBalance

  const poolTokenPercentage =
    !!userPoolBalance &&
    !!totalPoolTokens &&
    JSBI.greaterThanOrEqual(totalPoolTokens.quotient, userPoolBalance.quotient)
      ? new Percent(userPoolBalance.quotient, totalPoolTokens.quotient)
      : undefined

  const [token0Deposited, token1Deposited] =
    !!totalPoolTokens &&
    !!userPoolBalance &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    JSBI.greaterThanOrEqual(totalPoolTokens.quotient, userPoolBalance.quotient)
      ? [
          pair.getLiquidityValue(pair.token0, totalPoolTokens, userPoolBalance, false),
          pair.getLiquidityValue(pair.token1, totalPoolTokens, userPoolBalance, false),
        ]
      : [undefined, undefined]

  const backgroundColor = useColor(pair.token0)

  return (
    <Flex
      p="$spacing16"
      borderRadius="$rounded16"
      $platform-web={{
        background: `radial-gradient(91.85% 100% at 1.84% 0%, ${transparentize(0.8, backgroundColor)} 0%, ${colors.surface2.val} 100%) `,
      }}
    >
      <CardNoise />
      <Flex gap="$spacing6">
        <Flex row alignItems="center" justifyContent="space-between">
          <Flex row gap="$spacing8">
            <DoubleCurrencyLogo currencies={[currency0, currency1]} size={20} />
            <Text variant="body1">{`${currency0.symbol}/${currency1.symbol}`}</Text>
          </Flex>
          <Flex row gap="$spacing8">
            <Button
              emphasis="tertiary"
              variant="branded"
              size="small"
              icon={showMore ? <ChevronUp /> : <ChevronDown />}
              iconPosition="after"
              onPress={() => setShowMore(!showMore)}
            >
              {t('common.manage')}
            </Button>
          </Flex>
        </Flex>

        {showMore && (
          <Flex gap="$spacing6">
            <Flex row alignItems="center" justifyContent="space-between">
              <Text variant="body2">{t('pool.totalTokens')}</Text>
              <Text variant="body2">{userPoolBalance ? userPoolBalance.toSignificant(4) : '-'}</Text>
            </Flex>
            {stakedBalance && (
              <Flex row alignItems="center" justifyContent="space-between">
                <Text variant="body2">{t('pool.rewardsPool.label')}</Text>
                <Text variant="body2">{stakedBalance.toSignificant(4)}</Text>
              </Flex>
            )}
            <Flex row alignItems="center" justifyContent="space-between">
              <Text variant="body2">{t('removeLiquidity.pooled', { symbol: currency0.symbol })}</Text>
              {token0Deposited ? (
                <Flex row centered>
                  <Text variant="body2" mr="$spacing4">
                    {token0Deposited.toSignificant(6)}
                  </Text>
                  <CurrencyLogo size={20} currency={currency0} />
                </Flex>
              ) : (
                '-'
              )}
            </Flex>

            <Flex row alignItems="center" justifyContent="space-between">
              <Text variant="body2">{t('pool.pooled', { sym: currency1.symbol })}</Text>
              {token1Deposited ? (
                <Flex row centered>
                  <Text variant="body2" mr="$spacing4">
                    {token1Deposited.toSignificant(6)}
                  </Text>
                  <CurrencyLogo size={20} currency={currency1} />
                </Flex>
              ) : (
                '-'
              )}
            </Flex>

            <Flex row justifyContent="space-between">
              <Text variant="body2">{t('pool.share.label')}</Text>
              <Text variant="body2">
                {poolTokenPercentage
                  ? (poolTokenPercentage.toFixed(2) === '0.00' ? '<0.01' : poolTokenPercentage.toFixed(2)) + '%'
                  : '-'}
              </Text>
            </Flex>

            {userDefaultPoolBalance && JSBI.greaterThan(userDefaultPoolBalance.quotient, BIG_INT_ZERO) && (
              <Flex row justifyContent="space-between" mt="$spacing16" width="100%">
                <Link
                  to={`/migrate/v2/${pair.liquidityToken.address}`}
                  style={{ textDecoration: 'none', width: '64%' }}
                >
                  <Button size="medium" variant="branded" width="100%">
                    {t('common.migrate')}
                  </Button>
                </Link>
                <Link
                  to={`/remove/v2/${currencyId(currency0)}/${currencyId(currency1)}`}
                  style={{ textDecoration: 'none', width: '32%' }}
                >
                  <Button size="medium" variant="branded" emphasis="tertiary" width="100%">
                    {t('common.remove.label')}
                  </Button>
                </Link>
              </Flex>
            )}
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}
