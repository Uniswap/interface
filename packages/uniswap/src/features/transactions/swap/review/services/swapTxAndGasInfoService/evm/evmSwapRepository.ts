import { TransactionRequest } from '@ethersproject/providers'
import { GasEstimate, TradingApi } from '@universe/api'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SignDelegationAuthorizationFn, SwapDelegationInfo } from 'uniswap/src/features/smartWallet/delegation/types'
import { transformTradingApiUserOpToRpcUserOp } from 'uniswap/src/features/smartWallet/userOp/transformTradingApiUserOp'
import { tradingApiToUniverseChainId } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import type { RpcUserOperation } from 'viem/account-abstraction'

export type SwapData = {
  requestId: string
  gasFee?: string
  gasEstimate?: GasEstimate
  includesDelegation?: boolean
  requestUniswapGasSponsorship?: boolean
  paymasterService?: Partial<TradingApi.PaymasterServiceCapability>
} & (
  | {
      transactions?: never
      unsignedUserOperation: RpcUserOperation<'0.8'>
    }
  | { unsignedUserOperation?: never; transactions: TransactionRequest[] }
)

// Input to fetchSwapData: CreateSwapRequest plus sponsorshipInfo, forwarded to swap endpoints that accept it(/swap_4337, /swap_5792).
export type SwapRequestParams = TradingApi.CreateSwapRequest & {
  sponsorshipInfo?: TradingApi.SponsorshipInfo
}

export interface EVMSwapRepository {
  fetchSwapData: (params: SwapRequestParams) => Promise<SwapData>
}

export function convertSwapResponseToSwapData(response: TradingApi.CreateSwapResponse): SwapData {
  return {
    requestId: response.requestId,
    transactions: [response.swap],
    gasFee: response.gasFee,
    gasEstimate: response.gasEstimates?.[0],
  }
}

export function createLegacyEVMSwapRepository(): EVMSwapRepository {
  return {
    fetchSwapData: async (params: TradingApi.CreateSwapRequest) =>
      convertSwapResponseToSwapData(await TradingApiClient.fetchSwap(params)),
  }
}

export function convertSwap7702ResponseToSwapData(
  response: TradingApi.CreateSwap7702Response,
  includesDelegation?: boolean,
): SwapData {
  return {
    requestId: response.requestId,
    transactions: [response.swap],
    gasFee: response.gasFee,
    includesDelegation,
  }
}

export function create7702EVMSwapRepository(ctx: {
  getSwapDelegationInfo: (chainId?: UniverseChainId) => SwapDelegationInfo
}): EVMSwapRepository {
  const { getSwapDelegationInfo } = ctx
  async function fetchSwapData(params: TradingApi.CreateSwapRequest): Promise<SwapData> {
    const chainId = tradingApiToUniverseChainId(params.quote.chainId)
    const smartContractDelegationInfo = getSwapDelegationInfo(chainId)
    const response = await TradingApiClient.fetchSwap7702({
      ...params,
      smartContractDelegationAddress: smartContractDelegationInfo.delegationAddress,
    })

    return convertSwap7702ResponseToSwapData(response, smartContractDelegationInfo.delegationInclusion)
  }

  return { fetchSwapData }
}

export function convertSwap5792ResponseToSwapData(response: TradingApi.CreateSwap5792Response): SwapData {
  return {
    requestId: response.requestId,
    transactions: response.calls.map((c) => ({ ...c, chainId: response.chainId })),
    gasFee: response.gasFee,
    paymasterService: response.paymasterService,
  }
}

export function create5792EVMSwapRepository(): EVMSwapRepository {
  return {
    fetchSwapData: async (params: SwapRequestParams) =>
      convertSwap5792ResponseToSwapData(await TradingApiClient.fetchSwap5792(params)),
  }
}

export function convertSwap4337ResponseToSwapData(
  response: TradingApi.Swap4337Response,
  includesDelegation?: boolean,
): SwapData {
  return {
    requestId: response.requestId,
    unsignedUserOperation: transformTradingApiUserOpToRpcUserOp(response.userOperation),
    requestUniswapGasSponsorship: response.gasSponsored,
    includesDelegation,
    // Since this is an internal wallet endpoint, paymaster URL is assumed to be our own paymaster endpoint
    paymasterService: { context: response.paymasterServiceContext },
  }
}

export function create4337EVMSwapRepository(ctx?: {
  getSwapDelegationInfo?: (chainId?: UniverseChainId) => SwapDelegationInfo
  signDelegationAuthorization?: SignDelegationAuthorizationFn
}): EVMSwapRepository {
  return {
    fetchSwapData: async (params: SwapRequestParams) => {
      const sender = params.quote.swapper
      if (!sender) {
        throw new Error('create4337EVMSwapRepository: quote.swapper is required to populate Swap4337Request.sender')
      }

      const chainId = tradingApiToUniverseChainId(params.quote.chainId)
      const delegationInfo = ctx?.getSwapDelegationInfo?.(chainId)

      // This swap activates the delegation when the account isn't yet delegated on this chain
      // (first sponsored swap on an undelegated account). The "Includes smart wallet activation"
      // label is gated on this intent — not on whether a signed auth was produced — so it also
      // shows on web, where the auth is signed later in the execution path (encode_4337) rather
      // than during review. Mirrors the non-sponsored 7702 repo, which uses delegationInclusion.
      const includesDelegation = Boolean(
        chainId && delegationInfo?.delegationInclusion && delegationInfo.delegationAddress,
      )

      // Sign the 7702 authorization up front (in environments that provide the callback) so the
      // backend's paymaster + bundler simulation runs against a delegated account. The signed auth
      // round-trips back on the returned UserOp, so the later signUserOp step reuses it.
      const eip7702Auth =
        includesDelegation && chainId && delegationInfo?.delegationAddress
          ? await ctx?.signDelegationAuthorization?.({
              chainId,
              sender,
              delegationAddress: delegationInfo.delegationAddress,
            })
          : undefined

      const swap4337Params: TradingApi.Swap4337Request = {
        quote: params.quote,
        sender,
        permitData: params.permitData,
        deadline: params.deadline,
        sponsorshipInfo: params.sponsorshipInfo,
        eip7702Auth,
      }
      return convertSwap4337ResponseToSwapData(await TradingApiClient.fetchSwap4337(swap4337Params), includesDelegation)
    },
  }
}
