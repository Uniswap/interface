import { BigNumber } from '@ethersproject/bignumber'
import { CurrencyAmount, OLD_UBE_ROMULUS_ADDRESSES, Token } from '@ubeswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { UBE } from 'constants/tokens'
import { useUbeTokenContract } from 'hooks/useContract'
import JSBI from 'jsbi'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { useMemo } from 'react'
// import { useRomulusInfo } from '../../utils/useRomulusInfo'

const initialVotingTokens = {
  balance: undefined,
  releaseBalance: undefined,
  votingPower: undefined,
  releaseVotingPower: undefined,
}

type VotingInfo = {
  balance: CurrencyAmount<Token> | undefined
  releaseBalance: CurrencyAmount<Token> | undefined
  votingPower: CurrencyAmount<Token> | undefined
  releaseVotingPower: CurrencyAmount<Token> | undefined
}

export const useVotingTokens = (blockNumber: BigNumber | number): VotingInfo => {
  const { account, chainId } = useWeb3React()
  const romulusAddress = chainId ? OLD_UBE_ROMULUS_ADDRESSES[chainId] : undefined
  const ube = chainId ? UBE[chainId] : undefined
  // const { tokenAddress, releaseTokenAddress } = useRomulusInfo(romulusAddress)
  const ubeContract = useUbeTokenContract()
  // const releaseToken = useUbeTokenContract(releaseTokenAddress !== ZERO_ADDRESS ? releaseTokenAddress : undefined)
  const balance = useSingleCallResult(ubeContract, 'balanceOf', [account ?? undefined]).result?.[0]
  const votingPower = useSingleCallResult(ubeContract, 'getPriorVotes', [account ?? undefined, blockNumber]).result?.[0]
  // const releaseBalance = useSingleCallResult(releaseToken, 'balanceOf', [account ?? undefined]).result?.[0]
  // const releaseVotingPower = useSingleCallResult(releaseToken, 'getPriorVotes', [account ?? undefined, blockNumber]).result?.[0]
  return useMemo(() => {
    if (!account || !romulusAddress || !ube) {
      return initialVotingTokens
    }
    const votingInfo: VotingInfo = initialVotingTokens
    votingInfo.balance = balance ? CurrencyAmount.fromRawAmount(ube, JSBI.BigInt(balance.toString())) : undefined
    votingInfo.votingPower = votingPower
      ? CurrencyAmount.fromRawAmount(ube, JSBI.BigInt(votingPower.toString()))
      : undefined
    votingInfo.releaseBalance = CurrencyAmount.fromRawAmount(ube, JSBI.BigInt(0))
    votingInfo.releaseVotingPower = CurrencyAmount.fromRawAmount(ube, JSBI.BigInt(0))
    // votingInfo.releaseBalance = releaseBalance
    //   ? CurrencyAmount.fromRawAmount(ube, JSBI.BigInt(releaseBalance.toString()))
    //   : undefined
    // votingInfo.releaseVotingPower = releaseVotingPower
    //   ? CurrencyAmount.fromRawAmount(ube, JSBI.BigInt(releaseVotingPower.toString()))
    //   : undefined
    return votingInfo
  }, [account, balance, /*releaseBalance, releaseVotingPower,*/ romulusAddress, ube, votingPower])
}
