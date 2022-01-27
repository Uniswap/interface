import { ChainId, Fraction, JSBI, Pair, Percent, TokenAmount } from '@dynamic-amm/sdk'
import { darken } from 'polished'
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Text, Flex } from 'rebass'
import styled from 'styled-components'
import { t, Trans } from '@lingui/macro'

import { DMM_ANALYTICS_URL, ONE_BIPS } from 'constants/index'
import { useTotalSupply } from '../../data/TotalSupply'
import { useActiveWeb3React } from '../../hooks'
import { useTokenBalance } from '../../state/wallet/hooks'
import { ExternalLink, UppercaseText } from '../../theme'
import { currencyId } from '../../utils/currencyId'
import { unwrappedToken } from '../../utils/wrappedCurrency'
import { ButtonEmpty, ButtonPrimary, ButtonOutlined } from '../Button'
import Card, { LightCard } from '../Card'
import { AutoColumn } from '../Column'
import CurrencyLogo from '../CurrencyLogo'
import DoubleCurrencyLogo from '../DoubleLogo'
import { RowBetween, RowFixed, AutoRow } from '../Row'
import { useCurrencyConvertedToNative, getTradingFeeAPR } from 'utils/dmm'
import { UserLiquidityPosition, useSinglePoolData } from 'state/pools/hooks'
import useTheme from 'hooks/useTheme'
import { TokenWrapper } from 'pages/AddLiquidity/styled'
import { useTokensPrice, useETHPrice } from 'state/application/hooks'
import { formattedNum, shortenAddress } from 'utils'
import WarningLeftIcon from 'components/Icons/WarningLeftIcon'
import { MouseoverTooltip } from 'components/Tooltip'
import Divider from 'components/Divider'
import DropIcon from 'components/Icons/DropIcon'
import InfoHelper from 'components/InfoHelper'
import CopyHelper from 'components/Copy'

export const FixedHeightRow = styled(RowBetween)`
  height: 24px;
`

const VerticalDivider = styled.div`
  width: 1px;
  height: 10px;
  background-color: ${({ theme }) => theme.subText};
`

export const HoverCard = styled(Card)`
  border: 1px solid transparent;
  :hover {
    border: 1px solid ${({ theme }) => darken(0.06, theme.bg2)};
  }
`
const StyledPositionCard = styled(LightCard)`
  border: none;
  background: ${({ theme }) => theme.background};
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  padding: 28px 20px 16px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 32px 16px 16px;
  `}
`

const StyledMinimalPositionCard = styled.div`
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.background};
  border-radius: 4px;
  padding: 1rem;
  align-items: flex-start;
  gap: 1rem;

  @media only screen and (min-width: 1000px) {
    flex-direction: row;
    align-items: center;
    padding: 20px 24px;
    gap: 1rem;
  }
`

const MinimalPositionItem = styled(AutoColumn)<{ noBorder?: boolean; noPadding?: boolean }>`
  width: 100%;
  border-bottom: ${({ theme, noBorder }) => (noBorder ? 'none' : `1px solid ${theme.border}`)};
  padding-bottom: ${({ noPadding }) => (noPadding ? '0' : '1rem')};

  @media only screen and (min-width: 1000px) {
    width: fit-content;
    border-bottom: none;
    border-right: ${({ theme, noBorder }) => (noBorder ? 'none' : `1px solid ${theme.border}`)};
    padding-right: ${({ noPadding }) => (noPadding ? '0' : '1rem')};
    padding-bottom: 0;
  }
`

const IconWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
`

const WarningMessage = styled(Text)`
  color: ${({ theme }) => theme.warning};
  text-align: center;
`

const formattedUSDPrice = (tokenAmount: TokenAmount, price: number) => {
  const usdValue = parseFloat(tokenAmount.toSignificant(6)) * price

  return <span>{`(~${formattedNum(usdValue.toString(), true)})`}</span>
}

interface PositionCardProps {
  pair: Pair
  showUnwrapped?: boolean
  border?: string
  stakedBalance?: TokenAmount // optional balance to indicate that liquidity is deposited in mining pool
  myLiquidity?: UserLiquidityPosition
  farmStatus?: 'NO_FARM' | 'FARM_ACTIVE' | 'FARM_ENDED'
  tab?: 'ALL' | 'STAKED'
  farmAPR?: number
}

