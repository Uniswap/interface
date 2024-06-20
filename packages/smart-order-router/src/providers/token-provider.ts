import { Interface } from '@ethersproject/abi'
import { BigNumber } from '@ethersproject/bignumber'
import { parseBytes32String } from '@ethersproject/strings'
import { ChainId, Token } from '@ubeswap/sdk-core'
import _ from 'lodash'

import { IERC20Metadata__factory } from '../types/v3/factories/IERC20Metadata__factory'
import { log, WRAPPED_NATIVE_CURRENCY } from '../util'

import { IMulticallProvider, Result } from './multicall-provider'
import { ProviderConfig } from './provider'

/**
 * Provider for getting token data.
 *
 * @export
 * @interface ITokenProvider
 */
export interface ITokenProvider {
  /**
   * Gets the token at each address. Any addresses that are not valid ERC-20 are ignored.
   *
   * @param addresses The token addresses to get.
   * @param [providerConfig] The provider config.
   * @returns A token accessor with methods for accessing the tokens.
   */
  getTokens(addresses: string[], providerConfig?: ProviderConfig): Promise<TokenAccessor>
}

export type TokenAccessor = {
  getTokenByAddress(address: string): Token | undefined
  getTokenBySymbol(symbol: string): Token | undefined
  getAllTokens: () => Token[]
}

// Some well known tokens on each chain for seeding cache / testing.
export const USDC_MAINNET = new Token(
  ChainId.MAINNET,
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  6,
  'USDC',
  'USD//C'
)
export const USDT_MAINNET = new Token(
  ChainId.MAINNET,
  '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  6,
  'USDT',
  'Tether USD'
)
export const WBTC_MAINNET = new Token(
  ChainId.MAINNET,
  '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  8,
  'WBTC',
  'Wrapped BTC'
)
export const DAI_MAINNET = new Token(
  ChainId.MAINNET,
  '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  18,
  'DAI',
  'Dai Stablecoin'
)
export const FEI_MAINNET = new Token(
  ChainId.MAINNET,
  '0x956F47F50A910163D8BF957Cf5846D573E7f87CA',
  18,
  'FEI',
  'Fei USD'
)
export const UNI_MAINNET = new Token(
  ChainId.MAINNET,
  '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
  18,
  'UNI',
  'Uniswap'
)

export const AAVE_MAINNET = new Token(
  ChainId.MAINNET,
  '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
  18,
  'AAVE',
  'Aave Token'
)

export const LIDO_MAINNET = new Token(
  ChainId.MAINNET,
  '0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32',
  18,
  'LDO',
  'Lido DAO Token'
)

export const USDC_SEPOLIA = new Token(
  ChainId.SEPOLIA,
  '0x6f14C02Fc1F78322cFd7d707aB90f18baD3B54f5',
  18,
  'USDC',
  'USDC Token'
)
export const DAI_SEPOLIA = new Token(
  ChainId.SEPOLIA,
  '0x7AF17A48a6336F7dc1beF9D485139f7B6f4FB5C8',
  18,
  'DAI',
  'DAI Token'
)
export const USDC_GOERLI = new Token(ChainId.GOERLI, '0x07865c6e87b9f70255377e024ace6630c1eaa37f', 6, 'USDC', 'USD//C')
export const USDT_GOERLI = new Token(
  ChainId.GOERLI,
  '0xe583769738b6dd4e7caf8451050d1948be717679',
  18,
  'USDT',
  'Tether USD'
)
export const WBTC_GOERLI = new Token(
  ChainId.GOERLI,
  '0xa0a5ad2296b38bd3e3eb59aaeaf1589e8d9a29a9',
  8,
  'WBTC',
  'Wrapped BTC'
)
export const DAI_GOERLI = new Token(
  ChainId.GOERLI,
  '0x11fe4b6ae13d2a6055c8d9cf65c55bac32b5d844',
  18,
  'DAI',
  'Dai Stablecoin'
)
export const UNI_GOERLI = new Token(
  ChainId.GOERLI,
  '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
  18,
  'UNI',
  'Uni token'
)

