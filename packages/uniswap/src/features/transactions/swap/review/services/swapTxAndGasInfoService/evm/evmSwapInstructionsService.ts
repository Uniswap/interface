import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import type {
  BridgeQuoteResponse,
  ClassicQuoteResponse,
  WrapQuoteResponse,
} from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { CreateSwapRequest, Permit, Routing } from 'uniswap/src/data/tradingApi/__generated__'
import type { CustomSwapDataForRequest, GasStrategy } from 'uniswap/src/data/tradingApi/types'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { SwapDelegationInfo } from 'uniswap/src/features/smartWallet/delegation/types'
import type { TransactionSettings } from 'uniswap/src/features/transactions/components/settings/types'
import type {
  EVMSwapRepository,
  SwapData,
} from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/evm/evmSwapRepository'
import {
  create5792EVMSwapRepository,
  create7702EVMSwapRepository,
  createLegacyEVMSwapRepository,
} from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/evm/evmSwapRepository'
import type { PresignPermitFn } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/evm/hooks'
import { createPrepareSwapRequestParams } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/utils'
import {
  ApprovalAction,
  BridgeTrade,
  ClassicTrade,
  UnwrapTrade,
  WrapTrade,
} from 'uniswap/src/features/transactions/swap/types/trade'
import { tradingApiToUniverseChainId } from 'uniswap/src/features/transactions/swap/utils/tradingApi'

type SwapInstructions =
  | { response: SwapData; unsignedPermit: null; swapRequestParams: null }
  | { response: null; unsignedPermit: Permit; swapRequestParams: CreateSwapRequest }

/** A service utility capable of fetching swap instructions or returning unsigned permit data when instructions cannot yet be fetched. */
export interface EVMSwapInstructionsService {
  getSwapInstructions: (params: {
    swapQuoteResponse:
      | ClassicQuoteResponse
      | BridgeQuoteResponse
      | WrapQuoteResponse<Routing.WRAP>
      | WrapQuoteResponse<Routing.UNWRAP>
    transactionSettings: TransactionSettings
    approvalAction: ApprovalAction
    trade?: ClassicTrade | BridgeTrade | WrapTrade | UnwrapTrade
  }) => Promise<SwapInstructions>
}

interface EVMSwapInstructionsServiceContext {
  v4SwapEnabled: boolean
  gasStrategy: GasStrategy
  /** A function that should be provided in wallet environments that support signing permits without prompting the user. Allows fetching swap instructions earlier for some flows.*/
  presignPermit?: PresignPermitFn
  getCanBatchTransactions?: (chainId: UniverseChainId | undefined) => boolean
  getSwapDelegationInfo?: (chainId: UniverseChainId | undefined) => SwapDelegationInfo
}

const getCustomSwapTokenData = (
  trade: ClassicTrade | BridgeTrade | WrapTrade | UnwrapTrade | undefined,
): CustomSwapDataForRequest | undefined => {
  if (!trade || trade.routing !== Routing.CLASSIC || !trade.swaps[0]) {
    return undefined
  }

  const swap = trade.swaps[0]
  const currencyIn = swap.inputAmount.currency
  const currencyOut = swap.outputAmount.currency

  return {
    chainId: currencyIn.chainId,
    tokenInChainId: currencyIn.chainId,
    tokenInAddress: currencyIn.isNative ? ZERO_ADDRESS : currencyIn.address,
    tokenInDecimals: currencyIn.decimals,
    tokenOutChainId: currencyOut.chainId,
    tokenOutAddress: currencyOut.isNative ? ZERO_ADDRESS : currencyOut.address,
    tokenOutDecimals: currencyOut.decimals,
  }
}

function createLegacyEVMSwapInstructionsService(
  ctx: Omit<EVMSwapInstructionsServiceContext, 'swapDelegationAddress'> & { swapRepository: EVMSwapRepository },
): EVMSwapInstructionsService {
  const { gasStrategy, swapRepository } = ctx

  const prepareSwapRequestParams = createPrepareSwapRequestParams({
    gasStrategy,
  })

  const service: EVMSwapInstructionsService = {
    getSwapInstructions: async ({ swapQuoteResponse, transactionSettings, approvalAction, trade }) => {
      const { permitData, permitTransaction } = swapQuoteResponse
      const signature = permitData ? await ctx.presignPermit?.(permitData) : undefined
      const alreadyApproved = approvalAction === ApprovalAction.None && !permitTransaction

      const swapRequestParams = prepareSwapRequestParams({
        swapQuoteResponse,
        signature,
        transactionSettings,
        alreadyApproved,
      })

      const signatureMissing = permitData && !signature
      if (signatureMissing) {
        return { response: null, unsignedPermit: permitData, swapRequestParams }
      }

      const customSwapData = getCustomSwapTokenData(trade)
      const response = await swapRepository.fetchSwapData({ ...swapRequestParams, customSwapData })
      return { response, unsignedPermit: null, swapRequestParams: null }
    },
  }

  return service
}

function createBatchedEVMSwapInstructionsService(
  ctx: Omit<EVMSwapInstructionsServiceContext, 'presignPermit'> & { swapRepository: EVMSwapRepository },
): EVMSwapInstructionsService {
  const { gasStrategy, swapRepository } = ctx

  const prepareSwapRequestParams = createPrepareSwapRequestParams({
    gasStrategy,
  })

  const service: EVMSwapInstructionsService = {
    getSwapInstructions: async ({ swapQuoteResponse, transactionSettings, approvalAction }) => {
      const swapRequestParams = prepareSwapRequestParams({
        swapQuoteResponse,
        signature: undefined,
        transactionSettings,
        alreadyApproved: approvalAction === ApprovalAction.None,
        overrideSimulation: true, // always simulate for batched transactions
      })

      const response = await swapRepository.fetchSwapData(swapRequestParams)
      return { response, unsignedPermit: null, swapRequestParams: null }
    },
  }

  return service
}

export function createEVMSwapInstructionsService(ctx: EVMSwapInstructionsServiceContext): EVMSwapInstructionsService {
  const { getSwapDelegationInfo } = ctx
  const smartContractWalletInstructionService = getSwapDelegationInfo
    ? createBatchedEVMSwapInstructionsService({
        ...ctx,
        swapRepository: create7702EVMSwapRepository({ getSwapDelegationInfo }),
      })
    : undefined

  const batchedInstructionsService = createBatchedEVMSwapInstructionsService({
    ...ctx,
    swapRepository: create5792EVMSwapRepository(),
  })

  const legacyInstructionsService = createLegacyEVMSwapInstructionsService({
    ...ctx,
    swapRepository: createLegacyEVMSwapRepository(),
  })

  const service: EVMSwapInstructionsService = {
    getSwapInstructions: async (params) => {
      const chainId = tradingApiToUniverseChainId(params.swapQuoteResponse.quote.chainId)

      if (smartContractWalletInstructionService && ctx.getSwapDelegationInfo?.(chainId).delegationAddress) {
        return smartContractWalletInstructionService.getSwapInstructions(params)
      }

      if (ctx.getCanBatchTransactions?.(chainId)) {
        return batchedInstructionsService.getSwapInstructions(params)
      }

      return legacyInstructionsService.getSwapInstructions(params)
    },
  }

  return service
}
