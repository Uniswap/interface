import { JSBI, Pair, Percent } from 'dxswap-sdk'
import { transparentize } from 'polished'
import React, { useContext, useState } from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'
import styled, { ThemeContext } from 'styled-components'
import { useTotalSupply } from '../../data/TotalSupply'

import { useActiveWeb3React } from '../../hooks'
import { useTokenBalance } from '../../state/wallet/hooks'
import { TYPE } from '../../theme'
import { currencyId } from '../../utils/currencyId'
import { unwrappedToken } from '../../utils/wrappedCurrency'
import { ButtonSecondary } from '../Button'

import Card, { LightCard, OutlineCard } from '../Card'
import { AutoColumn } from '../Column'
import CurrencyLogo from '../CurrencyLogo'
import DoubleCurrencyLogo from '../DoubleLogo'
import { RowBetween, RowFixed } from '../Row'
import { Dots } from '../swap/styleds'

export const FixedHeightRow = styled(RowBetween)`
  height: 24px;
`

export const HoverCard = styled(Card)`
  border: 1px solid transparent;
`

const PointableFixedHeightRow = styled(FixedHeightRow)`
  cursor: pointer;
`

const StyledPositionCard = styled(LightCard)`
  border: none;
  padding: 20px;
  color: white;
  background: ${({ theme }) => transparentize(0.28, theme.bg1)};
  position: relative;
  overflow: hidden;
`

interface PositionCardProps {
  pair: Pair
  showUnwrapped?: boolean
  border?: string
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
          pair.getLiquidityValue(pair.token0, totalPoolTokens, userPoolBalance, false),
          pair.getLiquidityValue(pair.token1, totalPoolTokens, userPoolBalance, false)
        ]
      : [undefined, undefined]

  const pairSwapFee = new Percent(JSBI.BigInt(pair.swapFee.toString()), JSBI.BigInt(10000))

  return (
    <>
      {userPoolBalance && JSBI.greaterThan(userPoolBalance.raw, JSBI.BigInt(0)) ? (
        <OutlineCard border={border}>
          <AutoColumn gap="12px">
            <FixedHeightRow>
              <RowFixed>
                <TYPE.body color="text4" fontSize="15px" lineHeight="19px">
                  Your position
                </TYPE.body>
              </RowFixed>
            </FixedHeightRow>
            <FixedHeightRow onClick={() => setShowMore(!showMore)}>
              <RowFixed>
                <DoubleCurrencyLogo marginRight={6} currency0={currency0} currency1={currency1} size={20} />
                <TYPE.white fontSize="16px" lineHeight="20px">
                  {currency0.symbol}/{currency1.symbol}
                </TYPE.white>
              </RowFixed>
              <RowFixed>
                <TYPE.white fontSize="16px" lineHeight="22px">
                  {userPoolBalance ? userPoolBalance.toSignificant(4) : '-'}
                </TYPE.white>
              </RowFixed>
            </FixedHeightRow>
            <AutoColumn gap="4px">
              <FixedHeightRow>
                <TYPE.body color="text4" fontSize="15px" lineHeight="19px">
                  Your pool's share:
                </TYPE.body>
                <TYPE.body color="text4" fontSize="15px" lineHeight="19px">
                  {poolTokenPercentage ? poolTokenPercentage.toFixed(6) + '%' : '-'}
                </TYPE.body>
              </FixedHeightRow>
              <FixedHeightRow>
                <TYPE.body color="text4" fontSize="15px" lineHeight="19px">
                  {currency0.symbol}:
                </TYPE.body>
                {token0Deposited ? (
                  <RowFixed>
                    <TYPE.body color="text4" fontSize="14px" lineHeight="17px" marginLeft={'6px'}>
                      {token0Deposited?.toSignificant(6)}
                    </TYPE.body>
                  </RowFixed>
                ) : (
                  '-'
                )}
              </FixedHeightRow>
              <FixedHeightRow>
                <TYPE.body color="text4" fontSize="15px" lineHeight="19px">
                  {currency1.symbol}:
                </TYPE.body>
                {token1Deposited ? (
                  <RowFixed>
                    <TYPE.body color="text4" fontSize="15px" lineHeight="19px" marginLeft={'6px'}>
                      {token1Deposited?.toSignificant(6)}
                    </TYPE.body>
                  </RowFixed>
                ) : (
                  '-'
                )}
              </FixedHeightRow>
            </AutoColumn>
          </AutoColumn>
        </OutlineCard>
      ) : (
        <OutlineCard>
          <TYPE.body fontWeight="500" fontSize="12px" lineHeight="20px">
            By adding liquidity you&apos;ll earn {pairSwapFee ? pairSwapFee.toSignificant(3) : '0.25'}% of all trades on
            this pair proportional to your share of the pool. Fees are added to the pool, accrue in real time and can be
            claimed by withdrawing your liquidity.
          </TYPE.body>
        </OutlineCard>
      )}
    </>
  )
}