export const USDC_OPTIMISM = new Token(
  ChainId.OPTIMISM,
  '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
  6,
  'USDC',
  'USD//C'
)
export const USDT_OPTIMISM = new Token(
  ChainId.OPTIMISM,
  '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
  6,
  'USDT',
  'Tether USD'
)
export const WBTC_OPTIMISM = new Token(
  ChainId.OPTIMISM,
  '0x68f180fcCe6836688e9084f035309E29Bf0A2095',
  8,
  'WBTC',
  'Wrapped BTC'
)
export const DAI_OPTIMISM = new Token(
  ChainId.OPTIMISM,
  '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
  18,
  'DAI',
  'Dai Stablecoin'
)
export const OP_OPTIMISM = new Token(
  ChainId.OPTIMISM,
  '0x4200000000000000000000000000000000000042',
  18,
  'OP',
  'Optimism'
)

export const USDC_OPTIMISM_GOERLI = new Token(
  ChainId.OPTIMISM_GOERLI,
  '0x7E07E15D2a87A24492740D16f5bdF58c16db0c4E',
  6,
  'USDC',
  'USD//C'
)
export const USDT_OPTIMISM_GOERLI = new Token(
  ChainId.OPTIMISM_GOERLI,
  '0x853eb4bA5D0Ba2B77a0A5329Fd2110d5CE149ECE',
  6,
  'USDT',
  'Tether USD'
)
export const WBTC_OPTIMISM_GOERLI = new Token(
  ChainId.OPTIMISM_GOERLI,
  '0xe0a592353e81a94Db6E3226fD4A99F881751776a',
  8,
  'WBTC',
  'Wrapped BTC'
)
export const DAI_OPTIMISM_GOERLI = new Token(
  ChainId.OPTIMISM_GOERLI,
  '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
  18,
  'DAI',
  'Dai Stablecoin'
)

export const USDC_ARBITRUM = new Token(
  ChainId.ARBITRUM_ONE,
  '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
  6,
  'USDC',
  'USD//C'
)
export const USDT_ARBITRUM = new Token(
  ChainId.ARBITRUM_ONE,
  '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
  6,
  'USDT',
  'Tether USD'
)
export const WBTC_ARBITRUM = new Token(
  ChainId.ARBITRUM_ONE,
  '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
  8,
  'WBTC',
  'Wrapped BTC'
)
export const DAI_ARBITRUM = new Token(
  ChainId.ARBITRUM_ONE,
  '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
  18,
  'DAI',
  'Dai Stablecoin'
)

export const ARB_ARBITRUM = new Token(
  ChainId.ARBITRUM_ONE,
  '0x912CE59144191C1204E64559FE8253a0e49E6548',
  18,
  'ARB',
  'Arbitrum'
)

export const DAI_ARBITRUM_GOERLI = new Token(
  ChainId.ARBITRUM_GOERLI,
  '0x0000000000000000000000000000000000000000', // TODO: add address
  18,
  'DAI',
  'Dai Stablecoin'
)

// Bridged version of official Goerli USDC
export const USDC_ARBITRUM_GOERLI = new Token(
  ChainId.ARBITRUM_GOERLI,
  '0x8FB1E3fC51F3b789dED7557E680551d93Ea9d892',
  6,
  'USDC',
  'USD//C'
)

//polygon tokens
export const WMATIC_POLYGON = new Token(
  ChainId.POLYGON,
  '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
  18,
  'WMATIC',
  'Wrapped MATIC'
)

export const WETH_POLYGON = new Token(
  ChainId.POLYGON,
  '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
  18,
  'WETH',
  'Wrapped Ether'
)

export const USDC_POLYGON = new Token(
  ChainId.POLYGON,
  '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
  6,
  'USDC',
  'USD//C'
)

export const DAI_POLYGON = new Token(
  ChainId.POLYGON,
  '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
  18,
  'DAI',
  'Dai Stablecoin'
)

//polygon mumbai tokens
export const WMATIC_POLYGON_MUMBAI = new Token(
  ChainId.POLYGON_MUMBAI,
  '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889',
  18,
  'WMATIC',
  'Wrapped MATIC'
)

export const USDC_POLYGON_MUMBAI = new Token(
  ChainId.POLYGON_MUMBAI,
  '0xe11a86849d99f524cac3e7a0ec1241828e332c62',
  6,
  'USDC',
  'USD//C'
)

