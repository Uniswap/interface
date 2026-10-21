import { GraphQLApi } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { DAI, USDC_BASE, USDC_SOLANA, USDG_ROBINHOOD, WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import { MELD_NATIVE_SOL_ADDRESS_SOLANA } from 'uniswap/src/features/chains/svm/defaults'
import { FORSupportedToken } from 'uniswap/src/features/fiatOnRamp/types'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { fiatOnRampToCurrency, gqlToCurrency, getTokenDetailsURL, unwrapToken } from '~/data/util'
import { CHAIN_SEARCH_PARAM } from '~/utils/params/chainQueryParam'

const PATHUSD_ADDRESS = '0x20c0000000000000000000000000000000000000'

const FOR_TOKEN: FORSupportedToken = {
  cryptoCurrencyCode: 'TEST',
  displayName: 'Test token',
  cryptoCurrencyChain: 'test',
  chainId: String(UniverseChainId.Mainnet),
  symbol: 'TEST',
}

describe('fiatOnRampToCurrency', () => {
  it('uses chain-config decimals for USDG on Robinhood instead of the hardcoded 18', () => {
    const result = fiatOnRampToCurrency({
      ...FOR_TOKEN,
      chainId: String(UniverseChainId.Robinhood),
      address: USDG_ROBINHOOD.address,
    })
    expect(result?.isToken).toBe(true)
    expect(result?.decimals).toBe(6)
  })

  it('uses chain-config decimals for USDC on Base', () => {
    const result = fiatOnRampToCurrency({
      ...FOR_TOKEN,
      chainId: String(UniverseChainId.Base),
      address: USDC_BASE.address,
    })
    expect(result?.isToken).toBe(true)
    expect(result?.decimals).toBe(6)
  })

  it('uses chain-config decimals for USDC on Solana (SVM address)', () => {
    const result = fiatOnRampToCurrency({
      ...FOR_TOKEN,
      chainId: String(UniverseChainId.Solana),
      address: USDC_SOLANA.address,
    })
    expect(result?.isToken).toBe(true)
    expect(result?.decimals).toBe(6)
  })

  it('falls back to 18 decimals for a token not in chain config', () => {
    const result = fiatOnRampToCurrency({
      ...FOR_TOKEN,
      chainId: String(UniverseChainId.Mainnet),
      address: PATHUSD_ADDRESS,
    })
    expect(result?.isToken).toBe(true)
    expect(result?.decimals).toBe(18)
  })

  it('returns native currency when address is missing', () => {
    const result = fiatOnRampToCurrency({ ...FOR_TOKEN, chainId: String(UniverseChainId.Robinhood) })
    expect(result?.isNative).toBe(true)
    expect(result?.chainId).toBe(UniverseChainId.Robinhood)
  })

  it('returns undefined for an unsupported chain', () => {
    const result = fiatOnRampToCurrency({ ...FOR_TOKEN, chainId: '0' })
    expect(result).toBeUndefined()
  })
})

describe('gqlToCurrency', () => {
  describe('Tempo chain handling', () => {
    it('returns undefined for Tempo native token with no address', () => {
      const result = gqlToCurrency({
        chain: GraphQLApi.Chain.Tempo,
        standard: GraphQLApi.TokenStandard.Native,
      })
      expect(result).toBeUndefined()
    })

    it('returns undefined for Tempo native token with NATIVE_CHAIN_ID address', () => {
      const result = gqlToCurrency({
        chain: GraphQLApi.Chain.Tempo,
        standard: GraphQLApi.TokenStandard.Native,
        address: NATIVE_CHAIN_ID,
      })
      expect(result).toBeUndefined()
    })

    it('builds currency normally for Tempo token with Native standard but real address', () => {
      const result = gqlToCurrency({
        chain: GraphQLApi.Chain.Tempo,
        standard: GraphQLApi.TokenStandard.Native,
        address: PATHUSD_ADDRESS,
        decimals: 6,
        symbol: 'pathUSD',
        name: 'pathUSD',
      })
      expect(result).toBeDefined()
      expect(result?.isToken).toBe(true)
      expect(result?.symbol).toBe('pathUSD')
    })

    it('builds currency normally for Tempo ERC20 token', () => {
      const result = gqlToCurrency({
        chain: GraphQLApi.Chain.Tempo,
        address: PATHUSD_ADDRESS,
        decimals: 6,
        symbol: 'pathUSD',
        name: 'pathUSD',
      })
      expect(result).toBeDefined()
      expect(result?.isToken).toBe(true)
    })
  })

  describe('non-Tempo chains', () => {
    it('returns native currency for Mainnet native token', () => {
      const result = gqlToCurrency({
        chain: GraphQLApi.Chain.Ethereum,
        standard: GraphQLApi.TokenStandard.Native,
        address: NATIVE_CHAIN_ID,
      })
      expect(result).toBeDefined()
      expect(result?.isNative).toBe(true)
      expect(result?.chainId).toBe(UniverseChainId.Mainnet)
    })

    it('builds ERC20 token for Mainnet token with address', () => {
      const result = gqlToCurrency({
        chain: GraphQLApi.Chain.Ethereum,
        address: DAI.address,
        decimals: 18,
        symbol: 'DAI',
        name: 'Dai Stablecoin',
      })
      expect(result).toBeDefined()
      expect(result?.isToken).toBe(true)
      expect(result?.symbol).toBe('DAI')
    })

    it('returns undefined for missing chain', () => {
      const result = gqlToCurrency({})
      expect(result).toBeUndefined()
    })

    it('returns undefined for unsupported chain', () => {
      const result = gqlToCurrency({
        chain: 'INVALID' as GraphQLApi.Chain,
      })
      expect(result).toBeUndefined()
    })
  })
})

describe('getTokenDetailsURL', () => {
  it('defaults to ethereum and NATIVE when no chain or address is provided', () => {
    expect(getTokenDetailsURL({})).toBe(`/explore/tokens/ethereum/${NATIVE_CHAIN_ID}`)
  })

  it('uses chainUrlParam for the path when provided', () => {
    expect(
      getTokenDetailsURL({
        chainUrlParam: 'arbitrum',
        chain: GraphQLApi.Chain.Ethereum,
        address: '0x0000000000000000000000000000000000000001',
      }),
    ).toBe('/explore/tokens/arbitrum/0x0000000000000000000000000000000000000001')
  })

  it('uses chain enum lowercased for the path when chainUrlParam is omitted', () => {
    expect(
      getTokenDetailsURL({
        chain: GraphQLApi.Chain.Ethereum,
        address: DAI.address,
      }),
    ).toBe(`/explore/tokens/ethereum/${DAI.address}`)
  })

  it('maps native token address to NATIVE path segment when chain resolves to a universe chain id', () => {
    const nativeEthAddress = getNativeAddress(UniverseChainId.Mainnet)
    expect(
      getTokenDetailsURL({
        chain: GraphQLApi.Chain.Ethereum,
        address: nativeEthAddress,
      }),
    ).toBe(`/explore/tokens/ethereum/${NATIVE_CHAIN_ID}`)
  })

  it('maps the Meld native-SOL address to the NATIVE path segment', () => {
    expect(
      getTokenDetailsURL({
        chain: GraphQLApi.Chain.Solana,
        address: MELD_NATIVE_SOL_ADDRESS_SOLANA,
      }),
    ).toBe(`/explore/tokens/solana/${NATIVE_CHAIN_ID}`)
  })

  it('maps native sentinel addresses to NATIVE on chains whose native currency has a real token address', () => {
    // Celo's native currency lives at 0x471E..., so the zero/0xeee sentinels aren't its native address
    expect(
      getTokenDetailsURL({
        chain: GraphQLApi.Chain.Celo,
        address: '0x0000000000000000000000000000000000000000',
      }),
    ).toBe(`/explore/tokens/celo/${NATIVE_CHAIN_ID}`)
    expect(
      getTokenDetailsURL({
        chain: GraphQLApi.Chain.Celo,
        address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      }),
    ).toBe(`/explore/tokens/celo/${NATIVE_CHAIN_ID}`)
  })

  it('treats null and undefined address as NATIVE', () => {
    expect(getTokenDetailsURL({ chain: GraphQLApi.Chain.Ethereum, address: null })).toBe(
      `/explore/tokens/ethereum/${NATIVE_CHAIN_ID}`,
    )
    expect(getTokenDetailsURL({ chain: GraphQLApi.Chain.Ethereum, address: undefined })).toBe(
      `/explore/tokens/ethereum/${NATIVE_CHAIN_ID}`,
    )
  })

  it('appends swap query params and chain search param when provided', () => {
    const url = getTokenDetailsURL({
      chain: GraphQLApi.Chain.Ethereum,
      address: DAI.address,
      inputAddress: '0x1111111111111111111111111111111111111111',
      outputAddress: '0x2222222222222222222222222222222222222222',
      chainQueryParam: 'optimism',
    })
    const parsed = new URL(url, 'https://example.com')
    expect(parsed.pathname).toBe(`/explore/tokens/ethereum/${DAI.address}`)
    expect(parsed.searchParams.get('inputCurrency')).toBe('0x1111111111111111111111111111111111111111')
    expect(parsed.searchParams.get('outputCurrency')).toBe('0x2222222222222222222222222222222222222222')
    expect(parsed.searchParams.get(CHAIN_SEARCH_PARAM)).toBe('optimism')
  })
})

describe('unwrapToken', () => {
  it('does NOT unwrap pathUSD to native USD on Tempo', () => {
    const pathUsdToken = { address: PATHUSD_ADDRESS, symbol: 'pathUSD', name: 'pathUSD' }
    const result = unwrapToken(UniverseChainId.Tempo, pathUsdToken)
    expect(result.address).toBe(PATHUSD_ADDRESS)
    expect(result.symbol).toBe('pathUSD')
  })

  it('unwraps WETH to native ETH on Mainnet', () => {
    const wethAddress = WRAPPED_NATIVE_CURRENCY[UniverseChainId.Mainnet]?.address
    const wethToken = { address: wethAddress, symbol: 'WETH', name: 'Wrapped Ether' }
    const result = unwrapToken(UniverseChainId.Mainnet, wethToken)
    expect(result.address).toBe(NATIVE_CHAIN_ID)
  })

  // Expectations in the cases below are deliberately independent literals ('NATIVE', raw addresses,
  // per-chain names) rather than the production constants they assert about — re-deriving them from
  // those constants would make the tests unfalsifiable.
  it('unwraps the zero-address native token on Mainnet', () => {
    const token = { address: '0x0000000000000000000000000000000000000000', symbol: 'ETH', name: 'Ethereum' }
    const result = unwrapToken(UniverseChainId.Mainnet, token)
    expect(result.address).toBe('NATIVE')
  })

  it('unwraps the legacy 0xeee... native address on Mainnet', () => {
    const token = { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', symbol: 'ETH', name: 'Ethereum' }
    const result = unwrapToken(UniverseChainId.Mainnet, token)
    expect(result.address).toBe('NATIVE')
  })

  // The next two cases mirror the Explore table's object-form call (see TokensTable.tsx):
  // nativeCurrencyChainId is the row's own chain on chain-filtered pages, and Mainnet on the
  // unfiltered page when the grouping has a mainnet native leg.
  it('rebrands a zero-address native leg with the chain-specific native branding (chain-filtered explore page)', () => {
    const token = {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'ETH',
      name: 'Ethereum',
      project: { name: 'Ethereum' },
    }
    const result = unwrapToken(
      { chainId: UniverseChainId.Optimism, nativeCurrencyChainId: UniverseChainId.Optimism },
      token,
    )
    expect(result.address).toBe('NATIVE')
    expect(result.name).toBe('Optimistic ETH')
    expect(result.project.name).toBe('Optimistic ETH')
  })

  it('rebrands a zero-address L2 native leg with mainnet branding when nativeCurrencyChainId is Mainnet (unfiltered explore page)', () => {
    const token = { address: '0x0000000000000000000000000000000000000000', symbol: 'ETH', name: 'upstream name' }
    const result = unwrapToken({ chainId: UniverseChainId.Base, nativeCurrencyChainId: UniverseChainId.Mainnet }, token)
    expect(result.address).toBe('NATIVE')
    expect(result.name).toBe('Ethereum')
  })

  // Polygon's native POL lives at a real contract address (0x...1010) — the zero address is just an
  // unknown token there and must not be rebranded as native.
  it('does not rebrand the zero address on Polygon', () => {
    const token = { address: '0x0000000000000000000000000000000000000000', symbol: '???', name: 'Unknown' }
    const result = unwrapToken(
      { chainId: UniverseChainId.Polygon, nativeCurrencyChainId: UniverseChainId.Polygon },
      token,
    )
    expect(result.address).toBe('0x0000000000000000000000000000000000000000')
    expect(result.name).toBe('Unknown')
  })

  it('does not rebrand the zero address on Celo', () => {
    const token = { address: '0x0000000000000000000000000000000000000000', symbol: '???', name: 'Unknown' }
    const result = unwrapToken(UniverseChainId.Celo, token)
    expect(result.address).toBe('0x0000000000000000000000000000000000000000')
  })

  it('rebrands Polygon native POL by its real contract address', () => {
    const token = { address: '0x0000000000000000000000000000000000001010', symbol: 'POL', name: 'Polygon' }
    const result = unwrapToken(
      { chainId: UniverseChainId.Polygon, nativeCurrencyChainId: UniverseChainId.Polygon },
      token,
    )
    expect(result.address).toBe('NATIVE')
    expect(result.name).toBe('Polygon POL')
  })

  it('does not unwrap non-wrapped tokens', () => {
    const daiToken = { address: DAI.address, symbol: 'DAI', name: 'Dai' }
    const result = unwrapToken(UniverseChainId.Mainnet, daiToken)
    expect(result.address).toBe(DAI.address)
    expect(result.symbol).toBe('DAI')
  })

  it('returns token unchanged when address is undefined', () => {
    const token = { address: undefined }
    const result = unwrapToken(UniverseChainId.Mainnet, token)
    expect(result).toBe(token)
  })
})
