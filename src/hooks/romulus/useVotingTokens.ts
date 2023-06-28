import { useCelo } from '@celo/react-celo'
import { ChainId as UbeswapChainId, JSBI, TokenAmount } from '@ubeswap/sdk'
import { BigNumber } from 'ethers'
import { usePoofTokenContract } from 'hooks/useContract'
import { useMemo } from 'react'
import { useSingleCallResult } from 'state/multicall/hooks'

import { UBE, ubeGovernanceAddresses, ZERO_ADDRESS } from '../../constants'
import { useRomulusInfo } from '../../utils/useRomulusInfo'

const initialVotingTokens = {
  balance: undefined,
  releaseBalance: undefined,
  votingPower: undefined,
  releaseVotingPower: undefined,
}

type VotingInfo = {
  balance: TokenAmount | undefined
  releaseBalance: TokenAmount | undefined
  votingPower: TokenAmount | undefined
  releaseVotingPower: TokenAmount | undefined
}

export const useVotingTokens = (blockNumber: BigNumber | number): VotingInfo => {
  const { address, network } = useCelo()
  const chainId = network.chainId as UbeswapChainId
  const romulusAddress = chainId ? ubeGovernanceAddresses[chainId] : undefined
  const ube = chainId ? UBE[chainId as unknown as UbeswapChainId] : undefined
  const { tokenAddress, releaseTokenAddress } = useRomulusInfo(romulusAddress)
  const poofContract = usePoofTokenContract(tokenAddress)
  const releaseToken = usePoofTokenContract(releaseTokenAddress !== ZERO_ADDRESS ? releaseTokenAddress : undefined)
  const balance = useSingleCallResult(poofContract, 'balanceOf', [address ?? undefined]).result?.[0]
  const votingPower = useSingleCallResult(poofContract, 'getPriorVotes', [address ?? undefined, blockNumber])
    .result?.[0]
  const releaseBalance = useSingleCallResult(releaseToken, 'balanceOf', [address ?? undefined]).result?.[0]
  const releaseVotingPower = useSingleCallResult(releaseToken, 'getPriorVotes', [address ?? undefined, blockNumber])
    .result?.[0]
  return useMemo(() => {
    if (!address || !romulusAddress || !ube) {
      return initialVotingTokens
    }
    const votingInfo: VotingInfo = initialVotingTokens
    votingInfo.balance = balance ? new TokenAmount(ube, JSBI.BigInt(balance.toString())) : undefined
    votingInfo.votingPower = votingPower ? new TokenAmount(ube, JSBI.BigInt(votingPower.toString())) : undefined
    votingInfo.releaseBalance = releaseBalance
      ? new TokenAmount(ube, JSBI.BigInt(releaseBalance.toString()))
      : undefined
    votingInfo.releaseVotingPower = releaseVotingPower
      ? new TokenAmount(ube, JSBI.BigInt(releaseVotingPower.toString()))
      : undefined
    return votingInfo
  }, [address, balance, releaseBalance, releaseVotingPower, romulusAddress, ube, votingPower])
}
