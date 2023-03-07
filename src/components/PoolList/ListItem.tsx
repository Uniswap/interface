import { ChainId, Fraction } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import JSBI from 'jsbi'
import { rgba } from 'polished'
import React from 'react'
import { AlertTriangle, Info, Minus, Plus, Share2 } from 'react-feather'
import { useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { Flex, Text } from 'rebass'

import { ButtonEmpty } from 'components/Button'
import CopyHelper from 'components/Copy'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { MoneyBag } from 'components/Icons'
import Loader from 'components/Loader'
import { AMPLiquidityAndTVLContainer, ButtonWrapper, DataText, TableRow, TextTVL } from 'components/PoolList/styled'
import { MouseoverTooltip } from 'components/Tooltip'
import { FeeTag } from 'components/YieldPools/ElasticFarmGroup/styleds'
import { ClassicFarmingPoolAPRCell } from 'components/YieldPools/FarmingPoolAPRCell'
import { APP_PATHS, MAX_ALLOW_APY } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { IconWrapper } from 'pages/Pools/styleds'
import { usePoolDetailModalToggle, useToggleEthPowAckModal } from 'state/application/hooks'
import { useActiveAndUniqueFarmsData } from 'state/farms/classic/hooks'
import { setSelectedPool } from 'state/pools/actions'
import { SubgraphPoolData, UserLiquidityPosition, useSharedPoolIdManager, useUrlOnEthPowAck } from 'state/pools/hooks'
import { formattedNum, shortenAddress } from 'utils'
import { currencyId } from 'utils/currencyId'
import { getMyLiquidity, getTradingFeeAPR, parseSubgraphPoolData } from 'utils/dmm'

interface ListItemGroupProps {
  poolData: SubgraphPoolData
  userLiquidityPositions: { [key: string]: UserLiquidityPosition }
}

const ListItem = ({ poolData, userLiquidityPositions }: ListItemGroupProps) => {
  const myLiquidity = userLiquidityPositions[poolData.id]

  const { chainId, networkInfo } = useActiveWeb3React()
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
    <TableRow>
      <DataText>
        <Flex alignItems="center">
          <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={20} />
          <Text fontSize="14px" fontWeight="500">
            {poolData.token0.symbol} - {poolData.token1.symbol}
          </Text>
          <FeeTag style={{ padding: '4px 6px' }}>AMP {formattedNum(amp.toSignificant(5))}</FeeTag>
          {isFarmingPool && (
            <MouseoverTooltip placement="top" text={t`Available for yield farming`}>
              <Link to={`${APP_PATHS.FARMS}/${networkInfo.route}?tab=classic&type=active&search=${poolData.id}`}>
                <IconWrapper style={{ marginLeft: '6px', background: theme.apr + '33', width: '20px', height: '20px' }}>
                  <MoneyBag size={12} color={theme.apr} />
                </IconWrapper>
              </Link>
            </MouseoverTooltip>
          )}
          {isWarning && (
            <MouseoverTooltip text={`One of the tokens in the pool is close to 0%. Pool might become inactive soon`}>
              <IconWrapper style={{ background: theme.warning, marginLeft: '6px' }}>
                <AlertTriangle color={theme.textReverse} size={12} />
              </IconWrapper>
            </MouseoverTooltip>
          )}
        </Flex>

        <Flex marginTop="8px" fontSize="12px" color={theme.subText} width="max-content" fontWeight="500">
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
      </DataText>

      <DataText>
        {!poolData ? (
          <Loader />
        ) : (
          <AMPLiquidityAndTVLContainer>
            <Text>{ampLiquidity}</Text>
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
              background: rgba(theme.red, 0.2),
              minWidth: '28px',
              minHeight: '28px',
              width: '28px',
              height: '28px',
            }}
          >
            <Minus size={16} color={theme.red} />
          </ButtonEmpty>
        )}
        <ButtonEmpty
          padding="0"
          onClick={onTogglePoolDetailModal}
          style={{
            background: rgba(theme.subText, 0.2),
            minWidth: '28px',
            minHeight: '28px',
            width: '28px',
            height: '28px',
          }}
        >
          <Info size="16px" color={theme.subText} />
        </ButtonEmpty>
      </ButtonWrapper>
    </TableRow>
  )
}
export default ListItem
