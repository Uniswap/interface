import { FeeAmount, Position } from '@kyberswap/ks-sdk-elastic'
import { Trans, t } from '@lingui/macro'
import { BigNumber } from 'ethers'
import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import RangeBadge from 'components/Badge/RangeBadge'
import { AutoColumn } from 'components/Column'
import Copy from 'components/Copy'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { FarmingIcon } from 'components/Icons'
import { MouseoverTooltip } from 'components/Tooltip'
import { FeeTag } from 'components/YieldPools/ElasticFarmGroup/styleds'
import { APP_PATHS, ELASTIC_BASE_FEE_UNIT } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useProAmmPoolInfo from 'hooks/useProAmmPoolInfo'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'
import { shortenAddress } from 'utils'
import { unwrappedToken } from 'utils/wrappedCurrency'

import { RotateSwapIcon } from './styles'

export default function ProAmmPoolInfo({
  isFarmActive,
  position,
  tokenId,
  narrow = false,
  rotatedProp,
  setRotatedProp,
  showRangeInfo = true,
}: {
  isFarmActive?: boolean
  position: Position
  tokenId?: string
  narrow?: boolean
  rotatedProp?: boolean
  setRotatedProp?: (rotated: boolean) => void
  showRangeInfo?: boolean
}) {
  const { networkInfo, chainId } = useActiveWeb3React()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const theme = useTheme()
  const poolAddress = useProAmmPoolInfo(position.pool.token0, position.pool.token1, position.pool.fee as FeeAmount)

  const removed = BigNumber.from(position.liquidity.toString()).eq(0)
  const outOfRange = position.pool.tickCurrent < position.tickLower || position.pool.tickCurrent >= position.tickUpper

  const token0Shown = unwrappedToken(position.pool.token0)
  const token1Shown = unwrappedToken(position.pool.token1)

  const renderFarmIcon = () => {
    if (!isFarmActive) {
      return null
    }

    if (upToSmall) {
      return (
        <MouseoverTooltip
          noArrow
          placement="top"
          text={
            <Text>
              <Trans>
                Available for yield farming. Click{' '}
                <Link to={`${APP_PATHS.FARMS}/${networkInfo.route}?tab=elastic&type=active&search=${poolAddress}`}>
                  here
                </Link>{' '}
                to go to the farm.
              </Trans>
            </Text>
          }
        >
          <FarmingIcon />
        </MouseoverTooltip>
      )
    }

    return (
      <MouseoverTooltip width="fit-content" placement="top" text={t`Available for yield farming`}>
        <Link to={`${APP_PATHS.FARMS}/${networkInfo.route}?tab=elastic&type=active&search=${poolAddress}`}>
          <FarmingIcon />
        </Link>
      </MouseoverTooltip>
    )
  }

  const [rotatedState, setRotatedState] = useState(false)
  const [rotated, setRotated] =
    typeof rotatedProp === 'boolean' && typeof setRotatedProp !== 'undefined'
      ? [rotatedProp, setRotatedProp]
      : [rotatedState, setRotatedState]
  const [tokenA, tokenB] = rotated ? [position.amount0, position.amount1] : [position.amount1, position.amount0]

  const onReversePrice: React.MouseEventHandler<HTMLSpanElement> = useCallback(
    e => {
      e.preventDefault()
      e.stopPropagation()
      setRotated(!rotated)
    },
    [rotated, setRotated],
  )

  return (
    <>
      {poolAddress && (
        <AutoColumn>
          <Flex
            alignItems={upToSmall ? undefined : 'center'}
            justifyContent="space-between"
            flexDirection={upToSmall ? 'column' : undefined}
            sx={{ gap: '8px' }}
          >
            <Flex alignItems="center">
              <DoubleCurrencyLogo currency0={token0Shown} currency1={token1Shown} size={20} />
              <Text fontSize="16px" fontWeight="500">
                {token0Shown.symbol} - {token1Shown.symbol}
              </Text>
              <FeeTag>FEE {(position?.pool.fee * 100) / ELASTIC_BASE_FEE_UNIT}% </FeeTag>
            </Flex>

            <Flex sx={{ gap: '8px' }}>
              {renderFarmIcon()}
              {showRangeInfo && <RangeBadge removed={removed} inRange={!outOfRange} hideText />}
            </Flex>
          </Flex>

          <Flex
            justifyContent="space-between"
            alignItems={upToExtraSmall ? 'flex-start' : 'center'}
            marginTop="8px"
            sx={{ gap: '8px' }}
            flexDirection={upToExtraSmall ? 'column' : 'row'}
          >
            <Flex alignItems="center" color={theme.subText} fontSize={12}>
              <Copy
                toCopy={poolAddress}
                text={
                  <Text fontSize="12px" fontWeight="500" color={theme.subText}>
                    {shortenAddress(chainId, poolAddress)}{' '}
                  </Text>
                }
              />
            </Flex>
            {showRangeInfo && !!tokenId ? (
              <Text fontSize="12px" marginRight="4px" color={theme.subText}>
                #{tokenId}
              </Text>
            ) : null}
            {narrow && (
              <Flex sx={{ gap: '4px' }}>
                <Text fontSize={12}>
                  <Trans>
                    <Flex>
                      <Text color={theme.subText}>Current Price:</Text>&nbsp;1 {tokenB.currency.symbol} ={' '}
                      {position.pool.priceOf(tokenB.currency).toSignificant(6)} {tokenA.currency.symbol}
                    </Flex>
                  </Trans>
                </Text>
                <span onClick={onReversePrice} style={{ cursor: 'pointer' }}>
                  <RotateSwapIcon rotated={rotated} size={12} />
                </span>
              </Flex>
            )}
          </Flex>
        </AutoColumn>
      )}
    </>
  )
}
