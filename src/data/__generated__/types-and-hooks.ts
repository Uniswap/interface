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
  Money = 'money'
}

export type Amount = IAmount & {
  __typename?: 'Amount';
  currency?: Maybe<Currency>;
  id: Scalars['ID'];
  value: Scalars['Float'];
};

export type AmountChange = {
  __typename?: 'AmountChange';
  absolute?: Maybe<Amount>;
  id: Scalars['ID'];
  percentage?: Maybe<Amount>;
};

export type AssetActivity = {
  __typename?: 'AssetActivity';
  assetChanges: Array<Maybe<AssetChange>>;
  chain: Chain;
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

/**   TODO: deprecate this enum */
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
  rarities?: Maybe<Array<NftAssetRarity>>;
  smallImage?: Maybe<Image>;
  smallImageUrl?: Maybe<Scalars['String']>;
  suspiciousFlag?: Maybe<Scalars['Boolean']>;
  thumbnail?: Maybe<Image>;
  thumbnailUrl?: Maybe<Scalars['String']>;
  tokenId: Scalars['String'];
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
  totalCount?: Maybe<Scalars['Int']>;
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

export type NftAssetsFilterInput = {
  listed?: InputMaybe<Scalars['Boolean']>;
  marketplaces?: InputMaybe<Array<NftMarketplace>>;
  maxPrice?: InputMaybe<Scalars['String']>;
  minPrice?: InputMaybe<Scalars['String']>;
  tokenIds?: InputMaybe<Array<Scalars['String']>>;
  tokenSearchQuery?: InputMaybe<Scalars['String']>;
  traits?: InputMaybe<Array<NftAssetTraitInput>>;
};

export type NftBalance = {
  __typename?: 'NftBalance';
  id: Scalars['ID'];
  lastPrice?: Maybe<TimestampedAmount>;
  listedMarketplaces?: Maybe<Array<NftMarketplace>>;
  listingFees?: Maybe<Array<Maybe<NftFee>>>;
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
  floorPrice?: Maybe<Scalars['Float']>;
  id: Scalars['ID'];
  listings?: Maybe<Scalars['Int']>;
  marketplace?: Maybe<NftMarketplace>;
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

export type NftCollectionsFilterInput = {
  addresses?: InputMaybe<Array<Scalars['String']>>;
  nameQuery?: InputMaybe<Scalars['String']>;
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

export type NftFee = {
  __typename?: 'NftFee';
  basisPoints: Scalars['Int'];
  id: Scalars['ID'];
  payoutAddress: Scalars['String'];
};

export enum NftMarketSortableField {
  FloorPrice = 'FLOOR_PRICE',
  Volume = 'VOLUME'
}

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
  Erc721 = 'ERC721',
  Erc1155 = 'ERC1155',
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
  assetActivities?: Maybe<Array<Maybe<AssetActivity>>>;
  id: Scalars['ID'];
  /**   TODO: (michael.zhang) replace with paginated query */
  nftBalances?: Maybe<Array<Maybe<NftBalance>>>;
  ownerAddress: Scalars['String'];
  tokenBalances?: Maybe<Array<Maybe<TokenBalance>>>;
  tokensTotalDenominatedValue?: Maybe<Amount>;
  tokensTotalDenominatedValueChange?: Maybe<AmountChange>;
};


export type PortfolioAssetActivitiesArgs = {
  page?: InputMaybe<Scalars['Int']>;
  pageSize?: InputMaybe<Scalars['Int']>;
};


export type PortfolioTokensTotalDenominatedValueChangeArgs = {
  duration?: InputMaybe<HistoryDuration>;
};

export type Query = {
  __typename?: 'Query';
  assetActivities?: Maybe<Array<Maybe<AssetActivity>>>;
  nftAssets?: Maybe<NftAssetConnection>;
  nftBalances?: Maybe<NftBalanceConnection>;
  nftCollections?: Maybe<NftCollectionConnection>;
  nftCollectionsById?: Maybe<Array<Maybe<NftCollection>>>;
  portfolios?: Maybe<Array<Maybe<Portfolio>>>;
  searchTokenProjects?: Maybe<Array<Maybe<TokenProject>>>;
  searchTokens?: Maybe<Array<Maybe<Token>>>;
  token?: Maybe<Token>;
  tokenProjects?: Maybe<Array<Maybe<TokenProject>>>;
  tokens?: Maybe<Array<Maybe<Token>>>;
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


export type QueryPortfoliosArgs = {
  ownerAddresses: Array<Scalars['String']>;
  useAltDataSource?: InputMaybe<Scalars['Boolean']>;
};


export type QuerySearchTokenProjectsArgs = {
  searchQuery: Scalars['String'];
};


export type QuerySearchTokensArgs = {
  searchQuery: Scalars['String'];
};


export type QueryTokenArgs = {
  address?: InputMaybe<Scalars['String']>;
  chain: Chain;
};


export type QueryTokenProjectsArgs = {
  contracts: Array<ContractInput>;
};


export type QueryTokensArgs = {
  contracts: Array<ContractInput>;
};


export type QueryTopTokensArgs = {
  chain?: InputMaybe<Chain>;
  orderBy?: InputMaybe<TokenSortableField>;
  page?: InputMaybe<Scalars['Int']>;
  pageSize?: InputMaybe<Scalars['Int']>;
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
  spamCode?: Maybe<Scalars['Int']>;
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

export enum TokenSortableField {
  MarketCap = 'MARKET_CAP',
  Popularity = 'POPULARITY',
  TotalValueLocked = 'TOTAL_VALUE_LOCKED',
  Volume = 'VOLUME'
}

export enum TokenStandard {
  Erc20 = 'ERC20',
  Erc1155 = 'ERC1155',
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

export type TokenPriceHistoryQueryVariables = Exact<{
  contract: ContractInput;
  duration?: InputMaybe<HistoryDuration>;
}>;


export type TokenPriceHistoryQuery = { __typename?: 'Query', tokenProjects?: Array<{ __typename?: 'TokenProject', id: string, name?: string | null, markets?: Array<{ __typename?: 'TokenProjectMarket', id: string, price?: { __typename?: 'Amount', id: string, value: number } | null, pricePercentChange24h?: { __typename?: 'Amount', id: string, value: number } | null, priceHistory?: Array<{ __typename?: 'TimestampedAmount', id: string, timestamp: number, value: number } | null> | null } | null> | null, tokens: Array<{ __typename?: 'Token', id: string, chain: Chain, address?: string | null, symbol?: string | null, decimals?: number | null }> } | null> | null };

export type AccountListQueryVariables = Exact<{
  addresses: Array<Scalars['String']> | Scalars['String'];
}>;


export type AccountListQuery = { __typename?: 'Query', portfolios?: Array<{ __typename?: 'Portfolio', id: string, tokensTotalDenominatedValue?: { __typename?: 'Amount', id: string, value: number } | null } | null> | null };

export type SearchPopularTokensQueryVariables = Exact<{ [key: string]: never; }>;


export type SearchPopularTokensQuery = { __typename?: 'Query', topTokens?: Array<{ __typename?: 'Token', id: string, address?: string | null, chain: Chain, name?: string | null, symbol?: string | null, project?: { __typename?: 'TokenProject', id: string, logoUrl?: string | null } | null } | null> | null, eth?: Array<{ __typename?: 'Token', id: string, address?: string | null, chain: Chain, name?: string | null, symbol?: string | null, project?: { __typename?: 'TokenProject', id: string, logoUrl?: string | null } | null } | null> | null };

export type NftsQueryVariables = Exact<{
  ownerAddress: Scalars['String'];
}>;


export type NftsQuery = { __typename?: 'Query', portfolios?: Array<{ __typename?: 'Portfolio', id: string, nftBalances?: Array<{ __typename?: 'NftBalance', id: string, ownedAsset?: { __typename?: 'NftAsset', id: string, description?: string | null, name?: string | null, tokenId: string, collection?: { __typename?: 'NftCollection', id: string, collectionId: string, description?: string | null, isVerified?: boolean | null, name?: string | null, numAssets?: number | null, image?: { __typename?: 'Image', id: string, url: string } | null, markets?: Array<{ __typename?: 'NftCollectionMarket', id: string, owners?: number | null, floorPrice?: { __typename?: 'TimestampedAmount', id: string, value: number } | null, volume24h?: { __typename?: 'Amount', id: string, value: number } | null, totalVolume?: { __typename?: 'TimestampedAmount', id: string, value: number } | null }> | null } | null, image?: { __typename?: 'Image', id: string, url: string } | null, nftContract?: { __typename?: 'NftContract', id: string, address: string, chain: Chain, standard?: NftStandard | null } | null, thumbnail?: { __typename?: 'Image', id: string, url: string } | null, creator?: { __typename?: 'NftProfile', id: string, address: string, username?: string | null } | null } | null } | null> | null } | null> | null };

export type NftItemScreenQueryVariables = Exact<{
  contractAddress: Scalars['String'];
  filter?: InputMaybe<NftAssetsFilterInput>;
}>;


export type NftItemScreenQuery = { __typename?: 'Query', nftAssets?: { __typename?: 'NftAssetConnection', edges: Array<{ __typename?: 'NftAssetEdge', node: { __typename?: 'NftAsset', id: string, description?: string | null, name?: string | null, tokenId: string, collection?: { __typename?: 'NftCollection', id: string, collectionId: string, description?: string | null, isVerified?: boolean | null, name?: string | null, numAssets?: number | null, image?: { __typename?: 'Image', id: string, url: string } | null, markets?: Array<{ __typename?: 'NftCollectionMarket', id: string, owners?: number | null, floorPrice?: { __typename?: 'TimestampedAmount', id: string, value: number } | null, totalVolume?: { __typename?: 'TimestampedAmount', id: string, value: number } | null }> | null, nftContracts?: Array<{ __typename?: 'NftContract', id: string, address: string }> | null } | null, image?: { __typename?: 'Image', id: string, url: string } | null, nftContract?: { __typename?: 'NftContract', id: string, address: string, chain: Chain, standard?: NftStandard | null } | null, creator?: { __typename?: 'NftProfile', id: string, address: string, username?: string | null } | null } }> } | null };

export type NftsTabQueryVariables = Exact<{
  ownerAddress: Scalars['String'];
  first?: InputMaybe<Scalars['Int']>;
  after?: InputMaybe<Scalars['String']>;
}>;


export type NftsTabQuery = { __typename?: 'Query', nftBalances?: { __typename?: 'NftBalanceConnection', edges: Array<{ __typename?: 'NftBalanceEdge', node: { __typename?: 'NftBalance', ownedAsset?: { __typename?: 'NftAsset', id: string, name?: string | null, tokenId: string, description?: string | null, collection?: { __typename?: 'NftCollection', id: string, name?: string | null, isVerified?: boolean | null, markets?: Array<{ __typename?: 'NftCollectionMarket', id: string, floorPrice?: { __typename?: 'TimestampedAmount', value: number } | null }> | null } | null, image?: { __typename?: 'Image', id: string, url: string } | null, nftContract?: { __typename?: 'NftContract', id: string, address: string } | null } | null } }>, pageInfo: { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage?: boolean | null, hasPreviousPage?: boolean | null, startCursor?: string | null } } | null };

export type PortfolioBalancesQueryVariables = Exact<{
  ownerAddress: Scalars['String'];
}>;


export type PortfolioBalancesQuery = { __typename?: 'Query', portfolios?: Array<{ __typename?: 'Portfolio', id: string, tokenBalances?: Array<{ __typename?: 'TokenBalance', id: string, quantity?: number | null, denominatedValue?: { __typename?: 'Amount', id: string, currency?: Currency | null, value: number } | null, token?: { __typename?: 'Token', id: string, chain: Chain, address?: string | null, name?: string | null, symbol?: string | null, decimals?: number | null, project?: { __typename?: 'TokenProject', id: string, logoUrl?: string | null, safetyLevel?: SafetyLevel | null, isSpam?: boolean | null } | null } | null, tokenProjectMarket?: { __typename?: 'TokenProjectMarket', relativeChange24?: { __typename?: 'Amount', id: string, value: number } | null } | null } | null> | null } | null> | null };

export type SelectWalletScreenQueryVariables = Exact<{
  ownerAddresses: Array<Scalars['String']> | Scalars['String'];
}>;


export type SelectWalletScreenQuery = { __typename?: 'Query', portfolios?: Array<{ __typename?: 'Portfolio', id: string, ownerAddress: string, tokensTotalDenominatedValue?: { __typename?: 'Amount', id: string, value: number } | null } | null> | null };

export type TransactionHistoryUpdaterQueryVariables = Exact<{
  addresses: Array<Scalars['String']> | Scalars['String'];
}>;


export type TransactionHistoryUpdaterQuery = { __typename?: 'Query', portfolios?: Array<{ __typename?: 'Portfolio', id: string, ownerAddress: string, assetActivities?: Array<{ __typename?: 'AssetActivity', id: string, timestamp: number } | null> | null } | null> | null };

export type TokenQueryVariables = Exact<{
  chain: Chain;
  address?: InputMaybe<Scalars['String']>;
}>;


export type TokenQuery = { __typename?: 'Query', token?: { __typename?: 'Token', id: string, name?: string | null, symbol?: string | null, decimals?: number | null, chain: Chain, address?: string | null, project?: { __typename?: 'TokenProject', id: string, logoUrl?: string | null, safetyLevel?: SafetyLevel | null, isSpam?: boolean | null } | null } | null };

export type TokenDetailsScreenQueryVariables = Exact<{
  chain: Chain;
  address?: InputMaybe<Scalars['String']>;
}>;


export type TokenDetailsScreenQuery = { __typename?: 'Query', token?: { __typename?: 'Token', id: string, address?: string | null, chain: Chain, name?: string | null, symbol?: string | null, market?: { __typename?: 'TokenMarket', id: string, volume?: { __typename?: 'Amount', id: string, value: number } | null } | null, project?: { __typename?: 'TokenProject', id: string, description?: string | null, homepageUrl?: string | null, twitterName?: string | null, safetyLevel?: SafetyLevel | null, logoUrl?: string | null, markets?: Array<{ __typename?: 'TokenProjectMarket', id: string, price?: { __typename?: 'Amount', id: string, value: number } | null, marketCap?: { __typename?: 'Amount', id: string, value: number } | null, fullyDilutedMarketCap?: { __typename?: 'Amount', id: string, value: number } | null, priceHigh52W?: { __typename?: 'Amount', id: string, value: number } | null, priceLow52W?: { __typename?: 'Amount', id: string, value: number } | null } | null> | null, tokens: Array<{ __typename?: 'Token', id: string, chain: Chain, address?: string | null }> } | null } | null };

export type TokenProjectsQueryVariables = Exact<{
  contracts: Array<ContractInput> | ContractInput;
}>;


export type TokenProjectsQuery = { __typename?: 'Query', tokenProjects?: Array<{ __typename?: 'TokenProject', id: string, logoUrl?: string | null, name?: string | null, safetyLevel?: SafetyLevel | null, tokens: Array<{ __typename?: 'Token', id: string, chain: Chain, address?: string | null, decimals?: number | null, symbol?: string | null }> } | null> | null };

export type TransactionListQueryVariables = Exact<{
  address: Scalars['String'];
}>;


export type TransactionListQuery = { __typename?: 'Query', portfolios?: Array<{ __typename?: 'Portfolio', id: string, assetActivities?: Array<{ __typename?: 'AssetActivity', id: string, timestamp: number, type: ActivityType, transaction: { __typename?: 'Transaction', id: string, hash: string, status: TransactionStatus, to: string, from: string }, assetChanges: Array<{ __typename: 'NftApproval' } | { __typename: 'NftApproveForAll' } | { __typename: 'NftTransfer', id: string, nftStandard: NftStandard, sender: string, recipient: string, direction: TransactionDirection, asset: { __typename?: 'NftAsset', id: string, name?: string | null, tokenId: string, nftContract?: { __typename?: 'NftContract', id: string, chain: Chain, address: string } | null, image?: { __typename?: 'Image', id: string, url: string } | null, collection?: { __typename?: 'NftCollection', id: string, name?: string | null } | null } } | { __typename: 'TokenApproval', id: string, tokenStandard: TokenStandard, approvedAddress: string, quantity: string, asset: { __typename?: 'Token', id: string, name?: string | null, symbol?: string | null, decimals?: number | null, address?: string | null, chain: Chain } } | { __typename: 'TokenTransfer', id: string, tokenStandard: TokenStandard, quantity: string, sender: string, recipient: string, direction: TransactionDirection, asset: { __typename?: 'Token', id: string, name?: string | null, symbol?: string | null, address?: string | null, decimals?: number | null, chain: Chain, project?: { __typename?: 'TokenProject', id: string, isSpam?: boolean | null } | null }, transactedValue?: { __typename?: 'Amount', id: string, currency?: Currency | null, value: number } | null } | null> } | null> | null } | null> | null };

export type TopTokensQueryVariables = Exact<{
  chain?: InputMaybe<Chain>;
  page?: InputMaybe<Scalars['Int']>;
  pageSize?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<TokenSortableField>;
}>;


export type TopTokensQuery = { __typename?: 'Query', topTokens?: Array<{ __typename?: 'Token', id: string, address?: string | null, chain: Chain, decimals?: number | null, name?: string | null, symbol?: string | null, project?: { __typename?: 'TokenProject', id: string, isSpam?: boolean | null, logoUrl?: string | null, safetyLevel?: SafetyLevel | null } | null } | null> | null };

export type SearchTokensQueryVariables = Exact<{
  searchQuery: Scalars['String'];
}>;


export type SearchTokensQuery = { __typename?: 'Query', searchTokens?: Array<{ __typename?: 'Token', id: string, chain: Chain, address?: string | null, decimals?: number | null, name?: string | null, symbol?: string | null, project?: { __typename?: 'TokenProject', id: string, logoUrl?: string | null, safetyLevel?: SafetyLevel | null } | null } | null> | null };

export type ExploreSearchTokensQueryVariables = Exact<{
  searchQuery: Scalars['String'];
}>;


export type ExploreSearchTokensQuery = { __typename?: 'Query', searchTokens?: Array<{ __typename?: 'Token', id: string, chain: Chain, address?: string | null, decimals?: number | null, name?: string | null, symbol?: string | null, market?: { __typename?: 'TokenMarket', volume?: { __typename?: 'Amount', id: string, value: number } | null } | null, project?: { __typename?: 'TokenProject', id: string, logoUrl?: string | null, safetyLevel?: SafetyLevel | null } | null } | null> | null };

export type SpotPricesQueryVariables = Exact<{
  contracts: Array<ContractInput> | ContractInput;
}>;


export type SpotPricesQuery = { __typename?: 'Query', tokenProjects?: Array<{ __typename?: 'TokenProject', id: string, markets?: Array<{ __typename?: 'TokenProjectMarket', id: string, price?: { __typename?: 'Amount', id: string, value: number } | null, pricePercentChange24h?: { __typename?: 'Amount', id: string, value: number } | null } | null> | null } | null> | null };

export type TopTokenPartsFragment = { __typename?: 'Token', id: string, name?: string | null, symbol?: string | null, chain: Chain, address?: string | null, market?: { __typename?: 'TokenMarket', id: string, totalValueLocked?: { __typename?: 'Amount', id: string, value: number } | null, volume?: { __typename?: 'Amount', id: string, value: number } | null } | null, project?: { __typename?: 'TokenProject', id: string, logoUrl?: string | null, markets?: Array<{ __typename?: 'TokenProjectMarket', id: string, price?: { __typename?: 'Amount', id: string, value: number } | null, pricePercentChange24h?: { __typename?: 'Amount', id: string, value: number } | null, marketCap?: { __typename?: 'Amount', id: string, value: number } | null } | null> | null } | null };

export type ExploreTokensTabQueryVariables = Exact<{
  topTokensOrderBy: TokenSortableField;
}>;


export type ExploreTokensTabQuery = { __typename?: 'Query', topTokens?: Array<{ __typename?: 'Token', id: string, name?: string | null, symbol?: string | null, chain: Chain, address?: string | null, market?: { __typename?: 'TokenMarket', id: string, totalValueLocked?: { __typename?: 'Amount', id: string, value: number } | null, volume?: { __typename?: 'Amount', id: string, value: number } | null } | null, project?: { __typename?: 'TokenProject', id: string, logoUrl?: string | null, markets?: Array<{ __typename?: 'TokenProjectMarket', id: string, price?: { __typename?: 'Amount', id: string, value: number } | null, pricePercentChange24h?: { __typename?: 'Amount', id: string, value: number } | null, marketCap?: { __typename?: 'Amount', id: string, value: number } | null } | null> | null } | null } | null> | null, eth?: { __typename?: 'Token', id: string, name?: string | null, symbol?: string | null, chain: Chain, address?: string | null, market?: { __typename?: 'TokenMarket', id: string, totalValueLocked?: { __typename?: 'Amount', id: string, value: number } | null, volume?: { __typename?: 'Amount', id: string, value: number } | null } | null, project?: { __typename?: 'TokenProject', id: string, logoUrl?: string | null, markets?: Array<{ __typename?: 'TokenProjectMarket', id: string, price?: { __typename?: 'Amount', id: string, value: number } | null, pricePercentChange24h?: { __typename?: 'Amount', id: string, value: number } | null, marketCap?: { __typename?: 'Amount', id: string, value: number } | null } | null> | null } | null } | null };

export type FavoriteTokenCardQueryVariables = Exact<{
  chain: Chain;
  address?: InputMaybe<Scalars['String']>;
}>;


export type FavoriteTokenCardQuery = { __typename?: 'Query', token?: { __typename?: 'Token', id: string, name?: string | null, symbol?: string | null, chain: Chain, address?: string | null, project?: { __typename?: 'TokenProject', id: string, logoUrl?: string | null, markets?: Array<{ __typename?: 'TokenProjectMarket', id: string, price?: { __typename?: 'Amount', id: string, value: number } | null, pricePercentChange24h?: { __typename?: 'Amount', id: string, value: number } | null } | null> | null } | null } | null };

export type PortfolioBalanceQueryVariables = Exact<{
  owner: Scalars['String'];
}>;


export type PortfolioBalanceQuery = { __typename?: 'Query', portfolios?: Array<{ __typename?: 'Portfolio', id: string, tokensTotalDenominatedValue?: { __typename?: 'Amount', id: string, value: number } | null, tokensTotalDenominatedValueChange?: { __typename?: 'AmountChange', absolute?: { __typename?: 'Amount', id: string, value: number } | null, percentage?: { __typename?: 'Amount', id: string, value: number } | null } | null } | null> | null };

export const TopTokenPartsFragmentDoc = gql`
    fragment TopTokenParts on Token {
  id
  name
  symbol
  chain
  address
  market {
    id
    totalValueLocked {
      id
      value
    }
    volume(duration: DAY) {
      id
      value
    }
  }
  project {
    id
    logoUrl
    markets(currencies: [USD]) {
      id
      price {
        id
        value
      }
      pricePercentChange24h {
        id
        value
      }
      marketCap {
        id
        value
      }
    }
  }
}
    `;
export const TokenPriceHistoryDocument = gql`
    query TokenPriceHistory($contract: ContractInput!, $duration: HistoryDuration = DAY) {
  tokenProjects(contracts: [$contract]) {
    id
    name
    markets(currencies: [USD]) {
      id
      price {
        id
        value
      }
      pricePercentChange24h {
        id
        value
      }
      priceHistory(duration: $duration) {
        id
        timestamp
        value
      }
    }
    tokens {
      id
      chain
      address
      symbol
      decimals
    }
  }
}
    `;

/**
 * __useTokenPriceHistoryQuery__
 *
 * To run a query within a React component, call `useTokenPriceHistoryQuery` and pass it any options that fit your needs.
 * When your component renders, `useTokenPriceHistoryQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTokenPriceHistoryQuery({
 *   variables: {
 *      contract: // value for 'contract'
 *      duration: // value for 'duration'
 *   },
 * });
 */
export function useTokenPriceHistoryQuery(baseOptions: Apollo.QueryHookOptions<TokenPriceHistoryQuery, TokenPriceHistoryQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<TokenPriceHistoryQuery, TokenPriceHistoryQueryVariables>(TokenPriceHistoryDocument, options);
      }
export function useTokenPriceHistoryLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<TokenPriceHistoryQuery, TokenPriceHistoryQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<TokenPriceHistoryQuery, TokenPriceHistoryQueryVariables>(TokenPriceHistoryDocument, options);
        }
export type TokenPriceHistoryQueryHookResult = ReturnType<typeof useTokenPriceHistoryQuery>;
export type TokenPriceHistoryLazyQueryHookResult = ReturnType<typeof useTokenPriceHistoryLazyQuery>;
export type TokenPriceHistoryQueryResult = Apollo.QueryResult<TokenPriceHistoryQuery, TokenPriceHistoryQueryVariables>;
export const AccountListDocument = gql`
    query AccountList($addresses: [String!]!) {
  portfolios(ownerAddresses: $addresses) {
    id
    tokensTotalDenominatedValue {
      id
      value
    }
  }
}
    `;

/**
 * __useAccountListQuery__
 *
 * To run a query within a React component, call `useAccountListQuery` and pass it any options that fit your needs.
 * When your component renders, `useAccountListQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAccountListQuery({
 *   variables: {
 *      addresses: // value for 'addresses'
 *   },
 * });
 */
export function useAccountListQuery(baseOptions: Apollo.QueryHookOptions<AccountListQuery, AccountListQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<AccountListQuery, AccountListQueryVariables>(AccountListDocument, options);
      }
export function useAccountListLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<AccountListQuery, AccountListQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<AccountListQuery, AccountListQueryVariables>(AccountListDocument, options);
        }
export type AccountListQueryHookResult = ReturnType<typeof useAccountListQuery>;
export type AccountListLazyQueryHookResult = ReturnType<typeof useAccountListLazyQuery>;
export type AccountListQueryResult = Apollo.QueryResult<AccountListQuery, AccountListQueryVariables>;
export const SearchPopularTokensDocument = gql`
    query SearchPopularTokens {
  topTokens(chain: ETHEREUM, orderBy: VOLUME, page: 1, pageSize: 3) {
    id
    address
    chain
    name
    symbol
    project {
      id
      logoUrl
    }
  }
  eth: tokens(contracts: [{address: null, chain: ETHEREUM}]) {
    id
    address
    chain
    name
    symbol
    project {
      id
      logoUrl
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
export const NftsDocument = gql`
    query Nfts($ownerAddress: String!) {
  portfolios(ownerAddresses: [$ownerAddress]) {
    id
    nftBalances {
      id
      ownedAsset {
        id
        collection {
          id
          collectionId
          description
          image {
            id
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
              id
              value
            }
            totalVolume {
              id
              value
            }
          }
        }
        description
        image {
          id
          url
        }
        name
        nftContract {
          id
          address
          chain
          standard
        }
        thumbnail {
          id
          url
        }
        tokenId
        creator {
          id
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
export const NftItemScreenDocument = gql`
    query NFTItemScreen($contractAddress: String!, $filter: NftAssetsFilterInput) {
  nftAssets(address: $contractAddress, filter: $filter) {
    edges {
      node {
        id
        collection {
          id
          collectionId
          description
          image {
            id
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
            totalVolume {
              id
              value
            }
          }
          nftContracts {
            id
            address
          }
        }
        description
        image {
          id
          url
        }
        name
        nftContract {
          id
          address
          chain
          standard
        }
        tokenId
        creator {
          id
          address
          username
        }
      }
    }
  }
}
    `;

/**
 * __useNftItemScreenQuery__
 *
 * To run a query within a React component, call `useNftItemScreenQuery` and pass it any options that fit your needs.
 * When your component renders, `useNftItemScreenQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useNftItemScreenQuery({
 *   variables: {
 *      contractAddress: // value for 'contractAddress'
 *      filter: // value for 'filter'
 *   },
 * });
 */
export function useNftItemScreenQuery(baseOptions: Apollo.QueryHookOptions<NftItemScreenQuery, NftItemScreenQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<NftItemScreenQuery, NftItemScreenQueryVariables>(NftItemScreenDocument, options);
      }
export function useNftItemScreenLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<NftItemScreenQuery, NftItemScreenQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<NftItemScreenQuery, NftItemScreenQueryVariables>(NftItemScreenDocument, options);
        }
export type NftItemScreenQueryHookResult = ReturnType<typeof useNftItemScreenQuery>;
export type NftItemScreenLazyQueryHookResult = ReturnType<typeof useNftItemScreenLazyQuery>;
export type NftItemScreenQueryResult = Apollo.QueryResult<NftItemScreenQuery, NftItemScreenQueryVariables>;
export const NftsTabDocument = gql`
    query NftsTab($ownerAddress: String!, $first: Int, $after: String) {
  nftBalances(ownerAddress: $ownerAddress, first: $first, after: $after) {
    edges {
      node {
        ownedAsset {
          id
          collection {
            id
            name
            isVerified
            markets(currencies: [ETH]) {
              id
              floorPrice {
                value
              }
            }
          }
          image {
            id
            url
          }
          name
          tokenId
          description
          nftContract {
            id
            address
          }
        }
      }
    }
    pageInfo {
      endCursor
      hasNextPage
      hasPreviousPage
      startCursor
    }
  }
}
    `;

/**
 * __useNftsTabQuery__
 *
 * To run a query within a React component, call `useNftsTabQuery` and pass it any options that fit your needs.
 * When your component renders, `useNftsTabQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useNftsTabQuery({
 *   variables: {
 *      ownerAddress: // value for 'ownerAddress'
 *      first: // value for 'first'
 *      after: // value for 'after'
 *   },
 * });
 */
export function useNftsTabQuery(baseOptions: Apollo.QueryHookOptions<NftsTabQuery, NftsTabQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<NftsTabQuery, NftsTabQueryVariables>(NftsTabDocument, options);
      }
export function useNftsTabLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<NftsTabQuery, NftsTabQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<NftsTabQuery, NftsTabQueryVariables>(NftsTabDocument, options);
        }
export type NftsTabQueryHookResult = ReturnType<typeof useNftsTabQuery>;
export type NftsTabLazyQueryHookResult = ReturnType<typeof useNftsTabLazyQuery>;
export type NftsTabQueryResult = Apollo.QueryResult<NftsTabQuery, NftsTabQueryVariables>;
export const PortfolioBalancesDocument = gql`
    query PortfolioBalances($ownerAddress: String!) {
  portfolios(ownerAddresses: [$ownerAddress]) {
    id
    tokenBalances {
      id
      quantity
      denominatedValue {
        id
        currency
        value
      }
      token {
        id
        chain
        address
        name
        symbol
        decimals
        project {
          id
          logoUrl
          safetyLevel
          isSpam
        }
      }
      tokenProjectMarket {
        relativeChange24: pricePercentChange(duration: DAY) {
          id
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
export const SelectWalletScreenDocument = gql`
    query SelectWalletScreen($ownerAddresses: [String!]!) {
  portfolios(ownerAddresses: $ownerAddresses) {
    id
    ownerAddress
    tokensTotalDenominatedValue {
      id
      value
    }
  }
}
    `;

/**
 * __useSelectWalletScreenQuery__
 *
 * To run a query within a React component, call `useSelectWalletScreenQuery` and pass it any options that fit your needs.
 * When your component renders, `useSelectWalletScreenQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSelectWalletScreenQuery({
 *   variables: {
 *      ownerAddresses: // value for 'ownerAddresses'
 *   },
 * });
 */
export function useSelectWalletScreenQuery(baseOptions: Apollo.QueryHookOptions<SelectWalletScreenQuery, SelectWalletScreenQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SelectWalletScreenQuery, SelectWalletScreenQueryVariables>(SelectWalletScreenDocument, options);
      }
export function useSelectWalletScreenLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SelectWalletScreenQuery, SelectWalletScreenQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SelectWalletScreenQuery, SelectWalletScreenQueryVariables>(SelectWalletScreenDocument, options);
        }
export type SelectWalletScreenQueryHookResult = ReturnType<typeof useSelectWalletScreenQuery>;
export type SelectWalletScreenLazyQueryHookResult = ReturnType<typeof useSelectWalletScreenLazyQuery>;
export type SelectWalletScreenQueryResult = Apollo.QueryResult<SelectWalletScreenQuery, SelectWalletScreenQueryVariables>;
export const TransactionHistoryUpdaterDocument = gql`
    query TransactionHistoryUpdater($addresses: [String!]!) {
  portfolios(ownerAddresses: $addresses) {
    id
    ownerAddress
    assetActivities(pageSize: 1, page: 1) {
      id
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
export const TokenDocument = gql`
    query Token($chain: Chain!, $address: String) {
  token(chain: $chain, address: $address) {
    id
    name
    symbol
    decimals
    chain
    address
    project {
      id
      logoUrl
      safetyLevel
      isSpam
    }
  }
}
    `;

/**
 * __useTokenQuery__
 *
 * To run a query within a React component, call `useTokenQuery` and pass it any options that fit your needs.
 * When your component renders, `useTokenQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTokenQuery({
 *   variables: {
 *      chain: // value for 'chain'
 *      address: // value for 'address'
 *   },
 * });
 */
export function useTokenQuery(baseOptions: Apollo.QueryHookOptions<TokenQuery, TokenQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<TokenQuery, TokenQueryVariables>(TokenDocument, options);
      }
export function useTokenLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<TokenQuery, TokenQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<TokenQuery, TokenQueryVariables>(TokenDocument, options);
        }
export type TokenQueryHookResult = ReturnType<typeof useTokenQuery>;
export type TokenLazyQueryHookResult = ReturnType<typeof useTokenLazyQuery>;
export type TokenQueryResult = Apollo.QueryResult<TokenQuery, TokenQueryVariables>;
export const TokenDetailsScreenDocument = gql`
    query TokenDetailsScreen($chain: Chain!, $address: String) {
  token(chain: $chain, address: $address) {
    id
    address
    chain
    name
    symbol
    market(currency: USD) {
      id
      volume(duration: DAY) {
        id
        value
      }
    }
    project {
      id
      description
      homepageUrl
      twitterName
      safetyLevel
      logoUrl
      markets(currencies: [USD]) {
        id
        price {
          id
          value
        }
        marketCap {
          id
          value
        }
        fullyDilutedMarketCap {
          id
          value
        }
        priceHigh52W: priceHighLow(duration: YEAR, highLow: HIGH) {
          id
          value
        }
        priceLow52W: priceHighLow(duration: YEAR, highLow: LOW) {
          id
          value
        }
      }
      tokens {
        id
        chain
        address
      }
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
 *      chain: // value for 'chain'
 *      address: // value for 'address'
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
    id
    logoUrl
    name
    safetyLevel
    tokens {
      id
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
  portfolios(ownerAddresses: [$address]) {
    id
    assetActivities(pageSize: 50, page: 1) {
      id
      timestamp
      type
      transaction {
        id
        hash
        status
        to
        from
      }
      assetChanges {
        __typename
        ... on TokenTransfer {
          id
          asset {
            id
            name
            symbol
            address
            decimals
            chain
            project {
              id
              isSpam
            }
          }
          tokenStandard
          quantity
          sender
          recipient
          direction
          transactedValue {
            id
            currency
            value
          }
        }
        ... on NftTransfer {
          id
          asset {
            id
            name
            nftContract {
              id
              chain
              address
            }
            tokenId
            image {
              id
              url
            }
            collection {
              id
              name
            }
          }
          nftStandard
          sender
          recipient
          direction
        }
        ... on TokenApproval {
          id
          asset {
            id
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
    query TopTokens($chain: Chain, $page: Int = 1, $pageSize: Int = 100, $orderBy: TokenSortableField = POPULARITY) {
  topTokens(chain: $chain, page: $page, pageSize: $pageSize, orderBy: $orderBy) {
    id
    address
    chain
    decimals
    name
    symbol
    project {
      id
      isSpam
      logoUrl
      safetyLevel
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
 *      chain: // value for 'chain'
 *      page: // value for 'page'
 *      pageSize: // value for 'pageSize'
 *      orderBy: // value for 'orderBy'
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
export const SearchTokensDocument = gql`
    query SearchTokens($searchQuery: String!) {
  searchTokens(searchQuery: $searchQuery) {
    id
    chain
    address
    decimals
    name
    symbol
    project {
      id
      logoUrl
      safetyLevel
    }
  }
}
    `;

/**
 * __useSearchTokensQuery__
 *
 * To run a query within a React component, call `useSearchTokensQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchTokensQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchTokensQuery({
 *   variables: {
 *      searchQuery: // value for 'searchQuery'
 *   },
 * });
 */
export function useSearchTokensQuery(baseOptions: Apollo.QueryHookOptions<SearchTokensQuery, SearchTokensQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SearchTokensQuery, SearchTokensQueryVariables>(SearchTokensDocument, options);
      }
export function useSearchTokensLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SearchTokensQuery, SearchTokensQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SearchTokensQuery, SearchTokensQueryVariables>(SearchTokensDocument, options);
        }
export type SearchTokensQueryHookResult = ReturnType<typeof useSearchTokensQuery>;
export type SearchTokensLazyQueryHookResult = ReturnType<typeof useSearchTokensLazyQuery>;
export type SearchTokensQueryResult = Apollo.QueryResult<SearchTokensQuery, SearchTokensQueryVariables>;
export const ExploreSearchTokensDocument = gql`
    query ExploreSearchTokens($searchQuery: String!) {
  searchTokens(searchQuery: $searchQuery) {
    id
    chain
    address
    decimals
    name
    symbol
    market {
      volume(duration: YEAR) {
        id
        value
      }
    }
    project {
      id
      logoUrl
      safetyLevel
    }
  }
}
    `;

/**
 * __useExploreSearchTokensQuery__
 *
 * To run a query within a React component, call `useExploreSearchTokensQuery` and pass it any options that fit your needs.
 * When your component renders, `useExploreSearchTokensQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useExploreSearchTokensQuery({
 *   variables: {
 *      searchQuery: // value for 'searchQuery'
 *   },
 * });
 */
export function useExploreSearchTokensQuery(baseOptions: Apollo.QueryHookOptions<ExploreSearchTokensQuery, ExploreSearchTokensQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ExploreSearchTokensQuery, ExploreSearchTokensQueryVariables>(ExploreSearchTokensDocument, options);
      }
export function useExploreSearchTokensLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ExploreSearchTokensQuery, ExploreSearchTokensQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ExploreSearchTokensQuery, ExploreSearchTokensQueryVariables>(ExploreSearchTokensDocument, options);
        }
export type ExploreSearchTokensQueryHookResult = ReturnType<typeof useExploreSearchTokensQuery>;
export type ExploreSearchTokensLazyQueryHookResult = ReturnType<typeof useExploreSearchTokensLazyQuery>;
export type ExploreSearchTokensQueryResult = Apollo.QueryResult<ExploreSearchTokensQuery, ExploreSearchTokensQueryVariables>;
export const SpotPricesDocument = gql`
    query SpotPrices($contracts: [ContractInput!]!) {
  tokenProjects(contracts: $contracts) {
    id
    markets(currencies: [USD]) {
      id
      price {
        id
        value
      }
      pricePercentChange24h {
        id
        value
      }
    }
  }
}
    `;

/**
 * __useSpotPricesQuery__
 *
 * To run a query within a React component, call `useSpotPricesQuery` and pass it any options that fit your needs.
 * When your component renders, `useSpotPricesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSpotPricesQuery({
 *   variables: {
 *      contracts: // value for 'contracts'
 *   },
 * });
 */
export function useSpotPricesQuery(baseOptions: Apollo.QueryHookOptions<SpotPricesQuery, SpotPricesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SpotPricesQuery, SpotPricesQueryVariables>(SpotPricesDocument, options);
      }
export function useSpotPricesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SpotPricesQuery, SpotPricesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SpotPricesQuery, SpotPricesQueryVariables>(SpotPricesDocument, options);
        }
