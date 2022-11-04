import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
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
  AWSJSON: any;
};

export enum ActivityType {
  Approve = 'APPROVE',
  Borrow = 'BORROW',
  Burn = 'BURN',
  Cancel = 'CANCEL',
  Claim = 'CLAIM',
  Deployment = 'DEPLOYMENT',
  Lend = 'LEND',
  Market = 'market',
  Mint = 'MINT',
  Money = 'money',
  Nft = 'NFT',
  Receive = 'RECEIVE',
  Repay = 'REPAY',
  Send = 'SEND',
  Stake = 'STAKE',
  Staking = 'Staking',
  Swap = 'SWAP',
  Unknown = 'UNKNOWN',
  Unstake = 'UNSTAKE',
  Withdraw = 'WITHDRAW'
}

export type Amount = IAmount & {
  __typename?: 'Amount';
  currency?: Maybe<Currency>;
  id: Scalars['ID'];
  value: Scalars['Float'];
};

export type AssetActivity = {
  __typename?: 'AssetActivity';
  assetChanges: Array<Maybe<AssetChange>>;
  gasUsed?: Maybe<Scalars['Float']>;
  id: Scalars['ID'];
  timestamp: Scalars['Int'];
  transaction: Transaction;
  type: ActivityType;
};

export type AssetChange = NftApproval | NftApproveForAll | NftTransfer | TokenApproval | TokenTransfer;

export enum Chain {
  Arbitrum = 'ARBITRUM',
  Celo = 'CELO',
  Ethereum = 'ETHEREUM',
  EthereumGoerli = 'ETHEREUM_GOERLI',
  Optimism = 'OPTIMISM',
  Polygon = 'POLYGON'
}

export type ContractInput = {
  address?: InputMaybe<Scalars['String']>;
  chain: Chain;
};

export enum Currency {
  Eth = 'ETH',
  Usd = 'USD'
}

export type Dimensions = {
  __typename?: 'Dimensions';
  height?: Maybe<Scalars['Float']>;
  id: Scalars['ID'];
  width?: Maybe<Scalars['Float']>;
};

export enum HighLow {
  High = 'HIGH',
  Low = 'LOW'
}

export enum HistoryDuration {
  Day = 'DAY',
  Hour = 'HOUR',
  Max = 'MAX',
  Month = 'MONTH',
  Week = 'WEEK',
  Year = 'YEAR'
}

export type IAmount = {
  currency?: Maybe<Currency>;
  value: Scalars['Float'];
};

export type IContract = {
  address?: Maybe<Scalars['String']>;
  chain: Chain;
};

export type Image = {
  __typename?: 'Image';
  dimensions?: Maybe<Dimensions>;
  id: Scalars['ID'];
  url: Scalars['String'];
};

export enum MarketSortableField {
  MarketCap = 'MARKET_CAP',
  Volume = 'VOLUME'
}

export type NftApproval = {
  __typename?: 'NftApproval';
  approvedAddress: Scalars['String'];
  /**   can be erc20 or erc1155 */
  asset: NftAsset;
  id: Scalars['ID'];
  nftStandard: NftStandard;
};

export type NftApproveForAll = {
  __typename?: 'NftApproveForAll';
  approved: Scalars['Boolean'];
  /**   can be erc721 or erc1155 */
  asset: NftAsset;
  id: Scalars['ID'];
  nftStandard: NftStandard;
  operatorAddress: Scalars['String'];
};

export type NftAsset = {
  __typename?: 'NftAsset';
  animationUrl?: Maybe<Scalars['String']>;
  collection?: Maybe<NftCollection>;
  creator?: Maybe<NftProfile>;
  description?: Maybe<Scalars['String']>;
  flaggedBy?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  image?: Maybe<Image>;
  imageUrl?: Maybe<Scalars['String']>;
  listings?: Maybe<NftOrderConnection>;
  metadataUrl?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  nftContract?: Maybe<NftContract>;
  originalImage?: Maybe<Image>;
  /**   TODO: may need to be array to support erc1155 cases. not needed at the moment so will revisit. */
  ownerAddress?: Maybe<Scalars['String']>;
  /**   Resolver to be implemented */
  rarities?: Maybe<Array<NftAssetRarity>>;
  smallImage?: Maybe<Image>;
  smallImageUrl?: Maybe<Scalars['String']>;
  suspiciousFlag?: Maybe<Scalars['Boolean']>;
  thumbnail?: Maybe<Image>;
  thumbnailUrl?: Maybe<Scalars['String']>;
  tokenId: Scalars['String'];
  /**   Resolver to be implemented */
  traits?: Maybe<Array<NftAssetTrait>>;
};


export type NftAssetListingsArgs = {
  after?: InputMaybe<Scalars['String']>;
  asc?: InputMaybe<Scalars['Boolean']>;
  before?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
};

export type NftAssetConnection = {
  __typename?: 'NftAssetConnection';
  edges: Array<NftAssetEdge>;
  pageInfo: PageInfo;
};

export type NftAssetEdge = {
  __typename?: 'NftAssetEdge';
  cursor: Scalars['String'];
  node: NftAsset;
};

export type NftAssetInput = {
  address: Scalars['String'];
  tokenId: Scalars['String'];
};

export type NftAssetRarity = {
  __typename?: 'NftAssetRarity';
  id: Scalars['ID'];
  provider?: Maybe<NftRarityProvider>;
  rank?: Maybe<Scalars['Int']>;
  score?: Maybe<Scalars['Float']>;
};

export type NftAssetsFilterInput = {
  listed?: InputMaybe<Scalars['Boolean']>;
  marketplaces?: InputMaybe<Array<NftMarketplace>>;
  maxPrice?: InputMaybe<Scalars['String']>;
  minPrice?: InputMaybe<Scalars['String']>;
  tokenIds?: InputMaybe<Array<Scalars['String']>>;
  tokenSearchQuery?: InputMaybe<Scalars['String']>;
  traits?: InputMaybe<Array<NftAssetTraitInput>>;
};

export enum NftAssetSortableField {
  Price = 'PRICE',
  Rarity = 'RARITY'
}

export type NftAssetTrait = {
  __typename?: 'NftAssetTrait';
  id: Scalars['ID'];
  name?: Maybe<Scalars['String']>;
  rarity?: Maybe<Scalars['Float']>;
  value?: Maybe<Scalars['String']>;
};

export type NftAssetTraitInput = {
  name: Scalars['String'];
  values: Array<Scalars['String']>;
};

