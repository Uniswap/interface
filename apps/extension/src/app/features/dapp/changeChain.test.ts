import { JsonRpcProvider } from '@ethersproject/providers'
import { providerErrors, serializeError } from '@metamask/rpc-errors'
import { changeChain } from 'src/app/features/dapp/changeChain'
import { dappStore } from 'src/app/features/dapp/store'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { chainIdToHexadecimalString } from 'uniswap/src/features/chains/utils'
import { DappResponseType } from 'uniswap/src/features/dappRequests/types'
import { ExtensionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'

// Mock dependencies
jest.mock('@ethersproject/providers')
jest.mock('@metamask/rpc-errors')
jest.mock('src/app/features/dapp/store')
jest.mock('uniswap/src/features/telemetry/send')
jest.mock('uniswap/src/features/chains/utils')

describe('changeChain', () => {
  const mockRequestId = 'test-request-id'
  const mockProviderUrl = 'http://localhost:8545'
  const mockChainId = 1 as UniverseChainId

  let mockProvider: JsonRpcProvider

  beforeEach(() => {
    jest.clearAllMocks()

    mockProvider = {
      connection: {
        url: mockProviderUrl,
      },
    } as JsonRpcProvider
  })

  it('should return an error response if updatedChainId is null', () => {
    const response = changeChain({
      activeConnectedAddress: undefined,
      dappUrl: undefined,
      provider: mockProvider,
      requestId: mockRequestId,
      updatedChainId: null,
    })

    expect(response).toEqual({
      type: DappResponseType.ErrorResponse,
      error: serializeError(
        providerErrors.custom({
          code: 4902,
          message: 'Uniswap Wallet does not support switching to this chain.',
        }),
      ),
      requestId: mockRequestId,
    })
  })

  it('should return an error response if provider is null', () => {
    const response = changeChain({
      activeConnectedAddress: undefined,
      dappUrl: undefined,
      provider: null,
      requestId: mockRequestId,
      updatedChainId: mockChainId,
    })

    expect(response).toEqual({
      type: DappResponseType.ErrorResponse,
      error: serializeError(providerErrors.unauthorized()),
      requestId: mockRequestId,
    })
  })

  it('should update dappStore and send analytics event if dappUrl is provided', () => {
    const mockDappUrl = 'http://example.com'

    const response = changeChain({
      activeConnectedAddress: '0xAddress',
      dappUrl: mockDappUrl,
      provider: mockProvider,
      requestId: mockRequestId,
      updatedChainId: mockChainId,
    })

    expect(dappStore.updateDappLatestChainId).toHaveBeenCalledWith(mockDappUrl, mockChainId)
    expect(sendAnalyticsEvent).toHaveBeenCalledWith(ExtensionEventName.DappChangeChain, {
      dappUrl: mockDappUrl,
      chainId: mockChainId,
      activeConnectedAddress: '0xAddress',
    })

    expect(response).toEqual({
      type: DappResponseType.ChainChangeResponse,
      requestId: mockRequestId,
      providerUrl: mockProviderUrl,
      chainId: chainIdToHexadecimalString(mockChainId),
    })
  })

  it('should not update dappStore if dappUrl is not provided', () => {
    const response = changeChain({
      activeConnectedAddress: '0xAddress',
      dappUrl: undefined,
      provider: mockProvider,
      requestId: mockRequestId,
      updatedChainId: mockChainId,
    })

    expect(dappStore.updateDappLatestChainId).not.toHaveBeenCalled()

    expect(response).toEqual({
      type: DappResponseType.ErrorResponse,
      error: serializeError(providerErrors.unauthorized()),
      requestId: mockRequestId,
    })
  })
})
