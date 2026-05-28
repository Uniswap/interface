import { Interface } from '@ethersproject/abi'
import { TransactionResponse } from '@ethersproject/providers'
import { useAccount } from 'hooks/useAccount'
import { useEthersProvider } from 'hooks/useEthersProvider'
import useSelectChain from 'hooks/useSelectChain'
import { USER_REFERRAL_ACTIVITY_CLAIM_API_URL } from 'pages/Referral/Constants/url'
import { useCallback, useRef } from 'react'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TransactionType } from 'state/transactions/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isAddress } from 'utilities/src/addresses'
import { getContract } from 'utilities/src/contracts/getContract'
import { calculateGasMargin } from 'utils/calculateGasMargin'

export const multiMerkleDistributorWithDeadlineAbi = [
  { inputs: [], name: 'AlreadyClaimed', type: 'error' },
  { inputs: [], name: 'CampaignNotFound', type: 'error' },
  { inputs: [], name: 'InvalidAmount', type: 'error' },
  { inputs: [], name: 'InvalidProof', type: 'error' },
  { inputs: [], name: 'InvalidRoot', type: 'error' },
  { inputs: [], name: 'InvalidOwner', type: 'error' },
  { inputs: [], name: 'InvalidToken', type: 'error' },
  { inputs: [], name: 'InvalidRecipient', type: 'error' },
  {
    inputs: [
      { internalType: 'uint256', name: 'campaignId', type: 'uint256' },
      { internalType: 'uint256', name: 'index', type: 'uint256' },
      { internalType: 'address', name: 'account', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'bytes32[]', name: 'merkleProof', type: 'bytes32[]' },
    ],
    name: 'claim',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'campaignId', type: 'uint256' },
      { internalType: 'uint256', name: 'index', type: 'uint256' },
    ],
    name: 'isClaimed',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

const multiMerkleDistributorInterface = new Interface(multiMerkleDistributorWithDeadlineAbi as any)

const REFERRAL_CLAIM_CHAIN_ID = UniverseChainId.Base
const REFERRAL_CLAIM_CONTRACT_ADDRESS = '0x4dd3F18AbE8667eB80b0ce4C98f07337e5332e7f'

type RawClaimParams = {
  campaignId?: unknown
  activityId?: unknown
  index?: unknown
  account?: unknown
  userAddress?: unknown
  amount?: unknown
  merkleProof?: unknown
  proof?: unknown
  airdropContract?: unknown
  distributorContract?: unknown
}

type NormalizedClaimParams = {
  campaignId: string
  index: string
  account: string
  amount: string
  merkleProof: string[]
  distributorAddress: string
}

function toUintString(value: unknown, field: string): string {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`Invalid ${field}`)
    }
    return Math.floor(value).toString()
  }

  if (typeof value === 'bigint') {
    if (value < 0n) {
      throw new Error(`Invalid ${field}`)
    }
    return value.toString()
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) {
      throw new Error(`Invalid ${field}`)
    }

    if (/^0x[0-9a-fA-F]+$/.test(trimmed)) {
      return BigInt(trimmed).toString()
    }

    if (/^\d+$/.test(trimmed)) {
      return BigInt(trimmed).toString()
    }
  }

  throw new Error(`Invalid ${field}`)
}

function normalizeProof(rawProof: unknown): string[] {
  if (typeof rawProof === 'string') {
    const trimmed = rawProof.trim()

    if (!trimmed) {
      throw new Error('Invalid merkle proof')
    }

    try {
      const parsed = JSON.parse(trimmed)
      return normalizeProof(parsed)
    } catch {
      throw new Error('Invalid merkle proof')
    }
  }

  if (!Array.isArray(rawProof)) {
    throw new Error('Invalid merkle proof')
  }

  if (rawProof.some((item) => typeof item !== 'string')) {
    throw new Error('Invalid merkle proof')
  }

  return rawProof.map((item) => item.trim()).filter((item) => item.length > 0)
}