export const DAI_POLYGON_MUMBAI = new Token(
  ChainId.POLYGON_MUMBAI,
  '0x001b3b4d0f3714ca98ba10f6042daebf0b1b7b6f',
  18,
  'DAI',
  'Dai Stablecoin'
)

export const WETH_POLYGON_MUMBAI = new Token(
  ChainId.POLYGON_MUMBAI,
  '0xa6fa4fb5f76172d178d61b04b0ecd319c5d1c0aa',
  18,
  'WETH',
  'Wrapped Ether'
)

// BNB chain Tokens
export const BTC_BNB = new Token(ChainId.BNB, '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c', 18, 'BTCB', 'Binance BTC')

export const BUSD_BNB = new Token(ChainId.BNB, '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', 18, 'BUSD', 'BUSD')

export const DAI_BNB = new Token(ChainId.BNB, '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', 18, 'DAI', 'DAI')

export const ETH_BNB = new Token(ChainId.BNB, '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', 18, 'ETH', 'ETH')

export const USDC_BNB = new Token(ChainId.BNB, '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', 18, 'USDC', 'USDC')

export const USDT_BNB = new Token(ChainId.BNB, '0x55d398326f99059fF775485246999027B3197955', 18, 'USDT', 'USDT')

// Celo Tokens
export const CELO = new Token(
  ChainId.CELO,
  '0x471EcE3750Da237f93B8E339c536989b8978a438',
  18,
  'CELO',
  'Celo native asset'
)

export const DAI_CELO = new Token(
  ChainId.CELO,
  '0xE4fE50cdD716522A56204352f00AA110F731932d',
  18,
  'DAI',
  'Dai Stablecoin'
)

export const CUSD_CELO = new Token(
  ChainId.CELO,
  '0x765DE816845861e75A25fCA122bb6898B8B1282a',
  18,
  'CUSD',
  'Celo Dollar Stablecoin'
)

export const CEUR_CELO = new Token(
  ChainId.CELO,
  '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73',
  18,
  'CEUR',
  'Celo Euro Stablecoin'
)

// Celo Alfajores Tokens
export const CELO_ALFAJORES = new Token(
  ChainId.CELO_ALFAJORES,
  '0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9',
  18,
  'CELO',
  'Celo native asset'
)
export const DAI_CELO_ALFAJORES = new Token(
  ChainId.CELO_ALFAJORES,
  '0x7d91E51C8F218f7140188A155f5C75388630B6a8',
  18,
  'DAI',
  'Dai Stablecoin'
)

export const CUSD_CELO_ALFAJORES = new Token(
  ChainId.CELO_ALFAJORES,
  '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1',
  18,
  'CUSD',
  'Celo Dollar Stablecoin'
)

export const CEUR_CELO_ALFAJORES = new Token(
  ChainId.CELO_ALFAJORES,
  '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F',
  18,
  'CEUR',
  'Celo Euro Stablecoin'
)

// Avalanche Tokens
export const DAI_AVAX = new Token(
  ChainId.AVALANCHE,
  '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70',
  18,
  'DAI.e',
  'DAI.e Token'
)

export const USDC_AVAX = new Token(
  ChainId.AVALANCHE,
  '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
  6,
  'USDC',
  'USDC Token'
)

// Base Tokens
export const USDC_BASE = new Token(
  ChainId.BASE,
  '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
  6,
  'USDbC',
  'USD Base Coin'
)

// Base Goerli Tokens
export const USDC_BASE_GOERLI = new Token(
  ChainId.BASE_GOERLI,
  '0x853154e2A5604E5C74a2546E2871Ad44932eB92C',
  6,
  'USDbC',
  'USD Base Coin'
)

// Gnosis Tokens
export const USDC_ETHEREUM_GNOSIS = new Token(
  ChainId.GNOSIS,
  '0xddafbb505ad214d7b80b1f830fccc89b60fb7a83',
  6,
  'USDC',
  'USDC from Ethereum on Gnosis'
)

export const WXDAI_GNOSIS = new Token(
  ChainId.GNOSIS,
  '0xe91d153e0b41518a2ce8dd3d7944fa863463a97d',
  18,
  'WXDAI',
  'Wrapped XDAI on Gnosis'
)