export type NftBalance = {
  __typename?: 'NftBalance';
  id: Scalars['ID'];
  listedMarketplaces?: Maybe<Array<NftMarketplace>>;
  ownedAsset?: Maybe<NftAsset>;
};

export type NftBalanceConnection = {
  __typename?: 'NftBalanceConnection';
  edges: Array<NftBalanceEdge>;
  pageInfo: PageInfo;
};

export type NftBalanceEdge = {
  __typename?: 'NftBalanceEdge';
  cursor: Scalars['String'];
  node: NftBalance;
};

export type NftBalancesFilterInput = {
  addresses?: InputMaybe<Array<Scalars['String']>>;
  assets?: InputMaybe<Array<NftAssetInput>>;
};

export type NftCollection = {
  __typename?: 'NftCollection';
  bannerImage?: Maybe<Image>;
  /**
   *  TODO: support querying for collection assets here
   * assets(page: Int, pageSize: Int, orderBy: NftAssetSortableField): [NftAsset]
   */
  bannerImageUrl?: Maybe<Scalars['String']>;
  collectionId: Scalars['String'];
  creator?: Maybe<NftProfile>;
  description?: Maybe<Scalars['String']>;
  discordUrl?: Maybe<Scalars['String']>;
  homepageUrl?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  image?: Maybe<Image>;
  imageUrl?: Maybe<Scalars['String']>;
  instagramName?: Maybe<Scalars['String']>;
  isVerified?: Maybe<Scalars['Boolean']>;
  markets?: Maybe<Array<NftCollectionMarket>>;
  name?: Maybe<Scalars['String']>;
  nftContracts?: Maybe<Array<NftContract>>;
  numAssets?: Maybe<Scalars['Int']>;
  openseaUrl?: Maybe<Scalars['String']>;
  traits?: Maybe<Array<NftCollectionTrait>>;
  twitterName?: Maybe<Scalars['String']>;
};


export type NftCollectionMarketsArgs = {
  currencies: Array<Currency>;
};

export type NftCollectionConnection = {
  __typename?: 'NftCollectionConnection';
  edges: Array<NftCollectionEdge>;
  pageInfo: PageInfo;
};

export type NftCollectionEdge = {
  __typename?: 'NftCollectionEdge';
  cursor: Scalars['String'];
  node: NftCollection;
};

export type NftCollectionMarket = {
  __typename?: 'NftCollectionMarket';
  floorPrice?: Maybe<TimestampedAmount>;
  floorPricePercentChange?: Maybe<TimestampedAmount>;
  id: Scalars['ID'];
  listings?: Maybe<TimestampedAmount>;
  marketplaces?: Maybe<Array<NftCollectionMarketplace>>;
  nftContracts?: Maybe<Array<NftContract>>;
  owners?: Maybe<Scalars['Int']>;
  sales?: Maybe<TimestampedAmount>;
  totalVolume?: Maybe<TimestampedAmount>;
  volume?: Maybe<TimestampedAmount>;
  volume24h?: Maybe<Amount>;
  volumePercentChange?: Maybe<TimestampedAmount>;
};


export type NftCollectionMarketFloorPricePercentChangeArgs = {
  duration?: InputMaybe<HistoryDuration>;
};


export type NftCollectionMarketMarketplacesArgs = {
  marketplaces?: InputMaybe<Array<NftMarketplace>>;
};


export type NftCollectionMarketSalesArgs = {
  duration?: InputMaybe<HistoryDuration>;
};


export type NftCollectionMarketVolumeArgs = {
  duration?: InputMaybe<HistoryDuration>;
};


export type NftCollectionMarketVolumePercentChangeArgs = {
  duration?: InputMaybe<HistoryDuration>;
};

export type NftCollectionMarketplace = {
  __typename?: 'NftCollectionMarketplace';
  id: Scalars['ID'];
  listings?: Maybe<Scalars['Int']>;
  marketplace?: Maybe<NftMarketplace>;
};

export type NftCollectionsFilterInput = {
  addresses?: InputMaybe<Array<Scalars['String']>>;
};

export type NftCollectionTrait = {
  __typename?: 'NftCollectionTrait';
  id: Scalars['ID'];
  name?: Maybe<Scalars['String']>;
  stats?: Maybe<Array<NftCollectionTraitStats>>;
  values?: Maybe<Array<Scalars['String']>>;
};

export type NftCollectionTraitStats = {
  __typename?: 'NftCollectionTraitStats';
  assets?: Maybe<Scalars['Int']>;
  id: Scalars['ID'];
  listings?: Maybe<Scalars['Int']>;
  name?: Maybe<Scalars['String']>;
  value?: Maybe<Scalars['String']>;
};

export type NftContract = IContract & {
  __typename?: 'NftContract';
  address: Scalars['String'];
  chain: Chain;
  id: Scalars['ID'];
  name?: Maybe<Scalars['String']>;
  standard?: Maybe<NftStandard>;
  symbol?: Maybe<Scalars['String']>;
  totalSupply?: Maybe<Scalars['Int']>;
};

export enum NftMarketplace {
  Cryptopunks = 'CRYPTOPUNKS',
  Foundation = 'FOUNDATION',
  Looksrare = 'LOOKSRARE',
  Nft20 = 'NFT20',
  Nftx = 'NFTX',
  Opensea = 'OPENSEA',
  Sudoswap = 'SUDOSWAP',
  X2Y2 = 'X2Y2'
}

export enum NftMarketSortableField {
  FloorPrice = 'FLOOR_PRICE',
  Volume = 'VOLUME'
}

export type NftOrder = {
  __typename?: 'NftOrder';
  address: Scalars['String'];
  auctionType?: Maybe<Scalars['String']>;
  createdAt: Scalars['Float'];
  endAt?: Maybe<Scalars['Float']>;
  id: Scalars['ID'];
  maker: Scalars['String'];
  marketplace: NftMarketplace;
  marketplaceUrl: Scalars['String'];
  orderHash?: Maybe<Scalars['String']>;
  price: Amount;
  protocolParameters?: Maybe<Scalars['AWSJSON']>;
  quantity: Scalars['Int'];
  startAt: Scalars['Float'];
  status: OrderStatus;
  taker?: Maybe<Scalars['String']>;
  tokenId?: Maybe<Scalars['String']>;
  type: OrderType;
};

export type NftOrderConnection = {
  __typename?: 'NftOrderConnection';
  edges: Array<NftOrderEdge>;
  pageInfo: PageInfo;
};

