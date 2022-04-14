import React from 'react'

// import { CurrencyAmount, Token } from 'sdk-core/entities'

// import { DoubleCurrencyLogo } from 'components/DoubleLogo/DoubleCurrencyLogo.stories'
// import { Link } from 'react-router-dom'
// import StakingModal from 'components/farm/StakingModal'
// import UnstakingModal from 'components/farm/UnstakingModal'
// import { isTruthy } from 'utils/isTruthy'

import JSBI from 'jsbi'
// import CurrencyLogo from 'components/CurrencyLogo'
import { FarmTable, FarmTableRow } from 'components/farm/FarmTable'

import { MinichefRawPoolInfo, useCalculateAPR, usePairTokens, usePools, useRewardInfos } from 'state/farm/farm-hooks'
import useUSDCPrice from 'hooks/useUSDCPrice'

import styled from 'styled-components'
import { Tux } from '../../components/farm/TuxBanner'
import { FarmHeading } from '../../components/farm/FarmHeading'
import { HRDark } from '../../components/HR/HR'

const FarmListContainer = styled.div`
  max-width: 1080px;
  width: 100%;
`

export function FarmListPage() {
  const pools = usePools()

  return (
    <FarmListContainer>
      <Tux />
      <FarmHeading />
      {/* {pools.map((pool) => pool.lpTokenAddress && <Pool key={pool.lpTokenAddress} {...pool} />).filter(isTruthy)} */}
      <FarmTable>
        {pools.map((pool) => (
          <>
            <HRDark key={`hr-${pool.poolId}`} />
            <PoolRow key={pool.poolId} {...pool} />
          </>
        ))}
      </FarmTable>
    </FarmListContainer>
  )
}

type PoolProps = MinichefRawPoolInfo

function PoolRow({
  lpTokenAddress,
  poolId,
  // pendingAmount,
  rewarderAddress,
  // stakedRawAmount,
  poolEmissionAmount,
}: PoolProps) {
  const { totalPoolStaked, pair } = usePairTokens(lpTokenAddress)
  const USDPrice = useUSDCPrice(totalPoolStaked?.currency)
  const { rewardPerSecondAmount } = useRewardInfos(rewarderAddress)
  const primaryAPR = useCalculateAPR(poolEmissionAmount, totalPoolStaked)
  const secondaryAPR = useCalculateAPR(rewardPerSecondAmount, totalPoolStaked)
  const totalAPR = JSBI.add(primaryAPR || JSBI.BigInt(0), secondaryAPR || JSBI.BigInt(0))

  const valueOfTotalStakedAmountInUSDC = totalPoolStaked && USDPrice?.quote(totalPoolStaked)

  return (
    <>
      <FarmTableRow
        pair={pair ?? undefined}
        poolId={poolId}
        tlv={valueOfTotalStakedAmountInUSDC}
        totalLPStaked={totalPoolStaked}
        primaryEmissionPerSecond={poolEmissionAmount}
        secondaryEmissionPerSecond={rewardPerSecondAmount}
        totalAPR={totalAPR}
      />
    </>
  )
}

/*
function Pool({
  lpTokenAddress,
  poolId,
  pendingAmount,
  rewarderAddress,
  stakedRawAmount,
  poolEmissionAmount,
}: PoolProps) {
  const { token0, token1, availableLPAmount, lpToken, totalPoolStaked, pair } = usePairTokens(lpTokenAddress)
  const { pendingAmount: pendingRewardAmount } = useRewardInfos(rewarderAddress)
  const stakedAmount = useMemo(
    () => (lpToken ? CurrencyAmount.fromRawAmount(lpToken, stakedRawAmount) : undefined),
    [lpToken, stakedRawAmount]
  )

  // Just to match the API for the Modals
  const stakingInfo = useMemo(() => {
    return {
      poolId,
      tokens: [token0, token1] as [Token, Token],
      stakedAmount: stakedAmount!,
      earnedAmount: pendingAmount!,
      lpTokenAddress,
    }
  }, [lpTokenAddress, pendingAmount, poolId, stakedAmount, token0, token1])

  const [showModal, setShowModal] = useState(false)
  const [showUnstakeModal, setShowUnstakeModal] = useState(false)

  const apr = useCalculateAPR(poolEmissionAmount, totalPoolStaked)

  if (!token0 || !token1 || !stakedAmount) {
    return null
  }
  const weeklyTotalEmission = poolEmissionAmount?.multiply(JSBI.BigInt(60 * 60 * 24 * 7))

  return (
    <div
      css={`
        display: grid;
        gap: 4px;
        grid-auto-flow: row;
        margin-top: 6px;
        margin-bottom: 6px;
      `}
    >
      <h3>Pool: {poolId}</h3>
      <div
        css={`
          display: flex;
        `}
      >
        <DoubleCurrencyLogo currency0={token0} currency1={token1} />
        <Link to={`/farm/${poolId}`}>
          <span>
            {token0.symbol}/{token1.symbol}
          </span>{' '}
        </Link>
      </div>
      <br />
      <span>LP Balance: {availableLPAmount?.toSignificant(4)}</span>
      <br />
      <span>Staked LP: {stakedAmount.toSignificant(4)}</span> <br />
      <span>Pending Native Tokens: {pendingAmount?.toSignificant(4)}</span>
      <br />
      <span>
        Pending Reward Tokens: {pendingRewardAmount?.toSignificant(4)} ({pendingRewardAmount?.currency.symbol})
        <CurrencyLogo currency={pendingRewardAmount?.currency} />
      </span>
      <br />
      <span>
        Pool Emission: {weeklyTotalEmission?.toSignificant(4)} {poolEmissionAmount?.currency.symbol} / Week{' '}
      </span>
      <br />
      <span>APR: {JSBI.multiply(apr, JSBI.BigInt(100))}%</span>
      <button onClick={() => setShowModal(true)}>Deposit</button>
      <button onClick={() => setShowUnstakeModal(true)}>Withdraw</button>
      <StakingModal
        isOpen={showModal}
        onDismiss={() => setShowModal(false)}
        stakingInfo={stakingInfo}
        userLiquidityUnstaked={availableLPAmount}
      />
      {stakingInfo.earnedAmount && stakingInfo.stakedAmount && (
        <UnstakingModal
          isOpen={showUnstakeModal}
          onDismiss={() => setShowUnstakeModal(false)}
          stakingInfo={stakingInfo}
        />
      )}
    </div>
  )
}
*/
