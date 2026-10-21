import { UniverseChainId } from '@universe/chains'
// Saga handlers — redux-saga binds the receiver via call([obj, method]), which unbound-method can't model.
/* oxlint-disable typescript/unbound-method */
import { DappInfo } from 'src/app/features/dapp/store'
import type { SenderTabInfo } from 'src/app/features/dappRequests/shared'
import { ChainIdResponse, GetChainIdRequest } from 'src/app/features/dappRequests/types/DappRequestTypes'
import { dappResponseMessageChannel } from 'src/background/messagePassing/messageChannels'
import { call } from 'typed-redux-saga'
import { chainIdToHexadecimalString } from 'uniswap/src/features/chains/utils'
import { DappResponseType } from 'uniswap/src/features/dappRequests/types'

export function* getChainId({
  request,
  senderTabInfo,
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

  yield* call(dappResponseMessageChannel.sendMessageToFrame, senderTabInfo, response)
}

export function* getChainIdNoDappInfo({
  request,
  senderTabInfo,
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

  yield* call(dappResponseMessageChannel.sendMessageToFrame, senderTabInfo, response)
}