export type NftOrderEdge = {
  __typename?: 'NftOrderEdge';
  cursor: Scalars['String'];
  node: NftOrder;
};

export type NftProfile = {
  __typename?: 'NftProfile';
  address: Scalars['String'];
  id: Scalars['ID'];
  isVerified?: Maybe<Scalars['Boolean']>;
  profileImage?: Maybe<Image>;
  username?: Maybe<Scalars['String']>;
};

export enum NftRarityProvider {
  RaritySniper = 'RARITY_SNIPER'
}

export enum NftStandard {
  Erc1155 = 'ERC1155',
  Erc721 = 'ERC721',
  Noncompliant = 'NONCOMPLIANT'
}

export type NftTransfer = {
  __typename?: 'NftTransfer';
  asset: NftAsset;
  direction: TransactionDirection;
  id: Scalars['ID'];
  nftStandard: NftStandard;
  recipient: Scalars['String'];
  sender: Scalars['String'];
};

export enum OrderStatus {
  Cancelled = 'CANCELLED',
  Executed = 'EXECUTED',
  Expired = 'EXPIRED',
  Valid = 'VALID'
}

export enum OrderType {
  Listing = 'LISTING',
  Offer = 'OFFER'
}

export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor?: Maybe<Scalars['String']>;
  hasNextPage?: Maybe<Scalars['Boolean']>;
  hasPreviousPage?: Maybe<Scalars['Boolean']>;
  startCursor?: Maybe<Scalars['String']>;
};

export type Portfolio = {
  __typename?: 'Portfolio';
  absoluteChange24H?: Maybe<Scalars['Float']>;
  assetActivities?: Maybe<Array<Maybe<AssetActivity>>>;
  assetsValue?: Maybe<Scalars['Float']>;
  assetsValueUSD?: Maybe<Scalars['Float']>;
  id: Scalars['ID'];
  /**   TODO: (michael.zhang) replace with paginated query */
  nftBalances?: Maybe<Array<Maybe<NftBalance>>>;
  ownerAddress: Scalars['String'];
  relativeChange24H?: Maybe<Scalars['Float']>;
  tokenBalances?: Maybe<Array<Maybe<TokenBalance>>>;
  tokensTotalDenominatedValue?: Maybe<Amount>;
  tokensTotalDenominatedValueHistory?: Maybe<Array<Maybe<TimestampedAmount>>>;
  totalValue?: Maybe<Scalars['Float']>;
  totalValueUSD?: Maybe<Scalars['Float']>;
};


export type PortfolioAssetActivitiesArgs = {
  page?: InputMaybe<Scalars['Int']>;
  pageSize?: InputMaybe<Scalars['Int']>;
};


export type PortfolioTokensTotalDenominatedValueHistoryArgs = {
  duration?: InputMaybe<HistoryDuration>;
};

export type Query = {
  __typename?: 'Query';
  assetActivities?: Maybe<Array<Maybe<AssetActivity>>>;
  /**   Resolver to be implemented */
  nftAssets?: Maybe<NftAssetConnection>;
  /**   Resolver to be implemented */
  nftBalances?: Maybe<NftBalanceConnection>;
  nftCollections?: Maybe<NftCollectionConnection>;
  nftCollectionsById?: Maybe<Array<Maybe<NftCollection>>>;
  portfolio?: Maybe<Portfolio>;
  portfolios?: Maybe<Array<Maybe<Portfolio>>>;
  searchTokenProjects?: Maybe<Array<Maybe<TokenProject>>>;
  searchTokens?: Maybe<Array<Maybe<Token>>>;
  tokenProjects?: Maybe<Array<Maybe<TokenProject>>>;
  tokens?: Maybe<Array<Maybe<Token>>>;
  topTokenProjects?: Maybe<Array<Maybe<TokenProject>>>;
  topTokens?: Maybe<Array<Maybe<Token>>>;
};


export type QueryAssetActivitiesArgs = {
  address: Scalars['String'];
  page?: InputMaybe<Scalars['Int']>;
  pageSize?: InputMaybe<Scalars['Int']>;
};


export type QueryNftAssetsArgs = {
  address: Scalars['String'];
  after?: InputMaybe<Scalars['String']>;
  asc?: InputMaybe<Scalars['Boolean']>;
  before?: InputMaybe<Scalars['String']>;
  chain?: InputMaybe<Chain>;
  filter?: InputMaybe<NftAssetsFilterInput>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<NftAssetSortableField>;
};


export type QueryNftBalancesArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  chain?: InputMaybe<Chain>;
  filter?: InputMaybe<NftBalancesFilterInput>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
  ownerAddress: Scalars['String'];
};


export type QueryNftCollectionsArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  filter?: InputMaybe<NftCollectionsFilterInput>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
};


export type QueryNftCollectionsByIdArgs = {
  collectionIds?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
};


export type QueryPortfolioArgs = {
  ownerAddress: Scalars['String'];
};


export type QueryPortfoliosArgs = {
  ownerAddresses: Array<Scalars['String']>;
};


export type QuerySearchTokenProjectsArgs = {
  searchQuery: Scalars['String'];
};


export type QuerySearchTokensArgs = {
  searchQuery: Scalars['String'];
};


export type QueryTokenProjectsArgs = {
  contracts: Array<ContractInput>;
};


export type QueryTokensArgs = {
  contracts: Array<ContractInput>;
};


export type QueryTopTokenProjectsArgs = {
  currency?: InputMaybe<Currency>;
  orderBy: MarketSortableField;
  page: Scalars['Int'];
  pageSize: Scalars['Int'];
};


export type QueryTopTokensArgs = {
  chain?: InputMaybe<Chain>;
  page: Scalars['Int'];
  pageSize: Scalars['Int'];
};

export enum SafetyLevel {
  Blocked = 'BLOCKED',
  MediumWarning = 'MEDIUM_WARNING',
  StrongWarning = 'STRONG_WARNING',
  Verified = 'VERIFIED'
}

export type TimestampedAmount = IAmount & {
  __typename?: 'TimestampedAmount';
  currency?: Maybe<Currency>;
  id: Scalars['ID'];
  timestamp: Scalars['Int'];
  value: Scalars['Float'];
};

export type Token = IContract & {
  __typename?: 'Token';
  address?: Maybe<Scalars['String']>;
  chain: Chain;
  decimals?: Maybe<Scalars['Int']>;
  id: Scalars['ID'];
  market?: Maybe<TokenMarket>;
  name?: Maybe<Scalars['String']>;
  project?: Maybe<TokenProject>;
  standard?: Maybe<TokenStandard>;
  symbol?: Maybe<Scalars['String']>;
};


