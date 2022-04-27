import { useAirdropContract } from 'hooks/useContract'
import { useActiveWeb3React } from 'hooks/web3'
import { useCallback, useEffect, useState } from 'react'
import { useSingleCallResult } from 'state/multicall/hooks'
import { useIsTransactionPending, useTransactionAdder } from 'state/transactions/hooks'

export const AIRDROP_ENDDATE = new Date('June 24 2022')

type AirdropInfo = {
  leaf: {
    address: string
    amount: string
    index: number
  }
  proof: string[]
}

export function useAirdrop() {
  const { account } = useActiveWeb3React()
  const airdropContract = useAirdropContract()
  const addTransaction = useTransactionAdder()
  const [isClaiming, setIsClaiming] = useState(false)
  const [didJustClaim, setDidJustClaim] = useState(false)
  const [txHash, setTxHash] = useState<string | undefined>()
  const isPending = useIsTransactionPending(txHash)

  const { airdropInfo, isLoading } = useAirdropInfo(account)

  const didClaimResponse = useSingleCallResult(airdropContract, 'redeemed', [airdropInfo?.leaf.index])
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
        airdropInfo.leaf.index,
        account,
        airdropInfo.leaf.amount,
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
    isEligible: Boolean(airdropInfo),
    loading: didClaimResponse.loading || isLoading,
    didClaim: Boolean(didClaimResponse.result?.[0]),
    didJustClaim,
    isClaiming,
    isPending,
    claim,
  }
}

function useAirdropInfo(address?: string | null) {
  const [airdropInfo, setAirdropInfo] = useState<AirdropInfo | undefined>()
  const [isLoading, setIsLoading] = useState<boolean>(false)

  async function loadInfo(address: string) {
    setIsLoading(true)
    try {
      const response = await fetch(`
      https://diff-drop-bb.s3.amazonaws.com/${address.toLowerCase()}.json`)
      const body = await response.json()
      if (body.leaf && body.proof) {
        setAirdropInfo(body)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (address) {
      loadInfo(address)
    }
  }, [address])
  return {
    airdropInfo,
    isLoading,
  }
}
