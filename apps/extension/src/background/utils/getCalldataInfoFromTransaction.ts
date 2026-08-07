import { CommandParser, CommandType, type UniversalRouterCall } from '@uniswap/universal-router-sdk'
import { Actions, URVersion, V4BaseActionsParser, type V4RouterCall } from '@uniswap/v4-sdk'
import { TradingApi } from '@universe/api'
import { EthSendTransactionRPCActions } from 'src/app/features/dappRequests/types/DappRequestTypes'
import { parseCalldata as parseNfPMCalldata } from 'src/app/features/dappRequests/types/NonfungiblePositionManager'
import { type NonfungiblePositionManagerCall } from 'src/app/features/dappRequests/types/NonfungiblePositionManagerTypes'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { type UniverseChainId } from 'uniswap/src/features/chains/types'
import { wrappedNativeCurrency } from 'uniswap/src/utils/currency'
import methodHashToFunctionSignature from 'utilities/src/calldata/methodHashToFunctionSignature'
import { logger } from 'utilities/src/logger/logger'
import { noop } from 'utilities/src/react/noop'

// V4 swap calldata is version-dependent: v2.1.1 added a `minHopPriceX36` field to the swap
// params, so decoding v2.1.1 calldata with the v4-sdk's default (v2.0) ABI shifts fields and
// can fail single-hop swaps outright. `V4BaseActionsParser.parseCalldata` takes an optional
// UR version; we can't know which one the dApp encoded with, so try the chain's highest
// supported version first and fall back to the default (v2.0) parse for older calldata.
//
// `supportedURVersions` is the trading API's `UniversalRouterVersion` enum; the v4-sdk uses a
// separate but value-identical `URVersion` enum. Map across by string value rather than
// casting, so an unknown/future value resolves to `undefined` (default parse) instead of
// type-punning two enums.
function toV4SdkURVersion(version: TradingApi.UniversalRouterVersion): URVersion | undefined {
  switch (version) {
    case TradingApi.UniversalRouterVersion._2_1_1:
      return URVersion.V2_1_1
    case TradingApi.UniversalRouterVersion._2_0:
      return URVersion.V2_0
    default:
      return undefined
  }
}

// Explicit version precedence, lowest to highest. Chain configs carry supportedURVersions as an
// unordered list contract-wise, so pick the highest by rank rather than by array position.
const UR_VERSION_ASCENDING: TradingApi.UniversalRouterVersion[] = [
  TradingApi.UniversalRouterVersion._2_0,
  TradingApi.UniversalRouterVersion._2_1_1,
  TradingApi.UniversalRouterVersion._2_2_0,
]

function getHighestSupportedURVersion(chainId?: UniverseChainId): URVersion | undefined {
  if (!chainId) {
    return undefined
  }
  const supported = new Set(getChainInfo(chainId).supportedURVersions)
  const highest = [...UR_VERSION_ASCENDING].reverse().find((version) => supported.has(version))
  return highest ? toV4SdkURVersion(highest) : undefined
}

function parseV4SwapCalldata(data: string, chainId?: UniverseChainId): V4RouterCall | undefined {
  const highestVersion = getHighestSupportedURVersion(chainId)
  // Versions to attempt, highest-first. The version-less parse (v4-sdk default v2.0) is
  // always the final fallback so existing v2.0 calldata keeps decoding.
  const versionsToTry: (URVersion | undefined)[] =
    highestVersion && highestVersion !== URVersion.V2_0 ? [highestVersion, undefined] : [undefined]
  const failedVersions: string[] = []

  for (const version of versionsToTry) {
    try {
      const v4Calldata = V4BaseActionsParser.parseCalldata(data, version)
      const hasSwapAction = v4Calldata.actions.some(
        (action) =>
          action.actionType === Actions.SWAP_EXACT_IN ||
          action.actionType === Actions.SWAP_EXACT_OUT ||
          action.actionType === Actions.SWAP_EXACT_IN_SINGLE ||
          action.actionType === Actions.SWAP_EXACT_OUT_SINGLE,
      )
      if (hasSwapAction) {
        return v4Calldata
      }
    } catch {
      failedVersions.push(version ?? 'default')
    }
  }

  if (failedVersions.length === versionsToTry.length) {
    logger.debug('getCalldataInfoFromTransaction.ts', 'parseV4SwapCalldata', 'Unable to parse V4 calldata', {
      chainId,
      attemptedVersions: versionsToTry.map((version) => version ?? 'default'),
    })
  }

  return undefined
}

interface GetCalldataInfoFromTransactionReturnValue {
  functionSignature?: string
  contractInteractions: EthSendTransactionRPCActions
  to?: string
  parsedCalldata?: V4RouterCall | UniversalRouterCall | NonfungiblePositionManagerCall
}

export default function getCalldataInfoFromTransaction({
  data,
  to,
  chainId,
}: {
  data: string
  to?: string
  chainId?: UniverseChainId
}): GetCalldataInfoFromTransactionReturnValue {
  const calldataMethodHash = data.substring(2, 10)
  const functionSignature = methodHashToFunctionSignature(calldataMethodHash)
  const contractInteractions = EthSendTransactionRPCActions.ContractInteraction
  const result: GetCalldataInfoFromTransactionReturnValue = {
    functionSignature,
    contractInteractions,
    to,
  }

  if (functionSignature) {
    if (['permit2Approve'].some((el) => functionSignature.includes(el))) {
      result.contractInteractions = EthSendTransactionRPCActions.Permit2Approve
      return result
    }
    if (['approve', 'permit'].some((el) => functionSignature.includes(el))) {
      result.contractInteractions = EthSendTransactionRPCActions.Approve
      return result
    }

    const v4Calldata = parseV4SwapCalldata(data, chainId)
    if (v4Calldata) {
      result.contractInteractions = EthSendTransactionRPCActions.Swap
      result.parsedCalldata = v4Calldata
      return result
    }

    try {
      const URCalldata = CommandParser.parseCalldata(data)

      // Validate that the UR call actually contains swap commands
      const hasSwapCommand = URCalldata.commands.some(
        (command) =>
          command.commandType === CommandType.V2_SWAP_EXACT_IN ||
          command.commandType === CommandType.V2_SWAP_EXACT_OUT ||
          command.commandType === CommandType.V3_SWAP_EXACT_IN ||
          command.commandType === CommandType.V3_SWAP_EXACT_OUT ||
          command.commandType === CommandType.V4_SWAP,
      )

      if (hasSwapCommand) {
        result.contractInteractions = EthSendTransactionRPCActions.Swap
        result.parsedCalldata = URCalldata
        return result
      }
    } catch {
      noop()
    }

    try {
      const NfPMCalldata = parseNfPMCalldata(data)
      result.contractInteractions = EthSendTransactionRPCActions.LP
      result.parsedCalldata = NfPMCalldata
      return result
    } catch {
      noop()
    }

    const isWrapUnwrapSignature = functionSignature === 'deposit()' || functionSignature === 'withdraw(uint256)'
    const wrappedNative = chainId ? wrappedNativeCurrency(chainId) : undefined
    const isNativeWrappedCurrencyTo = wrappedNative && to?.toLowerCase() === wrappedNative.address.toLowerCase()
    if (functionSignature.includes('wrap') || (isWrapUnwrapSignature && isNativeWrappedCurrencyTo)) {
      result.contractInteractions = EthSendTransactionRPCActions.Wrap
      return result
    }
  }
  return result
}
