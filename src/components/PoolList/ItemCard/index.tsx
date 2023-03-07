import { ChainId, Fraction, Percent } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { parseUnits } from 'ethers/lib/utils'
import JSBI from 'jsbi'
import { useEffect, useState } from 'react'
import { AlertTriangle, BarChart2, Minus, Plus, Share2 } from 'react-feather'
import { Link, useNavigate } from 'react-router-dom'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonLight, ButtonOutlined } from 'components/Button'
import CopyHelper from 'components/Copy'
import CurrencyLogo from 'components/CurrencyLogo'
import Divider from 'components/Divider'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import HoverDropdown from 'components/HoverDropdown'
import { MoneyBag, Swap as SwapIcon } from 'components/Icons'
import {
  Progress,
  ProgressWrapper,
  TokenRatioContainer,
  TokenRatioGrid,
  TokenRatioName,
  TokenRatioPercent,
} from 'components/PoolList/styled'
import { MouseoverTooltip } from 'components/Tooltip'
import { FeeTag, FlipCard, FlipCardBack, FlipCardFront } from 'components/YieldPools/ElasticFarmGroup/styleds'
import { APRTooltipContent } from 'components/YieldPools/FarmingPoolAPRCell'
import DMM_POOL_INTERFACE from 'constants/abis/dmmPool'
import { APP_PATHS, DMM_ANALYTICS_URL, ONE_BIPS, SUBGRAPH_AMP_MULTIPLIER } from 'constants/index'
import { EVMNetworkInfo } from 'constants/networks/type'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { IconWrapper } from 'pages/Pools/styleds'
import { useToggleEthPowAckModal } from 'state/application/hooks'
import { useActiveAndUniqueFarmsData } from 'state/farms/classic/hooks'
import { Farm } from 'state/farms/classic/types'
import { useMultipleContractSingleData } from 'state/multicall/hooks'
import { SubgraphPoolData, UserLiquidityPosition, useSharedPoolIdManager, useUrlOnEthPowAck } from 'state/pools/hooks'
import { tryParseAmount } from 'state/swap/hooks'
import { ExternalLink } from 'theme'
import { formattedNum, shortenAddress } from 'utils'
import { currencyId } from 'utils/currencyId'
import {
  feeRangeCalc,
  getMyLiquidity,
  getTradingFeeAPR,
  parseSubgraphPoolData,
  priceRangeCalcBySubgraphPool,
  useFarmApr,
} from 'utils/dmm'

const StyledLink = styled(ExternalLink)`
  :hover {
    text-decoration: none;
  }
`
interface ListItemProps {
  poolData: SubgraphPoolData
  myLiquidity?: UserLiquidityPosition
}

const formatPriceMin = (price?: Fraction) => {
  return price?.toSignificant(6) ?? '0'
}

const formatPriceMax = (price?: Fraction) => {
  return !price || price.equalTo(new Fraction('-1')) ? '♾️' : price.toSignificant(6)
}

