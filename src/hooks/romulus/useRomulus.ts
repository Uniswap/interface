import { Address } from '@celo/contractkit'
import { useContractKit } from '@celo-tools/use-contractkit'
import { ChainId as UbeswapChainId, JSBI, TokenAmount } from '@ubeswap/sdk'
import { usePoofTokenContract } from 'hooks/useContract'
import { useMemo } from 'react'
import { useSingleCallResult } from 'state/multicall/hooks'

import { useRomulusInfo } from '../../utils/useRomulusInfo'
import { UBE } from './../../constants/tokens'

export const useRomulus = (
  romulusAddress: Address
): {
  tokenDelegate: string | undefined
  quorumVotes: TokenAmount | undefined
  proposalThreshold: TokenAmount | undefined
} => {
  const { address, network } = useContractKit()
  const chainId = network.chainId
  const ube = chainId ? UBE[chainId as unknown as UbeswapChainId] : undefined

  const { romulus, tokenAddress } = useRomulusInfo(romulusAddress as string)
  const quorumVotes = useSingleCallResult(romulus, 'quorumVotes', []).result?.[0]
  const proposalThreshold = useSingleCallResult(romulus, 'proposalThreshold', []).result?.[0]
  const poofContract = usePoofTokenContract(tokenAddress)
  const tokenDelegate = useSingleCallResult(poofContract, 'delegates', [address ?? undefined]).result?.[0]
  return useMemo(() => {
    return {
      tokenDelegate,
      quorumVotes: ube && quorumVotes ? new TokenAmount(ube, JSBI.BigInt(quorumVotes.toString())) : undefined,
      proposalThreshold:
        ube && proposalThreshold ? new TokenAmount(ube, JSBI.BigInt(proposalThreshold.toString())) : undefined,
    }
  }, [tokenDelegate, quorumVotes, proposalThreshold, ube])
}
