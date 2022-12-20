import { ChainId, Fraction } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import JSBI from 'jsbi'
import { rgba } from 'polished'
import React, { CSSProperties, useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp, Info, Minus, Plus, Share2 } from 'react-feather'
import { useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { Flex } from 'rebass'

import { ButtonEmpty } from 'components/Button'
import CopyHelper from 'components/Copy'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { MoneyBag } from 'components/Icons'
import Loader from 'components/Loader'
import {
  AMPLiquidityAndTVLContainer,
  AddressAndAMPContainer,
  AddressWrapper,
  ButtonWrapper,
  ChevronContainer,
  DataText,
  ListItemGroupContainer,
  PoolAddressContainer,
  TableRow,
  TextAMP,
  TextAMPLiquidity,
  TextShowMorePools,
  TextTVL,
  TextTokenPair,
  TokenPairContainer,
} from 'components/PoolList/styled'
import { MouseoverTooltip } from 'components/Tooltip'
import { ClassicFarmingPoolAPRCell } from 'components/YieldPools/FarmingPoolAPRCell'
import { MAX_ALLOW_APY } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { IconWrapper } from 'pages/Pools/styleds'
import { usePoolDetailModalToggle, useToggleEthPowAckModal } from 'state/application/hooks'
import { useActiveAndUniqueFarmsData } from 'state/farms/hooks'
import { setSelectedPool } from 'state/pools/actions'
import { SubgraphPoolData, UserLiquidityPosition, useSharedPoolIdManager, useUrlOnEthPowAck } from 'state/pools/hooks'
import { formattedNum, shortenAddress } from 'utils'
import { currencyId } from 'utils/currencyId'
import { getMyLiquidity, getTradingFeeAPR, parseSubgraphPoolData } from 'utils/dmm'

export interface ListItemGroupProps {
  sortedFilteredSubgraphPoolsObject: Map<string, SubgraphPoolData[]>
  poolData: SubgraphPoolData
  userLiquidityPositions: { [key: string]: UserLiquidityPosition }
  expandedPoolKey: string | undefined
  setExpandedPoolKey: React.Dispatch<React.SetStateAction<string | undefined>>
}

export interface ListItemProps {
  poolData: SubgraphPoolData
  myLiquidity: UserLiquidityPosition | undefined
  isShowExpandedPools: boolean
  isFirstPoolInGroup: boolean
  isDisableShowTwoPools: boolean
  style?: CSSProperties
}

const ListItem = ({
  sortedFilteredSubgraphPoolsObject,
  poolData,
  userLiquidityPositions,
  expandedPoolKey,
  setExpandedPoolKey,
}: ListItemGroupProps) => {
  const poolKey = poolData.token0.id + '-' + poolData.token1.id

  const isShowTwoPools = poolKey === expandedPoolKey

  const [isShowAllPools, setIsShowAllPools] = useState(false)

  const expandedPools = sortedFilteredSubgraphPoolsObject.get(poolKey) ?? []

  const renderPools = isShowTwoPools ? (isShowAllPools ? expandedPools : expandedPools.slice(0, 2)) : [poolData]

  const isDisableShowTwoPools = expandedPools.length <= 1
  const isDisableShowAllPools = expandedPools.length <= 2

  const onUpdateExpandedPoolKey = () => {
    if (isDisableShowTwoPools) return
    setExpandedPoolKey(prev => (prev === poolKey ? '' : poolKey))
  }

  const onShowAllExpandedPools = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation()
    if (isDisableShowAllPools) return
    setIsShowAllPools(prev => !prev)
  }

  return (
    <ListItemGroupContainer
      onClick={onUpdateExpandedPoolKey}
      isDisableShowTwoPools={isDisableShowTwoPools}
      isShowExpandedPools={isShowTwoPools}
    >
      {renderPools.map((poolData, index) => (
        <ListItemGroup
          key={poolData.id}
          poolData={poolData}
          myLiquidity={userLiquidityPositions[poolData.id]}
          isShowExpandedPools={isShowTwoPools}
          isFirstPoolInGroup={index === 0}
          isDisableShowTwoPools={isDisableShowTwoPools}
        />
      ))}
      {isShowTwoPools && (
        <TableRow isShowExpandedPools={isShowTwoPools} onClick={onShowAllExpandedPools} style={{ padding: '0' }}>
          <TextShowMorePools disabled={isDisableShowAllPools}>
            {isDisableShowAllPools || !isShowAllPools ? <Trans>Show more pools</Trans> : <Trans>Show less pools</Trans>}
          </TextShowMorePools>
        </TableRow>
      )}
    </ListItemGroupContainer>
  )
}

