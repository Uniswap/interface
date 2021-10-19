import { ChainId, Fraction, JSBI, Pair, Percent, TokenAmount } from '@dynamic-amm/sdk'
import { darken } from 'polished'
import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components'
import { t, Trans } from '@lingui/macro'

import { useTotalSupply } from '../../data/TotalSupply'
import { useActiveWeb3React } from '../../hooks'
import { useTokenBalance } from '../../state/wallet/hooks'
import { ExternalLink } from '../../theme'
import { currencyId } from '../../utils/currencyId'
import { unwrappedToken } from '../../utils/wrappedCurrency'
import { ButtonPrimary, ButtonSecondary, ButtonEmpty, ButtonOutlined } from '../Button'
import Card, { LightCard } from '../Card'
import { AutoColumn } from '../Column'
import CurrencyLogo from '../CurrencyLogo'
import DoubleCurrencyLogo from '../DoubleLogo'
import { RowBetween, RowFixed, AutoRow } from '../Row'
import WarningRightIcon from 'components/Icons/WarningRightIcon'
import QuestionHelper from 'components/QuestionHelper'
import { Dots } from '../swap/styleds'
import { BIG_INT_ZERO, DMM_ANALYTICS_URL } from '../../constants'
import { priceRangeCalcByPair, getMyLiquidity, useCurrencyConvertedToNative } from 'utils/dmm'
import { UserLiquidityPosition } from 'state/pools/hooks'

export const FixedHeightRow = styled(RowBetween)`
  height: 24px;
`

export const HoverCard = styled(Card)`
  border: 1px solid transparent;
  :hover {
    border: 1px solid ${({ theme }) => darken(0.06, theme.bg2)};
  }
`
const StyledPositionCard = styled(LightCard)`
  border: none;
  background: ${({ theme }) => theme.bg6};
  position: relative;
  overflow: hidden;
  border-radius: 8px;
`

const ButtonSecondary2 = styled(ButtonSecondary)`
  border: none;
  :hover {
    border: none;
  }
`

const PositionItem = styled.div`
  width: 100%;
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: 1fr 2fr 4fr 2fr 0.5fr;
  justify-content: space-between;
`

const IconWrapper = styled.div`
  position: absolute;
  top: 0;
  right: 0;
`

const USDValue = styled.div`
  text-align: right;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    text-align: left;
  `}
`

const TokenRatioText = styled(Text)<{ isWarning: boolean }>`
  color: ${({ theme, isWarning }) => (isWarning ? theme.warning : theme.text1)};
`

const WarningMessage = styled(Text)`
  color: ${({ theme }) => theme.warning};
  text-align: center;
`

const ButtonOutlined2 = styled(ButtonOutlined)`
  font-size: inherit;