export type SpotPricesQueryHookResult = ReturnType<typeof useSpotPricesQuery>;
export type SpotPricesLazyQueryHookResult = ReturnType<typeof useSpotPricesLazyQuery>;
export type SpotPricesQueryResult = Apollo.QueryResult<SpotPricesQuery, SpotPricesQueryVariables>;
export const ExploreTokensTabDocument = gql`
    query ExploreTokensTab($topTokensOrderBy: TokenSortableField!) {
  topTokens(chain: ETHEREUM, page: 1, pageSize: 100, orderBy: $topTokensOrderBy) {
    ...TopTokenParts
  }
  eth: token(address: null, chain: ETHEREUM) {
    ...TopTokenParts
  }
}
    ${TopTokenPartsFragmentDoc}`;

/**
 * __useExploreTokensTabQuery__
 *
 * To run a query within a React component, call `useExploreTokensTabQuery` and pass it any options that fit your needs.
 * When your component renders, `useExploreTokensTabQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useExploreTokensTabQuery({
 *   variables: {
 *      topTokensOrderBy: // value for 'topTokensOrderBy'
 *   },
 * });
 */
export function useExploreTokensTabQuery(baseOptions: Apollo.QueryHookOptions<ExploreTokensTabQuery, ExploreTokensTabQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ExploreTokensTabQuery, ExploreTokensTabQueryVariables>(ExploreTokensTabDocument, options);
      }