const ItemCard = ({ poolData, myLiquidity }: ListItemProps) => {
  const { chainId, networkInfo } = useActiveWeb3React()
  const amp = new Fraction(poolData.amp).divide(JSBI.BigInt(SUBGRAPH_AMP_MULTIPLIER))
  const navigate = useNavigate()
  const [, setUrlOnEthPoWAck] = useUrlOnEthPowAck()
  const toggleEthPowAckModal = useToggleEthPowAckModal()
  const [showDetail, setShowDetail] = useState(false)

  const { data: uniqueAndActiveFarms } = useActiveAndUniqueFarmsData()
  const farm = uniqueAndActiveFarms.find(f => f.id.toLowerCase() === poolData.id.toLowerCase())

  const isFarmingPool = !!farm
  const factories = useMultipleContractSingleData([poolData.id], DMM_POOL_INTERFACE, 'factory')
  const isNewStaticFeePool = factories?.[0]?.result?.[0] === (networkInfo as EVMNetworkInfo).classic.static.factory

  // Shorten address with 0x + 3 characters at start and end
  const shortenPoolAddress = shortenAddress(chainId, poolData.id, 3)
  const { currency0, currency1, reserve0, virtualReserve0, reserve1, virtualReserve1, totalSupply } =
    parseSubgraphPoolData(poolData, chainId)
  const realPercentToken0 =
    reserve0 && virtualReserve0 && reserve1 && virtualReserve1
      ? reserve0.asFraction
          .divide(virtualReserve0)
          .multiply('100')
          .divide(reserve0.divide(virtualReserve0).asFraction.add(reserve1.divide(virtualReserve1).asFraction))
      : new Fraction('50')
  const realPercentToken1 = new Fraction('100').subtract(realPercentToken0)
  const isWarning = realPercentToken0.lessThan('10') || realPercentToken1.lessThan('10')

  const percentToken0 = realPercentToken0.toSignificant(4)
  const percentToken1 = realPercentToken1.toSignificant(4)

  const theme = useTheme()

  const isHaveLiquidity = myLiquidity && myLiquidity.liquidityTokenBalance !== '0'

  const [, setSharedPoolId] = useSharedPoolIdManager()

  const ampLiquidity = formattedNum(`${parseFloat(amp.toSignificant(5)) * parseFloat(poolData.reserveUSD)}`, true)
  const volume = poolData.oneDayVolumeUSD ? poolData.oneDayVolumeUSD : poolData.oneDayVolumeUntracked
  const fee24H = poolData.oneDayFeeUSD ? poolData.oneDayFeeUSD : poolData.oneDayFeeUntracked
  const oneYearFL = getTradingFeeAPR(poolData.reserveUSD, fee24H).toFixed(2)

  const [farmAPR, setFarmAPR] = useState(0)

  const liquidityTokenBalance =
    myLiquidity?.liquidityTokenBalance && chainId
      ? tryParseAmount(myLiquidity?.liquidityTokenBalance, NativeCurrencies[chainId])
      : undefined

  const pooledToken0 =
    liquidityTokenBalance && reserve0 && totalSupply
      ? liquidityTokenBalance.multiply(reserve0).divide(totalSupply)
      : undefined

  const pooledToken1 =
    liquidityTokenBalance && reserve1 && totalSupply
      ? liquidityTokenBalance.multiply(reserve1).divide(totalSupply)
      : undefined

  const yourShareOfPool =
    liquidityTokenBalance && totalSupply ? new Percent(liquidityTokenBalance.quotient, totalSupply.quotient) : undefined

  const poolTitle = (
    <Flex alignItems="center">
      <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={20} />
      <Text fontSize="16px" fontWeight="500">
        {poolData.token0.symbol} - {poolData.token1.symbol}
      </Text>
      <FeeTag style={{ fontSize: '12px' }}>AMP {formattedNum(amp.toSignificant(5))}</FeeTag>

      {isFarmingPool && (
        <MouseoverTooltip
          noArrow
          text={
            <Text>
              <Trans>
                Available for yield farming. Click{' '}
                <Link to={`${APP_PATHS.FARMS}/${networkInfo.route}?tab=classic&type=active&search=${poolData.id}`}>
                  here
                </Link>{' '}
                to go to the farm.
              </Trans>
            </Text>
          }
        >
          <IconWrapper style={{ marginLeft: '6px', background: theme.apr + '33', width: '20px', height: '20px' }}>
            <MoneyBag size={12} color={theme.apr} />
          </IconWrapper>
        </MouseoverTooltip>
      )}

      {isWarning && (
        <MouseoverTooltip text={`One of the tokens in the pool is close to 0%. Pool might become inactive soon`}>
          <IconWrapper
            style={{
              background: theme.warning,
              marginLeft: '6px',
            }}
          >
            <AlertTriangle color={theme.textReverse} size={12} />
          </IconWrapper>
        </MouseoverTooltip>
      )}
    </Flex>
  )

  const buttonGroup = (
    <Flex marginTop="20px" justifyContent="space-between" fontSize="14px" style={{ gap: '16px' }}>
      <ButtonOutlined
        as={Link}
        to={
          isHaveLiquidity
            ? `/remove/${currencyId(currency0, chainId)}/${currencyId(currency1, chainId)}/${poolData.id}`
            : `${APP_PATHS.SWAP}/${networkInfo.route}?inputCurrency=${currencyId(
                currency0,
                chainId,
              )}&outputCurrency=${currencyId(currency1, chainId)}`
        }
        style={{
          padding: '10px',
          height: '36px',
          fontSize: '12px',
          fontWeight: 500,
          border: isHaveLiquidity ? 'none' : `1px solid ${theme.subText}`,
          color: isHaveLiquidity ? theme.red : theme.subText,
          background: isHaveLiquidity ? theme.red + '33' : 'transparent',
        }}
      >
        {isHaveLiquidity ? (
          <>
            <Minus size={16} />
            <Text marginLeft="4px">
              <Trans>Remove Liquidity</Trans>
            </Text>
          </>
        ) : (
          <Trans>Swap</Trans>
        )}
      </ButtonOutlined>
      <ButtonLight
        onClick={() => {
          const url = `/add/${currencyId(currency0, chainId)}/${currencyId(currency1, chainId)}/${poolData.id}`
          if (chainId === ChainId.ETHW) {
            setUrlOnEthPoWAck(url)
            toggleEthPowAckModal()
          } else {
            navigate(url)
          }
        }}
        style={{
          padding: '10px',
          fontWeight: 500,
          height: '36px',
        }}
      >
        <Plus size={16} />
        <Text marginLeft="4px" fontSize="12px">
          Add Liquidity
        </Text>
      </ButtonLight>
    </Flex>
  )

  return (
    <FlipCard flip={showDetail}>
      {farm && <FarmCalculator farm={farm} onUpdate={setFarmAPR} />}
      {!showDetail && (
        <FlipCardFront>
          {poolTitle}
          <Flex marginTop="0.75rem" fontSize="12px" color={theme.subText} width="max-content" fontWeight="500">
            <Flex color={theme.subText} sx={{ gap: '4px' }}>
              <CopyHelper toCopy={poolData.id} />
              {shortenPoolAddress}
            </Flex>

            <Flex
              marginLeft="12px"
              onClick={() => {
                setSharedPoolId(poolData.id)
              }}
              sx={{
                cursor: 'pointer',
                gap: '4px',
              }}
              role="button"
              color={theme.subText}
            >
              <Share2 size="14px" color={theme.subText} />
              <Trans>Share</Trans>
            </Flex>
          </Flex>

          <Text
            width="fit-content"
            lineHeight="16px"
            fontSize="12px"
            fontWeight="500"
            color={theme.subText}
            sx={{ borderBottom: `1px dashed ${theme.border}` }}
            marginTop="16px"
          >
            <MouseoverTooltip
              width="fit-content"
              placement="right"
              text={
                !isFarmingPool ? (
                  <Trans>Estimated return from trading fees if you participate in the pool</Trans>
                ) : (
                  <APRTooltipContent farmAPR={farmAPR || 0} poolAPR={Number(oneYearFL)} />
                )
              }
            >
              <Trans>Avg APR</Trans>
            </MouseoverTooltip>
          </Text>

          <Flex justifyContent="space-between" alignItems="center">
            <Text fontSize="28px" fontWeight="500" color={theme.apr}>
              {((farmAPR || 0) + Number(oneYearFL)).toFixed(2)}%
            </Text>

            <StyledLink href={DMM_ANALYTICS_URL[chainId] + '/pool/' + poolData.id}>
              <Flex alignItems="flex-end">
                <BarChart2 size="16px" color={theme.subText} />
                <Text fontSize="12px" fontWeight="500" marginLeft="4px" color={theme.subText}>
                  Pool Analytics ↗
                </Text>
              </Flex>
            </StyledLink>
          </Flex>

          <Flex justifyContent="space-between" color={theme.subText} fontSize="12px" fontWeight="500" marginTop="1rem">
            <Text>
              <Trans>Volume (24H)</Trans>
            </Text>
            <Text>
              <Trans>Fees (24H)</Trans>
            </Text>
          </Flex>

          <Flex justifyContent="space-between" fontSize="16px" fontWeight="500" marginTop="0.25rem" marginBottom="1rem">
            <Text>{formattedNum(volume, true)}</Text>
            <Text>{formattedNum(fee24H, true)}</Text>
          </Flex>

          <Divider />

          <Box
            sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}
            color={theme.subText}
            fontSize="12px"
            fontWeight="500"
            marginTop="1rem"
          >
            <Text>TVL</Text>
            <Text textAlign="center">AMP Liquidity</Text>
            <Text textAlign="end">My Liquidity</Text>
          </Box>

          <Box
            sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}
            fontSize="16px"
            fontWeight="500"
            marginTop="0.25rem"
          >
            <Text>{formattedNum(poolData.reserveUSD, true)}</Text>
            <Text textAlign="center">{ampLiquidity}</Text>
            <Text textAlign="end">{myLiquidity ? getMyLiquidity(myLiquidity) : '-'}</Text>
          </Box>

          {buttonGroup}
          <Flex
            justifyContent="center"
            alignItems="center"
            marginTop="auto"
            paddingTop="16px"
            fontSize="12px"
            fontWeight="500"
            role="button"
            color={theme.subText}
            sx={{ cursor: 'pointer' }}
            onClick={() => setShowDetail(true)}
          >
            <Text as="span" style={{ transform: 'rotate(90deg)' }}>
              <SwapIcon />
            </Text>
            <Text marginLeft="4px">
              <Trans>View Pool Details</Trans>
            </Text>
          </Flex>
        </FlipCardFront>
      )}

      {showDetail && (
        <FlipCardBack>
          {poolTitle}
          <TokenRatioContainer>
            <ProgressWrapper>
              <Progress value={percentToken0} />
            </ProgressWrapper>
            <TokenRatioGrid>
              <CurrencyLogo currency={currency0} size="32px" />
              <Flex flexDirection="column">
                <TokenRatioName>{poolData.token0.symbol}</TokenRatioName>
                <TokenRatioPercent>{percentToken0}%</TokenRatioPercent>
              </Flex>
              <Flex flexDirection="column" alignItems="flex-end">
                <TokenRatioName>{poolData.token1.symbol}</TokenRatioName>
                <TokenRatioPercent>{percentToken1}%</TokenRatioPercent>
              </Flex>
              <CurrencyLogo currency={currency1} size="32px" />
            </TokenRatioGrid>
          </TokenRatioContainer>

          <Flex justifyContent="space-between" color={theme.subText} fontSize="12px" fontWeight="500" marginTop="1rem">
            <Text>
              {poolData.token0.symbol}/{poolData.token1.symbol}
            </Text>
            <Text>
              {poolData.token1.symbol}/{poolData.token0.symbol}
            </Text>
          </Flex>

          <Flex justifyContent="space-between" fontSize="16px" fontWeight="500" marginTop="0.25rem">
            <Text>
              {formatPriceMin(priceRangeCalcBySubgraphPool(poolData)[0][0])} -{' '}
              {formatPriceMax(priceRangeCalcBySubgraphPool(poolData)[0][1])}
            </Text>
            <Text>
              {formatPriceMin(priceRangeCalcBySubgraphPool(poolData)[1][0])} -{' '}
              {formatPriceMax(priceRangeCalcBySubgraphPool(poolData)[1][1])}
            </Text>
          </Flex>

          <Flex justifyContent="space-between" color={theme.subText} fontSize="12px" fontWeight="500" marginTop="1rem">
            <Text>{poolData.fee ? <Trans>Fee</Trans> : <Trans>Fee Range</Trans>}</Text>
            <Text>AMP Liquidity</Text>
          </Flex>

          <Flex justifyContent="space-between" fontSize="16px" fontWeight="500" marginTop="0.25rem">
            <Text>
              {poolData.fee
                ? factories?.[0]?.result !== undefined
                  ? poolData.fee / (isNewStaticFeePool ? 1000 : 100) + '%'
                  : ''
                : feeRangeCalc(+amp.toSignificant(5))}
            </Text>
            <Text>{ampLiquidity}</Text>
          </Flex>

          <Flex justifyContent="space-between" color={theme.subText} fontSize="12px" fontWeight="500" marginTop="1rem">
            <Text>
              <Trans>My Share of Pool</Trans>
            </Text>
            <Text>
              <Trans>My Liquidity</Trans>
            </Text>
          </Flex>

          <Flex justifyContent="space-between" fontSize="16px" fontWeight="500" marginTop="0.25rem">
            <Text>
              {yourShareOfPool
                ? yourShareOfPool.equalTo('0')
                  ? '0%'
                  : yourShareOfPool.lessThan(ONE_BIPS)
                  ? '<0.01%'
                  : `${yourShareOfPool.toFixed(2)}%`
                : '-'}
            </Text>
            <Text>
              {myLiquidity ? (
                <HoverDropdown
                  padding="0"
                  content={getMyLiquidity(myLiquidity)}
                  dropdownContent={
                    <Flex flexDirection="column" sx={{ gap: '8px' }} fontSize="14px">
                      <Flex alignItems="center" sx={{ gap: '4px' }}>
                        <CurrencyLogo currency={currency0} size="16px" />
                        {pooledToken0?.toSignificant(6)} {currency0.symbol}
                      </Flex>
                      <Flex alignItems="center" sx={{ gap: '4px' }}>
                        <CurrencyLogo currency={currency1} size="16px" />
                        {pooledToken1?.toSignificant(6)} {currency1.symbol}
                      </Flex>
                    </Flex>
                  }
                />
              ) : (
                '-'
              )}
            </Text>
          </Flex>

          {buttonGroup}

          <Flex
            justifyContent="center"
            alignItems="center"
            marginTop="auto"
            paddingTop="16px"
            fontSize="12px"
            fontWeight="500"
            role="button"
            color={theme.subText}
            sx={{ cursor: 'pointer' }}
            onClick={() => setShowDetail(false)}
          >
            <Text as="span" style={{ transform: 'rotate(90deg)' }}>
              <SwapIcon />
            </Text>
            <Text marginLeft="4px">
              <Trans>View Pool</Trans>
            </Text>
          </Flex>
        </FlipCardBack>
      )}
    </FlipCard>
  )
}

const FarmCalculator = ({ farm, onUpdate }: { farm: Farm; onUpdate: (value: number) => void }) => {
  const lpTokenRatio = new Fraction(
    farm.totalStake.toString(),
    JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18)),
  ).divide(
    new Fraction(parseUnits(farm.totalSupply, 18).toString(), JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18))),
  )
  const liquidity = parseFloat(lpTokenRatio.toSignificant(6)) * parseFloat(farm.reserveUSD)
  const farmAPR = useFarmApr(farm, liquidity.toString())

  useEffect(() => {
    onUpdate(farmAPR)
  }, [farmAPR, onUpdate])

  return null
}

export default ItemCard