function extractRawClaimParams(payload: unknown): RawClaimParams {
  if (!payload || typeof payload !== 'object') {
    return {}
  }

  const record = payload as Record<string, unknown>
  const result: RawClaimParams = {}

  if (record.activityId !== undefined) {
    result.activityId = record.activityId
  }
  if (record.campaignId !== undefined) {
    result.campaignId = record.campaignId
  }
  if (record.userAddress !== undefined) {
    result.userAddress = record.userAddress
  }
  if (record.airdropContract !== undefined) {
    result.airdropContract = record.airdropContract
  }
  if (record.distributorContract !== undefined) {
    result.distributorContract = record.distributorContract
  }
  if (record.account !== undefined) {
    result.account = record.account
  }
  if (record.index !== undefined) {
    result.index = record.index
  }
  if (record.amount !== undefined) {
    result.amount = record.amount
  }
  if (record.merkleProof !== undefined) {
    result.merkleProof = record.merkleProof
  }
  if (record.proof !== undefined) {
    result.proof = record.proof
  }

  if (record.claim && typeof record.claim === 'object') {
    return { ...result, ...extractRawClaimParams(record.claim) }
  }
  if (record.params && typeof record.params === 'object') {
    return { ...result, ...extractRawClaimParams(record.params) }
  }
  if (record.data && typeof record.data === 'object') {
    return { ...result, ...extractRawClaimParams(record.data) }
  }
  if (record.result && typeof record.result === 'object') {
    return { ...result, ...extractRawClaimParams(record.result) }
  }

  return result
}

function normalizeClaimParams(payload: unknown, connectedAddress: string): NormalizedClaimParams {
  const raw = extractRawClaimParams(payload)
  if (raw.campaignId === undefined || raw.campaignId === null || raw.campaignId === '') {
    throw new Error('Missing campaignId in proof response')
  }
  const campaignId = toUintString(raw.campaignId, 'campaignId')
  const index = toUintString(raw.index, 'index')
  const amount = toUintString(raw.amount, 'amount')
  const addressFromApi = typeof raw.account === 'string' ? isAddress(raw.account) : false
  const userAddressFromApi = typeof raw.userAddress === 'string' ? isAddress(raw.userAddress) : false
  const account = userAddressFromApi || addressFromApi || connectedAddress
  const merkleProof = normalizeProof(raw.merkleProof ?? raw.proof)

  return {
    campaignId,
    index,
    account,
    amount,
    merkleProof,
    distributorAddress: REFERRAL_CLAIM_CONTRACT_ADDRESS,
  }
}

function appendClaimQuery(url: string, address: string, activityId: string): string {
  const separator = url.includes('?') ? '&' : '?'
  const query = new URLSearchParams({
    userAddress: address.toLowerCase(),
    activityId,
  }).toString()

  return `${url}${separator}${query}`
}

function extractRevertData(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') {
    return undefined
  }

  const candidate = error as {
    data?: unknown
    error?: unknown
    reason?: unknown
    message?: unknown
  }

  if (typeof candidate.data === 'string' && /^0x[0-9a-fA-F]+$/.test(candidate.data)) {
    return candidate.data
  }

  if (candidate.error && candidate.error !== error) {
    const nested = extractRevertData(candidate.error)
    if (nested) {
      return nested
    }
  }

  return undefined
}

function normalizeClaimRevertError(error: unknown): Error {
  const revertData = extractRevertData(error)
  if (revertData) {
    try {
      const decoded = multiMerkleDistributorInterface.parseError(revertData)
      switch (decoded.name) {
        case 'AlreadyClaimed':
          return new Error('Already claimed')
        case 'CampaignNotFound':
          return new Error('Campaign not found')
        case 'InvalidProof':
          return new Error('Invalid proof')
        case 'InvalidAmount':
          return new Error('Invalid claim amount')
        case 'InvalidRecipient':
          return new Error('Invalid recipient')
        case 'InvalidRoot':
          return new Error('Invalid merkle root')
        case 'InvalidToken':
          return new Error('Invalid token')
        case 'InvalidOwner':
          return new Error('Invalid owner')
        default:
          return new Error(decoded.name)
      }
    } catch {
      // fallback to generic extraction below
    }
  }

  if (error instanceof Error) {
    const marker = 'execution reverted'
    const lowered = error.message.toLowerCase()
    const markerIndex = lowered.indexOf(marker)
    if (markerIndex !== -1) {
      const remainder = error.message
        .slice(markerIndex + marker.length)
        .trim()
        .replace(/^:\s*/, '')
      if (remainder) {
        return new Error(remainder)
      }
    }
    return error
  }

  return new Error('Claim transaction reverted')
}

