import { requestRequiresSignature } from 'src/app/features/dappRequests/requestRequiresSignature'
import type { DappRequestStoreItem } from 'src/app/features/dappRequests/shared'
import type { WithMetadata } from 'src/app/features/dappRequests/slice'
import { DappRequestType } from 'uniswap/src/features/dappRequests/types'

const SIGNING_TYPES = [
  DappRequestType.SendCalls,
  DappRequestType.SendTransaction,
  DappRequestType.SignMessage,
  DappRequestType.SignTransaction,
  DappRequestType.SignTypedData,
]

const NON_SIGNING_TYPES = [
  DappRequestType.ChangeChain,
  DappRequestType.GetAccount,
  DappRequestType.GetCallsStatus,
  DappRequestType.GetCapabilities,
  DappRequestType.GetChainId,
  DappRequestType.GetPermissions,
  DappRequestType.ProviderDirect,
  DappRequestType.RequestAccount,
  DappRequestType.RequestPermissions,
  DappRequestType.RevokePermissions,
  DappRequestType.UniswapOpenSidebar,
]

function requestOfType(type: DappRequestType): WithMetadata<DappRequestStoreItem> {
  return {
    dappRequest: { type, requestId: '1' },
    senderTabInfo: {
      tabId: 1,
      frameId: 0,
      frameUrl: 'http://example.com',
      tabUrl: 'http://example.com',
      isCrossOriginFrame: false,
    },
  } as unknown as WithMetadata<DappRequestStoreItem>
}

describe('requestRequiresSignature', () => {
  it.each(SIGNING_TYPES)('is true for %s, which ends in a signature', (type) => {
    expect(requestRequiresSignature(requestOfType(type))).toBe(true)
  })

  it.each(NON_SIGNING_TYPES)('is false for %s, which needs no key', (type) => {
    expect(requestRequiresSignature(requestOfType(type))).toBe(false)
  })

  it('classifies every request type, so adding one to the enum fails here until it is classified', () => {
    expect([...SIGNING_TYPES, ...NON_SIGNING_TYPES].sort()).toEqual(Object.values(DappRequestType).sort())
  })

  it('treats an unrecognized request type as needing a signature', () => {
    expect(requestRequiresSignature(requestOfType('SomeFutureSigningRequest' as DappRequestType))).toBe(true)
  })
})
