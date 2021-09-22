import { JSBI, Pair, Percent, TokenAmount } from '@swapr/sdk'
import React, { useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { Link } from 'react-router-dom'
import { Box, Flex } from 'rebass'
import styled from 'styled-components'
import { ArrowUpRight } from 'react-feather'
import { useTotalSupply } from '../../data/TotalSupply'

import { useActiveWeb3React } from '../../hooks'
import { useTokenBalance } from '../../state/wallet/hooks'
import { ExternalLink, TYPE } from '../../theme'
import { currencyId } from '../../utils/currencyId'
import { unwrappedToken } from '../../utils/wrappedCurrency'
import { ButtonDark, ButtonGrey } from '../Button'

import Card, { GreyCard, OutlineCard } from '../Card'
import { AutoColumn } from '../Column'
import CurrencyLogo from '../CurrencyLogo'
import DoubleCurrencyLogo from '../DoubleLogo'
import { RowBetween, RowFixed } from '../Row'
import { useIsMobileByMedia } from '../../hooks/useIsMobileByMedia'

export const FixedHeightRow = styled(RowBetween)`
  height: 20px;
`

const StyledStatsLinkIcon = styled(ArrowUpRight)`
  color: ${props => props.theme.text4};
`

export const HoverCard = styled(Card)`
  border: 1px solid transparent;
`

const StyledPositionCard = styled(GreyCard)`
  border: none;
  padding: 24px 28px;
  color: white;
  position: relative;
  overflow: hidden;
  background: radial-gradient(147.37% 164.97% at 50% 0%, rgba(255, 255, 255, 0.1) 0%, rgba(0, 0, 0, 0) 100%), #1f1d2c;
  background-blend-mode: overlay, normal;
`

interface MinimalPositionCardProps {
  pair: Pair
  showUnwrapped?: boolean
  border?: string
}

export function MinimalPositionCard({ pair, showUnwrapped = false, border }: MinimalPositionCardProps) {
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
                  My position
                </TYPE.body>
              </RowFixed>
            </FixedHeightRow>
            <FixedHeightRow onClick={() => setShowMore(!showMore)}>
              <RowFixed>
                <DoubleCurrencyLogo marginRight={6} currency0={currency0} currency1={currency1} size={20} />
                <TYPE.white fontSize="16px" lineHeight="20px">
                  {currency0 && currency1 ? `${currency0.symbol}/${currency1.symbol}` : <Skeleton width="36px" />}
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
                  Your pool&apos;s share:
                </TYPE.body>
                <TYPE.body color="text4" fontSize="15px" lineHeight="19px">
                  {poolTokenPercentage ? poolTokenPercentage.toFixed(6) + '%' : '-'}
                </TYPE.body>
              </FixedHeightRow>
              <FixedHeightRow>
                <TYPE.body color="text4" fontSize="15px" lineHeight="19px">
                  {currency0 ? currency0.symbol : <Skeleton width="36px" />}:
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
                  {currency1 ? currency1.symbol : <Skeleton width="36px" />}:
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

const AccountAnalyticsButton = ({
  account,
  chainId,
  fullWidth
}: {
  account?: string | null
  chainId?: number
  fullWidth?: boolean
}) => (
  <ButtonGrey
    width={fullWidth ? undefined : 'auto'}
    style={{ padding: '8px 12px' }}
    as={ExternalLink}
    href={
      account
        ? `https://dxstats.eth.link/#/account/${account}?chainId=${chainId}`
        : `https://dxstats.eth.link/#/accounts?chainId=${chainId}`
    }
  >
    <Flex alignItems="center">
      <Box mr="4px">
        <TYPE.small color="text4" fontSize="12px" letterSpacing="0.08em">
          Account analytics
        </TYPE.small>
      </Box>
      <Box>
        <StyledStatsLinkIcon size="12px" />
      </Box>
    </Flex>
  </ButtonGrey>
)

interface FullPositionCardProps {
  pair?: Pair
  showUnwrapped?: boolean
  border?: string
}

export default function FullPositionCard({ pair, border }: FullPositionCardProps) {
  const { account, chainId } = useActiveWeb3React()

  const currency0 = unwrappedToken(pair?.token0)
  const currency1 = unwrappedToken(pair?.token1)

  const userPoolBalance = useTokenBalance(account ?? undefined, pair?.liquidityToken)
  const totalPoolTokens = useTotalSupply(pair?.liquidityToken)

  const mobile = useIsMobileByMedia()

  const poolTokenPercentage =
    !!userPoolBalance && !!totalPoolTokens
      ? totalPoolTokens.greaterThan('0') && JSBI.greaterThanOrEqual(totalPoolTokens.raw, userPoolBalance.raw)
        ? new Percent(userPoolBalance.raw, totalPoolTokens.raw)
        : new Percent('0', '100')
      : undefined

  const [token0Deposited, token1Deposited] = !!pair
    ? !!totalPoolTokens &&
      totalPoolTokens.greaterThan('0') &&
      !!userPoolBalance &&
      userPoolBalance.greaterThan('0') &&
      // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
      JSBI.greaterThanOrEqual(totalPoolTokens.raw, userPoolBalance.raw)
      ? [
          pair.getLiquidityValue(pair.token0, totalPoolTokens, userPoolBalance, false),
          pair.getLiquidityValue(pair.token1, totalPoolTokens, userPoolBalance, false)
        ]
      : [new TokenAmount(pair.token0, '0'), new TokenAmount(pair.token1, '0')]
    : [undefined, undefined]

  const showRemoveButton = !!userPoolBalance?.greaterThan('0')

  return (
    <StyledPositionCard border={border}>
      <AutoColumn gap="12px">
        <AutoColumn gap="11px">
          <FixedHeightRow justifyContent="space-between">
            <TYPE.body color="white" fontSize="16px" lineHeight="20px" fontWeight="500">
              My position
            </TYPE.body>
            {!mobile && <AccountAnalyticsButton account={account} chainId={chainId} />}
          </FixedHeightRow>
          <FixedHeightRow marginTop="12px">
            <TYPE.body color="text4" fontWeight="500" fontSize="14px" lineHeight="17px">
              Your pool tokens:
            </TYPE.body>
            <RowFixed>
              <TYPE.body color="text4" fontWeight="500" fontSize="14px" lineHeight="17px" marginRight="8px">
                {userPoolBalance ? userPoolBalance.toSignificant(4) : <Skeleton width="50px" />}
              </TYPE.body>
              <DoubleCurrencyLogo loading={!!!userPoolBalance} size={16} currency0={currency0} currency1={currency1} />
            </RowFixed>
          </FixedHeightRow>
          <FixedHeightRow>
            <RowFixed>
              <TYPE.body color="text4" fontWeight="500" fontSize="14px" lineHeight="17px">
                Pooled {currency0 ? `${currency0.symbol}:` : <Skeleton width="24px" />}
              </TYPE.body>
            </RowFixed>
            <RowFixed>
              <TYPE.body color="text4" fontWeight="500" fontSize="14px" lineHeight="17px" marginRight="8px">
                {token0Deposited ? token0Deposited.toSignificant(6) : <Skeleton width="50px" />}
              </TYPE.body>
              <CurrencyLogo loading={!!!currency0} size="16px" currency={currency0} />
            </RowFixed>
          </FixedHeightRow>

          <FixedHeightRow>
            <RowFixed>
              <TYPE.body color="text4" fontWeight="500" fontSize="14px" lineHeight="17px">
                Pooled {currency1 ? `${currency1.symbol}:` : <Skeleton width="24px" />}
              </TYPE.body>
            </RowFixed>
            <RowFixed>
              <TYPE.body color="text4" fontWeight="500" fontSize="14px" lineHeight="17px" marginRight="8px">
                {token1Deposited ? token1Deposited.toSignificant(6) : <Skeleton width="50px" />}
              </TYPE.body>
              <CurrencyLogo loading={!!!currency1} size="16px" currency={currency1} />
            </RowFixed>
          </FixedHeightRow>

          <FixedHeightRow>
            <TYPE.body color="text4" fontWeight="500" fontSize="14px" lineHeight="17px">
              Your pool share:
            </TYPE.body>
            <TYPE.body color="text4" fontWeight="500" fontSize="14px" lineHeight="17px">
              {poolTokenPercentage ? poolTokenPercentage.toFixed(2) + '%' : <Skeleton width="50px" />}
            </TYPE.body>
          </FixedHeightRow>
          <FixedHeightRow>
            <TYPE.body color="text4" fontWeight="500" fontSize="14px" lineHeight="17px">
              Swap fee:
            </TYPE.body>
            <TYPE.body color="text4" fontWeight="500" fontSize="14px" lineHeight="17px">
              {pair ? (
                new Percent(JSBI.BigInt(pair.swapFee.toString()), JSBI.BigInt(10000)).toSignificant(3) + '%'
              ) : (
                <Skeleton width="50px" />
              )}
            </TYPE.body>
          </FixedHeightRow>

          <RowBetween marginTop="16px">
            <ButtonDark
              padding="8px"
              as={Link}
              to={currency0 && currency1 ? `/add/${currencyId(currency0)}/${currencyId(currency1)}` : ''}
              style={{ fontSize: '12px', fontWeight: 'bold', lineHeight: '15px' }}
              width={showRemoveButton ? '48%' : '100%'}
            >
              ADD LIQUIDITY
            </ButtonDark>
            {showRemoveButton && (
              <ButtonDark
                padding="8px"
                as={Link}
                width="48%"
                to={currency0 && currency1 ? `/remove/${currencyId(currency0)}/${currencyId(currency1)}` : ''}
                style={{ fontSize: '12px', fontWeight: 'bold', lineHeight: '15px' }}
              >
                REMOVE LIQUIDITY
              </ButtonDark>
            )}
          </RowBetween>
          {mobile && <AccountAnalyticsButton fullWidth account={account} chainId={chainId} />}
        </AutoColumn>
      </AutoColumn>
    </StyledPositionCard>
  )
}
