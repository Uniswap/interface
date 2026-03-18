import { DappInfo } from 'src/app/features/dapp/store'
import type { SenderTabInfo } from 'src/app/features/dappRequests/shared'
import { ChainIdResponse, GetChainIdRequest } from 'src/app/features/dappRequests/types/DappRequestTypes'
import { dappResponseMessageChannel } from 'src/background/messagePassing/messageChannels'
import { call } from 'typed-redux-saga'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { chainIdToHexadecimalString } from 'uniswap/src/features/chains/utils'
import { DappResponseType } from 'uniswap/src/features/dappRequests/types'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function* getChainId({
  request,
  senderTabInfo: { id },
  dappInfo,
}: {
  request: GetChainIdRequest
  senderTabInfo: SenderTabInfo
  dappInfo: DappInfo
}) {
  const response: ChainIdResponse = {
    type: DappResponseType.ChainIdResponse,
    requestId: request.requestId,
    chainId: chainIdToHexadecimalString(dappInfo.lastChainId),
  }

  yield* call(dappResponseMessageChannel.sendMessageToTab, id, response)
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function* getChainIdNoDappInfo({
  request,
  senderTabInfo: { id },
  defaultChainId,
}: {
  request: GetChainIdRequest
  senderTabInfo: SenderTabInfo
  defaultChainId: UniverseChainId
}) {
  // Sending default chain for unconnected dapps
  const response: ChainIdResponse = {
    type: DappResponseType.ChainIdResponse,
    requestId: request.requestId,
    chainId: chainIdToHexadecimalString(defaultChainId),
  }

  yield* call(dappResponseMessageChannel.sendMessageToTab, id, response)
}
