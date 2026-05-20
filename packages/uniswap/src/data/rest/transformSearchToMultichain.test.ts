import { SearchTokensResponse } from '@uniswap/client-data-api/dist/data/v1/search_pb'
import { TokenProtectionInfo } from '@uniswap/client-data-api/dist/data/v1/searchTypes_pb'
import { FeeData, MultichainToken, Pool, SpamCode, Token } from '@uniswap/client-data-api/dist/data/v1/searchTypes_pb'
import {
  shouldTransformSearchToMultichain,
  transformSearchToMultichain,
} from 'uniswap/src/data/rest/transformSearchToMultichain'

function createSearchToken(
  overrides: {
    tokenId?: string
    chainId?: number
    address?: string
    decimals?: number
    symbol?: string
    name?: string
    standard?: string
    projectName?: string
    logoUrl?: string
    safetyLevel?: string
    spamCode?: SpamCode
    isSpam?: string
    feeData?: FeeData
    protectionInfo?: TokenProtectionInfo
  } = {},
): Token {
  return new Token({
    tokenId: overrides.tokenId ?? 'TOKEN:1:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    chainId: overrides.chainId ?? 1,
    address: overrides.address ?? '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    decimals: overrides.decimals ?? 6,
    symbol: overrides.symbol ?? 'USDC',
    name: overrides.name ?? 'USD Coin',
    standard: overrides.standard ?? 'ERC20',
    projectName: overrides.projectName ?? 'Circle',
    logoUrl: overrides.logoUrl ?? 'https://example.com/usdc.png',
    safetyLevel: overrides.safetyLevel ?? 'VERIFIED',
    spamCode: overrides.spamCode ?? SpamCode.NOT_SPAM,
    isSpam: overrides.isSpam ?? 'false',
    feeData: overrides.feeData,
    protectionInfo: overrides.protectionInfo,
  })
}