export const WBTC_GNOSIS = new Token(
  ChainId.GNOSIS,
  '0x8e5bbbb09ed1ebde8674cda39a0c169401db4252',
  8,
  'WBTC',
  'Wrapped BTC from Ethereum on Gnosis'
)

// Moonbeam Tokens
export const USDC_MOONBEAM = new Token(
  ChainId.MOONBEAM,
  '0x818ec0A7Fe18Ff94269904fCED6AE3DaE6d6dC0b',
  6,
  'USDC',
  'USD Coin bridged using Multichain'
)

export const WGLMR_MOONBEAM = new Token(
  ChainId.MOONBEAM,
  '0xAcc15dC74880C9944775448304B263D191c6077F',
  18,
  'WGLMR',
  'Wrapped GLMR'
)

export const DAI_MOONBEAM = new Token(
  ChainId.MOONBEAM,
  '0x818ec0A7Fe18Ff94269904fCED6AE3DaE6d6dC0b',
  6,
  'DAI',
  'Dai on moonbeam bridged using Multichain'
)

export const WBTC_MOONBEAM = new Token(
  ChainId.MOONBEAM,
  '0x922D641a426DcFFaeF11680e5358F34d97d112E1',
  8,
  'WBTC',
  'Wrapped BTC bridged using Multichain'
)

export class TokenProvider implements ITokenProvider {
  constructor(private chainId: ChainId, protected multicall2Provider: IMulticallProvider) {}