export default function FullPositionCard({ pair, border }: PositionCardProps) {
  const { account } = useActiveWeb3React()
  const theme = useContext(ThemeContext)

  const currency0 = unwrappedToken(pair.token0)
  const currency1 = unwrappedToken(pair.token1)

  const [showMore, setShowMore] = useState(false)

  const userPoolBalance = useTokenBalance(account ?? undefined, pair.liquidityToken)
  const totalPoolTokens = useTotalSupply(pair.liquidityToken)

  const poolTokenPercentage =
    !!userPoolBalance && !!totalPoolTokens && JSBI.greaterThanOrEqual(totalPoolTokens.raw, userPoolBalance.raw)
      ? new Percent(userPoolBalance.raw, totalPoolTokens.raw)
      : undefined

  const pairSwapFee = new Percent(JSBI.BigInt(pair.swapFee.toString()), JSBI.BigInt(10000))

  const [token0Deposited, token1Deposited] =
    !!pair &&
    !!totalPoolTokens &&
    !!userPoolBalance &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    JSBI.greaterThanOrEqual(totalPoolTokens.raw, userPoolBalance.raw)
      ? [
          pair.getLiquidityValue(pair.token0, totalPoolTokens, userPoolBalance, false),
          pair.getLiquidityValue(pair.token1, totalPoolTokens, userPoolBalance, false)
        ]
      : [undefined, undefined]

  return (
    <StyledPositionCard border={border}>
      <AutoColumn gap="12px">
        <PointableFixedHeightRow onClick={() => setShowMore(!showMore)}>
          <RowFixed>
            <DoubleCurrencyLogo marginRight={6} currency0={currency0} currency1={currency1} size={20} />
            <Text fontWeight={600} fontSize="16px" lineHeight="20px">
              {!currency0 || !currency1 ? <Dots>Loading</Dots> : `${currency0.symbol}/${currency1.symbol}`}
            </Text>
          </RowFixed>

          <RowFixed gap="8px">
            {showMore ? (
              <>
                <ChevronUp color={theme.text5} size="20" style={{ marginLeft: '10px' }} />
              </>
            ) : (
              <>
                <TYPE.body fontSize="14px" lineHeight="17px" style={{ textDecoration: 'underline' }}>
                  Expand
                </TYPE.body>
                <ChevronDown color={theme.text5} size="20" style={{ marginLeft: '10px' }} />
              </>
            )}
          </RowFixed>
        </PointableFixedHeightRow>

        {showMore && (
          <AutoColumn gap="11px">
            <FixedHeightRow marginTop="16px">
              <TYPE.body color="text4" fontSize="14px" lineHeight="17px">
                Your pool tokens:
              </TYPE.body>
              <TYPE.body color="text4" fontSize="14px" lineHeight="17px">
                {userPoolBalance ? userPoolBalance.toSignificant(4) : '-'}
              </TYPE.body>
            </FixedHeightRow>
            <FixedHeightRow>
              <RowFixed>
                <TYPE.body color="text4" fontSize="14px" lineHeight="17px">
                  Pooled {currency0.symbol}:
                </TYPE.body>
              </RowFixed>
              {token0Deposited ? (
                <RowFixed>
                  <TYPE.body color="text4" fontSize="14px" lineHeight="17px" marginLeft="6px">
                    {token0Deposited?.toSignificant(6)}
                  </TYPE.body>
                  <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={currency0} />
                </RowFixed>
              ) : (
                '-'
              )}
            </FixedHeightRow>

            <FixedHeightRow>
              <RowFixed>
                <TYPE.body color="text4" fontSize="14px" lineHeight="17px">
                  Pooled {currency1.symbol}:
                </TYPE.body>
              </RowFixed>
              {token1Deposited ? (
                <RowFixed>
                  <TYPE.body color="text4" fontSize="14px" lineHeight="17px" marginLeft="6px">
                    {token1Deposited?.toSignificant(6)}
                  </TYPE.body>
                  <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={currency1} />
                </RowFixed>
              ) : (
                '-'
              )}
            </FixedHeightRow>

            <FixedHeightRow>
              <TYPE.body color="text4" fontSize="14px" lineHeight="17px">
                Your pool share:
              </TYPE.body>
              <TYPE.body color="text4" fontSize="14px" lineHeight="17px">
                {poolTokenPercentage ? poolTokenPercentage.toFixed(2) + '%' : '-'}
              </TYPE.body>
            </FixedHeightRow>
            <FixedHeightRow>
              <TYPE.body color="text4" fontSize="14px" lineHeight="17px">
                Pool Swap Fee:
              </TYPE.body>
              <TYPE.body color="text4" fontSize="14px" lineHeight="17px">
                {pairSwapFee ? pairSwapFee.toSignificant(3) + '%' : '-'}
              </TYPE.body>
            </FixedHeightRow>

            <RowBetween marginTop="16px">
              <ButtonSecondary
                padding="8px"
                as={Link}
                to={`/add/${currencyId(currency0)}/${currencyId(currency1)}`}
                style={{ fontSize: '12px', fontWeight: 'bold', lineHeight: '15px' }}
                width="48%"
              >
                ADD
              </ButtonSecondary>
              <ButtonSecondary
                padding="8px"
                as={Link}
                width="48%"
                to={`/remove/${currencyId(currency0)}/${currencyId(currency1)}`}
                style={{ fontSize: '12px', fontWeight: 'bold', lineHeight: '15px' }}
              >
                REMOVE
              </ButtonSecondary>
            </RowBetween>
            <RowBetween marginTop="8px">
              <ButtonSecondary
                padding="8px"
                disabled
                style={{ fontSize: '12px', fontWeight: 'bold', lineHeight: '15px' }}
                width="100%"
              >
                GOVERNANCE
              </ButtonSecondary>
            </RowBetween>
          </AutoColumn>
        )}
      </AutoColumn>
    </StyledPositionCard>
  )
}
