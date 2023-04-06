import { gql } from '@apollo/client'
import * as Apollo from '@apollo/client'
export type Maybe<T> = T | null
export type InputMaybe<T> = Maybe<T>
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K]
}
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>
}
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>
}
const defaultOptions = {} as const
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string
  String: string
  Boolean: boolean
  Int: number
  Float: number
  /**
   * The `AWSJSON` scalar type provided by AWS AppSync, represents a JSON string that
   * complies with [RFC 8259](https://tools.ietf.org/html/rfc8259).  Maps like
   * "**{\\"upvotes\\": 10}**", lists like "**[1,2,3]**", and scalar values like
   * "**\\"AWSJSON example string\\"**", "**1**", and "**true**" are accepted as
   * valid JSON and will automatically be parsed and loaded in the resolver mapping
   * templates as Maps, Lists, or Scalar values rather than as the literal input
   * strings.  Invalid JSON strings like "**{a: 1}**", "**{'a': 1}**" and "**Unquoted
   * string**" will throw GraphQL validation errors.
   */
  AWSJSON: any
}

export enum ActivityType {
  Approve = 'APPROVE',
  Borrow = 'BORROW',
  Burn = 'BURN',
  Cancel = 'CANCEL',
  Claim = 'CLAIM',
  Deployment = 'DEPLOYMENT',
  Lend = 'LEND',
  Mint = 'MINT',
  Nft = 'NFT',
  Receive = 'RECEIVE',
  Repay = 'REPAY',
  Send = 'SEND',
  Stake = 'STAKE',
  Swap = 'SWAP',
  Staking = 'Staking',
  Unknown = 'UNKNOWN',
  Unstake = 'UNSTAKE',
  Withdraw = 'WITHDRAW',
  Market = 'market',
  Money = 'money',
}

export type Amount = IAmount & {
  __typename?: 'Amount'
  currency?: Maybe<Currency>
  id: Scalars['ID']
  value: Scalars['Float']
}

export type AmountChange = {
  __typename?: 'AmountChange'
  absolute?: Maybe<Amount>
  id: Scalars['ID']
  percentage?: Maybe<Amount>
}

export type AssetActivity = {
  __typename?: 'AssetActivity'
  assetChanges: Array<Maybe<AssetChange>>
  chain: Chain
  gasUsed?: Maybe<Scalars['Float']>
  id: Scalars['ID']
  timestamp: Scalars['Int']
  transaction: Transaction
  type: ActivityType
}

export type AssetChange =
  | NftApproval
  | NftApproveForAll
  | NftTransfer
  | TokenApproval
  | TokenTransfer

export enum Chain {
  Arbitrum = 'ARBITRUM',
  Bnb = 'BNB',
  Celo = 'CELO',
  Ethereum = 'ETHEREUM',
  EthereumGoerli = 'ETHEREUM_GOERLI',
  Optimism = 'OPTIMISM',
  Polygon = 'POLYGON',
  UnknownChain = 'UNKNOWN_CHAIN',
}

export enum CollectionSortableField {
  Volume = 'VOLUME',
}

export type ContractInput = {
  address?: InputMaybe<Scalars['String']>
  chain: Chain
}

export enum Currency {
  Eth = 'ETH',
  Matic = 'MATIC',
  Usd = 'USD',
}

export type Dimensions = {
  __typename?: 'Dimensions'
  height?: Maybe<Scalars['Float']>
  id: Scalars['ID']
  width?: Maybe<Scalars['Float']>
}

export enum HighLow {
  High = 'HIGH',
  Low = 'LOW',
}

export enum HistoryDuration {
  Day = 'DAY',
  Hour = 'HOUR',
  Max = 'MAX',
  Month = 'MONTH',
  Week = 'WEEK',
  Year = 'YEAR',
}

export type IAmount = {
  currency?: Maybe<Currency>
  value: Scalars['Float']
}

export type IContract = {
  address?: Maybe<Scalars['String']>
  chain: Chain
}

export type Image = {
  __typename?: 'Image'
  dimensions?: Maybe<Dimensions>
  id: Scalars['ID']
  url: Scalars['String']
}

/**   TODO: deprecate this enum */
export enum MarketSortableField {
  MarketCap = 'MARKET_CAP',
  Volume = 'VOLUME',
}

