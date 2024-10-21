import { CommandParser, UniversalRouterCall } from '@uniswap/universal-router-sdk'
import { V4BaseActionsParser, V4RouterCall } from '@uniswap/v4-sdk'
import { EthSendTransactionRPCActions } from 'src/app/features/dappRequests/types/DappRequestTypes'
import { EthersTransactionRequest } from 'src/app/features/dappRequests/types/EthersTypes'
import { parseCalldata as parseNfPMCalldata } from 'src/app/features/dappRequests/types/NonfungiblePositionManager'
import { NonfungiblePositionManagerCall } from 'src/app/features/dappRequests/types/NonfungiblePositionManagerTypes'
import methodHashToFunctionSignature from 'utilities/src/calldata/methodHashToFunctionSignature'
import noop from 'utilities/src/react/noop'

interface GetCalldataInfoFromTransactionReturnValue {
  functionSignature: string | undefined
  contractInteractions: EthSendTransactionRPCActions
  to: string | undefined
  parsedCalldata?: V4RouterCall | UniversalRouterCall | NonfungiblePositionManagerCall
}

function getCalldataInfoFromTransaction(
  transaction: EthersTransactionRequest,
): GetCalldataInfoFromTransactionReturnValue {
  const calldataMethodHash = transaction.data.substring(2, 10)
  const functionSignature = methodHashToFunctionSignature(calldataMethodHash)
  const contractInteractions = EthSendTransactionRPCActions.ContractInteraction
  const result: GetCalldataInfoFromTransactionReturnValue = {
    functionSignature,
    contractInteractions,
    to: transaction.to,
  }

  if (functionSignature) {
    if (['approve', 'permit'].some((el) => functionSignature.includes(el))) {
      result.contractInteractions = EthSendTransactionRPCActions.Approve
      return result
    }
    try {
      const v4Calldata = V4BaseActionsParser.parseCalldata(transaction.data)

      if (v4Calldata) {
        result.contractInteractions = EthSendTransactionRPCActions.Swap
        result.parsedCalldata = v4Calldata
        return result
      }
    } catch (_e) {
      noop()
    }
    try {
      const URCalldata = CommandParser.parseCalldata(transaction.data)

      if (URCalldata) {
        result.contractInteractions = EthSendTransactionRPCActions.Swap
        result.parsedCalldata = URCalldata
        return result
      }
    } catch (_e) {
      noop()
    }
    try {
      const NfPMCalldata = parseNfPMCalldata(transaction.data)

      if (NfPMCalldata) {
        result.contractInteractions = EthSendTransactionRPCActions.LP
        result.parsedCalldata = NfPMCalldata
        return result
      }
    } catch (_e) {
      noop()
    }
    if (functionSignature.includes('wrap')) {
      result.contractInteractions = EthSendTransactionRPCActions.Wrap
      return result
    }
  }
  return result
}

export default getCalldataInfoFromTransaction
