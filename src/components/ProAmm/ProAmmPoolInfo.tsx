import { FeeAmount, Position } from '@kyberswap/ks-sdk-elastic'
import { Trans, t } from '@lingui/macro'
import { BigNumber } from 'ethers'
import { Link } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import RangeBadge from 'components/Badge/RangeBadge'
import { AutoColumn } from 'components/Column'
import Copy from 'components/Copy'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { FarmingIcon } from 'components/Icons'
import { MouseoverTooltip } from 'components/Tooltip'
import { ELASTIC_BASE_FEE_UNIT } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useProAmmPoolInfo from 'hooks/useProAmmPoolInfo'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'
import { shortenAddress } from 'utils'
import { unwrappedToken } from 'utils/wrappedCurrency'

export default function ProAmmPoolInfo({
  isFarmActive,
  position,
  tokenId,
}: {
  isFarmActive?: boolean
  position: Position
  tokenId?: string
}) {
  const { chainId } = useActiveWeb3React()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
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
                <Link to={`/farms?tab=elastic&type=active&search=${poolAddress}`}>here</Link> to go to the farm.
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
        <Link to={`/farms?tab=elastic&type=active&search=${poolAddress}`}>
          <FarmingIcon />
        </Link>
      </MouseoverTooltip>
    )
  }

  return (
    <>
      {poolAddress && (
        <AutoColumn>
          <Flex alignItems="center" justifyContent="space-between">
            <Flex>
              <DoubleCurrencyLogo currency0={token0Shown} currency1={token1Shown} size={24} />
              <Text fontSize="20px" fontWeight="500">
                {token0Shown.symbol} - {token1Shown.symbol}
              </Text>
            </Flex>

            <Flex sx={{ gap: '8px' }}>
              {renderFarmIcon()}
              <RangeBadge removed={removed} inRange={!outOfRange} hideText />
            </Flex>
          </Flex>

          <Flex justifyContent="space-between" alignItems="center" marginTop="8px">
            <Flex alignItems="center" color={theme.subText} fontSize={12}>
              <Text fontSize="12px" fontWeight="500" color={theme.subText}>
                FEE = {(position?.pool.fee * 100) / ELASTIC_BASE_FEE_UNIT}% | {shortenAddress(chainId, poolAddress)}{' '}
              </Text>
              <Copy toCopy={poolAddress}></Copy>
            </Flex>
            {tokenId && (
              <Flex fontSize="12px" alignItems="center">
                <Text marginRight="4px" color={theme.subText}>
                  ID:
                </Text>{' '}
                {tokenId}
              </Flex>
            )}
          </Flex>
        </AutoColumn>
      )}
    </>
  )
}