export type NftActivity = {
  __typename?: 'NftActivity'
  address: Scalars['String']
  asset?: Maybe<NftAsset>
  fromAddress: Scalars['String']
  id: Scalars['ID']
  marketplace?: Maybe<Scalars['String']>
  orderStatus?: Maybe<OrderStatus>
  price?: Maybe<Amount>
  quantity?: Maybe<Scalars['Int']>
  timestamp: Scalars['Int']
  toAddress?: Maybe<Scalars['String']>
  tokenId?: Maybe<Scalars['String']>
  transactionHash?: Maybe<Scalars['String']>
  type: NftActivityType
  url?: Maybe<Scalars['String']>
}

export type NftActivityConnection = {
  __typename?: 'NftActivityConnection'
  edges: Array<NftActivityEdge>
  pageInfo: PageInfo
}

export type NftActivityEdge = {
  __typename?: 'NftActivityEdge'
  cursor: Scalars['String']
  node: NftActivity
}

export type NftActivityFilterInput = {
  activityTypes?: InputMaybe<Array<NftActivityType>>
  address?: InputMaybe<Scalars['String']>
  tokenId?: InputMaybe<Scalars['String']>
}

export enum NftActivityType {
  CancelListing = 'CANCEL_LISTING',
  Listing = 'LISTING',
  Sale = 'SALE',
  Transfer = 'TRANSFER',
}

export type NftApproval = {
  __typename?: 'NftApproval'
  approvedAddress: Scalars['String']
  /**   can be erc20 or erc1155 */
  asset: NftAsset
  id: Scalars['ID']
  nftStandard: NftStandard
}

export type NftApproveForAll = {
  __typename?: 'NftApproveForAll'
  approved: Scalars['Boolean']
  /**   can be erc721 or erc1155 */
  asset: NftAsset
  id: Scalars['ID']
  nftStandard: NftStandard
  operatorAddress: Scalars['String']
}

export type NftAsset = {
  __typename?: 'NftAsset'
  animationUrl?: Maybe<Scalars['String']>
  collection?: Maybe<NftCollection>
  creator?: Maybe<NftProfile>
  description?: Maybe<Scalars['String']>
  flaggedBy?: Maybe<Scalars['String']>
  id: Scalars['ID']
  image?: Maybe<Image>
  imageUrl?: Maybe<Scalars['String']>
  listings?: Maybe<NftOrderConnection>
  metadataUrl?: Maybe<Scalars['String']>
  name?: Maybe<Scalars['String']>
  nftContract?: Maybe<NftContract>
  originalImage?: Maybe<Image>
  /**   TODO: may need to be array to support erc1155 cases. not needed at the moment so will revisit. */
  ownerAddress?: Maybe<Scalars['String']>
  rarities?: Maybe<Array<NftAssetRarity>>
  smallImage?: Maybe<Image>
  smallImageUrl?: Maybe<Scalars['String']>
  suspiciousFlag?: Maybe<Scalars['Boolean']>
  thumbnail?: Maybe<Image>
  thumbnailUrl?: Maybe<Scalars['String']>
  tokenId: Scalars['String']
  traits?: Maybe<Array<NftAssetTrait>>
}

export type NftAssetListingsArgs = {
  _fs?: InputMaybe<Scalars['String']>
  after?: InputMaybe<Scalars['String']>
  asc?: InputMaybe<Scalars['Boolean']>
  before?: InputMaybe<Scalars['String']>
  chain?: InputMaybe<Chain>
  first?: InputMaybe<Scalars['Int']>
  last?: InputMaybe<Scalars['Int']>
}

export type NftAssetConnection = {
  __typename?: 'NftAssetConnection'
  edges: Array<NftAssetEdge>
  pageInfo: PageInfo
  totalCount?: Maybe<Scalars['Int']>
}

export type NftAssetEdge = {
  __typename?: 'NftAssetEdge'
  cursor: Scalars['String']
  node: NftAsset
}

export type NftAssetInput = {
  address: Scalars['String']
  tokenId: Scalars['String']
}

export type NftAssetRarity = {
  __typename?: 'NftAssetRarity'
  id: Scalars['ID']
  provider?: Maybe<NftRarityProvider>
  rank?: Maybe<Scalars['Int']>
  score?: Maybe<Scalars['Float']>
}

export enum NftAssetSortableField {
  Price = 'PRICE',
  Rarity = 'RARITY',
}

export type NftAssetTrait = {
  __typename?: 'NftAssetTrait'
  id: Scalars['ID']
  name?: Maybe<Scalars['String']>
  rarity?: Maybe<Scalars['Float']>
  value?: Maybe<Scalars['String']>
}

