import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { GraphQLApi } from '@universe/api'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SafetyInfo } from 'uniswap/src/features/dataApi/types'
import { CurrencyId } from 'uniswap/src/types/currency'

// Web: 55
// Mobile: 93
// Extension: 27

// In migration v55/93/27, we took out of a lot of fields from the SearchResultType that should be fetched at runtime instead of stored
// i.e. (such as name, logoUrl, feeData, ensName, unitag, imageUrl, etc)

export type PreV55SearchResult =
  | TokenSearchResult
  | WalletSearchResult
  | EtherscanSearchResult
  | NFTCollectionSearchResult
  | PoolSearchResult

export enum PreV55SearchResultType {
  ENSAddress = 0,
  Token = 1,
  Etherscan = 2,
  NFTCollection = 3,
  Unitag = 4,
  WalletByAddress = 5,
  Pool = 6,
}

interface SearchResultBase {
  type: PreV55SearchResultType
  searchId?: string
}

export interface TokenSearchResult extends SearchResultBase {
  type: PreV55SearchResultType.Token
  chainId: UniverseChainId
  symbol: string
  address: Address | null
  name: string | null
  logoUrl: string | null
  safetyInfo?: SafetyInfo | null
  feeData?: GraphQLApi.FeeData | null
}

interface PoolSearchResult extends SearchResultBase {
  type: PreV55SearchResultType.Pool
  chainId: UniverseChainId
  poolId: string
  protocolVersion: ProtocolVersion
  hookAddress?: Address
  feeTier: number
  token0CurrencyId: CurrencyId
  token1CurrencyId: CurrencyId
}

export function isPoolSearchResult(x: PreV55SearchResult): x is PoolSearchResult {
  return x.type === PreV55SearchResultType.Pool
}

interface NFTCollectionSearchResult extends SearchResultBase {
  type: PreV55SearchResultType.NFTCollection
  chainId: UniverseChainId
  address: Address
  name: string
  imageUrl: string | null
  isVerified: boolean
}

interface EtherscanSearchResult extends SearchResultBase {
  type: PreV55SearchResultType.Etherscan
  address: Address
}

type WalletSearchResult = ENSAddressSearchResult | UnitagSearchResult | WalletByAddressSearchResult

interface WalletByAddressSearchResult extends SearchResultBase {
  type: PreV55SearchResultType.WalletByAddress
  address: Address
}
interface ENSAddressSearchResult extends SearchResultBase {
  type: PreV55SearchResultType.ENSAddress
  address: Address
  isRawName?: boolean
  ensName: string
  primaryENSName?: string
}

interface UnitagSearchResult extends SearchResultBase {
  type: PreV55SearchResultType.Unitag
  address: Address
  unitag: string
}
