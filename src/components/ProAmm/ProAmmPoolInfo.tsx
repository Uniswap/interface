import { FeeAmount, Position } from '@kyberswap/ks-sdk-elastic'
import Copy from 'components/Copy'
import { AutoColumn } from 'components/Column'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import React from 'react'
import { Flex, Text } from 'rebass'
import useTheme from 'hooks/useTheme'
import { shortenAddress } from 'utils'
import { BigNumber } from 'ethers'
import RangeBadge from 'components/Badge/RangeBadge'
import { unwrappedToken } from 'utils/wrappedCurrency'
import useProAmmPoolInfo from 'hooks/useProAmmPoolInfo'
import { ELASTIC_BASE_FEE_UNIT } from 'constants/index'

export default function ProAmmPoolInfo({ position, tokenId }: { position: Position; tokenId?: string }) {
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
            <RangeBadge removed={removed} inRange={!outOfRange} />
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
