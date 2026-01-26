import { Interface } from '@ethersproject/abi'
import { TradingApi } from '@universe/api'
import NonfungiblePositionManagerJson from '@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { getV3PositionManagerAddress } from 'uniswap/src/constants/v3Addresses'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { parseErrorMessageTitle } from 'uniswap/src/features/transactions/liquidity/utils'
import {
  OnChainTransactionFields,
  OnChainTransactionFieldsBatched,
  TransactionStepType,
} from 'uniswap/src/features/transactions/steps/types'
import { validateTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'
import { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'
import { logger } from 'utilities/src/logger/logger'

const NFPMInterface = new Interface(NonfungiblePositionManagerJson.abi)

/**
 * Check if a chain ID is a HashKey chain
 */
function isHashKeyChain(chainId: number | undefined): boolean {
  return chainId === UniverseChainId.HashKey || chainId === UniverseChainId.HashKeyTestnet
}

/**
 * Calculate minimum amounts with slippage tolerance
 */
function calculateMinimumAmounts(
  amount0Desired: string,
  amount1Desired: string,
  slippageTolerance: number | undefined,
): { amount0Min: string; amount1Min: string } {
  const slippage = slippageTolerance ?? 0.05
  const slippageMultiplier = BigInt(Math.floor((1 - slippage) * 10000))
  const divisor = BigInt(10000)

  const amount0Min = (BigInt(amount0Desired) * slippageMultiplier) / divisor
  const amount1Min = (BigInt(amount1Desired) * slippageMultiplier) / divisor

  return {
    amount0Min: amount0Min.toString(),
    amount1Min: amount1Min.toString(),
  }
}

/**
 * Calculate deadline (20 minutes from now)
 */
function calculateDeadline(): number {
  return Math.floor(Date.now() / 1000) + 60 * 20
}

export interface IncreasePositionTransactionStep extends OnChainTransactionFields {
  // Doesn't require permit
  type: TransactionStepType.IncreasePositionTransaction
  sqrtRatioX96: string | undefined
}

export interface IncreasePositionTransactionStepAsync {
  // For Permit2 flows, signature is required
  // For HashKey Chain (on-chain building), signature is optional
  type: TransactionStepType.IncreasePositionTransactionAsync
  getTxRequest(
    signature: string | undefined,
  ): Promise<{ txRequest: ValidatedTransactionRequest | undefined; sqrtRatioX96: string | undefined }>
}

export interface IncreasePositionTransactionStepBatched extends OnChainTransactionFieldsBatched {
  type: TransactionStepType.IncreasePositionTransactionBatched
  sqrtRatioX96: string | undefined
}

export function createIncreasePositionStep(
  txRequest: ValidatedTransactionRequest,
  sqrtRatioX96: string | undefined,
): IncreasePositionTransactionStep {
  return {
    type: TransactionStepType.IncreasePositionTransaction,
    txRequest,
    sqrtRatioX96,
  }
}

export function createCreatePositionAsyncStep(
  createPositionRequestArgs: TradingApi.CreateLPPositionRequest | undefined,
): IncreasePositionTransactionStepAsync {
  return {
    type: TransactionStepType.IncreasePositionTransactionAsync,
    getTxRequest: async (
      signature: string | undefined,
    ): Promise<{ txRequest: ValidatedTransactionRequest | undefined; sqrtRatioX96: string | undefined }> => {
      if (!createPositionRequestArgs) {
        return { txRequest: undefined, sqrtRatioX96: undefined }
      }

      // Check if this is a HashKey chain - Trading API doesn't support HashKey chains
      const chainId = createPositionRequestArgs.chainId as number
      const isHashKey = isHashKeyChain(chainId)

      if (isHashKey) {
        // For HashKey chains, build the transaction on-chain instead of using Trading API
        // Only support V3 protocol (V4 is not supported on HashKey chains)
        // Note: HashKey Chain doesn't use Permit2, so signature is not required
        const protocol = createPositionRequestArgs.protocol
        if (protocol !== TradingApi.ProtocolItems.V3) {
          throw new Error(`HashKey Chain only supports V3 protocol, got ${protocol}`)
        }

        try {
          const positionManagerAddress = getV3PositionManagerAddress(chainId)
          if (!positionManagerAddress) {
            throw new Error(`Position Manager address not found for chain ${chainId}`)
          }

          const { position, walletAddress, initialPrice, independentAmount, independentToken, slippageTolerance, initialDependentAmount } = createPositionRequestArgs
          
          if (!position?.pool || !position.tickLower || !position.tickUpper) {
            throw new Error('Missing required position parameters')
          }

          const { token0, token1, fee } = position.pool
          const tickLower = position.tickLower
          const tickUpper = position.tickUpper

          // For HashKey chains, we need both amounts
          // Use independentAmount and initialDependentAmount (if provided) or calculate from initialPrice
          let amount0Desired: string
          let amount1Desired: string
          
          if (independentToken === TradingApi.IndependentToken.TOKEN_0) {
            amount0Desired = independentAmount || '0'
            // Use initialDependentAmount if provided (for new pools), otherwise we'd need to calculate from initialPrice
            // For now, if initialDependentAmount is not provided, we'll use 0 and let the contract handle it
            amount1Desired = initialDependentAmount || '0'
          } else {
            amount1Desired = independentAmount || '0'
            amount0Desired = initialDependentAmount || '0'
          }
          
          // If both amounts are 0, this is an error
          if (amount0Desired === '0' && amount1Desired === '0') {
            throw new Error('Both amounts cannot be zero. Please provide initialDependentAmount for new pools.')
          }

          // Calculate minimum amounts with slippage tolerance
          const { amount0Min, amount1Min } = calculateMinimumAmounts(
            amount0Desired,
            amount1Desired,
            slippageTolerance,
          )

          // Calculate deadline (20 minutes from now)
          const deadline = calculateDeadline()

          // Build multicall data
          const multicallData: string[] = []

          // Step 1: createAndInitializePoolIfNecessary (if initialPrice is provided, pool needs to be created)
          if (initialPrice) {
            multicallData.push(
              NFPMInterface.encodeFunctionData('createAndInitializePoolIfNecessary', [
                token0,
                token1,
                fee,
                initialPrice, // sqrtPriceX96
              ])
            )
          }

          // Step 2: mint (add liquidity)
          multicallData.push(
            NFPMInterface.encodeFunctionData('mint', [
              {
                token0,
                token1,
                fee,
                tickLower,
                tickUpper,
                amount0Desired,
                amount1Desired,
                amount0Min: amount0Min.toString(),
                amount1Min: amount1Min.toString(),
                recipient: walletAddress,
                deadline,
              },
            ])
          )

          // Build the transaction request
          const txRequest: ValidatedTransactionRequest = {
            to: positionManagerAddress,
            data: NFPMInterface.encodeFunctionData('multicall', [multicallData]),
            value: '0x0',
            chainId,
          }

          // Get sqrtRatioX96 from initialPrice if available
          const sqrtRatioX96 = initialPrice

          return { txRequest, sqrtRatioX96 }
        } catch (e) {
          const errorMessage = e instanceof Error ? e.message : 'Failed to build on-chain transaction for HashKey chain'
          logger.error(errorMessage, {
            tags: {
              file: 'increasePosition',
              function: 'createCreatePositionAsyncStep',
            },
            extra: {
              chainId,
              createPositionRequestArgs,
              error: e,
            },
          })

          sendAnalyticsEvent(InterfaceEventName.CreatePositionFailed, {
            message: errorMessage,
            ...createPositionRequestArgs,
          })

          throw new Error(errorMessage)
        }
      }

      try {
        // For non-HashKey chains, signature is required for Trading API
        if (!signature) {
          throw new Error('Signature is required for Trading API createLpPosition call')
        }
        const { create, sqrtRatioX96 } = await TradingApiClient.createLpPosition({
          ...createPositionRequestArgs,
          signature,
          simulateTransaction: true,
        })

        return { txRequest: validateTransactionRequest(create), sqrtRatioX96 }
      } catch (e) {
        const message = parseErrorMessageTitle(e, { includeRequestId: true })
        if (message) {
          logger.error(message, {
            tags: {
              file: 'increasePosition',
              function: 'createCreatePositionAsyncStep',
            },
          })

          sendAnalyticsEvent(InterfaceEventName.CreatePositionFailed, {
            message,
            ...createPositionRequestArgs,
          })
        }

        throw e
      }
    },
  }
}

export function createIncreasePositionAsyncStep(
  increasePositionRequestArgs: TradingApi.IncreaseLPPositionRequest | undefined,
): IncreasePositionTransactionStepAsync {
  return {
    type: TransactionStepType.IncreasePositionTransactionAsync,
    getTxRequest: async (
      signature: string | undefined,
    ): Promise<{ txRequest: ValidatedTransactionRequest | undefined; sqrtRatioX96: string | undefined }> => {
      if (!increasePositionRequestArgs) {
        return { txRequest: undefined, sqrtRatioX96: undefined }
      }

      try {
        // Signature is required for Trading API
        if (!signature) {
          throw new Error('Signature is required for Trading API increaseLpPosition call')
        }
        const { increase, sqrtRatioX96 } = await TradingApiClient.increaseLpPosition({
          ...increasePositionRequestArgs,
          signature,
          simulateTransaction: true,
        })

        return { txRequest: validateTransactionRequest(increase), sqrtRatioX96 }
      } catch (e) {
        const message = parseErrorMessageTitle(e, { includeRequestId: true })
        if (message) {
          logger.error(message, {
            tags: {
              file: 'generateTransactionSteps',
              function: 'createIncreasePositionAsyncStep',
            },
          })
          sendAnalyticsEvent(InterfaceEventName.IncreaseLiquidityFailed, {
            message,
            ...increasePositionRequestArgs,
          })
        }

        throw e
      }
    },
  }
}

export function createIncreasePositionStepBatched(
  txRequests: ValidatedTransactionRequest[],
  sqrtRatioX96: string | undefined,
): IncreasePositionTransactionStepBatched {
  return {
    type: TransactionStepType.IncreasePositionTransactionBatched,
    batchedTxRequests: txRequests,
    sqrtRatioX96,
  }
}
