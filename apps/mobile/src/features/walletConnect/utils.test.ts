import { utils } from 'ethers'
import {
  convertCapabilitiesToScopedProperties,
  decodeMessage,
  getAccountAddressFromEIP155String,
  getChainIdFromEIP155String,
  getSupportedWalletConnectChains,
  parseGetCallsStatusRequest,
  parseGetCapabilitiesRequest,
  parseSendCallsRequest,
  parseSignRequest,
  parseTransactionRequest,
} from 'src/features/walletConnect/utils'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { EthMethod } from 'uniswap/src/features/dappRequests/types'
import { DappRequestType } from 'uniswap/src/types/walletConnect'

const EIP155_MAINNET = 'eip155:1'
const EIP155_POLYGON = 'eip155:137'
const EIP155_OPTIMISM = 'eip155:10'
const EIP155_LINEA_UNSUPPORTED = 'eip155:59144'

const TEST_ADDRESS = '0xdFb84E543C39ACa3c6a39ea4e3B6c40eE7d2EBdA'

describe(getAccountAddressFromEIP155String, () => {
  it('handles valid eip155 mainnet address', () => {
    expect(getAccountAddressFromEIP155String(`${EIP155_MAINNET}:${TEST_ADDRESS}`)).toBe(TEST_ADDRESS)
  })

  it('handles valid eip155 polygon address', () => {
    expect(getAccountAddressFromEIP155String(`${EIP155_POLYGON}:${TEST_ADDRESS}`)).toBe(TEST_ADDRESS)
  })

  it('handles invalid eip155 address', () => {
    expect(getAccountAddressFromEIP155String(TEST_ADDRESS)).toBeNull()
  })
})

describe(getSupportedWalletConnectChains, () => {
  it('handles list of valid chains', () => {
    expect(getSupportedWalletConnectChains([EIP155_MAINNET, EIP155_POLYGON, EIP155_OPTIMISM])).toEqual([
      UniverseChainId.Mainnet,
      UniverseChainId.Polygon,
      UniverseChainId.Optimism,
    ])
  })

  it('handles list of valid chains including an invalid chain', () => {
    expect(getSupportedWalletConnectChains([EIP155_MAINNET, EIP155_POLYGON, EIP155_LINEA_UNSUPPORTED])).toEqual([
      UniverseChainId.Mainnet,
      UniverseChainId.Polygon,
    ])
  })
})

describe(getChainIdFromEIP155String, () => {
  it('handles valid eip155 mainnet address', () => {
    expect(getChainIdFromEIP155String(EIP155_MAINNET)).toBe(UniverseChainId.Mainnet)
  })

  it('handles valid eip155 optimism address', () => {
    expect(getChainIdFromEIP155String(EIP155_OPTIMISM)).toBe(UniverseChainId.Optimism)
  })

  it('handles invalid eip155 address', () => {
    expect(getChainIdFromEIP155String(EIP155_LINEA_UNSUPPORTED)).toBeNull()
  })
})

describe('isHexString', () => {
  test('should return true for valid hex string', () => {
    const validHex = '0x5468697320697320612074657374206d657373616765'
    expect(utils.isHexString(validHex)).toBe(true)
  })

  test('should return false for invalid hex string', () => {
    const invalidHex = '546869732069732G20612074657374206d657373616765' // Invalid hex
    expect(utils.isHexString(invalidHex)).toBe(false)
  })

  test('should return false for plain text', () => {
    const plainText = 'This is a plain text message'
    expect(utils.isHexString(plainText)).toBe(false)
  })
})

describe('decodeMessage', () => {
  test('should decode hex-encoded message', () => {
    const hexMessage = '0x5468697320697320612074657374206d657373616765'
    const expectedMessage = 'This is a test message'
    const result = decodeMessage(hexMessage)
    expect(result).toBe(expectedMessage)
  })

  test('should return plain text message unchanged', () => {
    const plainText = 'This is a plain text message'
    const result = decodeMessage(plainText)
    expect(result).toBe(plainText)
  })
})