`
interface PositionCardProps {
  pair: Pair
  showUnwrapped?: boolean
  border?: string
  stakedBalance?: TokenAmount // optional balance to indicate that liquidity is deposited in mining pool
  myLiquidity?: UserLiquidityPosition
}

export function MinimalPositionCard({ pair, showUnwrapped = false, border }: PositionCardProps) {
  const { account } = useActiveWeb3React()

  const currency0 = showUnwrapped ? pair.token0 : unwrappedToken(pair.token0)
  const currency1 = showUnwrapped ? pair.token1 : unwrappedToken(pair.token1)

  const [showMore, setShowMore] = useState(false)

  const userPoolBalance = useTokenBalance(account ?? undefined, pair.liquidityToken)
  const totalPoolTokens = useTotalSupply(pair.liquidityToken)

  const poolTokenPercentage =
    !!userPoolBalance && !!totalPoolTokens && JSBI.greaterThanOrEqual(totalPoolTokens.raw, userPoolBalance.raw)
      ? new Percent(userPoolBalance.raw, totalPoolTokens.raw)
      : undefined

  const [token0Deposited, token1Deposited] =
    !!pair &&
    !!totalPoolTokens &&
    !!userPoolBalance &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    JSBI.greaterThanOrEqual(totalPoolTokens.raw, userPoolBalance.raw)
      ? [
          pair.getLiquidityValue(pair.token0, totalPoolTokens, userPoolBalance),
          pair.getLiquidityValue(pair.token1, totalPoolTokens, userPoolBalance)
        ]
      : [undefined, undefined]

  const native0 = useCurrencyConvertedToNative(currency0 || undefined)
  const native1 = useCurrencyConvertedToNative(currency1 || undefined)
  return (
    <>
      <StyledPositionCard border={border}>
        <AutoColumn gap="12px">
          <FixedHeightRow>
            <RowFixed>
              <Text fontWeight={500} fontSize={16}>
                <Trans>Your position</Trans>
              </Text>
            </RowFixed>
          </FixedHeightRow>
          <FixedHeightRow onClick={() => setShowMore(!showMore)}>
            <RowFixed>
              <DoubleCurrencyLogo currency0={native0} currency1={native1} margin={true} size={20} />
              <Text fontWeight={500} fontSize={20}>
                {native0?.symbol}/{native1?.symbol}
              </Text>
            </RowFixed>
            <RowFixed>
              <Text fontWeight={500} fontSize={20}>
                {userPoolBalance ? userPoolBalance.toSignificant(4) : '-'}{' '}
              </Text>
            </RowFixed>
          </FixedHeightRow>
          <AutoColumn gap="4px">
            <FixedHeightRow>
              <Text fontSize={16} fontWeight={500}>
                <Trans>Your pool share:</Trans>
              </Text>
              <Text fontSize={16} fontWeight={500}>
                {poolTokenPercentage ? poolTokenPercentage.toFixed(6) + '%' : '-'}
              </Text>
            </FixedHeightRow>
            <FixedHeightRow>
              <Text fontSize={16} fontWeight={500}>
                {native0?.symbol}:
              </Text>
              {token0Deposited ? (
                <RowFixed>
                  <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
                    {token0Deposited?.toSignificant(6)}
                  </Text>
                </RowFixed>
              ) : (
                '-'
              )}
            </FixedHeightRow>
            <FixedHeightRow>
              <Text fontSize={16} fontWeight={500}>
                {native1?.symbol}:
              </Text>
              {token1Deposited ? (
                <RowFixed>
                  <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
                    {token1Deposited?.toSignificant(6)}
                  </Text>
                </RowFixed>
              ) : (
                '-'
              )}
            </FixedHeightRow>
          </AutoColumn>
        </AutoColumn>
      </StyledPositionCard>
    </>
  )
}

export default function FullPositionCard({ pair, border, stakedBalance, myLiquidity }: PositionCardProps) {
  const { account, chainId } = useActiveWeb3React()

  const currency0 = unwrappedToken(pair.token0)
  const currency1 = unwrappedToken(pair.token1)

  const [showMore, setShowMore] = useState(false)

  const userDefaultPoolBalance = useTokenBalance(account ?? undefined, pair.liquidityToken)
  const totalPoolTokens = useTotalSupply(pair.liquidityToken)

  // if staked balance balance provided, add to standard liquidity amount
  const userPoolBalance = stakedBalance ? userDefaultPoolBalance?.add(stakedBalance) : userDefaultPoolBalance

  const poolTokenPercentage =
    !!userPoolBalance && !!totalPoolTokens && JSBI.greaterThanOrEqual(totalPoolTokens.raw, userPoolBalance.raw)
      ? new Percent(userPoolBalance.raw, totalPoolTokens.raw)
      : undefined

  const [token0Deposited, token1Deposited] =
    !!pair &&
    !!totalPoolTokens &&
    !!userPoolBalance &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    JSBI.greaterThanOrEqual(totalPoolTokens.raw, userPoolBalance.raw)
      ? [
          pair.getLiquidityValue(pair.token0, totalPoolTokens, userPoolBalance),
          pair.getLiquidityValue(pair.token1, totalPoolTokens, userPoolBalance)
        ]
      : [undefined, undefined]

  const amp = new Fraction(pair.amp).divide(JSBI.BigInt(10000))

  const percentToken0 = pair.reserve0
    .divide(pair.virtualReserve0)
    .multiply('100')
    .divide(pair.reserve0.divide(pair.virtualReserve0).add(pair.reserve1.divide(pair.virtualReserve1)))
  const percentToken1 = new Fraction(JSBI.BigInt(100), JSBI.BigInt(1)).subtract(percentToken0)

  const usdValue = getMyLiquidity(myLiquidity)

  const isWarning = percentToken0.lessThan(JSBI.BigInt(10)) || percentToken1.lessThan(JSBI.BigInt(10))

  const warningToken = isWarning
    ? percentToken0.lessThan(JSBI.BigInt(10))
      ? pair.token0.symbol
      : pair.token1.symbol
    : undefined

  const native0 = useCurrencyConvertedToNative(currency0 || undefined)
  const native1 = useCurrencyConvertedToNative(currency1 || undefined)

  return (
    <StyledPositionCard border={border}>
      {isWarning && (
        <IconWrapper>
          <WarningRightIcon />
        </IconWrapper>
      )}
      <AutoColumn gap="12px">
        <FixedHeightRow>
          <AutoRow gap="8px" align="flex-start">
            {!currency0 || !currency1 ? (
              <Dots>
                <Trans>Loading</Trans>
              </Dots>
            ) : (
              <PositionItem>
                <DoubleCurrencyLogo currency0={native0} currency1={native1} size={20} />
                <div>{`${native0?.symbol}/${native1?.symbol}`}</div>
                <div>
                  {!!token0Deposited && (
                    <div>
                      {token0Deposited?.toSignificant(6)} / {token1Deposited?.toSignificant(6)}{' '}
                    </div>
                  )}
                </div>

                {!!usdValue && <USDValue>{usdValue}</USDValue>}

                <ButtonEmpty padding="0" width="32px" onClick={() => setShowMore(!showMore)}>
                  {showMore ? (
                    <ChevronUp size="20" style={{ marginLeft: '10px' }} />
                  ) : (
                    <ChevronDown size="20" style={{ marginLeft: '10px' }} />
                  )}
                </ButtonEmpty>
              </PositionItem>
            )}
          </AutoRow>
        </FixedHeightRow>

        {showMore && (
          <AutoColumn gap="8px" style={{ marginTop: '8px' }}>
            <FixedHeightRow>
              <Text fontSize={14} fontWeight={500}>
                <Trans>Your total pool tokens:</Trans>
              </Text>
              <Text fontSize={14} fontWeight={500}>
                {userPoolBalance ? userPoolBalance.toSignificant(4) : '-'}
              </Text>
            </FixedHeightRow>
            {stakedBalance && (
              <FixedHeightRow>
                <Text fontSize={14} fontWeight={500}>
                  <Trans>Pool tokens in rewards pool:</Trans>
                </Text>
                <Text fontSize={14} fontWeight={500}>
                  {stakedBalance.toSignificant(4)}
                </Text>
              </FixedHeightRow>
            )}
            <FixedHeightRow>
              <RowFixed>
                <Text fontSize={14} fontWeight={500}>
                  <Trans>Pooled {native0?.symbol}:</Trans>
                </Text>
              </RowFixed>
              {token0Deposited ? (
                <RowFixed>
                  <Text fontSize={14} fontWeight={500} marginLeft={'6px'}>
                    {token0Deposited?.toSignificant(6)}
                  </Text>
                  <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={currency0} />
                </RowFixed>
              ) : (
                '-'
              )}
            </FixedHeightRow>

            <FixedHeightRow>
              <RowFixed>
                <Text fontSize={14} fontWeight={500}>
                  <Trans>Pooled {native1?.symbol}:</Trans>
                </Text>
              </RowFixed>
              {token1Deposited ? (
                <RowFixed>
                  <Text fontSize={14} fontWeight={500} marginLeft={'6px'}>
                    {token1Deposited?.toSignificant(6)}
                  </Text>
                  <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={currency1} />
                </RowFixed>
              ) : (
                '-'
              )}
            </FixedHeightRow>

            <FixedHeightRow>
              <Text fontSize={14} fontWeight={500}>
                <Trans>Your pool share:</Trans>
              </Text>
              <Text fontSize={14} fontWeight={500}>
                {poolTokenPercentage
                  ? (poolTokenPercentage.toFixed(2) === '0.00' ? '<0.01' : poolTokenPercentage.toFixed(2)) + '%'
                  : '-'}
              </Text>
            </FixedHeightRow>
            <FixedHeightRow>
              <Text fontSize={14} fontWeight={500}>
                <Trans>Ratio:</Trans>
              </Text>
              <TokenRatioText fontSize={16} fontWeight={500} isWarning={isWarning}>
                {percentToken0.toSignificant(2) ?? '.'}% {pair.token0.symbol} - {percentToken1.toSignificant(2) ?? '.'}%{' '}
                {pair.token1.symbol}
              </TokenRatioText>
            </FixedHeightRow>
            <FixedHeightRow>
              <Text fontSize={14} fontWeight={500}>
                <Trans>AMP</Trans>{' '}
                <QuestionHelper
                  text={t`Amplification Factor. Higher AMP, higher capital efficiency within a price range. Higher AMP recommended for more stable pairs, lower AMP for more volatile pairs.`}
                />
                :
              </Text>
              <Text fontSize={14} fontWeight={500}>
                {amp.toSignificant(5)}
              </Text>
            </FixedHeightRow>
            <RowBetween>
              <Text fontSize={14} fontWeight={500}>
                <Trans>
                  Price range {pair.token0.symbol}/{pair.token1.symbol}
                </Trans>{' '}
                <QuestionHelper
                  text={t`Tradable price range for this pair based on AMP. If the price goes below or above this range, the pool may become inactive.`}
                />
                :
              </Text>
              <Text fontSize={14} fontWeight={500} marginLeft="12px">
                {/* token 0  */}
                {priceRangeCalcByPair(pair)[0][0]?.toSignificant(6) ?? '0'} -{' '}
                {priceRangeCalcByPair(pair)[0][1]?.toSignificant(6) ?? '♾️'}
              </Text>
            </RowBetween>
            <RowBetween>
              <Text fontSize={14} fontWeight={500}>
                Price range {pair.token1.symbol}/{pair.token0.symbol}{' '}
                <QuestionHelper
                  text={t`Tradable price range for this pair based on AMP. If the price goes below or above this range, the pool may become inactive.`}
                />
                :
              </Text>
              <Text fontSize={14} fontWeight={500} marginLeft="12px">
                {/* token 1  */}
                {priceRangeCalcByPair(pair)[1][0]?.toSignificant(6) ?? '0'} -{' '}
                {priceRangeCalcByPair(pair)[1][1]?.toSignificant(6) ?? '♾️'}
              </Text>
            </RowBetween>
            <ButtonSecondary2 padding="8px" borderRadius="8px">
              <ExternalLink
                style={{ width: '100%', textAlign: 'center' }}
                href={`${DMM_ANALYTICS_URL[chainId as ChainId]}/account/${account}`}
              >
                <Trans>View accrued fees and analytics</Trans>
                <span style={{ fontSize: '11px' }}>↗</span>
              </ExternalLink>
            </ButtonSecondary2>

            {isWarning && warningToken && (
              <WarningMessage>{t`Note: ${warningToken} is now <10% of the pool. Pool might become inactive if ${warningToken} reaches 0%`}</WarningMessage>
            )}

            {userDefaultPoolBalance && JSBI.greaterThan(userDefaultPoolBalance.raw, BIG_INT_ZERO) && (
              <AutoRow justify="space-around" marginTop="10px">
                <span style={{ display: 'inherit' }}>
                  <ButtonOutlined2
                    padding="8px"
                    as={Link}
                    width="150px"
                    to={`/remove/${currencyId(currency0, chainId)}/${currencyId(currency1, chainId)}/${pair.address}`}
                  >
                    <Trans>Remove</Trans>
                  </ButtonOutlined2>
                  &nbsp;
                  <ButtonPrimary
                    padding="8px"
                    as={Link}
                    to={`/add/${currencyId(currency0, chainId)}/${currencyId(currency1, chainId)}/${pair.address}`}
                    width="150px"
                  >
                    <Trans>Add</Trans>
                  </ButtonPrimary>
                </span>
              </AutoRow>
            )}
            {stakedBalance && JSBI.greaterThan(stakedBalance.raw, BIG_INT_ZERO) && (
              <ButtonPrimary
                padding="8px"
                as={Link}
                to={`/uni/${currencyId(currency0, chainId)}/${currencyId(currency1, chainId)}`}
                width="100%"
              >
                <Trans>Manage Liquidity in Rewards Pool</Trans>
              </ButtonPrimary>
            )}
          </AutoColumn>
        )}
      </AutoColumn>
    </StyledPositionCard>
  )
}