const ListItemGroup = ({
  poolData,
  myLiquidity,
  isShowExpandedPools,
  isFirstPoolInGroup,
  isDisableShowTwoPools,
}: ListItemProps) => {
  const { chainId } = useActiveWeb3React()
  const dispatch = useDispatch()
  const togglePoolDetailModal = usePoolDetailModalToggle()

  const amp = new Fraction(poolData.amp).divide(JSBI.BigInt(10000))

  const navigate = useNavigate()
  const [, setUrlOnEthPoWAck] = useUrlOnEthPowAck()
  const toggleEthPowAckModal = useToggleEthPowAckModal()

  const { data: uniqueAndActiveFarms } = useActiveAndUniqueFarmsData()
  const farm = uniqueAndActiveFarms.find(f => f.id.toLowerCase() === poolData.id.toLowerCase())

  const isFarmingPool = !!farm

  // Shorten address with 0x + 3 characters at start and end
  const shortenPoolAddress = shortenAddress(chainId, poolData.id, 3)
  const { currency0, currency1, reserve0, virtualReserve0, reserve1, virtualReserve1 } = parseSubgraphPoolData(
    poolData,
    chainId,
  )
  const realPercentToken0 =
    reserve0 && virtualReserve0 && reserve1 && virtualReserve1
      ? reserve0.asFraction
          .divide(virtualReserve0)
          .multiply('100')
          .divide(reserve0.divide(virtualReserve0).asFraction.add(reserve1.divide(virtualReserve1).asFraction))
      : new Fraction('50')
  const realPercentToken1 = new Fraction('100').subtract(realPercentToken0)
  const isWarning = realPercentToken0.lessThan('10') || realPercentToken1.lessThan('10')
  const volume = poolData.oneDayVolumeUSD ? poolData.oneDayVolumeUSD : poolData.oneDayVolumeUntracked

  const fee24H = poolData.oneDayFeeUSD ? poolData.oneDayFeeUSD : poolData.oneDayFeeUntracked

  const oneYearFL = getTradingFeeAPR(poolData.reserveUSD, fee24H).toFixed(2)

  const ampLiquidity = formattedNum(`${parseFloat(amp.toSignificant(5)) * parseFloat(poolData.reserveUSD)}`, true)
  const totalValueLocked = formattedNum(`${parseFloat(poolData.reserveUSD)}`, true)

  const onTogglePoolDetailModal = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.stopPropagation()
    dispatch(
      setSelectedPool({
        poolData,
        myLiquidity,
      }),
    )
    togglePoolDetailModal()
  }

  const theme = useTheme()

  const [, setSharedPoolId] = useSharedPoolIdManager()

  const renderAPR = () => {
    if (!poolData) {
      return <Loader />
    }

    if (Number(oneYearFL) > MAX_ALLOW_APY) {
      return '--'
    }

    if (isFarmingPool) {
      return <ClassicFarmingPoolAPRCell poolAPR={Number(oneYearFL)} farm={farm} />
    }

    return (
      <Flex
        sx={{
          alignItems: 'center',
          paddingRight: '20px', // to make all the APR numbers vertically align
        }}
      >
        {oneYearFL}%
      </Flex>
    )
  }

  return (
    <>
      <TableRow isShowExpandedPools={isShowExpandedPools} isShowBorderBottom={isShowExpandedPools} onClick={() => null}>
        <DataText>
          {isFirstPoolInGroup && (
            <Flex>
              <TokenPairContainer>
                <DoubleCurrencyLogo currency0={currency0} currency1={currency1} />
                <TextTokenPair>
                  {poolData.token0.symbol} - {poolData.token1.symbol}
                </TextTokenPair>
              </TokenPairContainer>
            </Flex>
          )}
        </DataText>

        <DataText style={{ position: 'relative' }}>
          <Flex
            sx={{
              position: 'absolute',
              top: '-1px',
              left: '-28px',
              minWidth: '18px', // to match width of IconWrapper
              flexDirection: 'column',
              rowGap: '4px',
              alignItems: 'center',
            }}
          >
            {isFarmingPool && (
              <MouseoverTooltip placement="top" text={t`Available for yield farming`}>
                <Link to={`/farms?tab=classic&type=active&search=${poolData.id}`}>
                  <MoneyBag size={16} color={theme.apr} />
                </Link>
              </MouseoverTooltip>
            )}
            {isWarning && (
              <MouseoverTooltip text={`One token is close to 0% in the pool ratio. Pool might go inactive`}>
                <IconWrapper style={{ background: theme.warning, marginTop: isFarmingPool ? '4px' : 0 }}>
                  <AlertTriangle color={theme.textReverse} size={12} />
                </IconWrapper>
              </MouseoverTooltip>
            )}
          </Flex>
          <PoolAddressContainer>
            <AddressAndAMPContainer>
              <AddressWrapper>
                {shortenPoolAddress}
                <CopyHelper toCopy={poolData.id} />
              </AddressWrapper>
              <TextAMP>AMP = {formattedNum(amp.toSignificant(5))}</TextAMP>
            </AddressAndAMPContainer>
          </PoolAddressContainer>
        </DataText>
        <DataText>
          {!poolData ? (
            <Loader />
          ) : (
            <AMPLiquidityAndTVLContainer>
              <TextAMPLiquidity>{ampLiquidity}</TextAMPLiquidity>
              <TextTVL>{totalValueLocked}</TextTVL>
            </AMPLiquidityAndTVLContainer>
          )}
        </DataText>
        <DataText
          alignItems="flex-end"
          style={{
            color: theme.apr,
          }}
        >
          {renderAPR()}
        </DataText>
        <DataText alignItems="flex-end">{!poolData ? <Loader /> : formattedNum(volume, true)}</DataText>
        <DataText alignItems="flex-end">{!poolData ? <Loader /> : formattedNum(fee24H, true)}</DataText>
        <DataText alignItems="flex-end">{getMyLiquidity(myLiquidity)}</DataText>
        <ButtonWrapper style={{ marginRight: '-3px' }}>
          <ButtonEmpty
            padding="0"
            style={{
              background: rgba(theme.primary, 0.2),
              minWidth: '28px',
              minHeight: '28px',
              width: '28px',
              height: '28px',
            }}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation()

              const url = `/add/${currencyId(currency0, chainId)}/${currencyId(currency1, chainId)}/${poolData.id}`
              setUrlOnEthPoWAck(url)

              if (chainId === ChainId.ETHW) {
                toggleEthPowAckModal()
              } else {
                navigate(url)
              }
            }}
          >
            <Plus size={16} color={theme.primary} />
          </ButtonEmpty>
          {myLiquidity && myLiquidity.liquidityTokenBalance !== '0' && (
            <ButtonEmpty
              padding="0"
              as={Link}
              to={`/remove/${currencyId(currency0, chainId)}/${currencyId(currency1, chainId)}/${poolData.id}`}
              style={{
                background: rgba(theme.subText, 0.2),
                minWidth: '28px',
                minHeight: '28px',
                width: '28px',
                height: '28px',
              }}
            >
              <Minus size={16} />
            </ButtonEmpty>
          )}
          <ButtonEmpty
            padding="0"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation()
              setSharedPoolId(poolData.id)
            }}
            style={{
              background: rgba(theme.buttonBlack, 0.2),
              minWidth: '28px',
              minHeight: '28px',
              width: '28px',
              height: '28px',
            }}
          >
            <Share2 size="14px" color={theme.subText} />
          </ButtonEmpty>
          <ButtonEmpty
            padding="0"
            onClick={onTogglePoolDetailModal}
            style={{
              background: rgba(theme.buttonGray, 0.2),
              minWidth: '28px',
              minHeight: '28px',
              width: '28px',
              height: '28px',
            }}
          >
            <Info size="16px" color={theme.subText} />
          </ButtonEmpty>
          <ChevronContainer>
            {isFirstPoolInGroup && isShowExpandedPools && (
              <ChevronUp size={20} style={{ minWidth: '20px', minHeight: '20px' }} />
            )}
            {isFirstPoolInGroup && !isShowExpandedPools && (
              <ChevronDown
                size={20}
                style={{ minWidth: '20px', minHeight: '20px' }}
                color={isDisableShowTwoPools ? theme.buttonGray : theme.text}
              />
            )}
            {!isFirstPoolInGroup && <div style={{ visibility: 'hidden', minWidth: '20px', minHeight: '20px' }} />}
          </ChevronContainer>
        </ButtonWrapper>
      </TableRow>
    </>
  )
}
export default ListItem
