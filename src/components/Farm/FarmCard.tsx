import { Trans } from '@lingui/macro'
import { Currency } from '@pollum-io/sdk-core'
import { ExpandIcon } from 'components/AccountDrawer/MiniPortfolio/ExpandoRow'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { useIsMobile } from 'nft/hooks'
import { useState } from 'react'
import { Box } from 'rebass'
import { formatAPY, getAPYWithFee } from 'utils/farmUtils'
import { unwrappedToken } from 'utils/unwrappedToken'

import { DualStakingInfo, StakingInfo } from './constants'

export default function FarmCard({
  stakingInfo,
  stakingAPY,
  isLPFarm,
}: {
  stakingInfo: StakingInfo | DualStakingInfo
  stakingAPY: number
  isLPFarm?: boolean
}) {
  const isMobile = useIsMobile()
  const [isExpandCard, setExpandCard] = useState(false)

  const lpStakingInfo = stakingInfo as StakingInfo
  const dualStakingInfo = stakingInfo as DualStakingInfo

  const token0 = stakingInfo.tokens[0] as unknown as Currency
  const token1 = stakingInfo.tokens[1] as unknown as Currency

  const currency0 = unwrappedToken(token0)
  const currency1 = unwrappedToken(token1)

  // const stakedAmounts = getStakedAmountStakingInfo(stakingInfo)

  let apyWithFee: number | string = 0

  if (stakingAPY && stakingAPY > 0 && stakingInfo.perMonthReturnInRewards) {
    apyWithFee = formatAPY(getAPYWithFee(stakingInfo.perMonthReturnInRewards, stakingAPY))
  }

  const tvl = 0
  // // getTVLStaking(stakedAmounts?.totalStakedUSD, stakedAmounts?.totalStakedBase)

  const lpPoolRate = 0
  // getRewardRate(lpStakingInfo.totalRewardRate, lpStakingInfo.rewardToken)

  const dualPoolRateA = 0
  // getRewardRate(dualStakingInfo.totalRewardRateA, dualStakingInfo.rewardTokenA)
  const dualPoolRateB = 0
  // getRewardRate(dualStakingInfo.totalRewardRateB, dualStakingInfo.rewardTokenB)

  const earnedUSDStr = isLPFarm ? 0 : 1
  //  getEarnedUSDLPFarm(lpStakingInfo) : getEarnedUSDDualFarm(dualStakingInfo)

  const lpRewards = 321
  // lpStakingInfo.rewardTokenPrice * lpStakingInfo.rate
  const dualRewards = 123123
  //   dualStakingInfo.rateA * dualStakingInfo.rewardTokenAPrice +
  //   dualStakingInfo.rateB * dualStakingInfo.rewardTokenBPrice

  const renderPool = (width: number) => (
    <Box className="flex items-center" width={width}>
      <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={28} />
      <Box ml={1.5}>
        <small>
          {currency0.symbol} / {currency1.symbol} LP
        </small>
      </Box>
    </Box>
  )

  return (
    <Box
      className={`farmLPCard ${stakingInfo.sponsored ? 'farmSponsoredCard' : ''} ${
        isExpandCard ? 'highlightedCard' : ''
      }`}
    >
      {stakingInfo.sponsored && <Box className="farmSponsorTag">sponsored</Box>}
      <Box className="farmLPCardUp" onClick={() => setExpandCard(!isExpandCard)}>
        {isMobile ? (
          <>
            {renderPool(isExpandCard ? 0.95 : 0.7)}
            {!isExpandCard && (
              <Box width={0.25}>
                <Box className="flex items-center">
                  <span className="text-secondary">apy</span>
                  {/* <Box ml={0.5} height={16}>
                    <img src={CircleInfoIcon} alt={'arrow up'} />
                  </Box> */}
                </Box>
                <Box mt={0.5}>
                  <small className="text-success">{apyWithFee}%</small>
                </Box>
              </Box>
            )}
            <Box width={0.05} className="flex justify-end text-primary">
              <ExpandIcon $expanded={isExpandCard} />
            </Box>
          </>
        ) : (
          <>
            {renderPool(0.3)}
            <Box width={0.2} textAlign="center">
              <small>{tvl}</small>
            </Box>
            <Box width={0.25} textAlign="center">
              <p className="small">${(isLPFarm ? lpRewards : dualRewards).toLocaleString('us')} / day</p>
              {isLPFarm ? (
                <p className="small">{lpPoolRate}</p>
              ) : (
                <>
                  <p className="small">{dualPoolRateA}</p>
                  <p className="small">{dualPoolRateB}</p>
                </>
              )}
            </Box>
            <Box width={0.15} className="flex justify-center items-center">
              <small className="text-success">{apyWithFee}%</small>
              {/* <Box ml={0.5} height={16}>
                <img src={CircleInfoIcon} alt={'arrow up'} />
              </Box> */}
            </Box>
            <Box width={0.2} textAlign="right">
              <small>{earnedUSDStr}</small>
              {isLPFarm ? (
                <></>
              ) : (
                // <Box className="flex items-center justify-end">
                //   <CurrencyLogo currency={lpStakingInfo.rewardToken} size="16px" />
                //   {/* <small style={{ marginLeft: 5 }}> */}
                //   {formatTokenAmount(lpStakingInfo.earnedAmount)}
                //   &nbsp;{lpStakingInfo.rewardToken.symbol}
                //   {/* </small> */}
                // </Box>
                <>
                  <Box className="flex items-center justify-end">
                    <CurrencyLogo
                      currency={
                        undefined
                        // unwrappedToken(dualStakingInfo.rewardTokenA)
                      }
                      size="16px"
                    />
                    {/* <small style={{ marginLeft: 5 }}>
                      {formatTokenAmount(dualStakingInfo.earnedAmountA)}
                      &nbsp;{dualStakingInfo.rewardTokenA.symbol}
                    </small> */}
                  </Box>
                  <Box className="flex items-center justify-end">
                    <CurrencyLogo
                      currency={
                        undefined
                        // unwrappedToken(dualStakingInfo.rewardTokenB)
                      }
                      size="16px"
                    />
                    {/* <small style={{ marginLeft: 5 }}>
                      {formatTokenAmount(dualStakingInfo.earnedAmountB)}
                      &nbsp;{dualStakingInfo.rewardTokenB.symbol}
                    </small> */}
                  </Box>
                </>
              )}
            </Box>
          </>
        )}
      </Box>

      {/* {isExpandCard && <FarmCardDetails stakingInfo={stakingInfo} stakingAPY={stakingAPY} isLPFarm={isLPFarm} />} */}
      {stakingInfo.sponsored && stakingInfo.sponsorLink && (
        <Box className="farmSponsoredLink">
          <Trans
          // i18nKey="learnmoreproject"
          // components={{
          //   alink: <a href={stakingInfo.sponsorLink} rel="noreferrer" target="_blank" />,
          // }}
          />
        </Box>
      )}
    </Box>
  )
}