describe('transformSearchToMultichain', () => {
  it('should return undefined when response is undefined', () => {
    expect(transformSearchToMultichain(undefined)).toBeUndefined()
  })

  it('should return response unchanged when tokens is empty', () => {
    const response = new SearchTokensResponse({ tokens: [], pools: [], multichainTokens: [] })
    expect(transformSearchToMultichain(response)).toBe(response)
  })

  it('should transform one token into one MultichainToken with one ChainToken', () => {
    const token = createSearchToken({
      tokenId: 'TOKEN:1:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      chainId: 1,
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      standard: 'ERC20',
      projectName: 'Circle',
      logoUrl: 'https://example.com/usdc.png',
      safetyLevel: 'VERIFIED',
      isSpam: 'false',
    })
    const response = new SearchTokensResponse({ tokens: [token], pools: [], multichainTokens: [] })

    const result = transformSearchToMultichain(response)

    expect(result).not.toBe(response)
    expect(result.tokens).toEqual([])
    expect(result.multichainTokens).toHaveLength(1)

    const mc = result.multichainTokens[0]!
    expect(mc.multichainId).toBe('TOKEN:1:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
    expect(mc.symbol).toBe('USDC')
    expect(mc.name).toBe('USD Coin')
    expect(mc.standard).toBe('ERC20')
    expect(mc.projectName).toBe('Circle')
    expect(mc.logoUrl).toBe('https://example.com/usdc.png')
    expect(mc.safetyLevel).toBe('VERIFIED')
    expect(mc.isSpam).toBe('false')

    expect(mc.chainTokens).toHaveLength(1)
    expect(mc.chainTokens[0]?.chainId).toBe(1)
    expect(mc.chainTokens[0]?.address).toBe('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
    expect(mc.chainTokens[0]?.decimals).toBe(6)
    expect(mc.chainTokens[0]?.safetyLevel).toBe('VERIFIED')
    expect(mc.chainTokens[0]?.isSpam).toBe('false')
  })

  it('should transform multiple tokens into multiple MultichainTokens', () => {
    const usdc = createSearchToken({ chainId: 1, symbol: 'USDC' })
    const eth = createSearchToken({
      tokenId: 'TOKEN:1:ETH',
      chainId: 1,
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
    })
    const response = new SearchTokensResponse({ tokens: [usdc, eth], pools: [], multichainTokens: [] })

    const result = transformSearchToMultichain(response)

    expect(result.tokens).toEqual([])
    expect(result.multichainTokens).toHaveLength(2)
    expect(result.multichainTokens[0]?.symbol).toBe('USDC')
    expect(result.multichainTokens[0]?.chainTokens).toHaveLength(1)
    expect(result.multichainTokens[1]?.symbol).toBe('ETH')
    expect(result.multichainTokens[1]?.chainTokens[0]?.chainId).toBe(1)
    expect(result.multichainTokens[1]?.chainTokens[0]?.decimals).toBe(18)
  })

  it('should clear tokens after transform', () => {
    const token = createSearchToken()
    const response = new SearchTokensResponse({ tokens: [token], pools: [], multichainTokens: [] })

    const result = transformSearchToMultichain(response)

    expect(result.tokens).toEqual([])
    expect(result.multichainTokens).toHaveLength(1)
  })

  it('should preserve pools unchanged', () => {
    const pool = new Pool({ id: 'pool-1', chainId: 1, feeTier: 3000, protocolVersion: 'V3' })
    const token = createSearchToken()
    const response = new SearchTokensResponse({ tokens: [token], pools: [pool], multichainTokens: [] })

    const result = transformSearchToMultichain(response)

    expect(result.pools).toHaveLength(1)
    expect(result.pools[0]?.id).toBe('pool-1')
    expect(result.pools[0]?.feeTier).toBe(3000)
  })

  it('should copy safety and spam fields to both MultichainToken and ChainToken', () => {
    const token = createSearchToken({
      safetyLevel: 'MEDIUM_WARNING',
      spamCode: SpamCode.SPAM,
      isSpam: 'true',
    })
    const response = new SearchTokensResponse({ tokens: [token], pools: [], multichainTokens: [] })

    const result = transformSearchToMultichain(response)
    const mc = result.multichainTokens[0]!

    expect(mc.safetyLevel).toBe('MEDIUM_WARNING')
    expect(mc.spamCode).toBe(SpamCode.SPAM)
    expect(mc.isSpam).toBe('true')

    expect(mc.chainTokens[0]?.safetyLevel).toBe('MEDIUM_WARNING')
    expect(mc.chainTokens[0]?.spamCode).toBe(SpamCode.SPAM)
    expect(mc.chainTokens[0]?.isSpam).toBe('true')
  })

  it('should preserve feeData when present', () => {
    const feeData = new FeeData({ sellFeeBps: '100', buyFeeBps: '50', feeTakenOnTransfer: true })
    const token = createSearchToken({ feeData })
    const response = new SearchTokensResponse({ tokens: [token], pools: [], multichainTokens: [] })

    const result = transformSearchToMultichain(response)
    const mc = result.multichainTokens[0]!

    expect(mc.feeData?.sellFeeBps).toBe('100')
    expect(mc.feeData?.buyFeeBps).toBe('50')
    expect(mc.chainTokens[0]?.feeData?.sellFeeBps).toBe('100')
  })

  it('should preserve protectionInfo when present', () => {
    const protectionInfo = new TokenProtectionInfo({
      result: 'MALICIOUS',
      tokenId: 'TOKEN:1:0xbad',
      chainId: 1,
      attackTypes: ['IMPERSONATOR'],
      address: '0xbad',
    })
    const token = createSearchToken({ protectionInfo })
    const response = new SearchTokensResponse({ tokens: [token], pools: [], multichainTokens: [] })

    const result = transformSearchToMultichain(response)
    const mc = result.multichainTokens[0]!

    expect(mc.protectionInfo?.result).toBe('MALICIOUS')
    expect(mc.protectionInfo?.attackTypes).toEqual(['IMPERSONATOR'])
    expect(mc.chainTokens[0]?.protectionInfo?.result).toBe('MALICIOUS')
  })

  it('should not overwrite existing multichainTokens when both fields are populated', () => {
    const existingMultichain = new MultichainToken({ multichainId: 'mc:existing', symbol: 'EXISTING' })
    const response = new SearchTokensResponse({
      tokens: [createSearchToken()],
      pools: [],
      multichainTokens: [existingMultichain],
    })

    const result = transformSearchToMultichain(response)

    expect(result).toBe(response)
    expect(result.multichainTokens).toHaveLength(1)
    expect(result.multichainTokens[0]?.symbol).toBe('EXISTING')
  })

  it('should handle token with minimal/default fields', () => {
    const token = new Token({})
    const response = new SearchTokensResponse({ tokens: [token], pools: [], multichainTokens: [] })

    const result = transformSearchToMultichain(response)
    const mc = result.multichainTokens[0]!

    expect(mc.multichainId).toBe('')
    expect(mc.symbol).toBe('')
    expect(mc.name).toBe('')
    expect(mc.chainTokens).toHaveLength(1)
    expect(mc.chainTokens[0]?.chainId).toBe(0)
    expect(mc.chainTokens[0]?.address).toBe('')
    expect(mc.chainTokens[0]?.decimals).toBe(0)
  })
})

describe('shouldTransformSearchToMultichain', () => {
  it('should return false when response is undefined', () => {
    expect(shouldTransformSearchToMultichain(undefined)).toBe(false)
  })

  it('should return false when tokens is empty', () => {
    const response = new SearchTokensResponse({ tokens: [], pools: [], multichainTokens: [] })
    expect(shouldTransformSearchToMultichain(response)).toBe(false)
  })

  it('should return true when tokens populated and multichainTokens empty', () => {
    const response = new SearchTokensResponse({
      tokens: [createSearchToken()],
      pools: [],
      multichainTokens: [],
    })
    expect(shouldTransformSearchToMultichain(response)).toBe(true)
  })

  it('should return false when both tokens and multichainTokens are populated', () => {
    const response = new SearchTokensResponse({
      tokens: [createSearchToken()],
      pools: [],
      multichainTokens: [new MultichainToken({ symbol: 'USDC', name: 'USD Coin' })],
    })
    expect(shouldTransformSearchToMultichain(response)).toBe(false)
  })

  it('should return false when only multichainTokens are populated', () => {
    const response = new SearchTokensResponse({
      tokens: [],
      pools: [],
      multichainTokens: [new MultichainToken({ symbol: 'USDC', name: 'USD Coin' })],
    })
    expect(shouldTransformSearchToMultichain(response)).toBe(false)
  })
})
