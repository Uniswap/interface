import { FeeAmount, Position } from '@kyberswap/ks-sdk-elastic'
import { t } from '@lingui/macro'
import { BigNumber } from 'ethers'
import React from 'react'
import { Flex, Text } from 'rebass'

import RangeBadge from 'components/Badge/RangeBadge'
import { AutoColumn } from 'components/Column'
import Copy from 'components/Copy'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import AgriCulture from 'components/Icons/AgriCulture'
import { MouseoverTooltip } from 'components/Tooltip'
import { ELASTIC_BASE_FEE_UNIT } from 'constants/index'
import useProAmmPoolInfo from 'hooks/useProAmmPoolInfo'
import useTheme from 'hooks/useTheme'
import { IconWrapper } from 'pages/Pools/styleds'
import { shortenAddress } from 'utils'
import { unwrappedToken } from 'utils/wrappedCurrency'

export default function ProAmmPoolInfo({
  farmAvailable,
  position,
  tokenId,
}: {
  farmAvailable?: boolean
  position: Position
  tokenId?: string
}) {
  const theme = useTheme()
  const poolAddress = useProAmmPoolInfo(position.pool.token0, position.pool.token1, position.pool.fee as FeeAmount)

  const removed = BigNumber.from(position.liquidity.toString()).eq(0)
  const outOfRange = position.pool.tickCurrent < position.tickLower || position.pool.tickCurrent >= position.tickUpper

  const token0Shown = unwrappedToken(position.pool.token0)
  const token1Shown = unwrappedToken(position.pool.token1)

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
              {farmAvailable && (
                <MouseoverTooltip text={t`Available for yield farming`}>
                  <IconWrapper style={{ width: '24px', height: '24px' }}>
                    <AgriCulture width={16} height={16} color={theme.textReverse} />
                  </IconWrapper>
                </MouseoverTooltip>
              )}
              <RangeBadge removed={removed} inRange={!outOfRange} hideText />
            </Flex>
          </Flex>

          <Flex justifyContent="space-between" alignItems="center" marginTop="8px">
            <Flex alignItems="center" color={theme.subText} fontSize={12}>
              <Text fontSize="12px" fontWeight="500" color={theme.subText}>
                FEE = {(position?.pool.fee * 100) / ELASTIC_BASE_FEE_UNIT}% | {shortenAddress(poolAddress)}{' '}
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
