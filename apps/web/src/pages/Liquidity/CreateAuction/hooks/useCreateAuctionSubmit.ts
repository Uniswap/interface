import { generateRandomBytes } from '@universe/cryptography'
import { ensure0xHex, uint8ToHex } from '@universe/encoding'
import { useState } from 'react'
import { useCreateAuctionMutation } from 'uniswap/src/data/rest/auctions/useCreateAuctionMutation'
import { validateTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'
import { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { buildCreateAuctionRequest } from '~/pages/Liquidity/CreateAuction/buildCreateAuctionRequest'
import { ConfigureAuctionFormState, CustomizePoolState, TokenFormState } from '~/pages/Liquidity/CreateAuction/types'

/**
 * Thrown at launch time when the chosen start time has already passed — possible when the user
 * picks a valid time and lingers before confirming (the picker minimum is only a few minutes).
 * The backend rejects past start times when translating them to blocks (`timeToBlock`), so this
 * is caught pre-submission and mapped to actionable copy in `LaunchAuctionErrorModal`.
 */
export class AuctionStartTimePassedError extends Error {
  constructor() {
    super('Auction start time has already passed')
    this.name = 'AuctionStartTimePassedError'
  }
}

export interface CreateAuctionSubmitResult {
  predictedTokenAddress: string
  predictedAuctionAddress: string
  /** Ordered, validated transaction(s) to broadcast (usually a single launcher multicall). */
  transactions: ValidatedTransactionRequest[]
  /** Whether the transactions may be submitted as a single atomic batch (EIP-5792/7702). */
  atomicallyBundleable: boolean
  requestId: string
}

interface UseCreateAuctionSubmitParams {
  tokenForm: TokenFormState
  configureAuction: ConfigureAuctionFormState
  customizePool: CustomizePoolState
  walletAddress: string | undefined
  /** Resolved raise-currency token address (zero address for native ETH). */
  currencyAddress: string | undefined
  /** From X OAuth / VerifyXCallback when the creator linked their handle. */
  xVerificationToken?: string | null
}

interface UseCreateAuctionSubmitResult {
  onLaunch: () => Promise<CreateAuctionSubmitResult | undefined>
  isPending: boolean
  isDisabled: boolean
  error?: Error
}

/**
 * Builds the wizard-level CreateAuction request from the store and calls the liquidity
 * service `CreateAuction` endpoint. On success it validates the returned calldata
 * transaction(s) and exposes them alongside the predicted token/auction addresses.
 *
 * The review step dispatches `submitAuctionLaunchSaga` to submit those txs to
 * the wallet (EIP-5792 atomic batch when supported, otherwise sequential sends).
 */
export function useCreateAuctionSubmit(params: UseCreateAuctionSubmitParams): UseCreateAuctionSubmitResult {
  const { tokenForm, configureAuction, customizePool, walletAddress, currencyAddress, xVerificationToken } = params
  const createAuctionMutation = useCreateAuctionMutation()
  const [error, setError] = useState<Error | undefined>(undefined)

  const canBuild = Boolean(
    walletAddress &&
    currencyAddress &&
    configureAuction.committed &&
    configureAuction.startTime &&
    configureAuction.endTime,
  )

  const onLaunch = useEvent(async (): Promise<CreateAuctionSubmitResult | undefined> => {
    setError(undefined)

    if (!walletAddress) {
      return undefined
    }

    if (configureAuction.startTime && configureAuction.startTime.getTime() <= Date.now()) {
      setError(new AuctionStartTimePassedError())
      return undefined
    }

    const request = buildCreateAuctionRequest({
      tokenForm,
      configureAuction,
      customizePool,
      walletAddress,
      currencyAddress: currencyAddress ?? '',
      salt: ensure0xHex(uint8ToHex(generateRandomBytes(32))),
      xVerificationToken,
    })

    if (!request) {
      setError(new Error('Auction configuration is incomplete'))
      return undefined
    }

    try {
      const response = await createAuctionMutation.mutateAsync(request)

      const transactions = response.transactions
        .map((tx) =>
          validateTransactionRequest({
            to: tx.to,
            from: tx.from,
            data: tx.data,
            value: tx.value,
            chainId: tx.chainId,
          }),
        )
        .filter((tx): tx is ValidatedTransactionRequest => Boolean(tx))

      if (transactions.length !== response.transactions.length) {
        throw new Error('CreateAuction returned an invalid transaction request')
      }

      const submitResult: CreateAuctionSubmitResult = {
        predictedTokenAddress: response.predictedTokenAddress,
        predictedAuctionAddress: response.predictedAuctionAddress,
        transactions,
        atomicallyBundleable: response.atomicallyBundleable,
        requestId: response.requestId,
      }
      return submitResult
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to create auction')
      setError(err)
      logger.error(err, { tags: { file: 'useCreateAuctionSubmit', function: 'onLaunch' } })
      return undefined
    }
  })

  return {
    onLaunch,
    isPending: createAuctionMutation.isPending,
    isDisabled: !canBuild || createAuctionMutation.isPending,
    error,
  }
}
