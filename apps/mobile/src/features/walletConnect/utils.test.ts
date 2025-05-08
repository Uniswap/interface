import { utils } from 'ethers'
import {
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
    const result = parseGetCapabilitiesRequest(EthMethod.GetCapabilities, mockTopic, mockInternalId, mockDapp, [
      TEST_ADDRESS,
    ])

    expect(result).toEqual({
      type: EthMethod.GetCapabilities,
      sessionId: mockTopic,
      internalId: String(mockInternalId),
      account: TEST_ADDRESS,
      chainIds: undefined,
      dapp: {
        name: mockDapp.name,
        url: mockDapp.url,
        icon: mockDapp.icons[0],
        source: 'walletconnect',
      },
    })
  })

  it('handles request with address and chain IDs', () => {
    const chainIds = [UniverseChainId.Mainnet, UniverseChainId.Polygon]
    const result = parseGetCapabilitiesRequest(EthMethod.GetCapabilities, mockTopic, mockInternalId, mockDapp, [
      TEST_ADDRESS,
      chainIds.map((c) => c.toString()),
    ])

    expect(result).toEqual({
      type: EthMethod.GetCapabilities,
      sessionId: mockTopic,
      internalId: String(mockInternalId),
      account: TEST_ADDRESS,
      chainIds,
      dapp: {
        name: mockDapp.name,
        url: mockDapp.url,
        icon: mockDapp.icons[0],
        source: 'walletconnect',
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

  it('parses personal_sign request correctly', () => {
    const message = '0x48656c6c6f20576f726c64' // "Hello World" in hex
    const params = [message, TEST_ADDRESS]

    const result = parseSignRequest(EthMethod.PersonalSign, mockTopic, mockInternalId, mockChainId, mockDapp, params)

    expect(result).toEqual({
      type: EthMethod.PersonalSign,
      sessionId: mockTopic,
      internalId: String(mockInternalId),
      account: TEST_ADDRESS,
      chainId: mockChainId,
      rawMessage: message,
      message: 'Hello World',
      dapp: {
        name: mockDapp.name,
        url: mockDapp.url,
        icon: mockDapp.icons[0],
        source: 'walletconnect',
      },
    })
  })

  it('parses eth_sign request correctly', () => {
    const message = '0x48656c6c6f20576f726c64' // "Hello World" in hex
    const params = [TEST_ADDRESS, message]

    const result = parseSignRequest(EthMethod.EthSign, mockTopic, mockInternalId, mockChainId, mockDapp, params)

    expect(result).toEqual({
      type: EthMethod.EthSign,
      sessionId: mockTopic,
      internalId: String(mockInternalId),
      account: TEST_ADDRESS,
      chainId: mockChainId,
      rawMessage: message,
      message: 'Hello World',
      dapp: {
        name: mockDapp.name,
        url: mockDapp.url,
        icon: mockDapp.icons[0],
        source: 'walletconnect',
      },
    })
  })

  it('parses eth_signTypedData request correctly', () => {
    const typedData = '{"types":{"EIP712Domain":[]},"domain":{},"primaryType":"Mail","message":{}}'
    const params = [TEST_ADDRESS, typedData]

    const result = parseSignRequest(EthMethod.SignTypedData, mockTopic, mockInternalId, mockChainId, mockDapp, params)

    expect(result).toEqual({
      type: EthMethod.SignTypedData,
      sessionId: mockTopic,
      internalId: String(mockInternalId),
      account: TEST_ADDRESS,
      chainId: mockChainId,
      rawMessage: typedData,
      message: null,
      dapp: {
        name: mockDapp.name,
        url: mockDapp.url,
        icon: mockDapp.icons[0],
        source: 'walletconnect',
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

    const result = parseTransactionRequest(
      EthMethod.EthSendTransaction,
      mockTopic,
      mockInternalId,
      mockChainId,
      mockDapp,
      [txParams],
    )

    expect(result).toEqual({
      type: EthMethod.EthSendTransaction,
      sessionId: mockTopic,
      internalId: String(mockInternalId),
      account: TEST_ADDRESS,
      chainId: mockChainId,
      transaction: {
        from: TEST_ADDRESS,
        to: '0x1234567890123456789012345678901234567890',
        data: '0x',
        gasLimit: '0x5208',
        value: '0x0',
        // gasPrice and nonce should be omitted
      },
      dapp: {
        name: mockDapp.name,
        url: mockDapp.url,
        icon: mockDapp.icons[0],
        source: 'walletconnect',
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
      version: '1.0',
      capabilities: {
        eip155: {
          methods: ['eth_sendTransaction'],
        },
      },
    }

    const result = parseSendCallsRequest(
      mockTopic,
      mockInternalId,
      mockChainId,
      mockDapp,
      [sendCallsParams],
      'fallback-address',
    )

    expect(result).toEqual({
      type: EthMethod.SendCalls,
      sessionId: mockTopic,
      internalId: String(mockInternalId),
      account: TEST_ADDRESS,
      chainId: mockChainId,
      calls: sendCallsParams.calls,
      capabilities: sendCallsParams.capabilities,
      id: sendCallsParams.id,
      version: sendCallsParams.version,
      dapp: {
        name: mockDapp.name,
        url: mockDapp.url,
        icon: mockDapp.icons[0],
        source: 'walletconnect',
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
      version: '1.0',
    }

    const fallbackAddress = '0xfallbackaddress'
    const result = parseSendCallsRequest(
      mockTopic,
      mockInternalId,
      mockChainId,
      mockDapp,
      [sendCallsParams],
      fallbackAddress,
    )

    expect(result.account).toBe(fallbackAddress)
    expect(result.id).toBeTruthy() // Should generate a mock ID
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

    const result = parseGetCallsStatusRequest(mockTopic, mockInternalId, mockChainId, mockDapp, [requestId], account)

    expect(result).toEqual({
      type: EthMethod.GetCallsStatus,
      sessionId: mockTopic,
      internalId: String(mockInternalId),
      account,
      chainId: mockChainId,
      id: requestId,
      dapp: {
        name: mockDapp.name,
        url: mockDapp.url,
        icon: mockDapp.icons[0],
        source: 'walletconnect',
      },
    })
  })
})