export type TokenMarketArgs = {
  currency?: InputMaybe<Currency>;
};

export type TokenApproval = {
  __typename?: 'TokenApproval';
  approvedAddress: Scalars['String'];
  /**   can be erc20 or erc1155 */
  asset: Token;
  id: Scalars['ID'];
  quantity: Scalars['String'];
  tokenStandard: TokenStandard;
};

export type TokenBalance = {
  __typename?: 'TokenBalance';
  blockNumber?: Maybe<Scalars['Int']>;
  blockTimestamp?: Maybe<Scalars['Int']>;
  denominatedValue?: Maybe<Amount>;
  id: Scalars['ID'];
  ownerAddress: Scalars['String'];
  quantity?: Maybe<Scalars['Float']>;
  token?: Maybe<Token>;
  tokenProjectMarket?: Maybe<TokenProjectMarket>;
};

export type TokenMarket = {
  __typename?: 'TokenMarket';
  id: Scalars['ID'];
  price?: Maybe<Amount>;
  priceHighLow?: Maybe<Amount>;
  priceHistory?: Maybe<Array<Maybe<TimestampedAmount>>>;
  pricePercentChange?: Maybe<Amount>;
  token: Token;
  totalValueLocked?: Maybe<Amount>;
  volume?: Maybe<Amount>;
};


export type TokenMarketPriceHighLowArgs = {
  duration: HistoryDuration;
  highLow: HighLow;
};


export type TokenMarketPriceHistoryArgs = {
  duration: HistoryDuration;
};


export type TokenMarketPricePercentChangeArgs = {
  duration: HistoryDuration;
};


export type TokenMarketVolumeArgs = {
  duration: HistoryDuration;
};

export type TokenProject = {
  __typename?: 'TokenProject';
  description?: Maybe<Scalars['String']>;
  homepageUrl?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  isSpam?: Maybe<Scalars['Boolean']>;
  logo?: Maybe<Image>;
  logoUrl?: Maybe<Scalars['String']>;
  markets?: Maybe<Array<Maybe<TokenProjectMarket>>>;
  name?: Maybe<Scalars['String']>;
  safetyLevel?: Maybe<SafetyLevel>;
  smallLogo?: Maybe<Image>;
  tokens: Array<Token>;
  twitterName?: Maybe<Scalars['String']>;
};


export type TokenProjectMarketsArgs = {
  currencies: Array<Currency>;
};

export type TokenProjectMarket = {
  __typename?: 'TokenProjectMarket';
  currency: Currency;
  fullyDilutedMarketCap?: Maybe<Amount>;
  id: Scalars['ID'];
  marketCap?: Maybe<Amount>;
  price?: Maybe<Amount>;
  priceHighLow?: Maybe<Amount>;
  priceHistory?: Maybe<Array<Maybe<TimestampedAmount>>>;
  pricePercentChange?: Maybe<Amount>;
  pricePercentChange24h?: Maybe<Amount>;
  tokenProject: TokenProject;
  volume?: Maybe<Amount>;
  volume24h?: Maybe<Amount>;
};


export type TokenProjectMarketPriceHighLowArgs = {
  duration: HistoryDuration;
  highLow: HighLow;
};


export type TokenProjectMarketPriceHistoryArgs = {
  duration: HistoryDuration;
};


export type TokenProjectMarketPricePercentChangeArgs = {
  duration: HistoryDuration;
};


export type TokenProjectMarketVolumeArgs = {
  duration: HistoryDuration;
};

export enum TokenStandard {
  Erc1155 = 'ERC1155',
  Erc20 = 'ERC20',
  Native = 'NATIVE'
}

export type TokenTransfer = {
  __typename?: 'TokenTransfer';
  asset: Token;
  direction: TransactionDirection;
  id: Scalars['ID'];
  quantity: Scalars['String'];
  recipient: Scalars['String'];
  sender: Scalars['String'];
  tokenStandard: TokenStandard;
  transactedValue?: Maybe<Amount>;
};

export type Transaction = {
  __typename?: 'Transaction';
  blockNumber: Scalars['Int'];
  from: Scalars['String'];
  gasLimit?: Maybe<Scalars['Float']>;
  hash: Scalars['String'];
  id: Scalars['ID'];
  maxFeePerGas?: Maybe<Scalars['Float']>;
  nonce: Scalars['Int'];
  status: TransactionStatus;
  to: Scalars['String'];
};

export enum TransactionDirection {
  In = 'IN',
  Out = 'OUT',
  Self = 'SELF'
}

export enum TransactionStatus {
  Confirmed = 'CONFIRMED',
  Failed = 'FAILED',
  Pending = 'PENDING'
}

export type NftsQueryVariables = Exact<{
  ownerAddress: Scalars['String'];
}>;


export type NftsQuery = { __typename?: 'Query', portfolios?: Array<{ __typename?: 'Portfolio', nftBalances?: Array<{ __typename?: 'NftBalance', ownedAsset?: { __typename?: 'NftAsset', id: string, description?: string | null, name?: string | null, tokenId: string, collection?: { __typename?: 'NftCollection', id: string, collectionId: string, description?: string | null, isVerified?: boolean | null, name?: string | null, numAssets?: number | null, image?: { __typename?: 'Image', url: string } | null, markets?: Array<{ __typename?: 'NftCollectionMarket', id: string, owners?: number | null, floorPrice?: { __typename?: 'TimestampedAmount', id: string, value: number } | null, volume24h?: { __typename?: 'Amount', value: number } | null, totalVolume?: { __typename?: 'TimestampedAmount', value: number } | null }> | null } | null, image?: { __typename?: 'Image', url: string } | null, nftContract?: { __typename?: 'NftContract', address: string, chain: Chain, standard?: NftStandard | null } | null, thumbnail?: { __typename?: 'Image', url: string } | null, creator?: { __typename?: 'NftProfile', address: string, username?: string | null } | null } | null } | null> | null } | null> | null };

export type PortfolioBalanceQueryVariables = Exact<{
  owner: Scalars['String'];
}>;


export type PortfolioBalanceQuery = { __typename?: 'Query', portfolios?: Array<{ __typename?: 'Portfolio', tokensTotalDenominatedValue?: { __typename?: 'Amount', value: number } | null } | null> | null };

