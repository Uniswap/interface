import type { TransactionResponse } from '@ethersproject/providers'
import MerkleDistributorJSON from '@uniswap/merkle-distributor/build/MerkleDistributor.json'
import { CurrencyAmount, MERKLE_DISTRIBUTOR_ADDRESS, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { useAccount } from 'hooks/useAccount'
import { useContract } from 'hooks/useContract'
import JSBI from 'jsbi'
import { useEffect, useState } from 'react'
import { useTransactionAdder } from 'state/transactions/hooks'
import { UNI } from 'uniswap/src/constants/tokens'
import { normalizeTokenAddressForCache } from 'uniswap/src/data/cache'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { logger } from 'utilities/src/logger/logger'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import { assume0xAddress } from 'utils/wagmi'
import { useReadContract } from 'wagmi'

const claimAbi = [
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'index',
        type: 'uint256',
      },
    ],
    name: 'isClaimed',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

function useMerkleDistributorContract() {
  const account = useAccount()
  return useContract({
    address: account.chainId ? MERKLE_DISTRIBUTOR_ADDRESS[account.chainId] : undefined,
    ABI: MerkleDistributorJSON.abi,
  })
}

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

type LastAddress = string
type ClaimAddressMapping = { [firstAddress: string]: LastAddress }
let FETCH_CLAIM_MAPPING_PROMISE: Promise<ClaimAddressMapping> | null = null
function fetchClaimMapping(): Promise<ClaimAddressMapping> {
  return (
    FETCH_CLAIM_MAPPING_PROMISE ??
    (FETCH_CLAIM_MAPPING_PROMISE = fetch(
      `https://raw.githubusercontent.com/Uniswap/mrkl-drop-data-chunks/final/chunks/mapping.json`,
    )
      .then((res) => res.json())
      .catch((error) => {
        logger.warn('claim/hooks', 'fetchClaimMapping', 'Claim mapping fetch failed', error)
        FETCH_CLAIM_MAPPING_PROMISE = null
      }))
  )
}

const FETCH_CLAIM_FILE_PROMISES: { [startingAddress: string]: Promise<{ [address: string]: UserClaimData }> } = {}
function fetchClaimFile(key: string): Promise<{ [address: string]: UserClaimData }> {
  return (
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    FETCH_CLAIM_FILE_PROMISES[key] ??
    (FETCH_CLAIM_FILE_PROMISES[key] = fetch(
      `https://raw.githubusercontent.com/Uniswap/mrkl-drop-data-chunks/final/chunks/${key}.json`,
    )
      .then((res) => res.json())
      .catch((error) => {
        logger.warn('claim/hooks', 'fetchClaimFile', 'Claim file fetch failed', error)
        delete FETCH_CLAIM_FILE_PROMISES[key]
      }))
  )
}

const FETCH_CLAIM_PROMISES: { [key: string]: Promise<UserClaimData> } = {}
// returns the claim for the given address, or null if not valid
function fetchClaim(account: string): Promise<UserClaimData> {
  const formatted = getValidAddress({ address: account, platform: Platform.EVM, withEVMChecksum: true })
  if (!formatted) {
    return Promise.reject(new Error('Invalid address'))
  }

  return (
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    FETCH_CLAIM_PROMISES[account] ??
    (FETCH_CLAIM_PROMISES[account] = fetchClaimMapping()
      .then((mapping) => {
        const sorted = Object.keys(mapping).sort((a, b) =>
          normalizeTokenAddressForCache(a) < normalizeTokenAddressForCache(b) ? -1 : 1,
        )

        for (const startingAddress of sorted) {
          const lastAddress = mapping[startingAddress]
          if (normalizeTokenAddressForCache(startingAddress) <= normalizeTokenAddressForCache(formatted)) {
            if (normalizeTokenAddressForCache(formatted) <= normalizeTokenAddressForCache(lastAddress)) {
              return startingAddress
            }
          } else {
            throw new Error(`Claim for ${formatted} was not found in partial search`)
          }
        }
        throw new Error(`Claim for ${formatted} was not found after searching all mappings`)
      })
      .then(fetchClaimFile)
      .then((result) => {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (result[formatted]) {
          return result[formatted]
        }
        throw new Error(`Claim for ${formatted} was not found in claim file!`)
      })
      .catch((error) => {
        logger.debug('claim/hooks', 'fetchClaim', 'Claim fetch failed', error)
        throw error
      }))
  )
}