export async function fetchReferralClaimParams({
  address,
  activityId,
  claimParamsUrl,
}: {
  address: string
  activityId: string
  claimParamsUrl?: string
}): Promise<NormalizedClaimParams> {
  const normalizedActivityId = activityId?.trim()
  if (!normalizedActivityId) {
    throw new Error('Missing activityId for claim')
  }

  const targetUrl = appendClaimQuery(
    claimParamsUrl ?? USER_REFERRAL_ACTIVITY_CLAIM_API_URL,
    address,
    normalizedActivityId,
  )
  const response = await fetch(targetUrl)

  if (!response.ok) {
    let bodyText = ''
    try {
      bodyText = (await response.text()).trim()
    } catch {
      bodyText = ''
    }

    if (bodyText) {
      try {
        const errJson = JSON.parse(bodyText)
        if (errJson && typeof errJson === 'object' && typeof (errJson as Record<string, unknown>).error === 'string') {
          throw new Error(`CLAIM_NOT_AVAILABLE: ${(errJson as Record<string, unknown>).error}`)
        }
      } catch (parseErr) {
        if (parseErr instanceof Error && parseErr.message.startsWith('CLAIM_NOT_AVAILABLE:')) {
          throw parseErr
        }
      }
    }

    throw new Error(
      `Failed to fetch claim params: HTTP ${response.status}${bodyText ? ` - ${bodyText.slice(0, 200)}` : ''}`,
    )
  }

  const payload = await response.json()

  if (payload && typeof payload === 'object' && typeof (payload as Record<string, unknown>).error === 'string') {
    throw new Error(`CLAIM_NOT_AVAILABLE: ${(payload as Record<string, unknown>).error}`)
  }

  return normalizeClaimParams(payload, address)
}

export function useReferralActivityClaim() {
  const account = useAccount()
  const accountRef = useRef(account)
  accountRef.current = account

  const provider = useEthersProvider({ chainId: REFERRAL_CLAIM_CHAIN_ID })
  const providerRef = useRef(provider)
  providerRef.current = provider

  const selectChain = useSelectChain()
  const addTransaction = useTransactionAdder()

  return useCallback(
    async ({ activityId, claimParamsUrl }: { activityId: string; claimParamsUrl?: string }): Promise<string> => {
      const currentAccount = accountRef.current
      if (currentAccount.status !== 'connected' || !currentAccount.address) {
        throw new Error('Wallet not connected')
      }

      if (currentAccount.chainId !== REFERRAL_CLAIM_CHAIN_ID) {
        const switched = await selectChain(REFERRAL_CLAIM_CHAIN_ID)
        if (!switched) {
          throw new Error('Failed to switch to Base')
        }
      }

      const currentProvider = providerRef.current
      if (!currentProvider) {
        throw new Error('No provider available')
      }

      const claimParams = await fetchReferralClaimParams({
        address: currentAccount.address,
        activityId,
        claimParamsUrl,
      })

      const contract = getContract(
        claimParams.distributorAddress,
        multiMerkleDistributorWithDeadlineAbi,
        currentProvider,
        currentAccount.address,
      )

      const args = [
        claimParams.campaignId,
        claimParams.index,
        claimParams.account,
        claimParams.amount,
        claimParams.merkleProof,
      ] as const

      try {
        await contract.callStatic['claim'](...args, {})
      } catch (error) {
        throw normalizeClaimRevertError(error)
      }

      let estimatedGasLimit
      try {
        estimatedGasLimit = await contract.estimateGas['claim'](...args, {})
      } catch (error) {
        throw normalizeClaimRevertError(error)
      }

      let txResponse: TransactionResponse
      try {
        txResponse = (await contract['claim'](...args, {
          value: null,
          gasLimit: calculateGasMargin(estimatedGasLimit),
        })) as TransactionResponse
      } catch (error) {
        throw normalizeClaimRevertError(error)
      }

      addTransaction(txResponse, {
        type: TransactionType.CLAIM,
        recipient: claimParams.account,
        uniAmountRaw: claimParams.amount,
      })

      return txResponse.hash
    },
    [addTransaction, selectChain],
  )
}