export type PortfolioBalancesQueryVariables = Exact<{
  ownerAddress: Scalars['String'];
}>;


export type PortfolioBalancesQuery = { __typename?: 'Query', portfolios?: Array<{ __typename?: 'Portfolio', tokenBalances?: Array<{ __typename?: 'TokenBalance', quantity?: number | null, denominatedValue?: { __typename?: 'Amount', currency?: Currency | null, value: number } | null, token?: { __typename?: 'Token', chain: Chain, address?: string | null, name?: string | null, symbol?: string | null, decimals?: number | null } | null, tokenProjectMarket?: { __typename?: 'TokenProjectMarket', tokenProject: { __typename?: 'TokenProject', logoUrl?: string | null, safetyLevel?: SafetyLevel | null }, relativeChange24?: { __typename?: 'Amount', value: number } | null } | null } | null> | null } | null> | null };

export type SearchTokensProjectsQueryVariables = Exact<{
  searchQuery: Scalars['String'];
  skip: Scalars['Boolean'];
}>;


export type SearchTokensProjectsQuery = { __typename?: 'Query', searchTokenProjects?: Array<{ __typename?: 'TokenProject', logoUrl?: string | null, name?: string | null, safetyLevel?: SafetyLevel | null, tokens: Array<{ __typename?: 'Token', chain: Chain, address?: string | null, decimals?: number | null, symbol?: string | null }> } | null> | null };

export type TransactionHistoryUpdaterQueryVariables = Exact<{
  addresses: Array<Scalars['String']> | Scalars['String'];
}>;


export type TransactionHistoryUpdaterQuery = { __typename?: 'Query', portfolios?: Array<{ __typename?: 'Portfolio', ownerAddress: string, assetActivities?: Array<{ __typename?: 'AssetActivity', timestamp: number } | null> | null } | null> | null };

export type TokenDetailsScreenQueryVariables = Exact<{
  contract: ContractInput;
}>;


export type TokenDetailsScreenQuery = { __typename?: 'Query', tokens?: Array<{ __typename?: 'Token', market?: { __typename?: 'TokenMarket', volume?: { __typename?: 'Amount', value: number } | null } | null } | null> | null, tokenProjects?: Array<{ __typename?: 'TokenProject', description?: string | null, homepageUrl?: string | null, twitterName?: string | null, name?: string | null, safetyLevel?: SafetyLevel | null, markets?: Array<{ __typename?: 'TokenProjectMarket', price?: { __typename?: 'Amount', value: number, currency?: Currency | null } | null, marketCap?: { __typename?: 'Amount', value: number, currency?: Currency | null } | null, fullyDilutedMarketCap?: { __typename?: 'Amount', value: number, currency?: Currency | null } | null, priceHigh52W?: { __typename?: 'Amount', value: number, currency?: Currency | null } | null, priceLow52W?: { __typename?: 'Amount', value: number, currency?: Currency | null } | null } | null> | null, tokens: Array<{ __typename?: 'Token', chain: Chain, address?: string | null, symbol?: string | null, decimals?: number | null }> } | null> | null };

export type TokenProjectsQueryVariables = Exact<{
  contracts: Array<ContractInput> | ContractInput;
}>;


export type TokenProjectsQuery = { __typename?: 'Query', tokenProjects?: Array<{ __typename?: 'TokenProject', logoUrl?: string | null, name?: string | null, safetyLevel?: SafetyLevel | null, tokens: Array<{ __typename?: 'Token', chain: Chain, address?: string | null, decimals?: number | null, symbol?: string | null }> } | null> | null };

export type TransactionListQueryVariables = Exact<{
  address: Scalars['String'];
}>;


export type TransactionListQuery = { __typename?: 'Query', portfolio?: { __typename?: 'Portfolio', assetActivities?: Array<{ __typename?: 'AssetActivity', timestamp: number, type: ActivityType, transaction: { __typename?: 'Transaction', hash: string, status: TransactionStatus, to: string, from: string }, assetChanges: Array<{ __typename: 'NftApproval' } | { __typename: 'NftApproveForAll' } | { __typename: 'NftTransfer', nftStandard: NftStandard, sender: string, recipient: string, direction: TransactionDirection, asset: { __typename?: 'NftAsset', name?: string | null, tokenId: string, imageUrl?: string | null, nftContract?: { __typename?: 'NftContract', chain: Chain, address: string } | null, collection?: { __typename?: 'NftCollection', name?: string | null } | null } } | { __typename: 'TokenApproval', tokenStandard: TokenStandard, approvedAddress: string, quantity: string, asset: { __typename?: 'Token', name?: string | null, symbol?: string | null, decimals?: number | null, address?: string | null, chain: Chain } } | { __typename: 'TokenTransfer', tokenStandard: TokenStandard, quantity: string, sender: string, recipient: string, direction: TransactionDirection, asset: { __typename?: 'Token', name?: string | null, symbol?: string | null, address?: string | null, decimals?: number | null, chain: Chain }, transactedValue?: { __typename?: 'Amount', currency?: Currency | null, value: number } | null } | null> } | null> | null } | null };

export type TopTokensQueryVariables = Exact<{ [key: string]: never; }>;


export type TopTokensQuery = { __typename?: 'Query', topTokenProjects?: Array<{ __typename?: 'TokenProject', logoUrl?: string | null, name?: string | null, safetyLevel?: SafetyLevel | null, tokens: Array<{ __typename?: 'Token', chain: Chain, address?: string | null, decimals?: number | null, symbol?: string | null }> } | null> | null };

export type SearchPopularTokensQueryVariables = Exact<{ [key: string]: never; }>;


export type SearchPopularTokensQuery = { __typename?: 'Query', topTokenProjects?: Array<{ __typename?: 'TokenProject', logoUrl?: string | null, tokens: Array<{ __typename?: 'Token', chain: Chain, address?: string | null, name?: string | null, symbol?: string | null }> } | null> | null };

export type SearchResultsQueryVariables = Exact<{
  searchQuery: Scalars['String'];
}>;


export type SearchResultsQuery = { __typename?: 'Query', searchTokenProjects?: Array<{ __typename?: 'TokenProject', logoUrl?: string | null, tokens: Array<{ __typename?: 'Token', chain: Chain, address?: string | null, name?: string | null, symbol?: string | null }> } | null> | null };

export type FavoriteTokenCardQueryQueryVariables = Exact<{
  contract: ContractInput;
}>;


