import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { Connection, PublicKey } from '@solana/web3.js'

export interface NetworkInfo {
  readonly chainId: ChainId

  // route can be used to detect which chain is favored in query param, check out useActiveNetwork.ts
  readonly route: string
  readonly ksSettingRoute: string
  readonly priceRoute: string
  readonly name: string
  readonly icon: string
  readonly iconDark: string | null
  readonly iconSelected: string | null
  readonly iconDarkSelected: string | null
  readonly etherscanUrl: string
  readonly etherscanName: string
  readonly bridgeURL: string
  readonly nativeToken: {
    readonly symbol: string
    readonly name: string
    readonly logo: string
    readonly decimal: number
    readonly minForGas: number
  }
  readonly routerUri: string
  readonly coingeckoNetworkId: string | null //https://api.coingecko.com/api/v3/asset_platforms
  readonly coingeckoNativeTokenId: string | null //https://api.coingecko.com/api/v3/coins/list
  readonly tokenListUrl: string
  readonly trueSightId: string | null
  readonly dexToCompare: string | null
  readonly limitOrder: {
    development: string | null
    production: string | null
  }
  // token: {
  //   DAI: Token
  //   USDC: Token
  //   USDT: Token
  // }
}

export interface EVMNetworkInfo extends NetworkInfo {
  readonly poolFarmRoute: string // use this to get data from our internal BE
  readonly blockClient: ApolloClient<NormalizedCacheObject>
  readonly rpcUrl: string
  readonly multicall: string
  readonly classic: {
    readonly client: ApolloClient<NormalizedCacheObject>
    readonly static: {
      readonly zap: string
      readonly router: string
      readonly factory: string
    }
    readonly oldStatic: {
      readonly zap: string
      readonly router: string
      readonly factory: string
    } | null
    readonly dynamic: {
      readonly zap: string
      readonly router: string
      readonly factory: string
    } | null
    readonly claimReward: string | null
    readonly fairlaunch: string[]
    readonly fairlaunchV2: string[]
  }
  readonly elastic: {
    readonly client: ApolloClient<NormalizedCacheObject>
    readonly startBlock: number
    readonly coreFactory: string
    readonly nonfungiblePositionManager: string
    readonly tickReader: string
    readonly initCodeHash: string
    readonly quoter: string
    readonly routers: string
    readonly farms: string[]
  }
  readonly limitOrder: {
    development: string | null
    production: string | null
  }
  readonly averageBlockTimeInSeconds: number
  readonly deBankSlug: string
  readonly kyberDAO?: {
    readonly staking: string
    readonly dao: string
    readonly rewardsDistributor: string
    readonly daoStatsApi: string
    readonly KNCAddress: string
    readonly KNCLAddress: string
  }
}

export interface SolanaNetworkInfo extends NetworkInfo {
  // readonly classic: {
  //   readonly pool: string
  //   readonly factory: string
  //   readonly router: string
  // }
  connection: Connection
  aggregatorProgramAddress: string
  openBookAddress: PublicKey
}
