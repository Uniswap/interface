import { generateRandomBytes } from '@universe/cryptography'
import { ensure0xHex, uint8ToHex } from '@universe/encoding'
import { useState } from 'react'
import { useCreateAuctionMutation } from 'uniswap/src/data/rest/auctions/useCreateAuctionMutation'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { AuctionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import type { AuctionCreateFailedProperties, AuctionCreateFailedStep } from 'uniswap/src/features/telemetry/types'
import { validateTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'
import { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { getAuctionCreateFailedDiagnostics } from '~/pages/Liquidity/CreateAuction/analytics'
import { buildCreateAuctionRequest } from '~/pages/Liquidity/CreateAuction/buildCreateAuctionRequest'
import {
  ConfigureAuctionFormState,
  CustomizePoolState,
  TokenFormState,
  TokenMode,
  XVerification,
} from '~/pages/Liquidity/CreateAuction/types'
import {
  EmissionScheduleError,
  getAuctionEmissionScheduleError,
} from '~/pages/Liquidity/CreateAuction/utils/emissionSchedule'

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

/**
 * Thrown at launch time when the wallet holds fewer tokens than the configured deposit — the auction
 * pulls the deposit from the wallet, so the backend would reject it. Mapped to actionable copy in
 * `LaunchAuctionErrorModal`.
 */
export class AuctionInsufficientBalanceError extends Error {
  constructor() {
    super('Wallet token balance is insufficient to fund the auction')
    this.name = 'AuctionInsufficientBalanceError'
  }
}

/**
 * Thrown at launch time when the chosen window no longer produces a valid emission schedule —
 * possible when a window that was valid at the Configure step goes stale because `now` advanced
 * (so start/end round to the same/adjacent block). The backend derives a convex emission schedule
 * from the block span and rejects a too-short window or one whose per-block rounding overshoots the
 * supply target ("Emission schedule overshot the supply target"). Caught pre-submission and mapped to
 * actionable copy in `LaunchAuctionErrorModal`.
 */
export class AuctionWindowTooShortError extends Error {
  constructor() {
    super('Auction window is too short for a valid emission schedule')
    this.name = 'AuctionWindowTooShortError'
  }
}

/**
 * Thrown at launch time when the stored X verification is bound to a different wallet than the one
 * about to submit — possible when the user verifies on the token-info step and switches wallets on a
 * later step, where the step-1 invalidation effect isn't mounted. The backend rejects such tokens
 * ("x_verification_token is bound to a different wallet"), so this is caught pre-submission and
 * mapped in `LaunchAuctionErrorModal` to copy that sends the user back to re-verify.
 */
export class AuctionXWalletMismatchError extends Error {
  constructor() {
    super('X verification is bound to a different wallet')
    this.name = 'AuctionXWalletMismatchError'
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
  xVerification?: Pick<XVerification, 'xVerificationToken' | 'boundWalletAddress'>
  /**
   * Existing-token only: the connected wallet's on-chain balance in base units. Used for the
   * build-time insufficient-balance check so a deposit larger than the held balance can't hit the
   * backend's "insufficient balance" rejection.
   */
  existingTokenWalletBalanceRaw?: bigint
  /**
   * Builds `Auction Create Failed` properties. Called by this hook at pre-submission failure points
   * (`build_request` for local validation, `create_auction_request` when the endpoint throws).
   */
  getCreateFailedProperties?: (args: {
    failedStep: AuctionCreateFailedStep
    errorCode?: string | number
  }) => AuctionCreateFailedProperties
}

/** Pulls a ConnectRPC/HTTP-style error code off an unknown thrown value, when present. */
function extractErrorCode(e: unknown): string | number | undefined {
  if (e && typeof e === 'object' && 'code' in e) {
    const code = (e as { code?: unknown }).code
    if (typeof code === 'string' || typeof code === 'number') {
      return code
    }
  }
  return undefined
}

function reportAuctionCreateFailed(args: {
  getCreateFailedProperties: UseCreateAuctionSubmitParams['getCreateFailedProperties']
  failedStep: AuctionCreateFailedStep
  error?: unknown
  errorCode?: string | number
  /** Config snapshot (Datadog only) so a failure can be tied to the inputs that produced it. */
  diagnostics?: Record<string, unknown>
}): void {
  const props = args.getCreateFailedProperties?.({ failedStep: args.failedStep, errorCode: args.errorCode })
  if (props) {
    sendAnalyticsEvent(AuctionEventName.AuctionCreateFailed, props)
  }
  // These failures are handled in-UI (error modal) and otherwise never reach Datadog. Log here so they
  // stay visible in RUM with the backend reason + config snapshot — enough to identify which gap to fix
  // (group by failed_step + errorMessage, then read the diagnostics for the offending input).
  const error = args.error instanceof Error ? args.error : new Error(`Auction create failed at ${args.failedStep}`)
  logger.error(error, {
    tags: { file: 'useCreateAuctionSubmit', function: 'onLaunch' },
    extra: {
      failedStep: args.failedStep,
      errorCode: args.errorCode,
      // Backend's human-readable reason (e.g. "Unsupported fee tier: 30000") — the primary gap signal,
      // surfaced as a field so it's filterable, not only buried inside the error object.
      errorMessage: args.error instanceof Error ? args.error.message : undefined,
      ...props,
      ...args.diagnostics,
    },
  })
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
  const {
    tokenForm,
    configureAuction,
    customizePool,
    walletAddress,
    currencyAddress,
    xVerification,
    existingTokenWalletBalanceRaw,
    getCreateFailedProperties,
  } = params
  const createAuctionMutation = useCreateAuctionMutation()
  const [error, setError] = useState<Error | undefined>(undefined)

  // Existing mode needs a resolved token; without it the request builder suppresses the request
  // (an empty `existing` source is rejected by the backend), so keep the launch button disabled.
  const hasResolvedToken = tokenForm.mode === TokenMode.CREATE_NEW || tokenForm.existingTokenCurrencyInfo !== undefined

  const canBuild = Boolean(
    walletAddress &&
    currencyAddress &&
    hasResolvedToken &&
    configureAuction.committed &&
    configureAuction.startTime &&
    configureAuction.endTime,
  )

  const onLaunch = useEvent(async (): Promise<CreateAuctionSubmitResult | undefined> => {
    setError(undefined)
    // Config snapshot logged alongside every failure below so Datadog shows which inputs triggered it.
    const diagnostics = getAuctionCreateFailedDiagnostics({ configureAuction, customizePool })

    if (!walletAddress) {
      // Unreachable on first open (the launch button is gated on a connected wallet), but a wallet
      // disconnect before a retry could land here. Set an error so onLaunch always pairs an
      // undefined return with a surfaced error, keeping the review modal from getting stuck with an
      // enabled launch button that silently no-ops.
      setError(new Error('Wallet not connected'))
      return undefined
    }

    if (configureAuction.startTime && configureAuction.startTime.getTime() <= Date.now()) {
      const err = new AuctionStartTimePassedError()
      setError(err)
      reportAuctionCreateFailed({ getCreateFailedProperties, failedStep: 'build_request', error: err, diagnostics })
      return undefined
    }

    // The X token is bound to the wallet that initiated the OAuth flow. A switch on the token-info
    // step is caught there, but a switch on a later step isn't — fail here with actionable copy
    // instead of letting the backend reject the request.
    if (
      xVerification &&
      !areAddressesEqual({
        addressInput1: { address: xVerification.boundWalletAddress, platform: Platform.EVM },
        addressInput2: { address: walletAddress, platform: Platform.EVM },
      })
    ) {
      const err = new AuctionXWalletMismatchError()
      setError(err)
      reportAuctionCreateFailed({ getCreateFailedProperties, failedStep: 'build_request', error: err, diagnostics })
      return undefined
    }

    // Existing tokens pull the deposit from the wallet, so a deposit larger than the held balance
    // can't be funded — fail here instead of letting the backend reject it.
    if (
      existingTokenWalletBalanceRaw !== undefined &&
      configureAuction.committed &&
      BigInt(configureAuction.committed.auctionSupplyAmount.quotient.toString()) > existingTokenWalletBalanceRaw
    ) {
      const err = new AuctionInsufficientBalanceError()
      setError(err)
      reportAuctionCreateFailed({ getCreateFailedProperties, failedStep: 'build_request', error: err, diagnostics })
      return undefined
    }

    // Re-check the emission schedule against `now`: a window valid at Configure can go stale if the
    // user lingers, leaving too few blocks for the backend's schedule (it would reject the request).
    if (
      getAuctionEmissionScheduleError({
        startTime: configureAuction.startTime,
        endTime: configureAuction.endTime,
        chainId: configureAuction.committed?.totalSupply.currency.chainId,
      }) === EmissionScheduleError.WindowTooShort
    ) {
      const err = new AuctionWindowTooShortError()
      setError(err)
      reportAuctionCreateFailed({ getCreateFailedProperties, failedStep: 'build_request', error: err, diagnostics })
      return undefined
    }

    const request = buildCreateAuctionRequest({
      tokenForm,
      configureAuction,
      customizePool,
      walletAddress,
      currencyAddress: currencyAddress ?? '',
      salt: ensure0xHex(uint8ToHex(generateRandomBytes(32))),
      xVerificationToken: xVerification?.xVerificationToken,
    })

    if (!request) {
      const err = new Error('Auction configuration is incomplete')
      setError(err)
      reportAuctionCreateFailed({ getCreateFailedProperties, failedStep: 'build_request', error: err, diagnostics })
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
      reportAuctionCreateFailed({
        getCreateFailedProperties,
        failedStep: 'create_auction_request',
        error: e,
        errorCode: extractErrorCode(e),
        diagnostics,
      })
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
