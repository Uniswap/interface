import JSBI from 'jsbi'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { TransactionResponse } from '@ethersproject/providers'
import { useEffect, useState } from 'react'
import { UNI } from '../../constants/tokens'
import { useActiveWeb3React } from '../../hooks/web3'
import { useMerkleDistributorContract } from '../../hooks/useContract'
import { calculateGasMargin } from '../../utils/calculateGasMargin'
import { useSingleCallResult } from '../multicall/hooks'
import { isAddress } from '../../utils'
import { useTransactionAdder } from '../transactions/hooks'

interface UserClaimData {
  index: number
  amount: string
  proof: string[]
  flags?: {
    isSOCKS: boolean
    isLP: boolean
    isUser: boolean
  }
}

const CLAIM_PROMISES: { [key: string]: Promise<UserClaimData | null> } = {}

// returns the claim for the given address, or null if not valid
function fetchClaim(account: string, chainId: number): Promise<UserClaimData | null> {
  const formatted = isAddress(account)
  if (!formatted) return Promise.reject(new Error('Invalid address'))
  const key = `${chainId}:${account}`

  return (CLAIM_PROMISES[key] =
    CLAIM_PROMISES[key] ??
    fetch('https://merkle-drop-1.uniswap.workers.dev/', {
      body: JSON.stringify({ chainId, address: formatted }),
      headers: {
        'Content-Type': 'application/json',
        'Referrer-Policy': 'no-referrer',
      },
      method: 'POST',
    })
      .then((res) => (res.ok ? res.json() : console.log(`No claim for account ${formatted} on chain ID ${chainId}`)))
      .catch((error) => console.error('Failed to get claim data', error)))
}

// parse distributorContract blob and detect if user has claim data
// null means we know it does not
export function useUserClaimData(account: string | null | undefined): UserClaimData | null | undefined {
  const { chainId } = useActiveWeb3React()

  const key = `${chainId}:${account}`
  const [claimInfo, setClaimInfo] = useState<{ [key: string]: UserClaimData | null }>({})

  useEffect(() => {
    if (!account || !chainId) return
    fetchClaim(account, chainId).then((accountClaimInfo) =>
      setClaimInfo((claimInfo) => {
        return {
          ...claimInfo,
          [key]: accountClaimInfo,
        }
      })
    )
  }, [account, chainId, key])

  return account && chainId ? claimInfo[key] : undefined
}

// check if user is in blob and has not yet claimed UNI
export function useUserHasAvailableClaim(account: string | null | undefined): boolean {
  const userClaimData = useUserClaimData(account)
  const distributorContract = useMerkleDistributorContract()
  const isClaimedResult = useSingleCallResult(distributorContract, 'isClaimed', [userClaimData?.index])
  // user is in blob and contract marks as unclaimed
  return Boolean(userClaimData && !isClaimedResult.loading && isClaimedResult.result?.[0] === false)
}

export function useUserUnclaimedAmount(account: string | null | undefined): CurrencyAmount<Token> | undefined {
  const { chainId } = useActiveWeb3React()
  const userClaimData = useUserClaimData(account)
  const canClaim = useUserHasAvailableClaim(account)

  const uni = chainId ? UNI[chainId] : undefined
  if (!uni) return undefined
  if (!canClaim || !userClaimData) {
    return CurrencyAmount.fromRawAmount(uni, JSBI.BigInt(0))
  }
  return CurrencyAmount.fromRawAmount(uni, JSBI.BigInt(userClaimData.amount))
}

export function useClaimCallback(account: string | null | undefined): {
  claimCallback: () => Promise<string>
} {
  // get claim data for this account
  const { library, chainId } = useActiveWeb3React()
  const claimData = useUserClaimData(account)

  // used for popup summary
  const unclaimedAmount: CurrencyAmount<Token> | undefined = useUserUnclaimedAmount(account)
  const addTransaction = useTransactionAdder()
  const distributorContract = useMerkleDistributorContract()

  const claimCallback = async function () {
    if (!claimData || !account || !library || !chainId || !distributorContract) return

    const args = [claimData.index, account, claimData.amount, claimData.proof]

    return distributorContract.estimateGas['claim'](...args, {}).then((estimatedGasLimit) => {
      return distributorContract
        .claim(...args, { value: null, gasLimit: calculateGasMargin(estimatedGasLimit) })
        .then((response: TransactionResponse) => {
          addTransaction(response, {
            summary: `Claimed ${unclaimedAmount?.toSignificant(4)} UNI`,
            claim: { recipient: account },
          })
          return response.hash
        })
    })
  }

  return { claimCallback }
}
