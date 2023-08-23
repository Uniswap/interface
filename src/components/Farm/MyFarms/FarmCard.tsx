import { ChainId } from '@pollum-io/smart-order-router'
import { formatNumber } from '@uniswap/conedison/format'
import RangeBadge from 'components/Badge/RangeBadge'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { useToken } from 'hooks/Tokens'
import { useIsMobile } from 'nft/hooks'
import React, { useMemo } from 'react'
import { Box } from 'rebass'
import { formatReward, useUSDCPricesFromAddresses } from 'utils/farmUtils'

interface FarmCardProps {
  el: any
  chainId: ChainId
  poolApr?: number
  farmApr?: number
}

export default function FarmCard({ el, poolApr, farmApr }: FarmCardProps) {
  // const { chainId } = useWeb3React()
  const isMobile = useIsMobile()

  // const tokenMap = useDefaultActiveTokens()
  const poolToken0 = el.pool.token0 as any
  const poolToken1 = el.pool.token1 as any
  const token0Address = poolToken0.id ?? poolToken0.address
  const token1Address = poolToken1.id ?? poolToken1.address

  const token0 = useToken(token0Address)

  const token1 = useToken(token1Address)

  const outOfRange: boolean =
    el.pool && el.tickLower && el.tickUpper
      ? Number(el.pool.tick) < el.tickLower || Number(el.pool.tick) >= el.tickUpper
      : false

  const rewardToken = el.eternalRewardToken
  const earned = el.eternalEarned
  const bonusEarned = el.eternalBonusEarned
  const bonusRewardToken = el.eternalBonusRewardToken

  const farmRewardToken = useToken(rewardToken.id)

  const HOPTokenAddress = '0xc5102fe9359fd9a28f877a67e36b0f050d81a3cc'

  const farmBonusRewardToken = useToken(
    el.pool && el.pool.id && el.pool.id.toLowerCase() === '0x0db644468cd5c664a354e31aa1f6dba1d1dead47'
      ? HOPTokenAddress
      : bonusRewardToken.id
  )

  const rewardTokenAddresses = useMemo(() => {
    const addresses = []
    if (rewardToken && rewardToken.id) addresses.push(rewardToken.id)
    if (bonusRewardToken && bonusRewardToken.id) addresses.push(bonusRewardToken.id)
    return addresses
  }, [bonusRewardToken, rewardToken])
  const rewardTokenUSDPrices = useUSDCPricesFromAddresses(rewardTokenAddresses)
  const rewardTokenPrice = rewardTokenUSDPrices?.find(
    (item) => rewardToken && rewardToken.id && item.address.toLowerCase() === rewardToken.id.toLowerCase()
  )
  const bonusRewardTokenPrice = rewardTokenUSDPrices?.find(
    (item) =>
      bonusRewardToken && bonusRewardToken.id && item.address.toLowerCase() === bonusRewardToken.id.toLowerCase()
  )

  const usdAmount =
    Number(earned) * (rewardTokenPrice ? rewardTokenPrice.price : 0) +
    Number(bonusEarned) * (bonusRewardTokenPrice ? bonusRewardTokenPrice.price : 0)

  return (
    <Box>
      <Box className="flex justify-between items-center flex-wrap ">
        {isMobile && (
          <Box mb={1}>
            <RangeBadge removed={false} inRange={!outOfRange} />
          </Box>
        )}

        <Box className="flex items-center flex-wrap" width={isMobile ? '100%' : '85%'}>
          <Box className="flex items-center" width={isMobile ? '100%' : '60%'} mb={isMobile ? 2 : 0}>
            <Box className="v3-tokenId-wrapper" mr={1}>
              <span>{el.id}</span>
            </Box>
            {token0 && token1 && <DoubleCurrencyLogo currency0={token0} currency1={token1} size={30} />}
            {token0 && token1 && (
              <Box ml="8px">
                <p className="small">{`${token0.symbol} / ${token1.symbol}`}</p>
                <a className="small" href={`/#/pool/${+el.id}`} rel="noopener noreferrer" target="_blank">
                  viewPosition
                </a>
              </Box>
            )}
            {!isMobile && (
              <Box ml={1}>
                <RangeBadge removed={false} inRange={!outOfRange} />
              </Box>
            )}
          </Box>

          {isMobile ? (
            <>
              <Box className="flex items-center justify-between" mb={2} width="100%">
                <small className="text-secondary">poolAPR</small>
                <small className="text-success">{poolApr ? formatNumber(poolApr) : '~'}%</small>
              </Box>
              <Box className="flex items-center justify-between" mb={2} width="100%">
                <small className="text-secondary">farmAPR</small>
                <small className="text-success">{farmApr ? formatNumber(farmApr) : '~'}%</small>
              </Box>
            </>
          ) : (
            <Box className="flex items-center" width="20%">
              <small className="text-success">{formatNumber((poolApr ?? 0) + (farmApr ?? 0))}%</small>
              <Box ml={0.5} height={16}>
                {/* <TotalAPRTooltip farmAPR={farmApr ?? 0} poolAPR={poolApr ?? 0}>
                  <img src={CircleInfoIcon} alt="info" />
                </TotalAPRTooltip> */}
              </Box>
            </Box>
          )}
          <Box className="flex items-center justify-between" mb={isMobile ? 2 : 0} width={isMobile ? '100%' : '20%'}>
            {isMobile && <small className="text-secondary">earnedRewards</small>}
            <Box textAlign={isMobile ? 'right' : 'left'}>
              <small className="weight-600">${formatNumber(usdAmount)}</small>
              <Box className={`flex items-center ${isMobile ? 'justify-end' : ''}`}>
                {farmRewardToken && <CurrencyLogo size="16px" currency={farmRewardToken} />}

                {rewardToken && (
                  <Box ml="6px">
                    <p className="caption">{`${formatReward(Number(earned))} ${rewardToken.symbol}`}</p>
                  </Box>
                )}
              </Box>
              <Box className={`flex items-center ${isMobile ? 'justify-end' : ''}`}>
                {farmBonusRewardToken && <CurrencyLogo size="16px" currency={farmBonusRewardToken} />}

                {bonusRewardToken && (
                  <Box ml="6px">
                    <p className="caption">{`${formatReward(Number(bonusEarned))} ${bonusRewardToken.symbol}`}</p>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Box>

        <Box className="flex items-center" width={isMobile ? '100%' : '15%'}>
          {/* <FarmStakeButtons el={el} /> */}
        </Box>
      </Box>
    </Box>
  )
}
