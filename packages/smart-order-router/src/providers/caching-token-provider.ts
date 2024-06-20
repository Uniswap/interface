import { ChainId, Token } from '@ubeswap/sdk-core'
import _ from 'lodash'

import { log, WRAPPED_NATIVE_CURRENCY } from '../util'

import { ICache } from './cache'
import {
  BTC_BNB,
  BUSD_BNB,
  CELO,
  CELO_ALFAJORES,
  CEUR_CELO,
  CUSD_CELO,
  CUSD_CELO_ALFAJORES,
  DAI_ARBITRUM,
  DAI_AVAX,
  DAI_BNB,
  DAI_CELO,
  DAI_CELO_ALFAJORES,
  DAI_MAINNET,
  DAI_MOONBEAM,
  DAI_OPTIMISM,
  DAI_OPTIMISM_GOERLI,
  DAI_POLYGON_MUMBAI,
  ETH_BNB,
  ITokenProvider,
  TokenAccessor,
  USDC_ARBITRUM,
  USDC_ARBITRUM_GOERLI,
  USDC_AVAX,
  USDC_BASE,
  USDC_BNB,
  USDC_ETHEREUM_GNOSIS,
  USDC_MAINNET,
  USDC_MOONBEAM,
  USDC_OPTIMISM,
  USDC_OPTIMISM_GOERLI,
  USDC_POLYGON,
  USDC_SEPOLIA,
  USDT_ARBITRUM,
  USDT_BNB,
  USDT_MAINNET,
  USDT_OPTIMISM,
  USDT_OPTIMISM_GOERLI,
  WBTC_ARBITRUM,
  WBTC_MAINNET,
  WBTC_MOONBEAM,
  WBTC_OPTIMISM,
  WBTC_OPTIMISM_GOERLI,
  WMATIC_POLYGON,
  WMATIC_POLYGON_MUMBAI,
} from './token-provider'

// These tokens will added to the Token cache on initialization.
export const CACHE_SEED_TOKENS: {
  [chainId in ChainId]?: { [symbol: string]: Token }
} = {
  [ChainId.MAINNET]: {
    WETH: WRAPPED_NATIVE_CURRENCY[ChainId.MAINNET]!,
    USDC: USDC_MAINNET,
    USDT: USDT_MAINNET,
    WBTC: WBTC_MAINNET,
    DAI: DAI_MAINNET,
    // This token stores its symbol as bytes32, therefore can not be fetched on-chain using
    // our token providers.
    // This workaround adds it to the cache, so we won't try to fetch it on-chain.
    RING: new Token(ChainId.MAINNET, '0x9469D013805bFfB7D3DEBe5E7839237e535ec483', 18, 'RING', 'RING'),
  },
  [ChainId.SEPOLIA]: {
    USDC: USDC_SEPOLIA,
  },
  [ChainId.OPTIMISM]: {
    USDC: USDC_OPTIMISM,
    USDT: USDT_OPTIMISM,
    WBTC: WBTC_OPTIMISM,
    DAI: DAI_OPTIMISM,
  },
  [ChainId.OPTIMISM_GOERLI]: {
    USDC: USDC_OPTIMISM_GOERLI,
    USDT: USDT_OPTIMISM_GOERLI,
    WBTC: WBTC_OPTIMISM_GOERLI,
    DAI: DAI_OPTIMISM_GOERLI,
  },
  [ChainId.ARBITRUM_ONE]: {
    USDC: USDC_ARBITRUM,
    USDT: USDT_ARBITRUM,
    WBTC: WBTC_ARBITRUM,
    DAI: DAI_ARBITRUM,
  },
  [ChainId.ARBITRUM_GOERLI]: {
    USDC: USDC_ARBITRUM_GOERLI,
  },
  [ChainId.POLYGON]: {
    WMATIC: WMATIC_POLYGON,
    USDC: USDC_POLYGON,
  },
  [ChainId.POLYGON_MUMBAI]: {
    WMATIC: WMATIC_POLYGON_MUMBAI,
    DAI: DAI_POLYGON_MUMBAI,
  },
  [ChainId.CELO]: {
    CELO,
    CUSD: CUSD_CELO,
    CEUR: CEUR_CELO,
    DAI: DAI_CELO,
  },
  [ChainId.CELO_ALFAJORES]: {
    CELO: CELO_ALFAJORES,
    CUSD: CUSD_CELO_ALFAJORES,
    CEUR: CUSD_CELO_ALFAJORES,
    DAI: DAI_CELO_ALFAJORES,
  },
  [ChainId.GNOSIS]: {
    WXDAI: WRAPPED_NATIVE_CURRENCY[ChainId.GNOSIS],
    USDC_ETHEREUM_GNOSIS,
  },
  [ChainId.MOONBEAM]: {
    USDC: USDC_MOONBEAM,
    DAI: DAI_MOONBEAM,
    WBTC: WBTC_MOONBEAM,
    WGLMR: WRAPPED_NATIVE_CURRENCY[ChainId.MOONBEAM],
  },
  [ChainId.BNB]: {
    USDC: USDC_BNB,
    USDT: USDT_BNB,
    BUSD: BUSD_BNB,
    ETH: ETH_BNB,
    DAI: DAI_BNB,
    BTC: BTC_BNB,
    WBNB: WRAPPED_NATIVE_CURRENCY[ChainId.BNB],
  },
  [ChainId.AVALANCHE]: {
    USDC: USDC_AVAX,
    DAI: DAI_AVAX,
    WAVAX: WRAPPED_NATIVE_CURRENCY[ChainId.AVALANCHE],
  },
  [ChainId.BASE]: {
    USDC: USDC_BASE,
    WETH: WRAPPED_NATIVE_CURRENCY[ChainId.BASE],
  },
  // Currently we do not have providers for Moonbeam mainnet or Gnosis testnet
}

