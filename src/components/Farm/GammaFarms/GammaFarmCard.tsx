import { Token } from '@pollum-io/sdk-core'
import { formatNumber } from '@uniswap/conedison/format'
import { CallState } from '@uniswap/redux-multicall'
import { TokenList } from '@uniswap/token-lists'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import TotalAPRTooltip from 'components/TotalAPRTooltip/TotalAPRTooltip'
import { formatUnits } from 'ethers/lib/utils'
import { useToken } from 'hooks/Tokens'
import { useIsMobile } from 'nft/hooks'
import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, ChevronDown, ChevronUp } from 'react-feather'
import { Link } from 'react-router-dom'
import { Box } from 'rebass'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import styled, { useTheme } from 'styled-components/macro'

import { FarmPoolData, ONE_TOKEN, ZERO } from '../constants'
import { useApr, usePoolInfo, useTotalAllocationPoints } from '../utils'
import GammaFarmCardDetails from './GammafarmCardDetails'

const CardContainer = styled.div<{ showDetails: boolean }>`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  border-radius: 16px;
  background: ${({ theme }) => theme.backgroundSurface};
  border: 1px solid ${({ showDetails, theme }) => (showDetails ? theme.userThemeColor : 'none')};
`

interface GammaFarmProps {
  data?: FarmPoolData
  rewardData: {
    tvl: number
    rewardPerSecond: CallState
    rewardTokenAddress: CallState
  }
  token0:
    | Token
    | {
        token: WrappedTokenInfo
        list?: TokenList
      }
  token1:
    | Token
    | {
        token: WrappedTokenInfo
        list?: TokenList
      }
  pairData: any
}

export function GammaFarmCard({ data, rewardData, pairData, token0, token1 }: GammaFarmProps) {
  const [showDetails, setShowDetails] = useState(false)
  const theme = useTheme()
  const isMobile = useIsMobile()
  const rewardPerSecond = rewardData?.rewardPerSecond
  const rewardTokenAddress = rewardData?.rewardTokenAddress
  const totalAllocPoints = useTotalAllocationPoints()
  const poolInfo = usePoolInfo(pairData?.pid)
  const [farmAPR, setFarmAPR] = useState<number>(0)

  const rewardPerSecondResult = useMemo(() => {
    if (!rewardPerSecond.loading && rewardPerSecond?.result) {
      return rewardPerSecond.result[0]
    }
    return ZERO
  }, [rewardPerSecond.loading, rewardPerSecond?.result])

  const poolInfoResultAllocPoint = useMemo(() => {
    if (!poolInfo.loading && poolInfo?.result) {
      return poolInfo.result.allocPoint
    }
    return ZERO
  }, [poolInfo.loading, poolInfo?.result])

  const totalAllocPointValue = totalAllocPoints?.result?.[0] || ONE_TOKEN
  const poolRewardPerSecInPSYS = rewardPerSecondResult.mul(poolInfoResultAllocPoint).div(totalAllocPointValue)

  const apr = useApr(pairData?.pid, poolRewardPerSecInPSYS, rewardData?.tvl)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resolvedApr = await apr
        if (resolvedApr) setFarmAPR(resolvedApr)
      } catch (error) {
        console.error('Error fetching APR:', error)
      }
    }

    fetchData()
  }, [pairData, rewardPerSecond, rewardData, apr])

  const poolAPR =
    data && data.returns && data.returns.allTime && data.returns.allTime.feeApr
      ? Number(data.returns.allTime.feeApr)
      : 0
  const token = useToken(rewardTokenAddress?.result?.toString())
  const rewardsPerSecondBN =
    rewardPerSecond && !rewardPerSecond.loading && rewardPerSecond.result && rewardPerSecond.result.length > 0
      ? rewardPerSecond.result[0]
      : undefined

  const rewardsAmount = rewardsPerSecondBN ? formatUnits(rewardsPerSecondBN, 18) : '0'

  const getToken = (token: Token | { token: WrappedTokenInfo }): Token | WrappedTokenInfo => {
    return 'address' in token ? token : token.token
  }

  const tokenZero = getToken(token0)
  const tokenOne = getToken(token1)

  return (
    <CardContainer showDetails={showDetails}>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', height: '60px', alignItems: 'center' }}>
        <div
          style={{
            width: '90%',
            display: 'flex',
            justifyContent: 'space-evenly',
            alignItems: 'center',
            marginRight: '15px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {token0 && token1 && (
              <>
                <DoubleCurrencyLogo currency0={tokenZero} currency1={tokenOne} size={30} />
                <div style={{ marginLeft: '6px' }}>
                  <small className="weight-600">{`${tokenZero.symbol}/${tokenOne.symbol} (${pairData.title})`}</small>
                  <Box className="cursor-pointer">
                    <Link
                      to={`/add/${tokenZero.address}/${tokenOne.address}/${pairData.feerTier}`}
                      target="_blank"
                      style={{ textDecoration: 'none' }}
                    >
                      <small style={{ color: theme.accentActive }}>getLP↗</small>
                    </Link>
                  </Box>
                </div>
              </>
            )}
          </div>

          {!isMobile && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {rewardData?.tvl && <small style={{ fontWeight: 600 }}>${formatNumber(rewardData.tvl)}</small>}
              </div>
              <small style={{ fontWeight: 600 }}>
                {rewardsAmount &&
                  Number(rewardsAmount) > 0 &&
                  token &&
                  `${formatNumber(Number(rewardsAmount) * 3600 * 24)} ${token.symbol} / day`}
              </small>
            </>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <small style={{ color: theme.accentSuccess, fontWeight: 600 }}>
              {formatNumber((poolAPR + farmAPR) * 100)}%
            </small>
            <div style={{ marginLeft: '5px', alignItems: 'center' }}>
              <TotalAPRTooltip farmAPR={farmAPR * 100} poolAPR={poolAPR * 100}>
                <AlertCircle size={16} />
              </TotalAPRTooltip>
            </div>
          </div>
        </div>

        <div style={{ width: '10%', display: 'flex', justifyContent: 'center' }}>
          <Box
            className="flex items-center justify-center cursor-pointer text-primary"
            width={20}
            height={20}
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? <ChevronUp color={theme.accentActive} /> : <ChevronDown color={theme.accentActive} />}
          </Box>
        </div>
      </div>
      {showDetails && data && <GammaFarmCardDetails data={data} pairData={pairData} rewardData={rewardData} />}
    </CardContainer>
  )
}