export type FavoriteTokenCardQueryQuery = { __typename?: 'Query', tokenProjects?: Array<{ __typename?: 'TokenProject', logoUrl?: string | null, tokens: Array<{ __typename?: 'Token', chain: Chain, address?: string | null, symbol?: string | null }>, markets?: Array<{ __typename?: 'TokenProjectMarket', price?: { __typename?: 'Amount', currency?: Currency | null, value: number } | null, pricePercentChange24h?: { __typename?: 'Amount', currency?: Currency | null, value: number } | null } | null> | null } | null> | null };


export const NftsDocument = gql`
    query Nfts($ownerAddress: String!) {
  portfolios(ownerAddresses: [$ownerAddress]) {
    nftBalances {
      ownedAsset {
        id
        collection {
          id
          collectionId
          description
          image {
            url
          }
          isVerified
          name
          numAssets
          markets(currencies: [USD]) {
            id
            floorPrice {
              id
              value
            }
            owners
            volume24h {
              value
            }
            totalVolume {
              value
            }
          }
        }
        description
        image {
          url
        }
        name
        nftContract {
          address
          chain
          standard
        }
        thumbnail {
          url
        }
        tokenId
        creator {
          address
          username
        }
      }
    }
  }
}
    `;

/**
 * __useNftsQuery__
 *
 * To run a query within a React component, call `useNftsQuery` and pass it any options that fit your needs.
 * When your component renders, `useNftsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useNftsQuery({
 *   variables: {
 *      ownerAddress: // value for 'ownerAddress'
 *   },
 * });
 */
export function useNftsQuery(baseOptions: Apollo.QueryHookOptions<NftsQuery, NftsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<NftsQuery, NftsQueryVariables>(NftsDocument, options);
      }
export function useNftsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<NftsQuery, NftsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<NftsQuery, NftsQueryVariables>(NftsDocument, options);
        }
export type NftsQueryHookResult = ReturnType<typeof useNftsQuery>;
export type NftsLazyQueryHookResult = ReturnType<typeof useNftsLazyQuery>;
export type NftsQueryResult = Apollo.QueryResult<NftsQuery, NftsQueryVariables>;
export const PortfolioBalanceDocument = gql`
    query PortfolioBalance($owner: String!) {
  portfolios(ownerAddresses: [$owner]) {
    tokensTotalDenominatedValue {
      value
    }
  }
}
    `;

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
export function usePortfolioBalanceQuery(baseOptions: Apollo.QueryHookOptions<PortfolioBalanceQuery, PortfolioBalanceQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<PortfolioBalanceQuery, PortfolioBalanceQueryVariables>(PortfolioBalanceDocument, options);
      }
export function usePortfolioBalanceLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<PortfolioBalanceQuery, PortfolioBalanceQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<PortfolioBalanceQuery, PortfolioBalanceQueryVariables>(PortfolioBalanceDocument, options);
        }
export type PortfolioBalanceQueryHookResult = ReturnType<typeof usePortfolioBalanceQuery>;
export type PortfolioBalanceLazyQueryHookResult = ReturnType<typeof usePortfolioBalanceLazyQuery>;
export type PortfolioBalanceQueryResult = Apollo.QueryResult<PortfolioBalanceQuery, PortfolioBalanceQueryVariables>;
export const PortfolioBalancesDocument = gql`
    query PortfolioBalances($ownerAddress: String!) {
  portfolios(ownerAddresses: [$ownerAddress]) {
    tokenBalances {
      quantity
      denominatedValue {
        currency
        value
      }
      token {
        chain
        address
        name
        symbol
        decimals
      }
      tokenProjectMarket {
        tokenProject {
          logoUrl
          safetyLevel
        }
        relativeChange24: pricePercentChange(duration: DAY) {
          value
        }
      }
    }
  }
}
    `;

/**
 * __usePortfolioBalancesQuery__
 *
 * To run a query within a React component, call `usePortfolioBalancesQuery` and pass it any options that fit your needs.
 * When your component renders, `usePortfolioBalancesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePortfolioBalancesQuery({
 *   variables: {
 *      ownerAddress: // value for 'ownerAddress'
 *   },
 * });
 */
export function usePortfolioBalancesQuery(baseOptions: Apollo.QueryHookOptions<PortfolioBalancesQuery, PortfolioBalancesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<PortfolioBalancesQuery, PortfolioBalancesQueryVariables>(PortfolioBalancesDocument, options);
      }
export function usePortfolioBalancesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<PortfolioBalancesQuery, PortfolioBalancesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<PortfolioBalancesQuery, PortfolioBalancesQueryVariables>(PortfolioBalancesDocument, options);
        }
export type PortfolioBalancesQueryHookResult = ReturnType<typeof usePortfolioBalancesQuery>;
export type PortfolioBalancesLazyQueryHookResult = ReturnType<typeof usePortfolioBalancesLazyQuery>;
export type PortfolioBalancesQueryResult = Apollo.QueryResult<PortfolioBalancesQuery, PortfolioBalancesQueryVariables>;
export const SearchTokensProjectsDocument = gql`
    query SearchTokensProjects($searchQuery: String!, $skip: Boolean!) {
  searchTokenProjects(searchQuery: $searchQuery) @skip(if: $skip) {
    logoUrl
    name
    safetyLevel
    tokens {
      chain
      address
      decimals
      symbol
    }
  }
}
    `;

/**
 * __useSearchTokensProjectsQuery__
 *
 * To run a query within a React component, call `useSearchTokensProjectsQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchTokensProjectsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchTokensProjectsQuery({
 *   variables: {
 *      searchQuery: // value for 'searchQuery'
 *      skip: // value for 'skip'
 *   },
 * });
 */
export function useSearchTokensProjectsQuery(baseOptions: Apollo.QueryHookOptions<SearchTokensProjectsQuery, SearchTokensProjectsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SearchTokensProjectsQuery, SearchTokensProjectsQueryVariables>(SearchTokensProjectsDocument, options);
      }
export function useSearchTokensProjectsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SearchTokensProjectsQuery, SearchTokensProjectsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SearchTokensProjectsQuery, SearchTokensProjectsQueryVariables>(SearchTokensProjectsDocument, options);
        }
