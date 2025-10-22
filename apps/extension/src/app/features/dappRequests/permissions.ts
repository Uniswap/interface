/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { rpcErrors, serializeError } from '@metamask/rpc-errors'
import { removeDappConnection } from 'src/app/features/dapp/actions'
import { DappInfo } from 'src/app/features/dapp/store'
import { saveAccount } from 'src/app/features/dappRequests/accounts'
import type { SenderTabInfo } from 'src/app/features/dappRequests/shared'
import {
  ErrorResponse,
  GetPermissionsRequest,
  GetPermissionsResponse,
  RequestPermissionsRequest,
  RequestPermissionsResponse,
  RevokePermissionsRequest,
  RevokePermissionsResponse,
} from 'src/app/features/dappRequests/types/DappRequestTypes'
import { dappResponseMessageChannel } from 'src/background/messagePassing/messageChannels'
import { Permission } from 'src/contentScript/WindowEthereumRequestTypes'
import { call, put } from 'typed-redux-saga'
import { chainIdToHexadecimalString } from 'uniswap/src/features/chains/utils'
import { DappResponseType, EthMethod } from 'uniswap/src/features/dappRequests/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { extractBaseUrl } from 'utilities/src/format/urls'
import { logger } from 'utilities/src/logger/logger'

export function getPermissions(dappUrl: string | undefined, connectedAddresses: Address[] | undefined): Permission[] {
  const permissions: Permission[] = []
  const isDappConnected = connectedAddresses && connectedAddresses.length > 0
  if (isDappConnected && dappUrl) {
    // Safe to assume the eth_accounts permission can be added here,
    // since dappInfo will only exist if it as been approved already
    permissions.push({
      invoker: dappUrl,
      parentCapability: EthMethod.EthAccounts,
      caveats: [],
    })
  }

  return permissions
}

export function* handleGetPermissionsRequest({
  request,
  senderTabInfo: { id, url },
  dappInfo,
}: {
  request: GetPermissionsRequest
  senderTabInfo: SenderTabInfo
  dappInfo?: DappInfo
}) {
  const permissions: Permission[] = []
  if (dappInfo) {
    permissions.push({
      invoker: url,
      parentCapability: EthMethod.EthAccounts,
      caveats: [],
    })
  }

  const response: GetPermissionsResponse = {
    type: DappResponseType.GetPermissionsResponse,
    requestId: request.requestId,
    permissions,
  }
  yield* call(dappResponseMessageChannel.sendMessageToTab, id, response)
}

export function* handleRequestPermissions(request: RequestPermissionsRequest, senderTabInfo: SenderTabInfo) {
  const requestedPermissions = Object.keys(request.permissions)

  if (requestedPermissions.includes(EthMethod.EthAccounts)) {
    // Pre-emptively save the dapp connection, to avoid double-approval when dapp calls eth_requestAccounts
    const accountInfo = yield* call(saveAccount, senderTabInfo)
    const accounts = accountInfo && {
      connectedAddresses: accountInfo.connectedAddresses,
      chainId: chainIdToHexadecimalString(accountInfo.chainId),
      providerUrl: accountInfo.providerUrl,
    }

    const permissions: Permission[] = [
      {
        invoker: senderTabInfo.url,
        parentCapability: EthMethod.EthAccounts,
        caveats: [],
      },
    ]
    const response: RequestPermissionsResponse = {
      type: DappResponseType.RequestPermissionsResponse,
      requestId: request.requestId,
      permissions,
      accounts,
    }
    yield* call(dappResponseMessageChannel.sendMessageToTab, senderTabInfo.id, response)
  } else {
    logger.info('saga.ts', 'handleRequestPermissions', 'Unknown permissions requested', requestedPermissions)
    yield* call(dappResponseMessageChannel.sendMessageToTab, senderTabInfo.id, {
      type: DappResponseType.ErrorResponse,
      error: serializeError(rpcErrors.methodNotFound()),
      requestId: request.requestId,
    } satisfies ErrorResponse)
  }
}

export function* handleRevokePermissions(request: RevokePermissionsRequest, senderTabInfo: SenderTabInfo) {
  const revokedPermissions = Object.keys(request.permissions)

  if (revokedPermissions.includes(EthMethod.EthAccounts)) {
    const dappUrl = extractBaseUrl(senderTabInfo.url)

    if (!dappUrl) {
      return
    }

    yield* call(removeDappConnection, dappUrl, undefined)
    yield* put(pushNotification({ type: AppNotificationType.DappDisconnected, dappIconUrl: senderTabInfo.favIconUrl }))

    yield* call(dappResponseMessageChannel.sendMessageToTab, senderTabInfo.id, {
      type: DappResponseType.RevokePermissionsResponse,
      requestId: request.requestId,
    } satisfies RevokePermissionsResponse)
  } else {
    logger.info('saga.ts', 'handleRevokePermissions', 'Unknown permissions requested', revokedPermissions)
    yield* call(dappResponseMessageChannel.sendMessageToTab, senderTabInfo.id, {
      type: DappResponseType.ErrorResponse,
      error: serializeError(rpcErrors.methodNotFound()),
      requestId: request.requestId,
    } satisfies ErrorResponse)
  }
}
