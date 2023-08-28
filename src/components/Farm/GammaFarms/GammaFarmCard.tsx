import { Token } from '@pollum-io/sdk-core'
import { formatNumber } from '@uniswap/conedison/format'
import CircleInfoIcon from 'assets/images/circleinfo.svg'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import TotalAPRTooltip from 'components/TotalAPRTooltip/TotalAPRTooltip'
import { useIsMobile } from 'nft/hooks'
import React, { useState } from 'react'
import { Box, ChevronDown, ChevronUp } from 'react-feather'
import { Link } from 'react-router-dom'

import GammaFarmCardDetails from './GammafarmCardDetails'

const GammaFarmCard: React.FC<{
  data: any
  rewardData: any
  token0: Token | null
  token1: Token | null
  pairData: any
}> = ({ data, rewardData, pairData, token0, token1 }) => {
  const rewards: any[] = rewardData && rewardData['rewarders'] ? Object.values(rewardData['rewarders']) : []
  const [showDetails, setShowDetails] = useState(false)

  const isMobile = useIsMobile()

  const farmAPR = rewardData && rewardData['apr'] ? Number(rewardData['apr']) : 0
  const poolAPR =
    data && data['returns'] && data['returns']['allTime'] && data['returns']['allTime']['feeApr']
      ? Number(data['returns']['allTime']['feeApr'])
      : 0

  return (
    <div style={{ width: '100%', borderRadius: 16 }} className={`bg-secondary1${showDetails ? ' border-primary' : ''}`}>
      <div style={{ padding: 1.5, display: 'flex', alignItems: 'center' }}>
        <Box width="90%" className="flex items-center">
          <Box width={isMobile ? (showDetails ? '100%' : '70%') : '30%'} className="flex items-center">
            {token0 && token1 && (
              <>
                <DoubleCurrencyLogo currency0={token0} currency1={token1} size={30} />
                <div style={{ marginLeft: '6px' }}>
                  <small className="weight-600">{`${token0.symbol}/${token1.symbol} (${pairData.title})`}</small>
                  <Box className="cursor-pointer">
                    <Link
                      to={`/pools?currency0=${token0.address}&currency1=${token1.address}`}
                      target="_blank"
                      className="no-decoration"
                    >
                      <small className="text-primary">getLP↗</small>
                    </Link>
                  </Box>
                </div>
              </>
            )}
          </Box>
          {!isMobile && (
            <>
              <Box width="20%" className="flex justify-between">
                {rewardData && <small className="weight-600">${formatNumber(rewardData['stakedAmountUSD'])}</small>}
              </Box>
              <Box width="30%">
                {rewards.map((reward, ind) => (
                  <div key={ind}>
                    {reward && Number(reward['rewardPerSecond']) > 0 && (
                      <small className="small weight-600">
                        {formatNumber(reward.rewardPerSecond * 3600 * 24)} {reward.rewardTokenSymbol} / day
                      </small>
                    )}
                  </div>
                ))}
              </Box>
            </>
          )}

          {(!isMobile || !showDetails) && (
            <Box width={isMobile ? '30%' : '20%'} className="flex items-center">
              <small className="text-success">{formatNumber((poolAPR + farmAPR) * 100)}%</small>
              <div style={{ marginLeft: 0.5, height: 16 }}>
                <TotalAPRTooltip farmAPR={farmAPR * 100} poolAPR={poolAPR * 100}>
                  <img src={CircleInfoIcon} alt="arrow up" />
                </TotalAPRTooltip>
              </div>
            </Box>
          )}
        </Box>

        <Box width="10%" className="flex justify-center">
          <Box
            className="flex items-center justify-center cursor-pointer text-primary"
            width={20}
            height={20}
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? <ChevronUp /> : <ChevronDown />}
          </Box>
        </Box>
      </div>
      {showDetails && <GammaFarmCardDetails data={data} pairData={pairData} rewardData={rewardData} />}
    </div>
  )
}

export default GammaFarmCard
