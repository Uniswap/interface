import { CommandParser, UniversalRouterCall } from '@uniswap/universal-router-sdk'
import { V4BaseActionsParser, V4RouterCall } from '@uniswap/v4-sdk'
import { EthSendTransactionRPCActions } from 'src/app/features/dappRequests/types/DappRequestTypes'
import { parseCalldata as parseNfPMCalldata } from 'src/app/features/dappRequests/types/NonfungiblePositionManager'
import { NonfungiblePositionManagerCall } from 'src/app/features/dappRequests/types/NonfungiblePositionManagerTypes'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { wrappedNativeCurrency } from 'uniswap/src/utils/currency'
import methodHashToFunctionSignature from 'utilities/src/calldata/methodHashToFunctionSignature'
import noop from 'utilities/src/react/noop'

interface GetCalldataInfoFromTransactionReturnValue {
  functionSignature: string | undefined
  contractInteractions: EthSendTransactionRPCActions
  to: string | undefined
  parsedCalldata?: V4RouterCall | UniversalRouterCall | NonfungiblePositionManagerCall
}

function getCalldataInfoFromTransaction(
  data: string,
  to: string | undefined,
  chainId: UniverseChainId | undefined,
): GetCalldataInfoFromTransactionReturnValue {
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

      if (v4Calldata) {
        result.contractInteractions = EthSendTransactionRPCActions.Swap
        result.parsedCalldata = v4Calldata
        return result
      }
    } catch (e) {
      noop()
    }
    try {
      const URCalldata = CommandParser.parseCalldata(data)

      if (URCalldata) {
        result.contractInteractions = EthSendTransactionRPCActions.Swap
        result.parsedCalldata = URCalldata
        return result
      }
    } catch (e) {
      noop()
    }
    try {
      const NfPMCalldata = parseNfPMCalldata(data)

      if (NfPMCalldata) {
        result.contractInteractions = EthSendTransactionRPCActions.LP
        result.parsedCalldata = NfPMCalldata
        return result
      }
    } catch (e) {
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

export default getCalldataInfoFromTransaction