export function useExploreTokensTabLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ExploreTokensTabQuery, ExploreTokensTabQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ExploreTokensTabQuery, ExploreTokensTabQueryVariables>(ExploreTokensTabDocument, options);
        }
export type ExploreTokensTabQueryHookResult = ReturnType<typeof useExploreTokensTabQuery>;
export type ExploreTokensTabLazyQueryHookResult = ReturnType<typeof useExploreTokensTabLazyQuery>;
export type ExploreTokensTabQueryResult = Apollo.QueryResult<ExploreTokensTabQuery, ExploreTokensTabQueryVariables>;
export const FavoriteTokenCardDocument = gql`
    query FavoriteTokenCard($chain: Chain!, $address: String) {
  token(chain: $chain, address: $address) {
    id
    name
    symbol
    chain
    address
    project {
      id
      logoUrl
      markets(currencies: [USD]) {
        id
        price {
          id
          value
        }
        pricePercentChange24h {
          id
          value
        }
      }
    }
  }
}
    `;

/**
 * __useFavoriteTokenCardQuery__
 *
 * To run a query within a React component, call `useFavoriteTokenCardQuery` and pass it any options that fit your needs.
 * When your component renders, `useFavoriteTokenCardQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFavoriteTokenCardQuery({
 *   variables: {
 *      chain: // value for 'chain'
 *      address: // value for 'address'
 *   },
 * });
 */
export function useFavoriteTokenCardQuery(baseOptions: Apollo.QueryHookOptions<FavoriteTokenCardQuery, FavoriteTokenCardQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<FavoriteTokenCardQuery, FavoriteTokenCardQueryVariables>(FavoriteTokenCardDocument, options);
      }
export function useFavoriteTokenCardLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<FavoriteTokenCardQuery, FavoriteTokenCardQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<FavoriteTokenCardQuery, FavoriteTokenCardQueryVariables>(FavoriteTokenCardDocument, options);
        }
export type FavoriteTokenCardQueryHookResult = ReturnType<typeof useFavoriteTokenCardQuery>;
export type FavoriteTokenCardLazyQueryHookResult = ReturnType<typeof useFavoriteTokenCardLazyQuery>;
export type FavoriteTokenCardQueryResult = Apollo.QueryResult<FavoriteTokenCardQuery, FavoriteTokenCardQueryVariables>;
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