export type NftAssetTraitInput = {
  name: Scalars['String']
  values: Array<Scalars['String']>
}

export type NftAssetsFilterInput = {
  listed?: InputMaybe<Scalars['Boolean']>
  marketplaces?: InputMaybe<Array<NftMarketplace>>
  maxPrice?: InputMaybe<Scalars['String']>
  minPrice?: InputMaybe<Scalars['String']>
  tokenIds?: InputMaybe<Array<Scalars['String']>>
  tokenSearchQuery?: InputMaybe<Scalars['String']>
  traits?: InputMaybe<Array<NftAssetTraitInput>>
}

export type NftBalance = {
  __typename?: 'NftBalance'
  id: Scalars['ID']
  lastPrice?: Maybe<TimestampedAmount>
  listedMarketplaces?: Maybe<Array<NftMarketplace>>
  listingFees?: Maybe<Array<Maybe<NftFee>>>
  ownedAsset?: Maybe<NftAsset>
  quantity?: Maybe<Scalars['Int']>
}

export type NftBalanceConnection = {
  __typename?: 'NftBalanceConnection'
  edges: Array<NftBalanceEdge>
  pageInfo: PageInfo
}

export type NftBalanceEdge = {
  __typename?: 'NftBalanceEdge'
  cursor: Scalars['String']
  node: NftBalance
}

export type NftBalancesFilterInput = {
  addresses?: InputMaybe<Array<Scalars['String']>>
  assets?: InputMaybe<Array<NftAssetInput>>
}

export type NftCollection = {
  __typename?: 'NftCollection'
  bannerImage?: Maybe<Image>
  /**
   *  TODO: support querying for collection assets here
   * assets(page: Int, pageSize: Int, orderBy: NftAssetSortableField): [NftAsset]
   */
  bannerImageUrl?: Maybe<Scalars['String']>
  collectionId: Scalars['String']
  creator?: Maybe<NftProfile>
  description?: Maybe<Scalars['String']>
  discordUrl?: Maybe<Scalars['String']>
  homepageUrl?: Maybe<Scalars['String']>
  id: Scalars['ID']
  image?: Maybe<Image>
  imageUrl?: Maybe<Scalars['String']>
  instagramName?: Maybe<Scalars['String']>
  isVerified?: Maybe<Scalars['Boolean']>
  markets?: Maybe<Array<NftCollectionMarket>>
  name?: Maybe<Scalars['String']>
  nftContracts?: Maybe<Array<NftContract>>
  numAssets?: Maybe<Scalars['Int']>
  openseaUrl?: Maybe<Scalars['String']>
  traits?: Maybe<Array<NftCollectionTrait>>
  twitterName?: Maybe<Scalars['String']>
}

export type NftCollectionMarketsArgs = {
  _fs?: InputMaybe<Scalars['String']>
  currencies: Array<Currency>
}

export type NftCollectionConnection = {
  __typename?: 'NftCollectionConnection'
  edges: Array<NftCollectionEdge>
  pageInfo: PageInfo
}

export type NftCollectionEdge = {
  __typename?: 'NftCollectionEdge'
  cursor: Scalars['String']
  node: NftCollection
}

export type NftCollectionMarket = {
  __typename?: 'NftCollectionMarket'
  floorPrice?: Maybe<TimestampedAmount>
  floorPricePercentChange?: Maybe<TimestampedAmount>
  id: Scalars['ID']
  listings?: Maybe<TimestampedAmount>
  marketplaces?: Maybe<Array<NftCollectionMarketplace>>
  nftContracts?: Maybe<Array<NftContract>>
  owners?: Maybe<Scalars['Int']>
  percentListed?: Maybe<TimestampedAmount>
  percentUniqueOwners?: Maybe<TimestampedAmount>
  sales?: Maybe<TimestampedAmount>
  totalVolume?: Maybe<TimestampedAmount>
  volume?: Maybe<TimestampedAmount>
  volume24h?: Maybe<Amount>
  volumePercentChange?: Maybe<TimestampedAmount>
}

export type NftCollectionMarketFloorPriceArgs = {
  _fs?: InputMaybe<Scalars['String']>
}

export type NftCollectionMarketFloorPricePercentChangeArgs = {
  duration?: InputMaybe<HistoryDuration>
}

export type NftCollectionMarketMarketplacesArgs = {
  marketplaces?: InputMaybe<Array<NftMarketplace>>
}