// parse distributorContract blob and detect if user has claim data
// null means we know it does not
function useUserClaimData(account: string | null | undefined): UserClaimData | null {
  const { chainId } = useAccount()

  const [claimInfo, setClaimInfo] = useState<{ [account: string]: UserClaimData | null }>({})

  useEffect(() => {
    if (!account || chainId !== 1) {
      return
    }

    fetchClaim(account)
      .then((accountClaimInfo) =>
        setClaimInfo((claimInfo) => {
          return {
            ...claimInfo,
            [account]: accountClaimInfo,
          }
        }),
      )
      .catch(() => {
        setClaimInfo((claimInfo) => {
          return {
            ...claimInfo,
            [account]: null,
          }
        })
      })
  }, [account, chainId])

  return account && chainId === 1 ? claimInfo[account] : null
}

// check if user is in blob and has not yet claimed UNI
export function useUserHasAvailableClaim(account: string | null | undefined): boolean {
  const userClaimData = useUserClaimData(account)

  const { data: isClaimed, isLoading: isClaimedLoading } = useReadContract({
    address: assume0xAddress(MERKLE_DISTRIBUTOR_ADDRESS[UniverseChainId.Mainnet]),
    chainId: UniverseChainId.Mainnet,
    abi: claimAbi,
    functionName: 'isClaimed',
    args: userClaimData ? [BigInt(userClaimData.index)] : undefined,
    query: { enabled: !!userClaimData },
  })

  // user is in blob and contract marks as unclaimed
  return Boolean(userClaimData && !isClaimedLoading && !isClaimed)
}

export function useUserUnclaimedAmount(account: string | null | undefined): CurrencyAmount<Token> | undefined {
  const { chainId } = useAccount()
  const userClaimData = useUserClaimData(account)
  const canClaim = useUserHasAvailableClaim(account)

  const uni = chainId ? (UNI as { [chainId: number]: Token })[chainId] : undefined
  if (!uni) {
    return undefined
  }
  if (!canClaim || !userClaimData) {
    return CurrencyAmount.fromRawAmount(uni, JSBI.BigInt(0))
  }
  return CurrencyAmount.fromRawAmount(uni, JSBI.BigInt(userClaimData.amount))
}

export function useClaimCallback(address: string | null | undefined): {
  claimCallback: () => Promise<string>
} {
  // get claim data for this account
  const account = useAccount()
  const { provider } = useWeb3React()
  const claimData = useUserClaimData(address)

  // used for popup summary
  const unclaimedAmount: CurrencyAmount<Token> | undefined = useUserUnclaimedAmount(address)
  const addTransaction = useTransactionAdder()
  const distributorContract = useMerkleDistributorContract()

  const claimCallback = async function () {
    if (!claimData || !address || !provider || !account.chainId || !distributorContract) {
      return undefined
    }

    const args = [claimData.index, address, claimData.amount, claimData.proof]

    return distributorContract.estimateGas.claim(...args, {}).then((estimatedGasLimit) => {
      return distributorContract
        .claim(...args, { value: null, gasLimit: calculateGasMargin(estimatedGasLimit) })
        .then((response: TransactionResponse) => {
          addTransaction(response, {
            type: TransactionType.ClaimUni,
            recipient: address,
            uniAmountRaw: unclaimedAmount?.quotient.toString(),
          })
          return response.hash
        })
    })
  }

  return { claimCallback }
}
