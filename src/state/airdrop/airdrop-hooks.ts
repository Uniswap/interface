import { useAirdropContract } from 'hooks/useContract'
import { useActiveWeb3React } from 'hooks/web3'
import { useCallback, useMemo, useState } from 'react'
import { useSingleCallResult } from 'state/multicall/hooks'
import { useIsTransactionPending, useTransactionAdder } from 'state/transactions/hooks'
import _airdropData from './forFrontend.json'

export const AIRDROP_ENDDATE = new Date('June 24 2022')

type AirdropInfo = {
  amount: string
  index: number
  proof: string[]
}
const airdropData = _airdropData as Record<string, AirdropInfo>

export function useAirdrop() {
  const { account } = useActiveWeb3React()
  const airdropContract = useAirdropContract()
  const addTransaction = useTransactionAdder()
  const [isClaiming, setIsClaiming] = useState(false)
  const [didJustClaim, setDidJustClaim] = useState(false)
  const [txHash, setTxHash] = useState<string | undefined>()
  const isPending = useIsTransactionPending(txHash)

  const airdropInfo = useMemo(() => {
    if (!account) {
      return null
    }
    return airdropData[account.toLowerCase()] ?? null
  }, [account])

  const didClaimResponse = useSingleCallResult(airdropContract, 'redeemed', [airdropInfo?.index])
  console.log('didClaimResponse', didClaimResponse)

  const claim = useCallback(async () => {
    if (!airdropInfo || !account || !airdropContract) {
      return
    }
    if (isClaiming) {
      return
    }
    try {
      setIsClaiming(true)
      const response = await airdropContract.redeemPackage(
        airdropInfo.index,
        account,
        airdropInfo.amount,
        airdropInfo.proof
      )

      addTransaction(response, {
        summary: 'Claim Airdrop',
      })

      setTxHash(response.hash)
      setDidJustClaim(true)
    } catch (e: any) {
      console.error(e)
    } finally {
      setIsClaiming(false)
    }
  }, [account, addTransaction, airdropContract, airdropInfo, isClaiming])

  return {
    isEligable: Boolean(airdropInfo),
    loading: didClaimResponse.loading,
    didClaim: Boolean(didClaimResponse.result?.[0]),
    didJustClaim,
    isClaiming,
    isPending,
    claim,
  }
}