describe(parseGetCapabilitiesRequest, () => {
  const mockTopic = 'test-topic'
  const mockInternalId = 123
  const mockDapp = {
    name: 'Test Dapp',
    description: 'Test Dapp Description',
    url: 'https://test.com',
    icons: ['https://test.com/icon.png'],
  }

  it('handles request with address only', () => {
    const result = parseGetCapabilitiesRequest({
      method: EthMethod.WalletGetCapabilities,
      topic: mockTopic,
      internalId: mockInternalId,
      dapp: mockDapp,
      requestParams: [TEST_ADDRESS],
    })

    expect(result).toEqual({
      type: EthMethod.WalletGetCapabilities,
      sessionId: mockTopic,
      internalId: String(mockInternalId),
      account: TEST_ADDRESS,
      chainIds: undefined,
      isLinkModeSupported: false,
      dappRequestInfo: {
        name: mockDapp.name,
        url: mockDapp.url,
        icon: mockDapp.icons[0],
        requestType: DappRequestType.WalletConnectSessionRequest,
      },
    })
  })

  it('handles request with address and chain IDs', () => {
    const chainIds = [UniverseChainId.Mainnet, UniverseChainId.Polygon]
    const result = parseGetCapabilitiesRequest({
      method: EthMethod.WalletGetCapabilities,
      topic: mockTopic,
      internalId: mockInternalId,
      dapp: mockDapp,
      requestParams: [TEST_ADDRESS, chainIds.map((c) => `0x${c.toString(16)}`)],
    })

    expect(result).toEqual({
      type: EthMethod.WalletGetCapabilities,
      sessionId: mockTopic,
      internalId: String(mockInternalId),
      account: TEST_ADDRESS,
      chainIds,
      isLinkModeSupported: false,
      dappRequestInfo: {
        name: mockDapp.name,
        url: mockDapp.url,
        icon: mockDapp.icons[0],
        requestType: DappRequestType.WalletConnectSessionRequest,
      },
    })
  })
})

describe(parseSignRequest, () => {
  const mockTopic = 'test-topic'
  const mockInternalId = 123
  const mockChainId = UniverseChainId.Mainnet
  const mockDapp = {
    name: 'Test Dapp',
    description: 'Test Dapp Description',
    url: 'https://test.com',
    icons: ['https://test.com/icon.png'],
  }

  it('parses personal_sign request correctly (standard hex-encoded message)', () => {
    const message = '0x48656c6c6f20576f726c64' // "Hello World" in hex
    const params = [message, TEST_ADDRESS]

    const result = parseSignRequest({
      method: EthMethod.PersonalSign,
      topic: mockTopic,
      internalId: mockInternalId,
      chainId: mockChainId,
      dapp: mockDapp,
      requestParams: params,
    })

    expect(result).toEqual({
      type: EthMethod.PersonalSign,
      sessionId: mockTopic,
      internalId: String(mockInternalId),
      account: TEST_ADDRESS,
      chainId: mockChainId,
      rawMessage: message,
      message: 'Hello World',
      isLinkModeSupported: false,
      dappRequestInfo: {
        name: mockDapp.name,
        url: mockDapp.url,
        icon: mockDapp.icons[0],
        requestType: DappRequestType.WalletConnectSessionRequest,
      },
    })
  })

  it('parses eth_sign request correctly', () => {
    const message = '0x48656c6c6f20576f726c64' // "Hello World" in hex
    const params = [TEST_ADDRESS, message]

    const result = parseSignRequest({
      method: EthMethod.EthSign,
      topic: mockTopic,
      internalId: mockInternalId,
      chainId: mockChainId,
      dapp: mockDapp,
      requestParams: params,
    })

    expect(result).toEqual({
      type: EthMethod.EthSign,
      sessionId: mockTopic,
      internalId: String(mockInternalId),
      account: TEST_ADDRESS,
      chainId: mockChainId,
      rawMessage: message,
      message: 'Hello World',
      isLinkModeSupported: false,
      dappRequestInfo: {
        name: mockDapp.name,
        url: mockDapp.url,
        icon: mockDapp.icons[0],
        requestType: DappRequestType.WalletConnectSessionRequest,
      },
    })
  })

  it('parses eth_signTypedData request correctly', () => {
    const typedData = '{"types":{"EIP712Domain":[]},"domain":{},"primaryType":"Mail","message":{}}'
    const params = [TEST_ADDRESS, typedData]

    const result = parseSignRequest({
      method: EthMethod.SignTypedData,
      topic: mockTopic,
      internalId: mockInternalId,
      chainId: mockChainId,
      dapp: mockDapp,
      requestParams: params,
    })

    expect(result).toEqual({
      type: EthMethod.SignTypedData,
      sessionId: mockTopic,
      internalId: String(mockInternalId),
      account: TEST_ADDRESS,
      chainId: mockChainId,
      rawMessage: typedData,
      message: null,
      isLinkModeSupported: false,
      dappRequestInfo: {
        name: mockDapp.name,
        url: mockDapp.url,
        icon: mockDapp.icons[0],
        requestType: DappRequestType.WalletConnectSessionRequest,
      },
    })
  })
})

