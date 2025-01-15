import { CurrencyAmount, Percent, Token } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { ButtonEmpty, ButtonPrimary, ButtonSecondary } from 'components/Button/buttons'
import { GrayCard, LightCard } from 'components/Card/cards'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import { AutoColumn } from 'components/deprecated/Column'
import { AutoRow, RowBetween, RowFixed } from 'components/deprecated/Row'
import { CardNoise } from 'components/earn/styled'
import { Dots } from 'components/swap/styled'
import { BIG_INT_ZERO } from 'constants/misc'
import { useAccount } from 'hooks/useAccount'
import { useColor } from 'hooks/useColor'
import { useTotalSupply } from 'hooks/useTotalSupply'
import JSBI from 'jsbi'
import styled from 'lib/styled-components'
import { transparentize } from 'polished'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'
import { Trans } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'
import { useTokenBalance } from 'state/connection/hooks'
import { StyledInternalLink, ThemedText } from 'theme/components'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { currencyId } from 'utils/currencyId'
import { unwrappedToken } from 'utils/unwrappedToken'

export const FixedHeightRow = styled(RowBetween)`
  height: 24px;
`

const StyledPositionCard = styled(LightCard)<{ bgColor: any }>`
  border: none;
  background: ${({ theme, bgColor }) =>
    `radial-gradient(91.85% 100% at 1.84% 0%, ${transparentize(0.8, bgColor)} 0%, ${theme.surface2} 100%) `};
  position: relative;
  overflow: hidden;
`

interface PositionCardProps {
  pair: Pair
  showUnwrapped?: boolean
  border?: string
  stakedBalance?: CurrencyAmount<Token> // optional balance to indicate that liquidity is deposited in mining pool
}

export function MinimalPositionCard({ pair, showUnwrapped = false, border }: PositionCardProps) {
  const account = useAccount()

  const currency0 = showUnwrapped ? pair.token0 : unwrappedToken(pair.token0)
  const currency1 = showUnwrapped ? pair.token1 : unwrappedToken(pair.token1)

  const [showMore, setShowMore] = useState(false)

  const userPoolBalance = useTokenBalance(account.address, pair.liquidityToken)
  const totalPoolTokens = useTotalSupply(pair.liquidityToken)

  const poolTokenPercentage =
    !!userPoolBalance &&
    !!totalPoolTokens &&
    JSBI.greaterThanOrEqual(totalPoolTokens.quotient, userPoolBalance.quotient)
      ? new Percent(userPoolBalance.quotient, totalPoolTokens.quotient)
      : undefined

  const [token0Deposited, token1Deposited] =
    !!pair &&
    !!totalPoolTokens &&
    !!userPoolBalance &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    JSBI.greaterThanOrEqual(totalPoolTokens.quotient, userPoolBalance.quotient)
      ? [
          pair.getLiquidityValue(pair.token0, totalPoolTokens, userPoolBalance, false),
          pair.getLiquidityValue(pair.token1, totalPoolTokens, userPoolBalance, false),
        ]
      : [undefined, undefined]

  return (
    <>
      {userPoolBalance && JSBI.greaterThan(userPoolBalance.quotient, JSBI.BigInt(0)) ? (
        <GrayCard border={border}>
          <AutoColumn gap="md">
            <FixedHeightRow>
              <RowFixed>
                <Text fontWeight={535} fontSize={16}>
                  <Trans i18nKey="position.your" />
                </Text>
              </RowFixed>
            </FixedHeightRow>
            <FixedHeightRow onClick={() => setShowMore(!showMore)}>
              <RowFixed>
                <DoubleCurrencyLogo currencies={[currency0, currency1]} size={20} />
                <Text fontWeight={535} fontSize={20}>
                  {currency0.symbol}/{currency1.symbol}
                </Text>
              </RowFixed>
              <RowFixed>
                <Text fontWeight={535} fontSize={20}>
                  {userPoolBalance ? userPoolBalance.toSignificant(4) : '-'}
                </Text>
              </RowFixed>
            </FixedHeightRow>
            <AutoColumn gap="4px">
              <FixedHeightRow>
                <Text fontSize={16} fontWeight={535}>
                  <Trans i18nKey="pool.share.label" />
                </Text>
                <Text fontSize={16} fontWeight={535}>
                  {poolTokenPercentage ? poolTokenPercentage.toFixed(6) + '%' : '-'}
                </Text>
              </FixedHeightRow>
              <FixedHeightRow>
                <Text fontSize={16} fontWeight={535}>
                  {currency0.symbol}:
                </Text>
                {token0Deposited ? (
                  <RowFixed>
                    <Text fontSize={16} fontWeight={535} marginLeft="6px">
                      {token0Deposited?.toSignificant(6)}
                    </Text>
                  </RowFixed>
                ) : (
                  '-'
                )}
              </FixedHeightRow>
              <FixedHeightRow>
                <Text fontSize={16} fontWeight={535}>
                  {currency1.symbol}:
                </Text>
                {token1Deposited ? (
                  <RowFixed>
                    <Text fontSize={16} fontWeight={535} marginLeft="6px">
                      {token1Deposited?.toSignificant(6)}
                    </Text>
                  </RowFixed>
                ) : (
                  '-'
                )}
              </FixedHeightRow>
            </AutoColumn>
          </AutoColumn>
        </GrayCard>
      ) : (
        <LightCard>
          <ThemedText.DeprecatedSubHeader style={{ textAlign: 'center' }}>
            <span role="img" aria-label="wizard-icon">
              ⭐️
            </span>{' '}
            <Trans i18nKey="pool.earnFees" />{' '}
          </ThemedText.DeprecatedSubHeader>
        </LightCard>
      )}
    </>
  )
}