/**
 * Provider for getting token metadata that falls back to a different provider
 * in the event of failure.
 *
 * @export
 * @class CachingTokenProviderWithFallback
 */
export class CachingTokenProviderWithFallback implements ITokenProvider {
  private CACHE_KEY = (chainId: ChainId, address: string) => `token-${chainId}-${address}`

  constructor(
    protected chainId: ChainId,
    // Token metadata (e.g. symbol and decimals) don't change so can be cached indefinitely.
    // Constructing a new token object is slow as sdk-core does checksumming.
    private tokenCache: ICache<Token>,
    protected primaryTokenProvider: ITokenProvider,
    protected fallbackTokenProvider?: ITokenProvider
  ) {}

  public async getTokens(_addresses: string[]): Promise<TokenAccessor> {
    const seedTokens = CACHE_SEED_TOKENS[this.chainId]

    if (seedTokens) {
      for (const token of Object.values(seedTokens)) {
        await this.tokenCache.set(this.CACHE_KEY(this.chainId, token.address.toLowerCase()), token)
      }
    }

    const addressToToken: { [address: string]: Token } = {}
    const symbolToToken: { [symbol: string]: Token } = {}

    const addresses = _(_addresses)
      .map((address) => address.toLowerCase())
      .uniq()
      .value()

    const addressesToFindInPrimary = []
    const addressesToFindInSecondary = []

    for (const address of addresses) {
      if (await this.tokenCache.has(this.CACHE_KEY(this.chainId, address))) {
        addressToToken[address.toLowerCase()] = (await this.tokenCache.get(this.CACHE_KEY(this.chainId, address)))!
        symbolToToken[addressToToken[address]!.symbol!] = (await this.tokenCache.get(
          this.CACHE_KEY(this.chainId, address)
        ))!
      } else {
        addressesToFindInPrimary.push(address)
      }
    }

    log.info(
      { addressesToFindInPrimary },
      `Found ${addresses.length - addressesToFindInPrimary.length} out of ${addresses.length} tokens in local cache. ${
        addressesToFindInPrimary.length > 0
          ? `Checking primary token provider for ${addressesToFindInPrimary.length} tokens`
          : ``
      }
      `
    )

    if (addressesToFindInPrimary.length > 0) {
      const primaryTokenAccessor = await this.primaryTokenProvider.getTokens(addressesToFindInPrimary)

      for (const address of addressesToFindInPrimary) {
        const token = primaryTokenAccessor.getTokenByAddress(address)

        if (token) {
          addressToToken[address.toLowerCase()] = token
          symbolToToken[addressToToken[address]!.symbol!] = token
          await this.tokenCache.set(this.CACHE_KEY(this.chainId, address.toLowerCase()), addressToToken[address]!)
        } else {
          addressesToFindInSecondary.push(address)
        }
      }

      log.info(
        { addressesToFindInSecondary },
        `Found ${addressesToFindInPrimary.length - addressesToFindInSecondary.length} tokens in primary. ${
          this.fallbackTokenProvider
            ? `Checking secondary token provider for ${addressesToFindInSecondary.length} tokens`
            : `No fallback token provider specified. About to return.`
        }`
      )
    }

    if (this.fallbackTokenProvider && addressesToFindInSecondary.length > 0) {
      const secondaryTokenAccessor = await this.fallbackTokenProvider.getTokens(addressesToFindInSecondary)

      for (const address of addressesToFindInSecondary) {
        const token = secondaryTokenAccessor.getTokenByAddress(address)
        if (token) {
          addressToToken[address.toLowerCase()] = token
          symbolToToken[addressToToken[address]!.symbol!] = token
          await this.tokenCache.set(this.CACHE_KEY(this.chainId, address.toLowerCase()), addressToToken[address]!)
        }
      }
    }

    return {
      getTokenByAddress: (address: string): Token | undefined => {
        return addressToToken[address.toLowerCase()]
      },
      getTokenBySymbol: (symbol: string): Token | undefined => {
        return symbolToToken[symbol.toLowerCase()]
      },
      getAllTokens: (): Token[] => {
        return Object.values(addressToToken)
      },
    }
  }
}