describe(parseTransactionRequest, () => {
  const mockTopic = 'test-topic'
  const mockInternalId = 123
  const mockChainId = UniverseChainId.Mainnet
  const mockDapp = {
    name: 'Test Dapp',
    description: 'Test Dapp Description',
    url: 'https://test.com',
    icons: ['https://test.com/icon.png'],
  }

  it('parses eth_sendTransaction request correctly', () => {
    const txParams = {
      from: TEST_ADDRESS,
      to: '0x1234567890123456789012345678901234567890',
      data: '0x',
      gasLimit: '0x5208', // 21000 in hex
      value: '0x0',
      gasPrice: '0x4a817c800', // This should be omitted in the result
      nonce: '0x1', // This should be omitted in the result
    }

    const result = parseTransactionRequest({
      method: EthMethod.EthSendTransaction,
      topic: mockTopic,
      internalId: mockInternalId,
      chainId: mockChainId,
      dapp: mockDapp,
      requestParams: [txParams],
    })

    expect(result).toEqual({
      type: EthMethod.EthSendTransaction,
      sessionId: mockTopic,
      internalId: String(mockInternalId),
      account: TEST_ADDRESS,
      chainId: mockChainId,
      isLinkModeSupported: false,
      transaction: {
        from: TEST_ADDRESS,
        to: '0x1234567890123456789012345678901234567890',
        data: '0x',
        gasLimit: '0x5208',
        value: '0x0',
        // gasPrice and nonce should be omitted
      },
      dappRequestInfo: {
        name: mockDapp.name,
        url: mockDapp.url,
        icon: mockDapp.icons[0],
        requestType: DappRequestType.WalletConnectSessionRequest,
      },
    })
  })
})

describe(parseSendCallsRequest, () => {
  const mockTopic = 'test-topic'
  const mockInternalId = 123
  const mockChainId = UniverseChainId.Mainnet
  const mockDapp = {
    name: 'Test Dapp',
    description: 'Test Dapp Description',
    url: 'https://test.com',
    icons: ['https://test.com/icon.png'],
  }

  it('parses wallet_sendCalls request with from address', () => {
    const sendCallsParams = {
      from: TEST_ADDRESS,
      calls: [
        {
          to: '0x1234567890123456789012345678901234567890',
          data: '0xabcdef',
          value: '0x0',
        },
      ],
      chainId: '0x01',
      id: 'test-batch-id',
      version: '2.0.0',
      capabilities: {
        eip155: {
          methods: ['eth_sendTransaction'],
        },
      },
    }

    const result = parseSendCallsRequest({
      topic: mockTopic,
      internalId: mockInternalId,
      chainId: mockChainId,
      dapp: mockDapp,
      requestParams: [sendCallsParams],
      account: 'fallback-address',
    })

    expect(result).toEqual({
      type: EthMethod.WalletSendCalls,
      sessionId: mockTopic,
      internalId: String(mockInternalId),
      account: TEST_ADDRESS,
      chainId: mockChainId,
      calls: sendCallsParams.calls,
      capabilities: sendCallsParams.capabilities,
      id: sendCallsParams.id,
      version: sendCallsParams.version,
      isLinkModeSupported: false,
      dappRequestInfo: {
        name: mockDapp.name,
        url: mockDapp.url,
        icon: mockDapp.icons[0],
        requestType: DappRequestType.WalletConnectSessionRequest,
      },
    })
  })

  it('uses fallback address when from is not provided', () => {
    const sendCallsParams = {
      chainId: '0x01',
      calls: [
        {
          to: '0x1234567890123456789012345678901234567890',
          data: '0xabcdef',
          value: '0x0',
        },
      ],
      version: '2.0.0',
    }

    const fallbackAddress = '0xfallbackaddress'
    const result = parseSendCallsRequest({
      topic: mockTopic,
      internalId: mockInternalId,
      chainId: mockChainId,
      dapp: mockDapp,
      requestParams: [sendCallsParams],
      account: fallbackAddress,
    })

    expect(result.account).toBe(fallbackAddress)
    expect(result.id).toBeTruthy() // Should generate a mock ID
  })
})