export function NarrowPositionCard({ pair, showUnwrapped = false, border }: PositionCardProps) {
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

export function MinimalPositionCard({ pair, showUnwrapped = false }: PositionCardProps) {
  const { account } = useActiveWeb3React()
  const theme = useTheme()

  const currency0 = showUnwrapped ? pair.token0 : unwrappedToken(pair.token0)
  const currency1 = showUnwrapped ? pair.token1 : unwrappedToken(pair.token1)

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

  const usdPrices = useTokensPrice([pair.token0, pair.token1])

  return (
    <>
      <StyledMinimalPositionCard>
        <MinimalPositionItem style={{ height: '100%', alignItems: 'center', display: 'flex' }}>
          <Text fontWeight={500} fontSize={16}>
            <Trans>Your Current Position</Trans>
          </Text>
        </MinimalPositionItem>

        <MinimalPositionItem gap="4px">
          <RowFixed>
            <DoubleCurrencyLogo currency0={native0} currency1={native1} size={16} />
            <UppercaseText style={{ marginLeft: '4px' }}>
              <Text fontWeight={500} fontSize={12} color={theme.subText}>
                {native0?.symbol}/{native1?.symbol} LP Tokens
              </Text>
            </UppercaseText>
          </RowFixed>
          <RowFixed>
            <Text fontWeight={400} fontSize={14}>
              {userPoolBalance ? userPoolBalance.toSignificant(4) : '-'}{' '}
            </Text>
          </RowFixed>
        </MinimalPositionItem>

        <MinimalPositionItem>
          <AutoRow justify="space-evenly" style={{ gap: '1rem' }}>
            <MinimalPositionItem>
              <TokenWrapper>
                <CurrencyLogo currency={native0} size="16px" />
                <Text fontSize={12} fontWeight={500}>
                  {native0?.symbol}
                </Text>
              </TokenWrapper>

              {token0Deposited ? (
                <RowFixed>
                  <Text fontSize={14} fontWeight={400}>
                    {token0Deposited.equalTo('0')
                      ? '0'
                      : token0Deposited.lessThan(new Fraction(JSBI.BigInt(1), JSBI.BigInt(100)))
                      ? '<0.01'
                      : token0Deposited?.toSignificant(6)}{' '}
                    {formattedUSDPrice(token0Deposited, usdPrices[0])}
                  </Text>
                </RowFixed>
              ) : (
                '-'
              )}
            </MinimalPositionItem>

            <MinimalPositionItem noBorder={true} noPadding={true}>
              <TokenWrapper>
                <CurrencyLogo currency={native1} size="16px" />
                <Text fontSize={12} fontWeight={500}>
                  {native1?.symbol}
                </Text>
              </TokenWrapper>
              {token1Deposited ? (
                <RowFixed>
                  <Text fontSize={14} fontWeight={400}>
                    {token1Deposited.equalTo('0')
                      ? '0'
                      : token1Deposited.lessThan(new Fraction(JSBI.BigInt(1), JSBI.BigInt(100)))
                      ? '<0.01'
                      : token1Deposited?.toSignificant(6)}{' '}
                    {formattedUSDPrice(token1Deposited, usdPrices[1])}
                  </Text>
                </RowFixed>
              ) : (
                '-'
              )}
            </MinimalPositionItem>
          </AutoRow>
        </MinimalPositionItem>

        <MinimalPositionItem gap="4px" noBorder={true} noPadding={true}>
          <Text fontSize={12} fontWeight={500} color={theme.subText}>
            <UppercaseText>
              <Trans>Your Share Of Pool</Trans>
            </UppercaseText>
          </Text>
          <Text fontSize={14} fontWeight={400}>
            {poolTokenPercentage && poolTokenPercentage.greaterThan('0')
              ? poolTokenPercentage?.lessThan(ONE_BIPS)
                ? '<0.01'
                : poolTokenPercentage?.toFixed(2)
              : '0'}
            %
          </Text>
        </MinimalPositionItem>
      </StyledMinimalPositionCard>
    </>
  )
}

const Row = styled(Flex)`
  justify-content: space-between;
  color: ${({ theme }) => theme.subText};
  font-weight: 500;
  margin-top: 8px;
  font-size: 12px;
  line-height: 2;
`

export default function FullPositionCard({
  pair,
  border,
  stakedBalance,
  myLiquidity,
  farmStatus = 'NO_FARM',
  tab,
  farmAPR = 0
}: PositionCardProps) {
  const { account, chainId } = useActiveWeb3React()

  const ethPrice = useETHPrice()

  const { data: poolData } = useSinglePoolData(pair.address.toLowerCase(), ethPrice.currentPrice)

  // const volume = poolData?.oneDayVolumeUSD || poolData?.oneDayVolumeUntracked
  const fee = poolData?.oneDayFeeUSD || poolData?.oneDayFeeUntracked
  const tradingFeeAPR = getTradingFeeAPR(poolData?.reserveUSD, fee)

  const apr = tradingFeeAPR + (tab && tab === 'STAKED' ? farmAPR : 0)

  const currency0 = unwrappedToken(pair.token0)
  const currency1 = unwrappedToken(pair.token1)

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

  const [token0Staked, token1Staked] =
    !!pair &&
    !!totalPoolTokens &&
    !!stakedBalance &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    JSBI.greaterThanOrEqual(totalPoolTokens.raw, stakedBalance.raw)
      ? [
          pair.getLiquidityValue(pair.token0, totalPoolTokens, stakedBalance),
          pair.getLiquidityValue(pair.token1, totalPoolTokens, stakedBalance)
        ]
      : [undefined, undefined]

  const amp = new Fraction(pair.amp).divide(JSBI.BigInt(10000))

  const percentToken0 = pair.reserve0
    .divide(pair.virtualReserve0)
    .multiply('100')
    .divide(pair.reserve0.divide(pair.virtualReserve0).add(pair.reserve1.divide(pair.virtualReserve1)))
  const percentToken1 = new Fraction(JSBI.BigInt(100), JSBI.BigInt(1)).subtract(percentToken0)

  const usdValue = myLiquidity
    ? (parseFloat(myLiquidity.liquidityTokenBalance) * parseFloat(myLiquidity.pool.reserveUSD)) /
      parseFloat(myLiquidity.pool.totalSupply)
    : 0

  const stakedUSD = myLiquidity
    ? (parseFloat(stakedBalance?.toExact() || '0') * parseFloat(myLiquidity.pool.reserveUSD)) /
      parseFloat(myLiquidity.pool.totalSupply)
    : 0

  const totalDeposit = formattedNum((usdValue + stakedUSD).toString(), true)

  const isWarning = percentToken0.lessThan(JSBI.BigInt(10)) || percentToken1.lessThan(JSBI.BigInt(10))

  const warningToken = isWarning
    ? percentToken0.lessThan(JSBI.BigInt(10))
      ? pair.token0.symbol
      : pair.token1.symbol
    : undefined

  const native0 = useCurrencyConvertedToNative(currency0 || undefined)
  const native1 = useCurrencyConvertedToNative(currency1 || undefined)

  const theme = useTheme()

  return (
    <StyledPositionCard border={border}>
      {(isWarning || farmStatus === 'FARM_ACTIVE') && (
        <IconWrapper>
          {farmStatus === 'FARM_ACTIVE' ? (
            <MouseoverTooltip text="Available for yield farming">
              <DropIcon width={40} height={40} />
            </MouseoverTooltip>
          ) : (
            <MouseoverTooltip
              text={
                warningToken ? (
                  <WarningMessage>{t`Note: ${warningToken} is now <10% of the pool. Pool might become inactive if ${warningToken} reaches 0%`}</WarningMessage>
                ) : (
                  <WarningMessage>
                    <Trans>One token is close to 0% in the pool ratio. Pool might go inactive.</Trans>
                  </WarningMessage>
                )
              }
            >
              <WarningLeftIcon width={40} height={40} />
            </MouseoverTooltip>
          )}
        </IconWrapper>
      )}

      <Flex justifyContent="space-between" alignItems="center">
        <div>
          <Text fontWeight={500} fontSize={20}>{`${native0?.symbol}/${native1?.symbol}`}</Text>
          <Flex alignItems="center" sx={{ gap: '6px' }} marginTop="4px">
            <Text color={theme.subText} fontWeight={500} fontSize="12px" width="max-content">
              AMP = {amp.toSignificant(5)}
            </Text>

            <VerticalDivider />
            <Flex alignItems="center" color={theme.subText} fontSize={12}>
              <Text>{shortenAddress(pair.address, 3)}</Text>
              <CopyHelper toCopy={pair.address} margin="0" />
            </Flex>
          </Flex>
        </div>
        <DoubleCurrencyLogo currency0={native0} currency1={native1} size={40} />
      </Flex>

      <Flex marginTop="0.25rem" justifyContent="flex-end" alignItems="center"></Flex>

      <Flex alignItems="center" justifyContent="space-between" marginTop="1.25rem">
        <Text fontSize="1rem" fontWeight={500} color={theme.subText}>
          {tab === 'ALL' ? <Trans>Your Liquidity</Trans> : <Trans>Your Staked</Trans>}
        </Text>
        <Flex fontSize={12} color={theme.subText} marginTop="2px" alignItems="baseline" sx={{ gap: '4px' }}>
          <Flex alignItems="center" flexDirection="row">
            APR{' '}
            {tab === 'STAKED' && (
              <InfoHelper text={t`${tradingFeeAPR.toFixed(2)}% LP Fee + ${farmAPR.toFixed(2)}% Rewards`} size={14} />
            )}
          </Flex>
          <Text as="span" color={theme.apr} fontSize="20px" fontWeight={500}>
            {apr ? `${apr.toFixed(2)}%` : '--'}
          </Text>
        </Flex>
      </Flex>
      <Divider sx={{ marginTop: '0.5rem' }} />

      <Flex height="168px" marginTop="0.75rem" flexDirection="column">
        {tab === 'ALL' ? (
          <>
            <Row>
              <Text>
                <Trans>Your Liquidity Balance</Trans>
              </Text>
              <Text fontSize={14} color={theme.text}>
                {totalDeposit}
              </Text>
            </Row>
            <Row>
              <Text>
                <Trans>Total LP Tokens</Trans>
              </Text>
              <Text color={theme.text} fontSize={14}>
                {userPoolBalance?.toSignificant(6) ?? '-'}
              </Text>
            </Row>
            <Row>
              <Flex alignItems="center">
                <Text>
                  <Trans>Available LP Tokens</Trans>
                </Text>
                <InfoHelper text={t`Your available LP Token balance after staking (if applicable)`} size={14} />
              </Flex>
              <Text color={theme.text} fontSize={14}>
                {userDefaultPoolBalance?.toSignificant(6) ?? '0'}
              </Text>
            </Row>

            <Row>
              <Text>
                <Trans>Pooled {native0?.symbol}</Trans>
              </Text>
              {token0Deposited ? (
                <RowFixed>
                  <CurrencyLogo size="16px" currency={currency0} />
                  <Text fontSize={14} fontWeight={500} marginLeft={'6px'} color={theme.text}>
                    {token0Deposited?.toSignificant(6)}
                  </Text>
                </RowFixed>
              ) : (
                '-'
              )}
            </Row>
            <Row>
              <Text>
                <Trans>Pooled {native1?.symbol}</Trans>
              </Text>
              {token1Deposited ? (
                <RowFixed>
                  <CurrencyLogo size="16px" currency={currency1} />
                  <Text color={theme.text} fontSize={14} fontWeight={500} marginLeft={'6px'}>
                    {token1Deposited?.toSignificant(6)}
                  </Text>
                </RowFixed>
              ) : (
                '-'
              )}
            </Row>

            <Row>
              <Text>
                <Trans>Your Share Of Pool</Trans>
              </Text>
              <Text fontSize={14} color={theme.text}>
                {poolTokenPercentage
                  ? (poolTokenPercentage.toFixed(2) === '0.00' ? '<0.01' : poolTokenPercentage.toFixed(2)) + '%'
                  : '-'}
              </Text>
            </Row>
          </>
        ) : (
          <>
            <Row>
              <Text>
                <Trans>Your Staked Balance</Trans>
              </Text>
              <Text fontSize={14} color={theme.text}>
                {formattedNum(stakedUSD.toString(), true)}
              </Text>
            </Row>
            <Row>
              <Text>
                <Trans>Staked LP Tokens</Trans>
              </Text>
              <Text color={theme.text} fontSize={14}>
                {stakedBalance?.toSignificant(6) ?? '-'}
              </Text>
            </Row>
            <Row>
              <Text>
                <Trans>Staked {native0?.symbol}</Trans>
              </Text>
              {token0Staked ? (
                <RowFixed>
                  <CurrencyLogo size="16px" currency={currency0} />
                  <Text fontSize={14} fontWeight={500} marginLeft={'6px'} color={theme.text}>
                    {token0Staked?.toSignificant(6)}
                  </Text>
                </RowFixed>
              ) : (
                '-'
              )}
            </Row>
            <Row>
              <Text>
                <Trans>Staked {native1?.symbol}</Trans>
              </Text>
              {token1Staked ? (
                <RowFixed>
                  <CurrencyLogo size="16px" currency={currency1} />
                  <Text color={theme.text} fontSize={14} fontWeight={500} marginLeft={'6px'}>
                    {token1Staked?.toSignificant(6)}
                  </Text>
                </RowFixed>
              ) : (
                '-'
              )}
            </Row>
          </>
        )}
      </Flex>

      {tab === 'ALL' ? (
        <Flex marginTop="20px" sx={{ gap: '1rem' }}>
          <ButtonPrimary
            padding="9px"
            style={{ fontSize: '14px', borderRadius: '4px' }}
            as={Link}
            to={`/add/${currencyId(currency0, chainId)}/${currencyId(currency1, chainId)}/${pair.address}`}
          >
            <Text width="max-content">
              <Trans>Add Liquidity</Trans>
            </Text>
          </ButtonPrimary>

          {userDefaultPoolBalance?.greaterThan(JSBI.BigInt(0)) ? (
            <ButtonOutlined
              style={{
                padding: '9px',
                borderRadius: '4px',
                fontSize: '14px'
              }}
              as={Link}
              to={`/remove/${currencyId(currency0, chainId)}/${currencyId(currency1, chainId)}/${pair.address}`}
            >
              <Text width="max-content">
                <Trans>Remove Liquidity</Trans>
              </Text>
            </ButtonOutlined>
          ) : (
            <ButtonPrimary
              disabled
              style={{
                padding: '9px',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <Text width="max-content">
                <Trans>Remove Liquidity</Trans>
              </Text>
            </ButtonPrimary>
          )}
        </Flex>
      ) : (
        <ButtonPrimary
          padding="9px"
          style={{ fontSize: '14px', borderRadius: '4px' }}
          as={Link}
          to={`/farms?tab=${farmStatus === 'FARM_ACTIVE' ? 'active' : 'end'}`}
        >
          <Text width="max-content">
            <Trans>Go to farm</Trans>
          </Text>
        </ButtonPrimary>
      )}

      <Divider sx={{ marginTop: '20px' }} />

      <Flex justifyContent="space-between" marginTop="16px" alignItems="center">
        <ButtonEmpty width="max-content" style={{ fontSize: '14px' }} padding="0">
          <ExternalLink
            style={{ width: '100%', textAlign: 'center' }}
            href={`${DMM_ANALYTICS_URL[chainId as ChainId]}/account/${account}`}
          >
            <Trans>Analytics ↗</Trans>
          </ExternalLink>
        </ButtonEmpty>
        {tab === 'ALL' && farmStatus === 'FARM_ACTIVE' && (
          <ButtonEmpty width="max-content" style={{ fontSize: '14px' }} padding="0" as={Link} to="/farms?tab=active">
            <Trans>Go to farm ↗</Trans>
          </ButtonEmpty>
        )}
        {tab === 'ALL' && farmStatus === 'FARM_ENDED' && stakedBalance && (
          <ButtonEmpty width="max-content" style={{ fontSize: '14px' }} padding="0" as={Link} to="/farms?tab=ended">
            <Trans>Go to farm ↗</Trans>
          </ButtonEmpty>
        )}
      </Flex>
    </StyledPositionCard>
  )
}
