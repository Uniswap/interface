import { JSBI, Pair, Percent, TokenAmount } from '@teleswap/sdk'
import RightArrow from 'assets/svg/right-arrow.svg'
import Bn from 'bignumber.js'
import { gql } from 'graphql-tag'
import { darken, transparentize } from 'polished'
import { useEffect, useMemo, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { ChevronDown, ChevronUp } from 'react-feather'
import { Link } from 'react-router-dom'
import { Box, BoxProps, Text } from 'rebass'
import styled from 'styled-components'
import { client } from 'utils/apolloClient'

import { BIG_INT_ZERO } from '../../constants'
import { useTotalSupply } from '../../data/TotalSupply'
import { useActiveWeb3React } from '../../hooks'
import { useColor } from '../../hooks/useColor'
import { useUserUnclaimedAmount } from '../../state/claim/hooks'
import { useTokenBalance } from '../../state/wallet/hooks'
import { ExternalLink /* , TYPE */ } from '../../theme'
import { currencyId } from '../../utils/currencyId'
import { unwrappedToken } from '../../utils/wrappedCurrency'
import { ButtonEmpty, ButtonPrimary, ButtonSecondary } from '../Button'
import Card, { LightCard } from '../Card'
import { AutoColumn } from '../Column'
import CurrencyLogo from '../CurrencyLogo'
import DoubleCurrencyLogoHorizontal from '../DoubleLogo'
import { CardNoise } from '../earn/styled'
import { AutoRow, RowBetween, RowFixed } from '../Row'
import { Dots } from '../swap/styleds'

export const FixedHeightRow = styled(RowBetween)``

export const HoverCard = styled(Card)`
  border: 1px solid transparent;
  :hover {
    border: 1px solid ${({ theme }) => darken(0.06, theme.bg2)};
  }
`
const StyledPositionCard = styled(LightCard)<{ bgColor: any }>`
  border: none;
  ${({ theme, bgColor }) =>
    bgColor
      ? `background: radial-gradient(91.85% 100% at 1.84% 0%, ${transparentize(0.8, bgColor)} 0%, ${theme.bg3} 100%) `
      : 'background: transparent'};
  position: relative;
  overflow: hidden;
`

interface PositionCardProps {
  pair: Pair
  showUnwrapped?: boolean
  border?: string
  stakedBalance?: TokenAmount // optional balance to indicate that liquidity is deposited in mining pool
}

const YourPisitonCard = styled(Box)`
  border: 1px solid ${({ theme }) => theme.common3};
  border-radius: 0.8rem;
  padding: 1.25rem;
  font-size: 0.7rem;
  color: #ffffff;
`
export function MinimalPositionCard({ pair, showUnwrapped = false, ...boxProps }: PositionCardProps & BoxProps) {
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

  return (
    <>
      {userPoolBalance && JSBI.greaterThan(userPoolBalance.raw, JSBI.BigInt(0)) ? (
        <YourPisitonCard {...boxProps}>
          <AutoColumn gap="12px">
            <FixedHeightRow>
              <RowFixed>
                <Text fontWeight={400} className={'secondary-title'}>
                  Your position
                </Text>
              </RowFixed>
            </FixedHeightRow>
            <FixedHeightRow onClick={() => setShowMore(!showMore)}>
              <RowFixed>
                <DoubleCurrencyLogoHorizontal
                  currency0={currency0}
                  currency1={currency1}
                  margin={false}
                  size={'1.25rem'}
                />
                <Text className="text-emphasize" fontWeight={400}>
                  {currency0.symbol}/{currency1.symbol}
                </Text>
              </RowFixed>
              <RowFixed>
                <Text className="text-emphasize" fontWeight={400}>
                  {userPoolBalance ? userPoolBalance.toSignificant(4) : '-'}
                </Text>
              </RowFixed>
            </FixedHeightRow>
            <div
              style={{
                width: '100%',
                height: '0px',
                borderBottom: `1px solid rgba(255, 255, 255, 0.2)`,
                marginTop: '0.3rem',
                marginBottom: '.8rem'
              }}
            ></div>
            <AutoColumn gap="0.7rem">
              <FixedHeightRow minHeight="fit-content">
                <Text className={'secondary-title'} fontWeight={400}>
                  Pooled assets
                </Text>
                {/* <Text fontSize={".6rem"} fontWeight={600}>
                  {poolTokenPercentage ? poolTokenPercentage.toFixed(6) + '%' : '-'}
                </Text> */}
              </FixedHeightRow>
              <FixedHeightRow minHeight="fit-content">
                <Box display={'flex'} alignItems="center" sx={{ gap: '0.5rem' }}>
                  <CurrencyLogo currency={currency0} size={'2rem'} />
                  <Box display="flex" flexDirection={'column'}>
                    <Text className="text-emphasize" fontWeight={400}>
                      {currency0.symbol}
                    </Text>
                    <Text className="text-small" fontWeight={200} color="#CCCCCC">
                      {currency0.name}
                    </Text>
                  </Box>
                </Box>
                {token0Deposited ? (
                  <RowFixed>
                    <Text className="text-emphasize" fontWeight={400} marginLeft={'6px'} opacity={0.8}>
                      {token0Deposited?.toSignificant(6)}
                    </Text>
                  </RowFixed>
                ) : (
                  '-'
                )}
              </FixedHeightRow>
              <FixedHeightRow minHeight="fit-content">
                <Box display={'flex'} alignItems="center" sx={{ gap: '0.5rem' }}>
                  <CurrencyLogo currency={currency1} size={'2rem'} />
                  <Box display="flex" flexDirection={'column'}>
                    <Text className="text-emphasize" fontWeight={400}>
                      {currency1.symbol}
                    </Text>
                    <Text className="text-small" fontWeight={200} color="#CCCCCC">
                      {currency1.name}
                    </Text>
                  </Box>
                </Box>
                {token1Deposited ? (
                  <RowFixed>
                    <Text className="text-emphasize" fontWeight={400} marginLeft={'6px'} opacity={0.8}>
                      {token1Deposited?.toSignificant(6)}
                    </Text>
                  </RowFixed>
                ) : (
                  '-'
                )}
              </FixedHeightRow>
            </AutoColumn>
          </AutoColumn>
        </YourPisitonCard>
      ) : (
        <></>
      )}
    </>
  )
}

const YourPisitonCardPart = styled(Box)`
  /* border: 1px solid ${({ theme }) => theme.common3}; */
  /* border-radius: 0.8rem; */
  font-size: 0.7rem;
  color: #ffffff;
`
export function MinimalPositionCardPart({ pair, showUnwrapped = false, border }: PositionCardProps) {
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

  return (
    <>
      {userPoolBalance && JSBI.greaterThan(userPoolBalance.raw, JSBI.BigInt(0)) ? (
        <YourPisitonCardPart>
          <AutoColumn gap="12px">
            <AutoColumn gap="0">
              <FixedHeightRow>
                <Text fontSize={'.7rem'} fontWeight={600} style={{ marginBottom: '1rem' }}>
                  Pair Liquidity Info
                </Text>
              </FixedHeightRow>
              <FixedHeightRow>
                {token0Deposited ? (
                  <RowFixed sx={{ flex: 1 }}>
                    <Text fontSize={'.5rem'} fontWeight={500}>
                      {token0Deposited?.toSignificant(6)}
                    </Text>
                  </RowFixed>
                ) : (
                  '-'
                )}

                {token1Deposited ? (
                  <RowFixed sx={{ flex: 1 }}>
                    <Text fontSize={'.5rem'} fontWeight={500}>
                      {token1Deposited?.toSignificant(6)}
                    </Text>
                  </RowFixed>
                ) : (
                  '-'
                )}
              </FixedHeightRow>
              <FixedHeightRow>
                <Text fontSize={'.4rem'} fontWeight={400} sx={{ color: 'rgba(255, 255, 255, 0.6)', flex: 1 }}>
                  {currency0.symbol}:
                </Text>
                <Text fontSize={'.4rem'} fontWeight={400} sx={{ color: 'rgba(255, 255, 255, 0.6)', flex: 1 }}>
                  {currency1.symbol}:
                </Text>
              </FixedHeightRow>
            </AutoColumn>
            <Box
              sx={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.2)', height: '0', marginTop: '.9rem' }}
            ></Box>
          </AutoColumn>
        </YourPisitonCardPart>
      ) : (
        <></>
        // <LightCard>
        //   <TYPE.subHeader style={{ textAlign: 'center' }}>
        //     <span role="img" aria-label="wizard-icon">
        //       ⭐️
        //   </span>{' '}
        //   By adding liquidity you&apos;ll earn 0.3% of all trades on this pair proportional to your share of the pool.
        //   Fees are added to the pool, accrue in real time and can be claimed by withdrawing your liquidity.
        // </TYPE.subHeader>
        // </LightCard>
      )}
    </>
  )
}

type ViewProps = Parameters<typeof StyledPositionCard>

export default function FullPositionCard({
  pair,
  border,
  borderRadius,
  stakedBalance,
  needBgColor = true
}: { needBgColor?: boolean } & ViewProps[0] & PositionCardProps) {
  const { account } = useActiveWeb3React()
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
          pair.getLiquidityValue(pair.token0, totalPoolTokens, userPoolBalance, false),
          pair.getLiquidityValue(pair.token1, totalPoolTokens, userPoolBalance, false)
        ]
      : [undefined, undefined]

  const backgroundColor = useColor(pair?.token0)
  return (
    <StyledPositionCard border={border} bgColor={needBgColor ? backgroundColor : null} borderRadius={borderRadius}>
      {needBgColor && <CardNoise />}
      <AutoColumn gap="12px">
        <FixedHeightRow>
          <AutoRow gap="8px">
            <DoubleCurrencyLogoHorizontal currency0={currency0} currency1={currency1} size={20} />
            <Text fontWeight={500} fontSize={20}>
              {!currency0 || !currency1 ? <Dots>Loading</Dots> : `${currency0.symbol}/${currency1.symbol}`}
            </Text>
          </AutoRow>
          <RowFixed gap="8px">
            <ButtonEmpty
              padding="6px 8px"
              borderRadius="12px"
              width="fit-content"
              onClick={() => setShowMore(!showMore)}
            >
              {showMore ? (
                <>
                  Manage
                  <ChevronUp size="20" style={{ marginLeft: '10px' }} />
                </>
              ) : (
                <>
                  Manage
                  <ChevronDown size="20" style={{ marginLeft: '10px' }} />
                </>
              )}
            </ButtonEmpty>
          </RowFixed>
        </FixedHeightRow>

        {showMore && (
          <AutoColumn gap="8px">
            <FixedHeightRow>
              <Text fontSize={16} fontWeight={500}>
                Your total pool tokens:
              </Text>
              <Text fontSize={16} fontWeight={500}>
                {userPoolBalance ? userPoolBalance.toSignificant(4) : '-'}
              </Text>
            </FixedHeightRow>
            {stakedBalance && (
              <FixedHeightRow>
                <Text fontSize={16} fontWeight={500}>
                  Pool tokens in rewards pool:
                </Text>
                <Text fontSize={16} fontWeight={500}>
                  {stakedBalance.toSignificant(4)}
                </Text>
              </FixedHeightRow>
            )}
            <FixedHeightRow>
              <RowFixed>
                <Text fontSize={16} fontWeight={500}>
                  Pooled {currency0.symbol}:
                </Text>
              </RowFixed>
              {token0Deposited ? (
                <RowFixed>
                  <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
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
                <Text fontSize={16} fontWeight={500}>
                  Pooled {currency1.symbol}:
                </Text>
              </RowFixed>
              {token1Deposited ? (
                <RowFixed>
                  <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
                    {token1Deposited?.toSignificant(6)}
                  </Text>
                  <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={currency1} />
                </RowFixed>
              ) : (
                '-'
              )}
            </FixedHeightRow>

            <FixedHeightRow>
              <Text fontSize={16} fontWeight={500}>
                Your pool share:
              </Text>
              <Text fontSize={16} fontWeight={500}>
                {poolTokenPercentage
                  ? (poolTokenPercentage.toFixed(2) === '0.00' ? '<0.01' : poolTokenPercentage.toFixed(2)) + '%'
                  : '-'}
              </Text>
            </FixedHeightRow>

            <ButtonSecondary padding="8px" borderRadius="8px">
              <ExternalLink
                style={{ width: '100%', textAlign: 'center' }}
                href={`https://uniswap.info/account/${account}`}
              >
                View accrued fees and analytics<span style={{ fontSize: '11px' }}>↗</span>
              </ExternalLink>
            </ButtonSecondary>
            {userDefaultPoolBalance && JSBI.greaterThan(userDefaultPoolBalance.raw, BIG_INT_ZERO) && (
              <RowBetween marginTop="10px">
                <ButtonPrimary
                  padding="8px"
                  borderRadius="8px"
                  as={Link}
                  to={`/add/${currencyId(currency0)}/${currencyId(currency1)}`}
                  width="48%"
                >
                  Add
                </ButtonPrimary>
                <ButtonPrimary
                  padding="8px"
                  borderRadius="8px"
                  as={Link}
                  width="48%"
                  to={`/remove/${currencyId(currency0)}/${currencyId(currency1)}`}
                >
                  Remove
                </ButtonPrimary>
              </RowBetween>
            )}
            {stakedBalance && JSBI.greaterThan(stakedBalance.raw, BIG_INT_ZERO) && (
              <ButtonPrimary
                padding="8px"
                borderRadius="8px"
                as={Link}
                to={`/uni/${currencyId(currency0)}/${currencyId(currency1)}`}
                width="100%"
              >
                Manage Liquidity in Rewards Pool
              </ButtonPrimary>
            )}
          </AutoColumn>
        )}
      </AutoColumn>
    </StyledPositionCard>
  )
}

const StyledLink = styled(ButtonPrimary)`
  & {
    display: inline-block !important;
    padding: 0.3rem;
    border-radius: 0.5rem !important;
    color: #000000;
  }
`

const MobileYourLiquidityCardColumnHead = styled(Text)`
  font-family: 'Poppins';
  font-style: normal;
  font-weight: 400;
  font-size: 0.75rem;
  line-height: 1rem;
  color: rgba(255, 255, 255, 0.6);
`

export function LiquidityCard({
  pair,
  border,
  borderRadius,
  stakedBalance,
  needBgColor = true,
  ethPrice
}: { needBgColor?: boolean; ethPrice: Bn } & ViewProps[0] & PositionCardProps) {
  const { account } = useActiveWeb3React()
  const currency0 = unwrappedToken(pair.token0)
  const currency1 = unwrappedToken(pair.token1)
  const pairModeStable = !!pair.stable
  const unclaimedAmount = useUserUnclaimedAmount(account)
  const [showMore, setShowMore] = useState(false)

  const userDefaultPoolBalance = useTokenBalance(account ?? undefined, pair.liquidityToken)
  const totalPoolTokens = useTotalSupply(pair.liquidityToken)

  // if staked balance balance provided, add to standard liquidity amount
  const userPoolBalance = stakedBalance ? userDefaultPoolBalance?.add(stakedBalance) : userDefaultPoolBalance

  const poolTokenPercentage =
    !!userPoolBalance && !!totalPoolTokens && JSBI.greaterThanOrEqual(totalPoolTokens.raw, userPoolBalance.raw)
      ? new Percent(userPoolBalance.raw, totalPoolTokens.raw)
      : undefined

  const userHoldingPercentage = useMemo(() => {
    if (userPoolBalance && totalPoolTokens) {
      return userPoolBalance?.divide(totalPoolTokens!)
    }
    return '-'
  }, [pair?.liquidityToken, totalPoolTokens, userPoolBalance])

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

  const [fullInfoPair, setFullInfoPair] = useState<any>()
  // const backgroundColor = useColor(pair?.token0)
  useEffect(() => {
    if (ethPrice) {
      ;(async () => {
        const pairAddress = Pair.getAddress(pair.token0, pair.token1).toLowerCase()
        try {
          const {
            data: {
              pairs: [fullPair]
            }
          } = await client.query({
            query: gql`
            {
              pairs(where: { id: "${pairAddress}" }) {
                id
                trackedReserveETH
                token0 {
                  id
                  symbol
                  name
                  derivedETH
                }
                token1 {
                  id
                  symbol
                  name
                  derivedETH
                }
                reserve0
                reserve1
                reserveUSD
                totalSupply
                trackedReserveETH
                reserveETH
                volumeUSD
                untrackedVolumeUSD
                token0Price
                token1Price
                createdAtTimestamp
              }
            }
            `
            /* variables: {
              pairAddress
            }, */
            // fetchPolicy: 'cache-first'
          })
          setFullInfoPair(fullPair)
        } catch (err) {
          console.error(err)
        }
      })()
    }
  }, [ethPrice, pair.token0, pair.token1])
  if (!isMobile) {
    return (
      <>
        <Box>
          <DoubleCurrencyLogoHorizontal currency0={currency0} currency1={currency1} size={20} />
        </Box>
        <Box>{pair.stable ? 'Stable' : 'Volatile'}</Box>
        <Box
          sx={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            width: 'min-content',
            textAlign: 'left',
            ...(isMobile ? { maxWidth: '3.5rem' } : {})
          }}
        >
          {!currency0 || !currency1 ? <Dots>Loading</Dots> : `${currency0.symbol}/${currency1.symbol}`}
        </Box>
        <Box>{userPoolBalance ? userPoolBalance.toSignificant(4) : '-'}</Box>
        <Box>
          {fullInfoPair && userHoldingPercentage && userHoldingPercentage !== '-'
            ? new Bn(fullInfoPair.trackedReserveETH)
                .multipliedBy(ethPrice)
                .multipliedBy(userHoldingPercentage?.toFixed(18))
                .decimalPlaces(4, Bn.ROUND_HALF_UP)
                .toString()
            : '-'}
          &nbsp;$
        </Box>
        {/* <td>xx</td> */}
        <Box style={{ display: 'flex', justifyContent: 'space-between', justifySelf: 'end' }}>
          {/* <ButtonPrimary padding={"unset"} width={"5rem"} borderRadius={".3rem"} sx={{ height: "1.3rem", fontSize: ".5rem", color: "#000000" }} as={Link} to="/manager">
          Manage
        </ButtonPrimary> */}
          <StyledLink
            className="text-small"
            as={Link}
            to={`/liquidity/${currencyId(currency0)}/${currencyId(currency1)}/${pairModeStable}`}
          >
            Manage
          </StyledLink>
          {/*  <Box style={{ display: 'inline-block' }}>
          <ButtonPrimary
            style={{ display: 'inline-block !important' }}
            padding=".3rem"
            borderRadius=".3rem"
            as={Link}
            to={`/add/${currencyId(currency0)}/${currencyId(currency1)}`}
          >
            Add
          </ButtonPrimary>
        </Box>
        <Box style={{ display: 'inline-block', marginLeft: '1rem' }}>
          <ButtonPrimary
            padding=".3rem"
            borderRadius=".3rem"
            as={Link}
            to={`/remove/${currencyId(currency0)}/${currencyId(currency1)}`}
          >
            Remove
          </ButtonPrimary>
        </Box> */}
        </Box>
      </>
    )
  } else {
    return (
      <>
        <Box className="mobile-pair-icon" display={'flex'} alignItems="center" justifyContent={'flex-start'}>
          <DoubleCurrencyLogoHorizontal currency0={currency0} currency1={currency1} size={20} />
          <Text
            sx={{
              'font-Family': 'Poppins',
              'font-Style': 'normal',
              'font-Weight': '500',
              'font-Size': '1rem',
              'line-Height': '1.5rem',
              color: '#FFFFFF'
            }}
          >
            {!currency0 || !currency1 ? <Dots>Loading</Dots> : `${currency0.symbol}/${currency1.symbol}`}
          </Text>
        </Box>
        <Box
          className="mobile-pair-manage-link"
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            a: {
              background: 'unset!important',
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: '600',
              fontSize: '0.8rem',
              lineHeight: '1.15rem',
              color: '#39e1ba',
              position: 'relative',
              textAlign: 'right',
              paddingRight: '1rem'
            }
          }}
        >
          <StyledLink as={Link} to={`/liquidity/${currencyId(currency0)}/${currencyId(currency1)}/${pairModeStable}`}>
            Manage
            <img
              src={RightArrow}
              alt="right-arrow"
              style={{ position: 'absolute', right: 0 }}
              height="14px"
              width={'14px'}
            />
          </StyledLink>
        </Box>
        <MobileYourLiquidityCardColumnHead>Amount</MobileYourLiquidityCardColumnHead>
        <MobileYourLiquidityCardColumnHead>Value</MobileYourLiquidityCardColumnHead>
        <MobileYourLiquidityCardColumnHead>Unclaimed Earnings</MobileYourLiquidityCardColumnHead>
        <Box>{userPoolBalance ? userPoolBalance.toSignificant(4) : '-'}</Box>
        <Box>
          {fullInfoPair && userHoldingPercentage && userHoldingPercentage !== '-'
            ? new Bn(fullInfoPair.trackedReserveETH)
                .multipliedBy(ethPrice)
                .multipliedBy(userHoldingPercentage?.toFixed(18))
                .decimalPlaces(4, Bn.ROUND_HALF_UP)
                .toString()
            : '-'}
          &nbsp;$
        </Box>
        <Box>{unclaimedAmount ? unclaimedAmount.toSignificant(4) : '-'}</Box>
      </>
    )
  }
}