export type NftCollectionMarketSalesArgs = {
  duration?: InputMaybe<HistoryDuration>
}

export type NftCollectionMarketVolumeArgs = {
  duration?: InputMaybe<HistoryDuration>
}

export type NftCollectionMarketVolumePercentChangeArgs = {
  duration?: InputMaybe<HistoryDuration>
}

export type NftCollectionMarketplace = {
  __typename?: 'NftCollectionMarketplace'
  floorPrice?: Maybe<Scalars['Float']>
  id: Scalars['ID']
  listings?: Maybe<Scalars['Int']>
  marketplace?: Maybe<NftMarketplace>
}

export type NftCollectionTrait = {
  __typename?: 'NftCollectionTrait'
  id: Scalars['ID']
  name?: Maybe<Scalars['String']>
  stats?: Maybe<Array<NftCollectionTraitStats>>
  values?: Maybe<Array<Scalars['String']>>
}

export type NftCollectionTraitStats = {
  __typename?: 'NftCollectionTraitStats'
  assets?: Maybe<Scalars['Int']>
  id: Scalars['ID']
  listings?: Maybe<Scalars['Int']>
  name?: Maybe<Scalars['String']>
  value?: Maybe<Scalars['String']>
}

export type NftCollectionsFilterInput = {
  addresses?: InputMaybe<Array<Scalars['String']>>
  nameQuery?: InputMaybe<Scalars['String']>
}

export type NftContract = IContract & {
  __typename?: 'NftContract'
  address: Scalars['String']
  chain: Chain
  id: Scalars['ID']
  name?: Maybe<Scalars['String']>
  standard?: Maybe<NftStandard>
  symbol?: Maybe<Scalars['String']>
  totalSupply?: Maybe<Scalars['Int']>
}

export type NftFee = {
  __typename?: 'NftFee'
  basisPoints: Scalars['Int']
  id: Scalars['ID']
  payoutAddress: Scalars['String']
}

export enum NftMarketSortableField {
  FloorPrice = 'FLOOR_PRICE',
  Volume = 'VOLUME',
}

export enum NftMarketplace {
  Cryptopunks = 'CRYPTOPUNKS',
  Foundation = 'FOUNDATION',
  Looksrare = 'LOOKSRARE',
  Nft20 = 'NFT20',
  Nftx = 'NFTX',
  Opensea = 'OPENSEA',
  Sudoswap = 'SUDOSWAP',
  X2Y2 = 'X2Y2',
}

export type NftOrder = {
  __typename?: 'NftOrder'
  address: Scalars['String']
  auctionType?: Maybe<Scalars['String']>
  createdAt: Scalars['Float']
  endAt?: Maybe<Scalars['Float']>
  id: Scalars['ID']
  maker: Scalars['String']
  marketplace: NftMarketplace
  marketplaceUrl: Scalars['String']
  orderHash?: Maybe<Scalars['String']>
  price: Amount
  protocolParameters?: Maybe<Scalars['AWSJSON']>
  quantity: Scalars['Int']
  startAt: Scalars['Float']
  status: OrderStatus
  taker?: Maybe<Scalars['String']>
  tokenId?: Maybe<Scalars['String']>
  type: OrderType
}

export type NftOrderConnection = {
  __typename?: 'NftOrderConnection'
  edges: Array<NftOrderEdge>
  pageInfo: PageInfo
}

export type NftOrderEdge = {
  __typename?: 'NftOrderEdge'
  cursor: Scalars['String']
  node: NftOrder
}

export type NftProfile = {
  __typename?: 'NftProfile'
  address: Scalars['String']
  id: Scalars['ID']
  isVerified?: Maybe<Scalars['Boolean']>
  profileImage?: Maybe<Image>
  username?: Maybe<Scalars['String']>
}

export enum NftRarityProvider {
  RaritySniper = 'RARITY_SNIPER',
}

export type NftRouteResponse = {
  __typename?: 'NftRouteResponse'
  calldata: Scalars['String']
  id: Scalars['ID']
  route?: Maybe<Array<NftTrade>>
  sendAmount: TokenAmount
  toAddress: Scalars['String']
}

export enum NftStandard {
  Erc721 = 'ERC721',
  Erc1155 = 'ERC1155',
  Noncompliant = 'NONCOMPLIANT',
}