describe('personal_sign signAsString flag behavior', () => {
  it('should handle hex-encoded UTF-8 messages for personal_sign', () => {
    const hexEncodedMessage = '0x48656c6c6f20576f726c64' // "Hello World"
    const params = [hexEncodedMessage, TEST_ADDRESS]

    const result = parseSignRequest({
      method: EthMethod.PersonalSign,
      topic: 'test-topic',
      internalId: 123,
      chainId: UniverseChainId.Mainnet,
      dapp: {
        name: 'Test Dapp',
        description: 'Test Description',
        url: 'https://test.com',
        icons: ['https://test.com/icon.png'],
      },
      requestParams: params,
    })

    // rawMessage stays as hex for signing
    expect(result.rawMessage).toBe(hexEncodedMessage)
    // message is decoded for UI display
    expect(result.message).toBe('Hello World')
  })

  it('should handle plain text messages for personal_sign', () => {
    const plainText = 'Sign this message to authenticate'
    const params = [plainText, TEST_ADDRESS]

    const result = parseSignRequest({
      method: EthMethod.PersonalSign,
      topic: 'test-topic',
      internalId: 123,
      chainId: UniverseChainId.Mainnet,
      dapp: {
        name: 'Test Dapp',
        description: 'Test Description',
        url: 'https://test.com',
        icons: ['https://test.com/icon.png'],
      },
      requestParams: params,
    })

    // Plain text stays unchanged in both fields
    expect(result.rawMessage).toBe(plainText)
    expect(result.message).toBe(plainText)
  })
})

describe(parseGetCallsStatusRequest, () => {
  const mockTopic = 'test-topic'
  const mockInternalId = 123
  const mockChainId = UniverseChainId.Mainnet
  const mockDapp = {
    name: 'Test Dapp',
    description: 'Test Dapp Description',
    url: 'https://test.com',
    icons: ['https://test.com/icon.png'],
  }

  it('parses wallet_getCallsStatus request correctly', () => {
    const requestId = 'test-batch-id'
    const account = TEST_ADDRESS

    const result = parseGetCallsStatusRequest({
      topic: mockTopic,
      internalId: mockInternalId,
      chainId: mockChainId,
      dapp: mockDapp,
      requestParams: [requestId],
      account,
    })

    expect(result).toEqual({
      type: EthMethod.WalletGetCallsStatus,
      sessionId: mockTopic,
      internalId: String(mockInternalId),
      account,
      chainId: mockChainId,
      id: requestId,
      isLinkModeSupported: false,
      dappRequestInfo: {
        name: mockDapp.name,
        url: mockDapp.url,
        icon: mockDapp.icons[0],
        requestType: DappRequestType.WalletConnectSessionRequest,
      },
    })
  })
})

describe(convertCapabilitiesToScopedProperties, () => {
  it('converts single chain capability to CAIP-2 format', () => {
    const capabilities = {
      '0xa': {
        atomic: { status: 'supported' },
      },
    }

    const result = convertCapabilitiesToScopedProperties(capabilities)

    expect(result).toEqual({
      'eip155:10': {
        atomic: { status: 'supported' },
      },
    })
  })

  it('converts multiple chain capabilities to CAIP-2 format', () => {
    const capabilities = {
      '0x1': {
        atomic: { status: 'supported' },
      },
      '0x89': {
        atomic: { status: 'unsupported' },
      },
      '0xa': {
        atomic: { status: 'supported' },
        paymasterService: { supported: true },
      },
    }

    const result = convertCapabilitiesToScopedProperties(capabilities)

    expect(result).toEqual({
      'eip155:1': {
        atomic: { status: 'supported' },
      },
      'eip155:137': {
        atomic: { status: 'unsupported' },
      },
      'eip155:10': {
        atomic: { status: 'supported' },
        paymasterService: { supported: true },
      },
    })
  })

  it('returns empty object when given empty capabilities', () => {
    const capabilities = {}

    const result = convertCapabilitiesToScopedProperties(capabilities)

    expect(result).toEqual({})
  })

  it('handles invalid hex chain IDs that cause errors', () => {
    const capabilities = {
      '0x1': {
        atomic: { status: 'supported' },
      },
      'invalid-hex': {
        atomic: { status: 'unsupported' },
      },
      '0x89': {
        atomic: { status: 'supported' },
      },
    }

    const result = convertCapabilitiesToScopedProperties(capabilities)

    // hexToNumber returns NaN for invalid hex, which should be excluded
    // The function continues execution despite the invalid chain ID
    expect(result).toHaveProperty('eip155:1')
    expect(result).toHaveProperty('eip155:137')
    expect(result).not.toHaveProperty('eip155:NaN')
    expect(result['eip155:1']).toEqual({
      atomic: { status: 'supported' },
    })
    expect(result['eip155:137']).toEqual({
      atomic: { status: 'supported' },
    })
  })
})
