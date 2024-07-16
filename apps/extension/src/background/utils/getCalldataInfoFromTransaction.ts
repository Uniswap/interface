import { parseCalldata as parseURCalldata } from 'src/app/features/dappRequests/requestContent/EthSend/Swap/universalRouter'
import { EthSendTransactionRPCActions } from 'src/app/features/dappRequests/types/DappRequestTypes'
import { EthersTransactionRequest } from 'src/app/features/dappRequests/types/EthersTypes'
import { parseCalldata as parseNfPMCalldata } from 'src/app/features/dappRequests/types/NonfungiblePositionManager'
import { NonfungiblePositionManagerCall } from 'src/app/features/dappRequests/types/NonfungiblePositionManagerTypes'
import { UniversalRouterCall } from 'src/app/features/dappRequests/types/UniversalRouterTypes'
import methodHashToFunctionSignature from 'utilities/src/calldata/methodHashToFunctionSignature'
import noop from 'utilities/src/react/noop'

interface GetCalldataInfoFromTransactionReturnValue {
  functionSignature: string | undefined
  contractInteractions: EthSendTransactionRPCActions
  to: string | undefined
  parsedCalldata?: UniversalRouterCall | NonfungiblePositionManagerCall
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
      const URCalldata = parseURCalldata(transaction.data)
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
