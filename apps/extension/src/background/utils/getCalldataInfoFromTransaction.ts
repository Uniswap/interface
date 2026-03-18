import { CommandParser, CommandType, type UniversalRouterCall } from '@uniswap/universal-router-sdk'
import { Actions, V4BaseActionsParser, type V4RouterCall } from '@uniswap/v4-sdk'
import { EthSendTransactionRPCActions } from 'src/app/features/dappRequests/types/DappRequestTypes'
import { parseCalldata as parseNfPMCalldata } from 'src/app/features/dappRequests/types/NonfungiblePositionManager'
import { type NonfungiblePositionManagerCall } from 'src/app/features/dappRequests/types/NonfungiblePositionManagerTypes'
import { type UniverseChainId } from 'uniswap/src/features/chains/types'
import { wrappedNativeCurrency } from 'uniswap/src/utils/currency'
import methodHashToFunctionSignature from 'utilities/src/calldata/methodHashToFunctionSignature'
import { noop } from 'utilities/src/react/noop'

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

    try {
      const v4Calldata = V4BaseActionsParser.parseCalldata(data)

      // Validate that the V4 call actually contains swap actions
      const hasSwapAction = v4Calldata.actions.some(
        (action) =>
          action.actionType === Actions.SWAP_EXACT_IN ||
          action.actionType === Actions.SWAP_EXACT_OUT ||
          action.actionType === Actions.SWAP_EXACT_IN_SINGLE ||
          action.actionType === Actions.SWAP_EXACT_OUT_SINGLE,
      )

      if (hasSwapAction) {
        result.contractInteractions = EthSendTransactionRPCActions.Swap
        result.parsedCalldata = v4Calldata
        return result
      }
    } catch {
      noop()
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
    const isNativeWrappedCurrencyTo =
      chainId && to?.toLowerCase() === wrappedNativeCurrency(chainId).address.toLowerCase()
    if (functionSignature.includes('wrap') || (isWrapUnwrapSignature && isNativeWrappedCurrencyTo)) {
      result.contractInteractions = EthSendTransactionRPCActions.Wrap
      return result
    }
  }
  return result
}