  private async getTokenSymbol(
    addresses: string[],
    providerConfig?: ProviderConfig
  ): Promise<{
    result: {
      blockNumber: BigNumber
      results: Result<[string]>[]
    }
    isBytes32: boolean
  }> {
    let result
    let isBytes32 = false

    try {
      result = await this.multicall2Provider.callSameFunctionOnMultipleContracts<undefined, [string]>({
        addresses,
        contractInterface: IERC20Metadata__factory.createInterface(),
        functionName: 'symbol',
        providerConfig,
      })
    } catch (error) {
      log.error({ addresses }, `TokenProvider.getTokenSymbol[string] failed with error ${error}. Trying with bytes32.`)

      const bytes32Interface = new Interface([
        {
          inputs: [],
          name: 'symbol',
          outputs: [
            {
              internalType: 'bytes32',
              name: '',
              type: 'bytes32',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
      ])

      try {
        result = await this.multicall2Provider.callSameFunctionOnMultipleContracts<undefined, [string]>({
          addresses,
          contractInterface: bytes32Interface,
          functionName: 'symbol',
          providerConfig,
        })
        isBytes32 = true
      } catch (error) {
        log.fatal({ addresses }, `TokenProvider.getTokenSymbol[bytes32] failed with error ${error}.`)

        throw new Error('[TokenProvider.getTokenSymbol] Impossible to fetch token symbol.')
      }
    }

    return { result, isBytes32 }
  }

  private async getTokenDecimals(addresses: string[], providerConfig?: ProviderConfig) {
    return this.multicall2Provider.callSameFunctionOnMultipleContracts<undefined, [number]>({
      addresses,
      contractInterface: IERC20Metadata__factory.createInterface(),
      functionName: 'decimals',
      providerConfig,
    })
  }

  public async getTokens(_addresses: string[], providerConfig?: ProviderConfig): Promise<TokenAccessor> {
    const addressToToken: { [address: string]: Token } = {}
    const symbolToToken: { [symbol: string]: Token } = {}

    const addresses = _(_addresses)
      .map((address) => address.toLowerCase())
      .uniq()
      .value()

    if (addresses.length > 0) {
      const [symbolsResult, decimalsResult] = await Promise.all([
        this.getTokenSymbol(addresses, providerConfig),
        this.getTokenDecimals(addresses, providerConfig),
      ])

      const isBytes32 = symbolsResult.isBytes32
      const { results: symbols } = symbolsResult.result
      const { results: decimals } = decimalsResult

      for (let i = 0; i < addresses.length; i++) {
        const address = addresses[i]!

        const symbolResult = symbols[i]
        const decimalResult = decimals[i]

        if (!symbolResult?.success || !decimalResult?.success) {
          log.info(
            {
              symbolResult,
              decimalResult,
            },
            `Dropping token with address ${address} as symbol or decimal are invalid`
          )
          continue
        }

        const symbol = isBytes32 ? parseBytes32String(symbolResult.result[0]!) : symbolResult.result[0]!
        const decimal = decimalResult.result[0]!

        addressToToken[address.toLowerCase()] = new Token(this.chainId, address, decimal, symbol)
        symbolToToken[symbol.toLowerCase()] = addressToToken[address.toLowerCase()]!
      }

      log.info(
        `Got token symbol and decimals for ${Object.values(addressToToken).length} out of ${
          addresses.length
        } tokens on-chain ${providerConfig ? `as of: ${providerConfig?.blockNumber}` : ''}`
      )
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

export const DAI_ON = (chainId: ChainId): Token => {
  switch (chainId) {
    case ChainId.MAINNET:
      return DAI_MAINNET
    case ChainId.GOERLI:
      return DAI_GOERLI
    case ChainId.SEPOLIA:
      return DAI_SEPOLIA
    case ChainId.OPTIMISM:
      return DAI_OPTIMISM
    case ChainId.OPTIMISM_GOERLI:
      return DAI_OPTIMISM_GOERLI
    case ChainId.ARBITRUM_ONE:
      return DAI_ARBITRUM
    case ChainId.ARBITRUM_GOERLI:
      return DAI_ARBITRUM_GOERLI
    case ChainId.POLYGON:
      return DAI_POLYGON
    case ChainId.POLYGON_MUMBAI:
      return DAI_POLYGON_MUMBAI
    case ChainId.CELO:
      return DAI_CELO
    case ChainId.CELO_ALFAJORES:
      return DAI_CELO_ALFAJORES
    case ChainId.MOONBEAM:
      return DAI_MOONBEAM
    case ChainId.BNB:
      return DAI_BNB
    case ChainId.AVALANCHE:
      return DAI_AVAX
    default:
      throw new Error(`Chain id: ${chainId} not supported`)
  }
}

export const USDT_ON = (chainId: ChainId): Token => {
  switch (chainId) {
    case ChainId.MAINNET:
      return USDT_MAINNET
    case ChainId.GOERLI:
      return USDT_GOERLI
    case ChainId.OPTIMISM:
      return USDT_OPTIMISM
    case ChainId.OPTIMISM_GOERLI:
      return USDT_OPTIMISM_GOERLI
    case ChainId.ARBITRUM_ONE:
      return USDT_ARBITRUM
    case ChainId.BNB:
      return USDT_BNB
    default:
      throw new Error(`Chain id: ${chainId} not supported`)
  }
}

export const USDC_ON = (chainId: ChainId): Token => {
  switch (chainId) {
    case ChainId.MAINNET:
      return USDC_MAINNET
    case ChainId.GOERLI:
      return USDC_GOERLI
    case ChainId.SEPOLIA:
      return USDC_SEPOLIA
    case ChainId.OPTIMISM:
      return USDC_OPTIMISM
    case ChainId.OPTIMISM_GOERLI:
      return USDC_OPTIMISM_GOERLI
    case ChainId.ARBITRUM_ONE:
      return USDC_ARBITRUM
    case ChainId.ARBITRUM_GOERLI:
      return USDC_ARBITRUM_GOERLI
    case ChainId.POLYGON:
      return USDC_POLYGON
    case ChainId.POLYGON_MUMBAI:
      return USDC_POLYGON_MUMBAI
    case ChainId.GNOSIS:
      return USDC_ETHEREUM_GNOSIS
    case ChainId.MOONBEAM:
      return USDC_MOONBEAM
    case ChainId.BNB:
      return USDC_BNB
    case ChainId.AVALANCHE:
      return USDC_AVAX
    case ChainId.BASE:
      return USDC_BASE
    case ChainId.BASE_GOERLI:
      return USDC_BASE_GOERLI
    default:
      throw new Error(`Chain id: ${chainId} not supported`)
  }
}

export const WNATIVE_ON = (chainId: ChainId.MAINNET | ChainId.CELO | ChainId.CELO_ALFAJORES): Token => {
  return WRAPPED_NATIVE_CURRENCY[chainId]
}