export type NftTrade = {
  __typename?: 'NftTrade'
  amount: Scalars['Int']
  contractAddress: Scalars['String']
  id: Scalars['ID']
  marketplace: NftMarketplace
  /**   price represents the current price of the NFT, which can be different from quotePrice */
  price: TokenAmount
  /**   quotePrice represents the last quoted price of the NFT */
  quotePrice?: Maybe<TokenAmount>
  tokenId: Scalars['String']
  tokenType: NftStandard
}

export type NftTradeInput = {
  amount: Scalars['Int']
  contractAddress: Scalars['String']
  id: Scalars['ID']
  marketplace: NftMarketplace
  quotePrice?: InputMaybe<TokenAmountInput>
  tokenId: Scalars['String']
  tokenType: NftStandard
}

export type NftTransfer = {
  __typename?: 'NftTransfer'
  asset: NftAsset
  direction: TransactionDirection
  id: Scalars['ID']
  nftStandard: NftStandard
  recipient: Scalars['String']
  sender: Scalars['String']
}

export enum OrderStatus {
  Cancelled = 'CANCELLED',
  Executed = 'EXECUTED',
  Expired = 'EXPIRED',
  Valid = 'VALID',
}

export enum OrderType {
  Listing = 'LISTING',
  Offer = 'OFFER',
}

export type PageInfo = {
  __typename?: 'PageInfo'
  endCursor?: Maybe<Scalars['String']>
  hasNextPage?: Maybe<Scalars['Boolean']>
  hasPreviousPage?: Maybe<Scalars['Boolean']>
  startCursor?: Maybe<Scalars['String']>
}

/**   v2 pool parameters as defined by https://github.com/Uniswap/v2-sdk/blob/main/src/entities/pair.ts */
export type PairInput = {
  tokenAmountA: TokenAmountInput
  tokenAmountB: TokenAmountInput
}

export type PermitDetailsInput = {
  amount: Scalars['String']
  expiration: Scalars['String']
  nonce: Scalars['String']
  token: Scalars['String']
}

export type PermitInput = {
  details: PermitDetailsInput
  sigDeadline: Scalars['String']
  signature: Scalars['String']
  spender: Scalars['String']
}

/**   v3 pool parameters as defined by https://github.com/Uniswap/v3-sdk/blob/main/src/entities/pool.ts */
export type PoolInput = {
  fee: Scalars['Int']
  liquidity: Scalars['String']
  sqrtRatioX96: Scalars['String']
  tickCurrent: Scalars['String']
  tokenA: TokenInput
  tokenB: TokenInput
}

export type Portfolio = {
  __typename?: 'Portfolio'
  assetActivities?: Maybe<Array<Maybe<AssetActivity>>>
  id: Scalars['ID']
  /**   TODO: (michael.zhang) replace with paginated query */
  nftBalances?: Maybe<Array<Maybe<NftBalance>>>
  ownerAddress: Scalars['String']
  tokenBalances?: Maybe<Array<Maybe<TokenBalance>>>
  tokensTotalDenominatedValue?: Maybe<Amount>
  tokensTotalDenominatedValueChange?: Maybe<AmountChange>
}

export type PortfolioAssetActivitiesArgs = {
  _fs?: InputMaybe<Scalars['String']>
  includeOffChain?: InputMaybe<Scalars['Boolean']>
  page?: InputMaybe<Scalars['Int']>
  pageSize?: InputMaybe<Scalars['Int']>
}

export type PortfolioTokensTotalDenominatedValueChangeArgs = {
  duration?: InputMaybe<HistoryDuration>
}

export type Query = {
  __typename?: 'Query'
  nftActivity?: Maybe<NftActivityConnection>
  nftAssets?: Maybe<NftAssetConnection>
  nftBalances?: Maybe<NftBalanceConnection>
  nftCollections?: Maybe<NftCollectionConnection>
  nftCollectionsById?: Maybe<Array<Maybe<NftCollection>>>
  nftRoute?: Maybe<NftRouteResponse>
  portfolios?: Maybe<Array<Maybe<Portfolio>>>
  /** @deprecated Use searchTokens */
  searchTokenProjects?: Maybe<Array<Maybe<TokenProject>>>
  searchTokens?: Maybe<Array<Maybe<Token>>>
  token?: Maybe<Token>
  tokenProjects?: Maybe<Array<Maybe<TokenProject>>>
  tokens?: Maybe<Array<Maybe<Token>>>
  topCollections?: Maybe<NftCollectionConnection>
  topTokens?: Maybe<Array<Maybe<Token>>>
}