export default function FullPositionCard({ pair, border, stakedBalance }: PositionCardProps) {
  const account = useAccount()

  const { defaultChainId } = useEnabledChains()

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
    !!pair &&
    !!totalPoolTokens &&
    !!userPoolBalance &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    JSBI.greaterThanOrEqual(totalPoolTokens.quotient, userPoolBalance.quotient)
      ? [
          pair.getLiquidityValue(pair.token0, totalPoolTokens, userPoolBalance, false),
          pair.getLiquidityValue(pair.token1, totalPoolTokens, userPoolBalance, false),
        ]
      : [undefined, undefined]

  const backgroundColor = useColor(pair?.token0)

  return (
    <StyledPositionCard border={border} bgColor={backgroundColor}>
      <CardNoise />
      <AutoColumn gap="md">
        <FixedHeightRow>
          <AutoRow gap="8px" style={{ marginLeft: '8px' }}>
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
          </AutoRow>
          <RowFixed gap="8px" style={{ marginRight: '4px' }}>
            <ButtonEmpty padding="6px 8px" $borderRadius="12px" width="100%" onClick={() => setShowMore(!showMore)}>
              {showMore ? (
                <>
                  <Trans i18nKey="common.manage" />
                  <ChevronUp size="20" style={{ marginLeft: '8px', height: '20px', minWidth: '20px' }} />
                </>
              ) : (
                <>
                  <Trans i18nKey="common.manage" />
                  <ChevronDown size="20" style={{ marginLeft: '8px', height: '20px', minWidth: '20px' }} />
                </>
              )}
            </ButtonEmpty>
          </RowFixed>
        </FixedHeightRow>

        {showMore && (
          <AutoColumn gap="sm">
            <FixedHeightRow>
              <Text fontSize={16} fontWeight={535}>
                <Trans i18nKey="pool.totalTokens" />
              </Text>
              <Text fontSize={16} fontWeight={535}>
                {userPoolBalance ? userPoolBalance.toSignificant(4) : '-'}
              </Text>
            </FixedHeightRow>
            {stakedBalance && (
              <FixedHeightRow>
                <Text fontSize={16} fontWeight={535}>
                  <Trans i18nKey="pool.rewardsPool.label" />
                </Text>
                <Text fontSize={16} fontWeight={535}>
                  {stakedBalance.toSignificant(4)}
                </Text>
              </FixedHeightRow>
            )}
            <FixedHeightRow>
              <RowFixed>
                <Text fontSize={16} fontWeight={535}>
                  <Trans i18nKey="pool.pooled" values={{ sym: currency0.symbol }} />
                </Text>
              </RowFixed>
              {token0Deposited ? (
                <RowFixed>
                  <Text fontSize={16} fontWeight={535} marginLeft="6px">
                    {token0Deposited?.toSignificant(6)}
                  </Text>
                  <CurrencyLogo size={20} style={{ marginLeft: '8px' }} currency={currency0} />
                </RowFixed>
              ) : (
                '-'
              )}
            </FixedHeightRow>

            <FixedHeightRow>
              <RowFixed>
                <Text fontSize={16} fontWeight={535}>
                  <Trans i18nKey="pool.pooled" values={{ sym: currency1.symbol }} />
                </Text>
              </RowFixed>
              {token1Deposited ? (
                <RowFixed>
                  <Text fontSize={16} fontWeight={535} marginLeft="6px">
                    {token1Deposited?.toSignificant(6)}
                  </Text>
                  <CurrencyLogo size={20} style={{ marginLeft: '8px' }} currency={currency1} />
                </RowFixed>
              ) : (
                '-'
              )}
            </FixedHeightRow>

            <FixedHeightRow>
              <Text fontSize={16} fontWeight={535}>
                <Trans i18nKey="pool.share.label" />
              </Text>
              <Text fontSize={16} fontWeight={535}>
                {poolTokenPercentage
                  ? `${poolTokenPercentage.toFixed(2) === '0.00' ? '<0.01' : poolTokenPercentage.toFixed(2)}%`
                  : '-'}
              </Text>
            </FixedHeightRow>

            <ButtonSecondary padding="8px" $borderRadius="8px">
              <StyledInternalLink
                style={{ width: '100%', textAlign: 'center' }}
                to={`/explore/pools/${toGraphQLChain(pair.chainId ?? defaultChainId).toLowerCase()}/${Pair.getAddress(pair.token0, pair.token1)}`}
              >
                <Trans i18nKey="pool.viewUncollectedFees" />
                <span style={{ fontSize: '11px' }}>↗</span>
              </StyledInternalLink>
            </ButtonSecondary>
            {userDefaultPoolBalance && JSBI.greaterThan(userDefaultPoolBalance.quotient, BIG_INT_ZERO) && (
              <RowBetween marginTop="10px">
                <ButtonPrimary
                  padding="8px"
                  $borderRadius="8px"
                  as={Link}
                  to={`/migrate/v2/${pair.liquidityToken.address}`}
                  width="32%"
                >
                  <Trans i18nKey="common.migrate" />
                </ButtonPrimary>
                <ButtonPrimary
                  padding="8px"
                  $borderRadius="8px"
                  as={Link}
                  to={`/add/v2/${currencyId(currency0)}/${currencyId(currency1)}`}
                  width="32%"
                >
                  <Trans i18nKey="common.add.label" />
                </ButtonPrimary>
                <ButtonPrimary
                  padding="8px"
                  $borderRadius="8px"
                  as={Link}
                  width="32%"
                  to={`/remove/v2/${currencyId(currency0)}/${currencyId(currency1)}`}
                >
                  <Trans i18nKey="common.remove.label" />
                </ButtonPrimary>
              </RowBetween>
            )}
            {stakedBalance && JSBI.greaterThan(stakedBalance.quotient, BIG_INT_ZERO) && (
              <ButtonPrimary
                padding="8px"
                $borderRadius="8px"
                as={Link}
                to={`/uni/${currencyId(currency0)}/${currencyId(currency1)}`}
                width="100%"
              >
                <Trans i18nKey="pool.manageRewardsLiquidity" />
              </ButtonPrimary>
            )}
          </AutoColumn>
        )}
      </AutoColumn>
    </StyledPositionCard>
  )
}
