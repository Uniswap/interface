import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { formatERC681Amount, parseERC681URI, parseScientificOrIntString } from 'uniswap/src/features/transactions/send/erc681'

describe('parseScientificOrIntString', () => {
  it('parses scientific notation accurately without precision loss', () => {
    expect(parseScientificOrIntString('2.014e18')).toBe('2014000000000000000')
    expect(parseScientificOrIntString('1e16')).toBe('10000000000000000')
    expect(parseScientificOrIntString('1e6')).toBe('1000000')
    expect(parseScientificOrIntString('1.5e6')).toBe('1500000')
  })

  it('parses standard integer strings and hex values', () => {
    expect(parseScientificOrIntString('1000000')).toBe('1000000')
    expect(parseScientificOrIntString('0xde0b6b3a7640000')).toBe('1000000000000000000')
  })

  it('returns undefined for invalid strings', () => {
    expect(parseScientificOrIntString('')).toBeUndefined()
    expect(parseScientificOrIntString('invalid')).toBeUndefined()
  })
})

describe('formatERC681Amount', () => {
  it('formats raw units cleanly without trailing zeros', () => {
    expect(formatERC681Amount('2014000000000000000', 18)).toBe('2.014')
    expect(formatERC681Amount('10000000000000000', 18)).toBe('0.01')
    expect(formatERC681Amount('1000000', 6)).toBe('1')
    expect(formatERC681Amount('1500000', 6)).toBe('1.5')
  })
})

describe('parseERC681URI', () => {
  const TEST_RECIPIENT = '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359'
  const TEST_RECIPIENT_2 = '0x54235780057CC828C92aA40e3b02053881990153'
  const TEST_USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
  const TEST_DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F'

  it('parses simple native ETH transfer on Mainnet (Test Vector 1)', () => {
    const uri = `ethereum:${TEST_RECIPIENT}?value=2.014e18`
    const result = parseERC681URI(uri)
    expect(result).toEqual({
      chainId: UniverseChainId.Mainnet,
      recipient: TEST_RECIPIENT,
      tokenAddress: undefined,
      rawAmount: '2014000000000000000',
      formattedAmount: '2.014',
    })
  })

  it('parses native ETH transfer on Base (Test Vector 2)', () => {
    const uri = `ethereum:${TEST_RECIPIENT}@8453?value=1e16`
    const result = parseERC681URI(uri)
    expect(result).toEqual({
      chainId: UniverseChainId.Base,
      recipient: TEST_RECIPIENT,
      tokenAddress: undefined,
      rawAmount: '10000000000000000',
      formattedAmount: '0.01',
    })
  })

  it('parses USDC transfer on Base (Test Vector 3)', () => {
    const uri = `ethereum:${TEST_USDC}@8453/transfer?address=${TEST_RECIPIENT_2}&uint256=1e6`
    const result = parseERC681URI(uri)
    expect(result).toEqual({
      chainId: UniverseChainId.Base,
      recipient: TEST_RECIPIENT_2,
      tokenAddress: TEST_USDC,
      rawAmount: '1000000',
      formattedAmount: undefined, // ERC-20 decimals require external resolution in UI
    })
  })

  it('parses DAI transfer on Mainnet (Test Vector 4)', () => {
    const uri = `ethereum:${TEST_DAI}/transfer?address=${TEST_RECIPIENT_2}&uint256=1e18`
    const result = parseERC681URI(uri)
    expect(result).toEqual({
      chainId: UniverseChainId.Mainnet,
      recipient: TEST_RECIPIENT_2,
      tokenAddress: TEST_DAI,
      rawAmount: '1000000000000000000',
      formattedAmount: undefined,
    })
  })

  it('parses plain ethereum:<address> URI without parameters', () => {
    const uri = `ethereum:${TEST_RECIPIENT}`
    const result = parseERC681URI(uri)
    expect(result).toEqual({
      chainId: UniverseChainId.Mainnet,
      recipient: TEST_RECIPIENT,
      tokenAddress: undefined,
      rawAmount: undefined,
      formattedAmount: undefined,
    })
  })

  it('returns undefined for invalid URI schemes or addresses', () => {
    expect(parseERC681URI('bitcoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')).toBeUndefined()
    expect(parseERC681URI('ethereum:invalid_address')).toBeUndefined()
    expect(parseERC681URI('ethereum:0x123/transfer?address=invalid_recipient')).toBeUndefined()
  })

  it('returns undefined for unsupported smart contract functions', () => {
    const uri = `ethereum:${TEST_USDC}/approve?address=${TEST_RECIPIENT}&uint256=1000`
    expect(parseERC681URI(uri)).toBeUndefined()
  })
})
