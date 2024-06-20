import { CurrencyAmount, Token } from '@ubeswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { useRomulusDelegateContract, useUbeTokenContract } from 'hooks/useContract'
import JSBI from 'jsbi'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { useMemo } from 'react'

import { UBE } from 'constants/tokens'

export const useRomulus = (): {
  tokenDelegate: string | undefined
  quorumVotes: CurrencyAmount<Token> | undefined
  proposalThreshold: CurrencyAmount<Token> | undefined
} => {
  const { account, chainId } = useWeb3React()
  const ube = chainId ? UBE[chainId] : undefined

  const romulus = useRomulusDelegateContract()
  const quorumVotes = useSingleCallResult(romulus, 'quorumVotes', []).result?.[0]
  const proposalThreshold = useSingleCallResult(romulus, 'proposalThreshold', []).result?.[0]
  const poofContract = useUbeTokenContract()
  const tokenDelegate = useSingleCallResult(poofContract, 'delegates', [account ?? undefined]).result?.[0]
  return useMemo(() => {
    return {
      tokenDelegate,
      quorumVotes:
        ube && quorumVotes ? CurrencyAmount.fromRawAmount(ube, JSBI.BigInt(quorumVotes.toString())) : undefined,
      proposalThreshold:
        ube && proposalThreshold
          ? CurrencyAmount.fromRawAmount(ube, JSBI.BigInt(proposalThreshold.toString()))
          : undefined,
    }
  }, [tokenDelegate, quorumVotes, proposalThreshold, ube])
}