export type SearchTokensProjectsQueryHookResult = ReturnType<typeof useSearchTokensProjectsQuery>;
export type SearchTokensProjectsLazyQueryHookResult = ReturnType<typeof useSearchTokensProjectsLazyQuery>;
export type SearchTokensProjectsQueryResult = Apollo.QueryResult<SearchTokensProjectsQuery, SearchTokensProjectsQueryVariables>;
export const TransactionHistoryUpdaterDocument = gql`
    query TransactionHistoryUpdater($addresses: [String!]!) {
  portfolios(ownerAddresses: $addresses) {
    ownerAddress
    assetActivities(pageSize: 1, page: 1) {
      timestamp
    }
  }
}
    `;

/**
 * __useTransactionHistoryUpdaterQuery__
 *
 * To run a query within a React component, call `useTransactionHistoryUpdaterQuery` and pass it any options that fit your needs.
 * When your component renders, `useTransactionHistoryUpdaterQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTransactionHistoryUpdaterQuery({
 *   variables: {
 *      addresses: // value for 'addresses'
 *   },
 * });
 */
export function useTransactionHistoryUpdaterQuery(baseOptions: Apollo.QueryHookOptions<TransactionHistoryUpdaterQuery, TransactionHistoryUpdaterQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<TransactionHistoryUpdaterQuery, TransactionHistoryUpdaterQueryVariables>(TransactionHistoryUpdaterDocument, options);
      }
export function useTransactionHistoryUpdaterLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<TransactionHistoryUpdaterQuery, TransactionHistoryUpdaterQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<TransactionHistoryUpdaterQuery, TransactionHistoryUpdaterQueryVariables>(TransactionHistoryUpdaterDocument, options);
        }
export type TransactionHistoryUpdaterQueryHookResult = ReturnType<typeof useTransactionHistoryUpdaterQuery>;
export type TransactionHistoryUpdaterLazyQueryHookResult = ReturnType<typeof useTransactionHistoryUpdaterLazyQuery>;
export type TransactionHistoryUpdaterQueryResult = Apollo.QueryResult<TransactionHistoryUpdaterQuery, TransactionHistoryUpdaterQueryVariables>;
export const TokenDetailsScreenDocument = gql`
    query TokenDetailsScreen($contract: ContractInput!) {
  tokens(contracts: [$contract]) {
    market(currency: USD) {
      volume(duration: DAY) {
        value
      }
    }
  }
  tokenProjects(contracts: [$contract]) {
    description
    homepageUrl
    twitterName
    name
    safetyLevel
    markets(currencies: [USD]) {
      price {
        value
        currency
      }
      marketCap {
        value
        currency
      }
      fullyDilutedMarketCap {
        value
        currency
      }
      priceHigh52W: priceHighLow(duration: YEAR, highLow: HIGH) {
        value
        currency
      }
      priceLow52W: priceHighLow(duration: YEAR, highLow: LOW) {
        value
        currency
      }
    }
    tokens {
      chain
      address
      symbol
      decimals
    }
  }
}
    `;

/**
 * __useTokenDetailsScreenQuery__
 *
 * To run a query within a React component, call `useTokenDetailsScreenQuery` and pass it any options that fit your needs.
 * When your component renders, `useTokenDetailsScreenQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTokenDetailsScreenQuery({
 *   variables: {
 *      contract: // value for 'contract'
 *   },
 * });
 */
export function useTokenDetailsScreenQuery(baseOptions: Apollo.QueryHookOptions<TokenDetailsScreenQuery, TokenDetailsScreenQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<TokenDetailsScreenQuery, TokenDetailsScreenQueryVariables>(TokenDetailsScreenDocument, options);
      }
export function useTokenDetailsScreenLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<TokenDetailsScreenQuery, TokenDetailsScreenQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<TokenDetailsScreenQuery, TokenDetailsScreenQueryVariables>(TokenDetailsScreenDocument, options);
        }
export type TokenDetailsScreenQueryHookResult = ReturnType<typeof useTokenDetailsScreenQuery>;
export type TokenDetailsScreenLazyQueryHookResult = ReturnType<typeof useTokenDetailsScreenLazyQuery>;
export type TokenDetailsScreenQueryResult = Apollo.QueryResult<TokenDetailsScreenQuery, TokenDetailsScreenQueryVariables>;
export const TokenProjectsDocument = gql`
    query TokenProjects($contracts: [ContractInput!]!) {
  tokenProjects(contracts: $contracts) {
    logoUrl
    name
    safetyLevel
    tokens {
      chain
      address
      decimals
      symbol
    }
  }
}
    `;

/**
 * __useTokenProjectsQuery__
 *
 * To run a query within a React component, call `useTokenProjectsQuery` and pass it any options that fit your needs.
 * When your component renders, `useTokenProjectsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTokenProjectsQuery({
 *   variables: {
 *      contracts: // value for 'contracts'
 *   },
 * });
 */
export function useTokenProjectsQuery(baseOptions: Apollo.QueryHookOptions<TokenProjectsQuery, TokenProjectsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<TokenProjectsQuery, TokenProjectsQueryVariables>(TokenProjectsDocument, options);
      }
export function useTokenProjectsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<TokenProjectsQuery, TokenProjectsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<TokenProjectsQuery, TokenProjectsQueryVariables>(TokenProjectsDocument, options);
        }
export type TokenProjectsQueryHookResult = ReturnType<typeof useTokenProjectsQuery>;
export type TokenProjectsLazyQueryHookResult = ReturnType<typeof useTokenProjectsLazyQuery>;
export type TokenProjectsQueryResult = Apollo.QueryResult<TokenProjectsQuery, TokenProjectsQueryVariables>;
export const TransactionListDocument = gql`
    query TransactionList($address: String!) {
  portfolio(ownerAddress: $address) {
    assetActivities(pageSize: 50, page: 1) {
      timestamp
      type
      transaction {
        hash
        status
        to
        from
      }
      assetChanges {
        __typename
        ... on TokenTransfer {
          asset {
            name
            symbol
            address
            decimals
            chain
          }
          tokenStandard
          quantity
          sender
          recipient
          direction
          transactedValue {
            currency
            value
          }
        }
        ... on NftTransfer {
          asset {
            name
            nftContract {
              chain
              address
            }
            tokenId
            imageUrl
            collection {
              name
            }
          }
          nftStandard
          sender
          recipient
          direction
        }
        ... on TokenApproval {
          asset {
            name
            symbol
            decimals
            address
            chain
          }
          tokenStandard
          approvedAddress
          quantity
        }
      }
    }
  }
}
    `;

/**
 * __useTransactionListQuery__
 *
 * To run a query within a React component, call `useTransactionListQuery` and pass it any options that fit your needs.
 * When your component renders, `useTransactionListQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTransactionListQuery({
 *   variables: {
 *      address: // value for 'address'
 *   },
 * });
 */
