/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ChainId, Token } from '@ubeswap/sdk-core'
import { TokenInfo, TokenList } from '@uniswap/token-lists'
import axios from 'axios'

import { log } from '../util/log'
import { metric, MetricLoggerUnit } from '../util/metric'

import { ICache } from './cache'
import { ITokenProvider, TokenAccessor } from './token-provider'

/**
 * Provider for getting token data from a Token List.
 *
 * @export
 * @interface ITokenListProvider
 */
export interface ITokenListProvider {
  hasTokenBySymbol(_symbol: string): Promise<boolean>

  getTokenBySymbol(_symbol: string): Promise<Token | undefined>

  hasTokenByAddress(address: string): Promise<boolean>

  getTokenByAddress(address: string): Promise<Token | undefined>
}

export class CachingTokenListProvider implements ITokenProvider, ITokenListProvider {
  private CACHE_KEY = (tokenInfo: TokenInfo) =>
    `token-list-token-${this.chainId}/${this.tokenList.name}/${this.tokenList.timestamp}/${
      this.tokenList.version
    }/${tokenInfo.address.toLowerCase()}/${tokenInfo.decimals}/${tokenInfo.symbol}/${tokenInfo.name}`

  private chainId: ChainId
  private chainToTokenInfos: Map<string, TokenInfo[]>
  private chainSymbolToTokenInfo: Map<string, TokenInfo>
  private chainAddressToTokenInfo: Map<string, TokenInfo>
  private tokenList: TokenList

  private CHAIN_SYMBOL_KEY = (chainId: ChainId, symbol: string) => `${chainId.toString()}/${symbol}`
  private CHAIN_ADDRESS_KEY = (chainId: ChainId, address: string) => `${chainId.toString()}/${address.toLowerCase()}`

  /**
   * Creates an instance of CachingTokenListProvider.
   * Token metadata (e.g. symbol and decimals) generally don't change so can be cached indefinitely.
   *
   * @param chainId The chain id to use.
   * @param tokenList The token list to get the tokens from.
   * @param tokenCache Cache instance to hold cached tokens.
   */
  constructor(chainId: ChainId | number, tokenList: TokenList, private tokenCache: ICache<Token>) {
    this.chainId = chainId
    this.tokenList = tokenList

    this.chainToTokenInfos = new Map()
    this.chainSymbolToTokenInfo = new Map()
    this.chainAddressToTokenInfo = new Map()

    for (const tokenInfo of this.tokenList.tokens) {
      const chainId = tokenInfo.chainId
      const chainIdString = chainId.toString()
      const symbol = tokenInfo.symbol
      const address = tokenInfo.address.toLowerCase()

      if (!this.chainToTokenInfos.has(chainIdString)) {
        this.chainToTokenInfos.set(chainIdString, [])
      }
      this.chainToTokenInfos.get(chainIdString)!.push(tokenInfo)

      this.chainSymbolToTokenInfo.set(this.CHAIN_SYMBOL_KEY(chainId, symbol), tokenInfo)
      this.chainAddressToTokenInfo.set(this.CHAIN_ADDRESS_KEY(chainId, address), tokenInfo)
    }
  }

  public static async fromTokenListURI(chainId: ChainId | number, tokenListURI: string, tokenCache: ICache<Token>) {
    const now = Date.now()
    const tokenList = await this.buildTokenList(tokenListURI)

    metric.putMetric('TokenListLoad', Date.now() - now, MetricLoggerUnit.Milliseconds)

    return new CachingTokenListProvider(chainId, tokenList, tokenCache)
  }

  private static async buildTokenList(tokenListURI: string): Promise<TokenList> {
    log.info(`Getting tokenList from ${tokenListURI}.`)
    const response = await axios.get(tokenListURI)
    log.info(`Got tokenList from ${tokenListURI}.`)

    const { data: tokenList, status } = response

    if (status != 200) {
      log.error({ response }, `Unabled to get token list from ${tokenListURI}.`)

      throw new Error(`Unable to get token list from ${tokenListURI}`)
    }

    return tokenList
  }

  public static async fromTokenList(chainId: ChainId | number, tokenList: TokenList, tokenCache: ICache<Token>) {
    const now = Date.now()

    const tokenProvider = new CachingTokenListProvider(chainId, tokenList, tokenCache)

    metric.putMetric('TokenListLoad', Date.now() - now, MetricLoggerUnit.Milliseconds)

    return tokenProvider
  }

  /**
   * If no addresses array is specified, all tokens in the token list are
   * returned.
   *
   * @param _addresses (optional) The token addresses to get.
   * @returns Promise<TokenAccessor> A token accessor with methods for accessing the tokens.
   */
  public async getTokens(_addresses?: string[]): Promise<TokenAccessor> {
    const addressToToken: Map<string, Token> = new Map()
    const symbolToToken: Map<string, Token> = new Map()

    const addToken = (token?: Token) => {
      if (!token) return
      addressToToken.set(token.address.toLowerCase(), token)
      if (token.symbol !== undefined) {
        symbolToToken.set(token.symbol.toLowerCase(), token)
      }
    }

    if (_addresses) {
      for (const address of _addresses) {
        const token = await this.getTokenByAddress(address)
        addToken(token)
      }
    } else {
      const chainTokens = this.chainToTokenInfos.get(this.chainId.toString()) ?? []
      for (const info of chainTokens) {
        const token = await this.buildToken(info)
        addToken(token)
      }
    }

    return {
      getTokenByAddress: (address: string) => addressToToken.get(address.toLowerCase()),
      getTokenBySymbol: (symbol: string) => symbolToToken.get(symbol.toLowerCase()),
      getAllTokens: (): Token[] => {
        return Array.from(addressToToken.values())
      },
    }
  }

  public async hasTokenBySymbol(_symbol: string): Promise<boolean> {
    return this.chainSymbolToTokenInfo.has(this.CHAIN_SYMBOL_KEY(this.chainId, _symbol))
  }

  public async getTokenBySymbol(_symbol: string): Promise<Token | undefined> {
    let symbol = _symbol

    // We consider ETH as a regular ERC20 Token throughout this package. We don't use the NativeCurrency object from the sdk.
    // When we build the calldata for swapping we insert wrapping/unwrapping as needed.
    if (_symbol == 'ETH') {
      symbol = 'WETH'
    }

    const tokenInfo = this.chainSymbolToTokenInfo.get(this.CHAIN_SYMBOL_KEY(this.chainId, symbol))

    if (!tokenInfo) {
      return undefined
    }

    const token: Token = await this.buildToken(tokenInfo)

    return token
  }

  public async hasTokenByAddress(address: string): Promise<boolean> {
    return this.chainAddressToTokenInfo.has(this.CHAIN_ADDRESS_KEY(this.chainId, address))
  }

  public async getTokenByAddress(address: string): Promise<Token | undefined> {
    const tokenInfo = this.chainAddressToTokenInfo.get(this.CHAIN_ADDRESS_KEY(this.chainId, address))

    if (!tokenInfo) {
      return undefined
    }

    const token: Token = await this.buildToken(tokenInfo)

    return token
  }

  private async buildToken(tokenInfo: TokenInfo): Promise<Token> {
    const cacheKey = this.CACHE_KEY(tokenInfo)
    const cachedToken = await this.tokenCache.get(cacheKey)

    if (cachedToken) {
      return cachedToken
    }

    const token = new Token(this.chainId, tokenInfo.address, tokenInfo.decimals, tokenInfo.symbol, tokenInfo.name)

    await this.tokenCache.set(cacheKey, token)

    return token
  }
}
