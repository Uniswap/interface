import { DappInfo } from 'src/app/features/dapp/store'
import { SenderTabInfo } from 'src/app/features/dappRequests/slice'
import {
  ChainIdResponse,
  DappResponseType,
  GetChainIdRequest,
} from 'src/app/features/dappRequests/types/DappRequestTypes'
import { dappResponseMessageChannel } from 'src/background/messagePassing/messageChannels'
import { call } from 'typed-redux-saga'
import { chainIdToHexadecimalString } from 'uniswap/src/features/chains/utils'
import { UniverseChainId } from 'uniswap/src/types/chains'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function* getChainId(request: GetChainIdRequest, { id }: SenderTabInfo, dappInfo: DappInfo) {
  const response: ChainIdResponse = {
    type: DappResponseType.ChainIdResponse,
    requestId: request.requestId,
    chainId: chainIdToHexadecimalString(dappInfo.lastChainId),
  }

  yield* call(dappResponseMessageChannel.sendMessageToTab, id, response)
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function* getChainIdNoDappInfo(request: GetChainIdRequest, { id }: SenderTabInfo) {
  // Sending mainnet as default chain for unconnected dapps
  const response: ChainIdResponse = {
    type: DappResponseType.ChainIdResponse,
    requestId: request.requestId,
    chainId: chainIdToHexadecimalString(UniverseChainId.Mainnet),
  }

  yield* call(dappResponseMessageChannel.sendMessageToTab, id, response)
}
