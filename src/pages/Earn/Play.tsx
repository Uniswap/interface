import React, { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components/macro'
import { useSingleCallResult, useSingleContractMultipleData } from 'state/multicall/hooks'
import { useMiniChef, usePairContract } from 'hooks/useContract'

import { useWeb3React } from '@web3-react/core'
import { useCurrencyBalance, useTokenBalance } from 'state/wallet/hooks'
import { CurrencyAmount, Token } from 'sdk-core/entities'
import { useToken } from 'hooks/Tokens'
import { DoubleCurrencyLogo } from 'components/DoubleLogo/DoubleCurrencyLogo.stories'
import { Link } from 'react-router-dom'
import StakingModal from 'components/earn/StakingModal'

export function Playground() {
  const { account } = useWeb3React()
  const pools = usePools()
  console.log('pools', pools)

  // const poolLength = useSingleCallResult(minichefContract, 'poolLength')
  // const realLength = poolLength.result?.[0]?.toNumber()
  // console.log('poolLength', poolLength, realLength)
  // const firstPool = useSingleCallResult(minichefContract, 'poolInfo', [0])

  const lpToken = new Token(9000, '0x390F68c5D47F8bd70C4322076204A40A43a0ed55', 9, 'LP TOKEN')
  const balance = useCurrencyBalance(account ?? undefined, lpToken)

  return (
    <div>
      <h1>Hi</h1>
      <span>Balance:{balance?.toSignificant(4)}</span>
      {pools.map((pool) => (
        <Pool key={pool.lpTokenAddress} lpTokenAddress={pool.lpTokenAddress!} poolId={pool.poolId} />
      ))}
    </div>
  )
}

function Pool({ lpTokenAddress, poolId }: { lpTokenAddress: string; poolId: number }) {
  const { token0, token1, lpBalance, lpToken } = usePairTokens(lpTokenAddress)
  const [showModal, setShowModal] = useState(false)
  const stakingInfo = useMemo(() => {
    return {
      tokens: [token0, token1] as [Token, Token],
      stakedAmount: lpToken ? CurrencyAmount.fromRawAmount(lpToken, 0) : undefined!,
      poolId,
      lpTokenAddress,
    }
  }, [lpToken, lpTokenAddress, poolId, token0, token1])
  // console.log('token0', token0)
  // console.log('token1', token1)
  // console.log('lpAmount', lpToken)
  // console.log('stakingInfo', stakingInfo)
  if (!token0 || !token1 || !stakingInfo.stakedAmount) {
    return null
  }
  // console.log(token0, token1)
  return (
    <div
      css={`
        display: grid;
        gap: 4px;
        grid-auto-flow: column;
        margin-top: 6px;
        margin-bottom: 6px;
      `}
    >
      <DoubleCurrencyLogo currency0={token0} currency1={token1} />
      <Link to={`/farm/${token0.address}/${token1.address}`}>
        <span>
          {token0.symbol}/{token1.symbol}
        </span>{' '}
      </Link>
      <button onClick={() => setShowModal(true)}>Show Modal</button>

      <StakingModal
        isOpen={showModal}
        onDismiss={() => setShowModal(false)}
        stakingInfo={stakingInfo}
        userLiquidityUnstaked={lpBalance}
      />
    </div>
  )
}

function usePairTokens(pairAddress: string) {
  const { account } = useWeb3React()
  const pairContract = usePairContract(pairAddress)
  const token0CallAddress = useSingleCallResult(pairContract, 'token0')
  const token1CallAddress = useSingleCallResult(pairContract, 'token1')
  const token0 = useToken(token0CallAddress.result?.[0])
  const token1 = useToken(token1CallAddress.result?.[0])
  const lpToken = useToken(pairAddress)
  const lpBalance = useTokenBalance(account ?? undefined, lpToken ?? undefined)

  return {
    token0,
    token1,
    lpToken,
    lpBalance,
  }
}

const hardcodedPoolIndexes = [0]

function usePools() {
  const minichefContract = useMiniChef()
  const poolInfos = useSingleContractMultipleData(
    minichefContract,
    'poolInfo',
    hardcodedPoolIndexes.map((id) => [id])
  )
  const lpTokens = useSingleContractMultipleData(
    minichefContract,
    'lpToken',
    hardcodedPoolIndexes.map((id) => [id])
  )

  const rewarders = useSingleContractMultipleData(
    minichefContract,
    'rewarder',
    hardcodedPoolIndexes.map((id) => [id])
  )
  const pools = useMemo(() => {
    return hardcodedPoolIndexes.map((poolId) => ({
      lpTokenAddress: lpTokens[poolId].result?.[0] as string | undefined,
      rewarderAddress: rewarders[poolId].result?.[0] as string | undefined,
      info: poolInfos[poolId].result,
      poolId,
    }))
  }, [lpTokens, poolInfos, rewarders])
  return pools.filter((pool) => pool.lpTokenAddress)
}