export type QueryNftActivityArgs = {
  _fs?: InputMaybe<Scalars['String']>
  after?: InputMaybe<Scalars['String']>
  chain?: InputMaybe<Chain>
  filter?: InputMaybe<NftActivityFilterInput>
  first?: InputMaybe<Scalars['Int']>
}

export type QueryNftAssetsArgs = {
  _fs?: InputMaybe<Scalars['String']>
  address: Scalars['String']
  after?: InputMaybe<Scalars['String']>
  asc?: InputMaybe<Scalars['Boolean']>
  before?: InputMaybe<Scalars['String']>
  chain?: InputMaybe<Chain>
  filter?: InputMaybe<NftAssetsFilterInput>
  first?: InputMaybe<Scalars['Int']>
  last?: InputMaybe<Scalars['Int']>
  orderBy?: InputMaybe<NftAssetSortableField>
}

export type QueryNftBalancesArgs = {
  _fs?: InputMaybe<Scalars['String']>
  after?: InputMaybe<Scalars['String']>
  before?: InputMaybe<Scalars['String']>
  chain?: InputMaybe<Chain>
  filter?: InputMaybe<NftBalancesFilterInput>
  first?: InputMaybe<Scalars['Int']>
  last?: InputMaybe<Scalars['Int']>
  ownerAddress: Scalars['String']
}

export type QueryNftCollectionsArgs = {
  _fs?: InputMaybe<Scalars['String']>
  after?: InputMaybe<Scalars['String']>
  chain?: InputMaybe<Chain>
  filter?: InputMaybe<NftCollectionsFilterInput>
  first?: InputMaybe<Scalars['Int']>
}

export type QueryNftCollectionsByIdArgs = {
  collectionIds?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
}

export type QueryNftRouteArgs = {
  chain?: InputMaybe<Chain>
  nftTrades: Array<NftTradeInput>
  senderAddress: Scalars['String']
  tokenTrades?: InputMaybe<Array<TokenTradeInput>>
}

export type QueryPortfoliosArgs = {
  chains?: InputMaybe<Array<Chain>>
  ownerAddresses: Array<Scalars['String']>
}

export type QuerySearchTokenProjectsArgs = {
  searchQuery: Scalars['String']
}

export type QuerySearchTokensArgs = {
  _fs?: InputMaybe<Scalars['String']>
  searchQuery: Scalars['String']
}

export type QueryTokenArgs = {
  _fs?: InputMaybe<Scalars['String']>
  address?: InputMaybe<Scalars['String']>
  chain: Chain
}

export type QueryTokenProjectsArgs = {
  _fs?: InputMaybe<Scalars['String']>
  contracts: Array<ContractInput>
}

export type QueryTokensArgs = {
  _fs?: InputMaybe<Scalars['String']>
  contracts: Array<ContractInput>
}

export type QueryTopCollectionsArgs = {
  after?: InputMaybe<Scalars['String']>
  chains?: InputMaybe<Array<Chain>>
  cursor?: InputMaybe<Scalars['String']>
  duration?: InputMaybe<HistoryDuration>
  first?: InputMaybe<Scalars['Int']>
  limit?: InputMaybe<Scalars['Int']>
  orderBy?: InputMaybe<CollectionSortableField>
}

export type QueryTopTokensArgs = {
  chain?: InputMaybe<Chain>
  orderBy?: InputMaybe<TokenSortableField>
  page?: InputMaybe<Scalars['Int']>
  pageSize?: InputMaybe<Scalars['Int']>
}

export enum SafetyLevel {
  Blocked = 'BLOCKED',
  MediumWarning = 'MEDIUM_WARNING',
  StrongWarning = 'STRONG_WARNING',
  Verified = 'VERIFIED',
}

export type TimestampedAmount = IAmount & {
  __typename?: 'TimestampedAmount'
  currency?: Maybe<Currency>
  id: Scalars['ID']
  timestamp: Scalars['Int']
  value: Scalars['Float']
}

export type Token = IContract & {
  __typename?: 'Token'
  address?: Maybe<Scalars['String']>
  chain: Chain
  decimals?: Maybe<Scalars['Int']>
  id: Scalars['ID']
  market?: Maybe<TokenMarket>
  name?: Maybe<Scalars['String']>
  project?: Maybe<TokenProject>
  standard?: Maybe<TokenStandard>
  symbol?: Maybe<Scalars['String']>
}

export type TokenMarketArgs = {
  currency?: InputMaybe<Currency>
}

