import { FeeAmount, Position } from '@kyberswap/ks-sdk-elastic'
import { t } from '@lingui/macro'
import { BigNumber } from 'ethers'
import { rgba } from 'polished'
import { Link } from 'react-router-dom'
import { Flex, Text } from 'rebass'

import RangeBadge from 'components/Badge/RangeBadge'
import { AutoColumn } from 'components/Column'
import Copy from 'components/Copy'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { MoneyBag } from 'components/Icons'
import { MouseoverTooltip } from 'components/Tooltip'
import { ELASTIC_BASE_FEE_UNIT } from 'constants/index'
import useProAmmPoolInfo from 'hooks/useProAmmPoolInfo'
import useTheme from 'hooks/useTheme'
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
              {isFarmActive && (
                <MouseoverTooltip noArrow placement="top" text={t`Available for yield farming. Click to go to Farm`}>
                  <Link to={`/farms?tab=elastic&type=active&search=${poolAddress}`}>
                    <Flex
                      width={24}
                      height={24}
                      justifyContent="center"
                      alignItems={'center'}
                      sx={{
                        background: rgba(theme.apr, 0.2),
                        borderRadius: '999px',
                      }}
                    >
                      <MoneyBag size={16} color={theme.apr} />
                    </Flex>
                  </Link>
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