export function useTransactionListQuery(baseOptions: Apollo.QueryHookOptions<TransactionListQuery, TransactionListQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<TransactionListQuery, TransactionListQueryVariables>(TransactionListDocument, options);
      }
export function useTransactionListLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<TransactionListQuery, TransactionListQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<TransactionListQuery, TransactionListQueryVariables>(TransactionListDocument, options);
        }
export type TransactionListQueryHookResult = ReturnType<typeof useTransactionListQuery>;
export type TransactionListLazyQueryHookResult = ReturnType<typeof useTransactionListLazyQuery>;
export type TransactionListQueryResult = Apollo.QueryResult<TransactionListQuery, TransactionListQueryVariables>;
export const TopTokensDocument = gql`
    query TopTokens {
  topTokenProjects(orderBy: MARKET_CAP, page: 1, pageSize: 100) {
    logoUrl
    name
    safetyLevel
    tokens {
      chain
      address
      decimals
      symbol
    }
  }
}
    `;

/**
 * __useTopTokensQuery__
 *
 * To run a query within a React component, call `useTopTokensQuery` and pass it any options that fit your needs.
 * When your component renders, `useTopTokensQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTopTokensQuery({
 *   variables: {
 *   },
 * });
 */
export function useTopTokensQuery(baseOptions?: Apollo.QueryHookOptions<TopTokensQuery, TopTokensQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<TopTokensQuery, TopTokensQueryVariables>(TopTokensDocument, options);
      }
export function useTopTokensLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<TopTokensQuery, TopTokensQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<TopTokensQuery, TopTokensQueryVariables>(TopTokensDocument, options);
        }
export type TopTokensQueryHookResult = ReturnType<typeof useTopTokensQuery>;
export type TopTokensLazyQueryHookResult = ReturnType<typeof useTopTokensLazyQuery>;
export type TopTokensQueryResult = Apollo.QueryResult<TopTokensQuery, TopTokensQueryVariables>;
export const SearchPopularTokensDocument = gql`
    query SearchPopularTokens {
  topTokenProjects(orderBy: VOLUME, page: 1, pageSize: 3) {
    logoUrl
    tokens {
      chain
      address
      name
      symbol
    }
  }
}
    `;

/**
 * __useSearchPopularTokensQuery__
 *
 * To run a query within a React component, call `useSearchPopularTokensQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchPopularTokensQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchPopularTokensQuery({
 *   variables: {
 *   },
 * });
 */
export function useSearchPopularTokensQuery(baseOptions?: Apollo.QueryHookOptions<SearchPopularTokensQuery, SearchPopularTokensQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SearchPopularTokensQuery, SearchPopularTokensQueryVariables>(SearchPopularTokensDocument, options);
      }
export function useSearchPopularTokensLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SearchPopularTokensQuery, SearchPopularTokensQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SearchPopularTokensQuery, SearchPopularTokensQueryVariables>(SearchPopularTokensDocument, options);
        }
export type SearchPopularTokensQueryHookResult = ReturnType<typeof useSearchPopularTokensQuery>;
export type SearchPopularTokensLazyQueryHookResult = ReturnType<typeof useSearchPopularTokensLazyQuery>;
export type SearchPopularTokensQueryResult = Apollo.QueryResult<SearchPopularTokensQuery, SearchPopularTokensQueryVariables>;
export const SearchResultsDocument = gql`
    query SearchResults($searchQuery: String!) {
  searchTokenProjects(searchQuery: $searchQuery) {
    logoUrl
    tokens {
      chain
      address
      name
      symbol
    }
  }
}
    `;

/**
 * __useSearchResultsQuery__
 *
 * To run a query within a React component, call `useSearchResultsQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchResultsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchResultsQuery({
 *   variables: {
 *      searchQuery: // value for 'searchQuery'
 *   },
 * });
 */
export function useSearchResultsQuery(baseOptions: Apollo.QueryHookOptions<SearchResultsQuery, SearchResultsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SearchResultsQuery, SearchResultsQueryVariables>(SearchResultsDocument, options);
      }
export function useSearchResultsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SearchResultsQuery, SearchResultsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SearchResultsQuery, SearchResultsQueryVariables>(SearchResultsDocument, options);
        }
export type SearchResultsQueryHookResult = ReturnType<typeof useSearchResultsQuery>;
export type SearchResultsLazyQueryHookResult = ReturnType<typeof useSearchResultsLazyQuery>;
export type SearchResultsQueryResult = Apollo.QueryResult<SearchResultsQuery, SearchResultsQueryVariables>;
export const FavoriteTokenCardQueryDocument = gql`
    query FavoriteTokenCardQuery($contract: ContractInput!) {
  tokenProjects(contracts: [$contract]) {
    tokens {
      chain
      address
      symbol
    }
    logoUrl
    markets(currencies: USD) {
      price {
        currency
        value
      }
      pricePercentChange24h {
        currency
        value
      }
    }
  }
}
    `;

/**
 * __useFavoriteTokenCardQueryQuery__
 *
 * To run a query within a React component, call `useFavoriteTokenCardQueryQuery` and pass it any options that fit your needs.
 * When your component renders, `useFavoriteTokenCardQueryQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFavoriteTokenCardQueryQuery({
 *   variables: {
 *      contract: // value for 'contract'
 *   },
 * });
 */
export function useFavoriteTokenCardQueryQuery(baseOptions: Apollo.QueryHookOptions<FavoriteTokenCardQueryQuery, FavoriteTokenCardQueryQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<FavoriteTokenCardQueryQuery, FavoriteTokenCardQueryQueryVariables>(FavoriteTokenCardQueryDocument, options);
      }
export function useFavoriteTokenCardQueryLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<FavoriteTokenCardQueryQuery, FavoriteTokenCardQueryQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<FavoriteTokenCardQueryQuery, FavoriteTokenCardQueryQueryVariables>(FavoriteTokenCardQueryDocument, options);
        }
export type FavoriteTokenCardQueryQueryHookResult = ReturnType<typeof useFavoriteTokenCardQueryQuery>;
export type FavoriteTokenCardQueryLazyQueryHookResult = ReturnType<typeof useFavoriteTokenCardQueryLazyQuery>;
export type FavoriteTokenCardQueryQueryResult = Apollo.QueryResult<FavoriteTokenCardQueryQuery, FavoriteTokenCardQueryQueryVariables>;