export type TokenProjectArgs = {
  _fs?: InputMaybe<Scalars['String']>
}

export type TokenAmount = {
  __typename?: 'TokenAmount'
  currency: Currency
  id: Scalars['ID']
  value: Scalars['String']
}

export type TokenAmountInput = {
  amount: Scalars['String']
  token: TokenInput
}

export type TokenApproval = {
  __typename?: 'TokenApproval'
  approvedAddress: Scalars['String']
  /**   can be erc20 or erc1155 */
  asset: Token
  id: Scalars['ID']
  quantity: Scalars['String']
  tokenStandard: TokenStandard
}

export type TokenBalance = {
  __typename?: 'TokenBalance'
  blockNumber?: Maybe<Scalars['Int']>
  blockTimestamp?: Maybe<Scalars['Int']>
  denominatedValue?: Maybe<Amount>
  id: Scalars['ID']
  ownerAddress: Scalars['String']
  quantity?: Maybe<Scalars['Float']>
  token?: Maybe<Token>
  tokenProjectMarket?: Maybe<TokenProjectMarket>
}

export type TokenInput = {
  address: Scalars['String']
  chainId: Scalars['Int']
  decimals: Scalars['Int']
  isNative: Scalars['Boolean']
}

export type TokenMarket = {
  __typename?: 'TokenMarket'
  id: Scalars['ID']
  price?: Maybe<Amount>
  priceHighLow?: Maybe<Amount>
  priceHistory?: Maybe<Array<Maybe<TimestampedAmount>>>
  pricePercentChange?: Maybe<Amount>
  token: Token
  totalValueLocked?: Maybe<Amount>
  volume?: Maybe<Amount>
}

export type TokenMarketPriceHighLowArgs = {
  duration: HistoryDuration
  highLow: HighLow
}

export type TokenMarketPriceHistoryArgs = {
  duration: HistoryDuration
}

export type TokenMarketPricePercentChangeArgs = {
  duration: HistoryDuration
}

export type TokenMarketVolumeArgs = {
  duration: HistoryDuration
}

export type TokenProject = {
  __typename?: 'TokenProject'
  description?: Maybe<Scalars['String']>
  homepageUrl?: Maybe<Scalars['String']>
  id: Scalars['ID']
  isSpam?: Maybe<Scalars['Boolean']>
  logo?: Maybe<Image>
  logoUrl?: Maybe<Scalars['String']>
  markets?: Maybe<Array<Maybe<TokenProjectMarket>>>
  name?: Maybe<Scalars['String']>
  safetyLevel?: Maybe<SafetyLevel>
  smallLogo?: Maybe<Image>
  spamCode?: Maybe<Scalars['Int']>
  tokens: Array<Token>
  twitterName?: Maybe<Scalars['String']>
}

export type TokenProjectMarketsArgs = {
  currencies: Array<Currency>
}

export type TokenProjectMarket = {
  __typename?: 'TokenProjectMarket'
  currency: Currency
  /** @deprecated Use marketCap */
  fullyDilutedMarketCap?: Maybe<Amount>
  id: Scalars['ID']
  marketCap?: Maybe<Amount>
  price?: Maybe<Amount>
  priceHighLow?: Maybe<Amount>
  priceHistory?: Maybe<Array<Maybe<TimestampedAmount>>>
  pricePercentChange?: Maybe<Amount>
  /** @deprecated Use pricePercentChange */
  pricePercentChange24h?: Maybe<Amount>
  tokenProject: TokenProject
  /** @deprecated Use TokenMarket.volume for Uniswap volume */
  volume?: Maybe<Amount>
  /** @deprecated Use TokenMarket.volume with duration DAY for Uniswap volume */
  volume24h?: Maybe<Amount>
}

export type TokenProjectMarketPriceHighLowArgs = {
  duration: HistoryDuration
  highLow: HighLow
}

export type TokenProjectMarketPriceHistoryArgs = {
  duration: HistoryDuration
}

export type TokenProjectMarketPricePercentChangeArgs = {
  duration: HistoryDuration
}

export type TokenProjectMarketVolumeArgs = {
  duration: HistoryDuration
}

export enum TokenSortableField {
  MarketCap = 'MARKET_CAP',
  Popularity = 'POPULARITY',
  TotalValueLocked = 'TOTAL_VALUE_LOCKED',
  Volume = 'VOLUME',
}

export enum TokenStandard {
  Erc20 = 'ERC20',
  Erc1155 = 'ERC1155',
  Native = 'NATIVE',
}

