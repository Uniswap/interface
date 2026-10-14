import { CurrencyAmount, MERKLE_DISTRIBUTOR_ADDRESS, Token } from '@uniswap/sdk-core'
import { getValidAddress, normalizeTokenAddressForCache, Platform, UniverseChainId } from '@universe/chains'
import JSBI from 'jsbi'
import { useEffect, useMemo, useState } from 'react'
import { UNI } from 'uniswap/src/constants/tokens'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger } from 'utilities/src/logger/logger'
import { useReadContract } from 'wagmi'
import { assume0xAddress, type ChainContract, createContract, getAddress, type Hash } from '~/chains'
import { useAccount } from '~/hooks/useAccount'
import { useEthersProvider, useEthersWeb3Provider } from '~/hooks/useEthersProvider'
import { useTransactionAdderFromHash } from '~/state/transactions/adder'

const merkleDistributorAbi = [
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
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'index',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'bytes32[]',
        name: 'merkleProof',
        type: 'bytes32[]',
      },
    ],
    name: 'claim',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

function useMerkleDistributorContract(): ChainContract<typeof merkleDistributorAbi> | null {
  const account = useAccount()
  const chainId = account.chainId
  const readProvider = useEthersProvider({ chainId })
  // Writes sign through the wallet's provider; reads stay on the app's read
  // provider (UniRPC) so they never route through connector RPC endpoints.
  const walletProvider = useEthersWeb3Provider({ chainId })
  const distributorAddress = chainId ? MERKLE_DISTRIBUTOR_ADDRESS[chainId] : undefined

  return useMemo(() => {
    const provider = readProvider ?? walletProvider
    if (!distributorAddress || !provider) {
      return null
    }
    const address = getAddress(distributorAddress)
    if (walletProvider && account.address) {
      return createContract({
        address,
        abi: merkleDistributorAbi,
        provider,
        signer: walletProvider.getSigner(account.address),
        signerAddress: account.address,
      })
    }
    return createContract({ address, abi: merkleDistributorAbi, provider })
  }, [distributorAddress, account.address, walletProvider, readProvider])
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
        // oxlint-disable-next-line typescript/no-unnecessary-condition
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
        // oxlint-disable-next-line no-shadow
        setClaimInfo((claimInfo) => {
          return {
            ...claimInfo,
            [account]: accountClaimInfo,
          }
        }),
      )
      .catch(() => {
        // oxlint-disable-next-line no-shadow
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
    abi: merkleDistributorAbi,
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
  claimCallback: () => Promise<string | undefined>
} {
  // get claim data for this account
  const account = useAccount()
  const claimData = useUserClaimData(address)

  // used for popup summary
  const unclaimedAmount: CurrencyAmount<Token> | undefined = useUserUnclaimedAmount(address)
  const addTransaction = useTransactionAdderFromHash()
  const distributorContract = useMerkleDistributorContract()

  const claimCallback = async function (): Promise<string | undefined> {
    // `account.address` gates on a connected wallet (the seam attaches a signer
    // only when it's present), so `write.claim` always has signing capability.
    if (!claimData || !address || !account.chainId || !account.address || !distributorContract) {
      return undefined
    }

    const hash = await distributorContract.write.claim([
      BigInt(claimData.index),
      assume0xAddress(address),
      BigInt(claimData.amount),
      claimData.proof as Hash[],
    ])
    addTransaction(
      { hash, chainId: account.chainId },
      {
        type: TransactionType.ClaimUni,
        recipient: address,
        uniAmountRaw: unclaimedAmount?.quotient.toString(),
      },
    )
    return hash
  }

  return { claimCallback }
}