export type TokenTradeInput = {
  permit?: InputMaybe<PermitInput>
  routes?: InputMaybe<TokenTradeRoutesInput>
  slippageToleranceBasisPoints?: InputMaybe<Scalars['Int']>
  tokenAmount: TokenAmountInput
}

export type TokenTradeRouteInput = {
  inputAmount: TokenAmountInput
  outputAmount: TokenAmountInput
  pools: Array<TradePoolInput>
}

export type TokenTradeRoutesInput = {
  mixedRoutes?: InputMaybe<Array<TokenTradeRouteInput>>
  tradeType: TokenTradeType
  v2Routes?: InputMaybe<Array<TokenTradeRouteInput>>
  v3Routes?: InputMaybe<Array<TokenTradeRouteInput>>
}

export enum TokenTradeType {
  ExactInput = 'EXACT_INPUT',
  ExactOutput = 'EXACT_OUTPUT',
}

export type TokenTransfer = {
  __typename?: 'TokenTransfer'
  asset: Token
  direction: TransactionDirection
  id: Scalars['ID']
  quantity: Scalars['String']
  recipient: Scalars['String']
  sender: Scalars['String']
  tokenStandard: TokenStandard
  transactedValue?: Maybe<Amount>
}

export type TradePoolInput = {
  pair?: InputMaybe<PairInput>
  pool?: InputMaybe<PoolInput>
}

export type Transaction = {
  __typename?: 'Transaction'
  blockNumber: Scalars['Int']
  from: Scalars['String']
  gasLimit?: Maybe<Scalars['Float']>
  hash: Scalars['String']
  id: Scalars['ID']
  maxFeePerGas?: Maybe<Scalars['Float']>
  nonce: Scalars['Int']
  status: TransactionStatus
  to: Scalars['String']
}

export enum TransactionDirection {
  In = 'IN',
  Out = 'OUT',
  Self = 'SELF',
}

export enum TransactionStatus {
  Confirmed = 'CONFIRMED',
  Failed = 'FAILED',
  Pending = 'PENDING',
}

export type PortfolioBalanceQueryVariables = Exact<{
  owner: Scalars['String']
}>

export type PortfolioBalanceQuery = {
  __typename?: 'Query'
  portfolios?: Array<{
    __typename?: 'Portfolio'
    id: string
    tokensTotalDenominatedValue?: {
      __typename?: 'Amount'
      id: string
      value: number
    } | null
    tokensTotalDenominatedValueChange?: {
      __typename?: 'AmountChange'
      absolute?: { __typename?: 'Amount'; id: string; value: number } | null
      percentage?: { __typename?: 'Amount'; id: string; value: number } | null
    } | null
  } | null> | null
}

export const PortfolioBalanceDocument = gql`
  query PortfolioBalance($owner: String!) {
    portfolios(ownerAddresses: [$owner]) {
      id
      tokensTotalDenominatedValue {
        id
        value
      }
      tokensTotalDenominatedValueChange(duration: DAY) {
        absolute {
          id
          value
        }
        percentage {
          id
          value
        }
      }
    }
  }
`

/**
 * __usePortfolioBalanceQuery__
 *
 * To run a query within a React component, call `usePortfolioBalanceQuery` and pass it any options that fit your needs.
 * When your component renders, `usePortfolioBalanceQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePortfolioBalanceQuery({
 *   variables: {
 *      owner: // value for 'owner'
 *   },
 * });
 */
export function usePortfolioBalanceQuery(
  baseOptions: Apollo.QueryHookOptions<
    PortfolioBalanceQuery,
    PortfolioBalanceQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<PortfolioBalanceQuery, PortfolioBalanceQueryVariables>(
    PortfolioBalanceDocument,
    options
  )
}
export function usePortfolioBalanceLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    PortfolioBalanceQuery,
    PortfolioBalanceQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<
    PortfolioBalanceQuery,
    PortfolioBalanceQueryVariables
  >(PortfolioBalanceDocument, options)
}
export type PortfolioBalanceQueryHookResult = ReturnType<
  typeof usePortfolioBalanceQuery
>
export type PortfolioBalanceLazyQueryHookResult = ReturnType<
  typeof usePortfolioBalanceLazyQuery
>
export type PortfolioBalanceQueryResult = Apollo.QueryResult<
  PortfolioBalanceQuery,
  PortfolioBalanceQueryVariables
>
