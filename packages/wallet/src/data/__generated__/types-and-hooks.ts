import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
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

/**
 *  Types, unions, and inputs (alphabetized):
 * These are colocated to highlight the relationship between some types and their inputs.
 */
export type ActivityDetails = SwapOrderDetails | TransactionDetails;

export type ActivityDetailsInput = {
  transactionDetails?: InputMaybe<TransactionDetailsInput>;
};

/**
 *  Enums (alphabetized):
 * deprecated and replaced with TransactionType, please do not use this
 */
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
  SwapOrder = 'SWAP_ORDER',
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

export type AmountInput = {
  currency?: InputMaybe<Currency>;
  value: Scalars['Float'];
};

export type ApplicationContract = IContract & {
  __typename?: 'ApplicationContract';
  address: Scalars['String'];
  chain: Chain;
  icon?: Maybe<Image>;
  id: Scalars['ID'];
  name?: Maybe<Scalars['String']>;
};

export type ApplicationContractInput = {
  address: Scalars['String'];
  chain: Chain;
  icon?: InputMaybe<ImageInput>;
  name?: InputMaybe<Scalars['String']>;
};

export type AssetActivity = {
  __typename?: 'AssetActivity';
  addresses?: Maybe<Array<Scalars['String']>>;
  /** @deprecated use assetChanges field in details */
  assetChanges: Array<Maybe<AssetChange>>;
  chain: Chain;
  details: ActivityDetails;
  /** @deprecated not required, remove usage */
  gasUsed?: Maybe<Scalars['Float']>;
  id: Scalars['ID'];
  timestamp: Scalars['Int'];
  /** @deprecated use fields from details */
  transaction: Transaction;
  /** @deprecated use type field in details */
  type: ActivityType;
};

export type AssetActivityInput = {
  chain: Chain;
  details: ActivityDetailsInput;
  timestamp: Scalars['Int'];
};

export enum AssetActivitySwitch {
  Alternate = 'ALTERNATE',
  Legacy = 'LEGACY'
}

export type AssetChange = NftApproval | NftApproveForAll | NftTransfer | TokenApproval | TokenTransfer;

export type AssetChangeInput = {
  nftApproval?: InputMaybe<NftApprovalInput>;
  nftApproveForAll?: InputMaybe<NftApproveForAllInput>;
  nftTransfer?: InputMaybe<NftTransferInput>;
  tokenApproval?: InputMaybe<TokenApprovalInput>;
  tokenTransfer?: InputMaybe<TokenTransferInput>;
};

export enum Chain {
  Arbitrum = 'ARBITRUM',
  Avalanche = 'AVALANCHE',
  Base = 'BASE',
  Bnb = 'BNB',
  Celo = 'CELO',
  Ethereum = 'ETHEREUM',
  EthereumGoerli = 'ETHEREUM_GOERLI',
  EthereumSepolia = 'ETHEREUM_SEPOLIA',
  Optimism = 'OPTIMISM',
  Polygon = 'POLYGON',
  UnknownChain = 'UNKNOWN_CHAIN'
}

export enum CollectionSortableField {
  Volume = 'VOLUME'
}

export type ContractInput = {
  address?: InputMaybe<Scalars['String']>;
  chain: Chain;
};

export enum Currency {
  Aud = 'AUD',
  Brl = 'BRL',
  Cad = 'CAD',
  Cny = 'CNY',
  Eth = 'ETH',
  Eur = 'EUR',
  Gbp = 'GBP',
  Hkd = 'HKD',
  Idr = 'IDR',
  Inr = 'INR',
  Jpy = 'JPY',
  Matic = 'MATIC',
  Ngn = 'NGN',
  Pkr = 'PKR',
  Rub = 'RUB',
  Sgd = 'SGD',
  Thb = 'THB',
  Try = 'TRY',
  Uah = 'UAH',
  Usd = 'USD',
  Vnd = 'VND'
}

export type CurrencyAmountInput = {
  currency: Currency;
  value: Scalars['Float'];
};

export type DescriptionTranslations = {
  __typename?: 'DescriptionTranslations';
  descriptionEnUs?: Maybe<Scalars['String']>;
  descriptionEs419?: Maybe<Scalars['String']>;
  descriptionEsEs?: Maybe<Scalars['String']>;
  descriptionEsUs?: Maybe<Scalars['String']>;
  descriptionFrFr?: Maybe<Scalars['String']>;
  descriptionHiIn?: Maybe<Scalars['String']>;
  descriptionIdId?: Maybe<Scalars['String']>;
  descriptionJaJp?: Maybe<Scalars['String']>;
  descriptionMsMy?: Maybe<Scalars['String']>;
  descriptionNlNl?: Maybe<Scalars['String']>;
  descriptionPtPt?: Maybe<Scalars['String']>;
  descriptionRuRu?: Maybe<Scalars['String']>;
  descriptionThTh?: Maybe<Scalars['String']>;
  descriptionTrTr?: Maybe<Scalars['String']>;
  descriptionUkUa?: Maybe<Scalars['String']>;
  descriptionUrPk?: Maybe<Scalars['String']>;
  descriptionViVn?: Maybe<Scalars['String']>;
  descriptionZhHans?: Maybe<Scalars['String']>;
  descriptionZhHant?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
};

export type Dimensions = {
  __typename?: 'Dimensions';
  height?: Maybe<Scalars['Float']>;
  id: Scalars['ID'];
  width?: Maybe<Scalars['Float']>;
};

export type DimensionsInput = {
  height?: InputMaybe<Scalars['Float']>;
  width?: InputMaybe<Scalars['Float']>;
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

/**   Interfaces (alphabetized): */
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

export type ImageInput = {
  dimensions?: InputMaybe<DimensionsInput>;
  url: Scalars['String'];
};

export enum MediaType {
  Audio = 'AUDIO',
  Image = 'IMAGE',
  Raw = 'RAW',
  Video = 'VIDEO'
}

export type Mutation = {
  __typename?: 'Mutation';
  assetActivity: AssetActivity;
  heartbeat: Status;
  unsubscribe: Status;
};


export type MutationAssetActivityArgs = {
  input: AssetActivityInput;
};


export type MutationHeartbeatArgs = {
  subscriptionId: Scalars['ID'];
  type: SubscriptionType;
};


export type MutationUnsubscribeArgs = {
  subscriptionId: Scalars['ID'];
  type: SubscriptionType;
};

export type NftActivity = {
  __typename?: 'NftActivity';
  address: Scalars['String'];
  asset?: Maybe<NftAsset>;
  fromAddress: Scalars['String'];
  id: Scalars['ID'];
  marketplace?: Maybe<Scalars['String']>;
  orderStatus?: Maybe<OrderStatus>;
  price?: Maybe<Amount>;
  quantity?: Maybe<Scalars['Int']>;
  timestamp: Scalars['Int'];
  toAddress?: Maybe<Scalars['String']>;
  tokenId?: Maybe<Scalars['String']>;
  transactionHash?: Maybe<Scalars['String']>;
  type: NftActivityType;
  url?: Maybe<Scalars['String']>;
};

export type NftActivityConnection = {
  __typename?: 'NftActivityConnection';
  edges: Array<NftActivityEdge>;
  pageInfo: PageInfo;
};

export type NftActivityEdge = {
  __typename?: 'NftActivityEdge';
  cursor: Scalars['String'];
  node: NftActivity;
};

export type NftActivityFilterInput = {
  activityTypes?: InputMaybe<Array<NftActivityType>>;
  address?: InputMaybe<Scalars['String']>;
  tokenId?: InputMaybe<Scalars['String']>;
};

export enum NftActivityType {
  CancelListing = 'CANCEL_LISTING',
  Listing = 'LISTING',
  Sale = 'SALE',
  Transfer = 'TRANSFER'
}

export type NftApproval = {
  __typename?: 'NftApproval';
  approvedAddress: Scalars['String'];
  /**   can be erc721, erc1155, noncompliant */
  asset: NftAsset;
  id: Scalars['ID'];
  nftStandard: NftStandard;
};

export type NftApprovalInput = {
  approvedAddress: Scalars['String'];
  asset: NftAssetInput;
  nftStandard: NftStandard;
};

export type NftApproveForAll = {
  __typename?: 'NftApproveForAll';
  approved: Scalars['Boolean'];
  /**   can be erc721, erc1155, noncompliant */
  asset: NftAsset;
  id: Scalars['ID'];
  nftStandard: NftStandard;
  operatorAddress: Scalars['String'];
};

export type NftApproveForAllInput = {
  approved: Scalars['Boolean'];
  asset: NftAssetInput;
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
  /** @deprecated Field no longer supported */
  imageUrl?: Maybe<Scalars['String']>;
  isSpam?: Maybe<Scalars['Boolean']>;
  listings?: Maybe<NftOrderConnection>;
  mediaType?: Maybe<MediaType>;
  metadataUrl?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  nftContract?: Maybe<NftContract>;
  originalImage?: Maybe<Image>;
  /**   TODO: may need to be array to support erc1155 cases. not needed at the moment so will revisit. */
  ownerAddress?: Maybe<Scalars['String']>;
  rarities?: Maybe<Array<NftAssetRarity>>;
  smallImage?: Maybe<Image>;
  /** @deprecated Field no longer supported */
  smallImageUrl?: Maybe<Scalars['String']>;
  suspiciousFlag?: Maybe<Scalars['Boolean']>;
  thumbnail?: Maybe<Image>;
  /** @deprecated Field no longer supported */
  thumbnailUrl?: Maybe<Scalars['String']>;
  tokenId: Scalars['String'];
  traits?: Maybe<Array<NftAssetTrait>>;
};


export type NftAssetListingsArgs = {
  after?: InputMaybe<Scalars['String']>;
  asc?: InputMaybe<Scalars['Boolean']>;
  before?: InputMaybe<Scalars['String']>;
  chain?: InputMaybe<Chain>;
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
  animationUrl?: InputMaybe<Scalars['String']>;
  collection?: InputMaybe<NftCollectionInput>;
  description?: InputMaybe<Scalars['String']>;
  image?: InputMaybe<ImageInput>;
  isSpam?: InputMaybe<Scalars['Boolean']>;
  mediaType?: InputMaybe<MediaType>;
  name?: InputMaybe<Scalars['String']>;
  nftContract?: InputMaybe<NftContractInput>;
  smallImage?: InputMaybe<ImageInput>;
  thumbnail?: InputMaybe<ImageInput>;
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
  quantity?: Maybe<Scalars['Int']>;
};

export type NftBalanceAssetInput = {
  address: Scalars['String'];
  tokenId: Scalars['String'];
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
  assets?: InputMaybe<Array<NftBalanceAssetInput>>;
  filterSpam?: InputMaybe<Scalars['Boolean']>;
};

export type NftCollection = {
  __typename?: 'NftCollection';
  bannerImage?: Maybe<Image>;
  /**
   *  TODO: support querying for collection assets here
   * assets(page: Int, pageSize: Int, orderBy: NftAssetSortableField): [NftAsset]
   * @deprecated Field no longer supported
   */
  bannerImageUrl?: Maybe<Scalars['String']>;
  collectionId: Scalars['String'];
  creator?: Maybe<NftProfile>;
  description?: Maybe<Scalars['String']>;
  discordUrl?: Maybe<Scalars['String']>;
  homepageUrl?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  image?: Maybe<Image>;
  /** @deprecated Field no longer supported */
  imageUrl?: Maybe<Scalars['String']>;
  instagramName?: Maybe<Scalars['String']>;
  isVerified?: Maybe<Scalars['Boolean']>;
  markets?: Maybe<Array<NftCollectionMarket>>;
  name?: Maybe<Scalars['String']>;
  nftContracts?: Maybe<Array<NftContract>>;
  numAssets?: Maybe<Scalars['Int']>;
  /** @deprecated Field no longer supported */
  openseaUrl?: Maybe<Scalars['String']>;
  traits?: Maybe<Array<NftCollectionTrait>>;
  twitterName?: Maybe<Scalars['String']>;
};


export type NftCollectionMarketsArgs = {
  currencies: Array<Currency>;
};

export type NftCollectionBalance = {
  __typename?: 'NftCollectionBalance';
  address: Scalars['String'];
  balance: Scalars['Float'];
  id: Scalars['ID'];
  logoImage?: Maybe<Image>;
  name: Scalars['String'];
};

export type NftCollectionBalanceConnection = {
  __typename?: 'NftCollectionBalanceConnection';
  edges: Array<NftCollectionBalanceEdge>;
  pageInfo: PageInfo;
};

export type NftCollectionBalanceEdge = {
  __typename?: 'NftCollectionBalanceEdge';
  cursor: Scalars['String'];
  node: NftCollectionBalance;
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

export type NftCollectionInput = {
  collectionId: Scalars['String'];
  name?: InputMaybe<Scalars['String']>;
  nftContracts?: InputMaybe<Array<NftContractInput>>;
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
  percentListed?: Maybe<TimestampedAmount>;
  percentUniqueOwners?: Maybe<TimestampedAmount>;
  sales?: Maybe<TimestampedAmount>;
  totalVolume?: Maybe<TimestampedAmount>;
  volume?: Maybe<TimestampedAmount>;
  /** @deprecated Field no longer supported */
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

export type NftContractInput = {
  address: Scalars['String'];
  chain: Chain;
  name?: InputMaybe<Scalars['String']>;
  standard?: InputMaybe<NftStandard>;
  symbol?: InputMaybe<Scalars['String']>;
  totalSupply?: InputMaybe<Scalars['Int']>;
};

export type NftFee = {
  __typename?: 'NftFee';
  basisPoints: Scalars['Int'];
  id: Scalars['ID'];
  payoutAddress: Scalars['String'];
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
  poolPrices?: Maybe<Array<Scalars['String']>>;
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

export type NftRouteResponse = {
  __typename?: 'NftRouteResponse';
  calldata: Scalars['String'];
  id: Scalars['ID'];
  route?: Maybe<Array<NftTrade>>;
  sendAmount: TokenAmount;
  toAddress: Scalars['String'];
};

export enum NftStandard {
  Erc721 = 'ERC721',
  Erc1155 = 'ERC1155',
  Noncompliant = 'NONCOMPLIANT'
}

export type NftTrade = {
  __typename?: 'NftTrade';
  amount: Scalars['Int'];
  contractAddress: Scalars['String'];
  id: Scalars['ID'];
  marketplace: NftMarketplace;
  /**   price represents the current price of the NFT, which can be different from quotePrice */
  price: TokenAmount;
  /**   quotePrice represents the last quoted price of the NFT */
  quotePrice?: Maybe<TokenAmount>;
  tokenId: Scalars['String'];
  tokenType?: Maybe<NftStandard>;
};

export type NftTradeInput = {
  amount: Scalars['Int'];
  contractAddress: Scalars['String'];
  id: Scalars['ID'];
  marketplace: NftMarketplace;
  quotePrice?: InputMaybe<TokenAmountInput>;
  tokenId: Scalars['String'];
  tokenType?: InputMaybe<NftStandard>;
};

export type NftTransfer = {
  __typename?: 'NftTransfer';
  asset: NftAsset;
  direction: TransactionDirection;
  id: Scalars['ID'];
  nftStandard: NftStandard;
  recipient: Scalars['String'];
  sender: Scalars['String'];
};

export type NftTransferInput = {
  asset: NftAssetInput;
  direction: TransactionDirection;
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

/**   v2 pool parameters as defined by https://github.com/Uniswap/v2-sdk/blob/main/src/entities/pair.ts */
export type PairInput = {
  tokenAmountA: TokenAmountInput;
  tokenAmountB: TokenAmountInput;
};

export type PermitDetailsInput = {
  amount: Scalars['String'];
  expiration: Scalars['String'];
  nonce: Scalars['String'];
  token: Scalars['String'];
};

export type PermitInput = {
  details: PermitDetailsInput;
  sigDeadline: Scalars['String'];
  signature: Scalars['String'];
  spender: Scalars['String'];
};

/**   v3 pool parameters as defined by https://github.com/Uniswap/v3-sdk/blob/main/src/entities/pool.ts */
export type PoolInput = {
  fee: Scalars['Int'];
  liquidity: Scalars['String'];
  sqrtRatioX96: Scalars['String'];
  tickCurrent: Scalars['String'];
  tokenA: TokenInput;
  tokenB: TokenInput;
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
  _fs?: InputMaybe<AssetActivitySwitch>;
  chains?: InputMaybe<Array<Chain>>;
  includeOffChain?: InputMaybe<Scalars['Boolean']>;
  page?: InputMaybe<Scalars['Int']>;
  pageSize?: InputMaybe<Scalars['Int']>;
};


export type PortfolioTokensTotalDenominatedValueChangeArgs = {
  duration?: InputMaybe<HistoryDuration>;
};

/**   Specify how the portfolio value should be calculated for each `ownerAddress`. */
export type PortfolioValueModifier = {
  includeSmallBalances?: InputMaybe<Scalars['Boolean']>;
  includeSpamTokens?: InputMaybe<Scalars['Boolean']>;
  ownerAddress: Scalars['String'];
  tokenExcludeOverrides?: InputMaybe<Array<ContractInput>>;
  tokenIncludeOverrides?: InputMaybe<Array<ContractInput>>;
};

export enum PriceSource {
  SubgraphV2 = 'SUBGRAPH_V2',
  SubgraphV3 = 'SUBGRAPH_V3'
}

export enum ProtocolVersion {
  V2 = 'V2',
  V3 = 'V3'
}

export type PushNotification = {
  __typename?: 'PushNotification';
  contents: Scalars['AWSJSON'];
  id: Scalars['ID'];
  notifyAddress: Scalars['String'];
  signerHeader: Scalars['AWSJSON'];
  viewerHeader: Scalars['AWSJSON'];
};

export type Query = {
  __typename?: 'Query';
  convert?: Maybe<Amount>;
  nftActivity?: Maybe<NftActivityConnection>;
  nftAssets?: Maybe<NftAssetConnection>;
  nftBalances?: Maybe<NftBalanceConnection>;
  nftCollectionBalances?: Maybe<NftCollectionBalanceConnection>;
  nftCollections?: Maybe<NftCollectionConnection>;
  nftRoute?: Maybe<NftRouteResponse>;
  portfolios?: Maybe<Array<Maybe<Portfolio>>>;
  searchTokens?: Maybe<Array<Maybe<Token>>>;
  /**
   *  token consumes chain and address instead of contract because the apollo client request cache can only use
   * keys from the response, and the token response does not contain a contract, but does contain an unwrapped
   * contract: chain and address.
   */
  token?: Maybe<Token>;
  tokenProjects?: Maybe<Array<Maybe<TokenProject>>>;
  tokens?: Maybe<Array<Maybe<Token>>>;
  topCollections?: Maybe<NftCollectionConnection>;
  topTokens?: Maybe<Array<Maybe<Token>>>;
  /**   returns top v2 pairs sorted by total value locked in desc order */
  topV2Pairs?: Maybe<Array<V2Pair>>;
  /**   returns top v3 pools sorted by total value locked in desc order */
  topV3Pools?: Maybe<Array<V3Pool>>;
  transactionNotification?: Maybe<TransactionNotification>;
};


export type QueryConvertArgs = {
  fromAmount: CurrencyAmountInput;
  toCurrency: Currency;
};


export type QueryNftActivityArgs = {
  after?: InputMaybe<Scalars['String']>;
  chain?: InputMaybe<Chain>;
  filter?: InputMaybe<NftActivityFilterInput>;
  first?: InputMaybe<Scalars['Int']>;
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


export type QueryNftCollectionBalancesArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  chain?: InputMaybe<Chain>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
  ownerAddress: Scalars['String'];
};


export type QueryNftCollectionsArgs = {
  after?: InputMaybe<Scalars['String']>;
  chain?: InputMaybe<Chain>;
  filter?: InputMaybe<NftCollectionsFilterInput>;
  first?: InputMaybe<Scalars['Int']>;
};


export type QueryNftRouteArgs = {
  chain?: InputMaybe<Chain>;
  nftTrades: Array<NftTradeInput>;
  senderAddress: Scalars['String'];
  tokenTrades?: InputMaybe<Array<TokenTradeInput>>;
};


export type QueryPortfoliosArgs = {
  chains?: InputMaybe<Array<Chain>>;
  lookupTokens?: InputMaybe<Array<ContractInput>>;
  ownerAddresses: Array<Scalars['String']>;
  valueModifiers?: InputMaybe<Array<PortfolioValueModifier>>;
};


export type QuerySearchTokensArgs = {
  chains?: InputMaybe<Array<Chain>>;
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


export type QueryTopCollectionsArgs = {
  after?: InputMaybe<Scalars['String']>;
  chains?: InputMaybe<Array<Chain>>;
  cursor?: InputMaybe<Scalars['String']>;
  duration?: InputMaybe<HistoryDuration>;
  first?: InputMaybe<Scalars['Int']>;
  limit?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<CollectionSortableField>;
};


export type QueryTopTokensArgs = {
  chain?: InputMaybe<Chain>;
  orderBy?: InputMaybe<TokenSortableField>;
  page?: InputMaybe<Scalars['Int']>;
  pageSize?: InputMaybe<Scalars['Int']>;
};


export type QueryTopV2PairsArgs = {
  chain: Chain;
  first: Scalars['Int'];
  tokenFilter?: InputMaybe<Scalars['String']>;
  tvlCursor?: InputMaybe<Scalars['Float']>;
};


export type QueryTopV3PoolsArgs = {
  chain: Chain;
  first: Scalars['Int'];
  tokenFilter?: InputMaybe<Scalars['String']>;
  tvlCursor?: InputMaybe<Scalars['Float']>;
};


export type QueryTransactionNotificationArgs = {
  address: Scalars['String'];
  chain: Chain;
  transactionHash: Scalars['String'];
};

export enum SafetyLevel {
  Blocked = 'BLOCKED',
  MediumWarning = 'MEDIUM_WARNING',
  StrongWarning = 'STRONG_WARNING',
  Verified = 'VERIFIED'
}

export type Status = {
  __typename?: 'Status';
  success: Scalars['Boolean'];
};

export type Subscription = {
  __typename?: 'Subscription';
  onAssetActivity?: Maybe<AssetActivity>;
};


export type SubscriptionOnAssetActivityArgs = {
  addresses: Array<Scalars['String']>;
  subscriptionId: Scalars['ID'];
};

export enum SubscriptionType {
  AssetActivity = 'ASSET_ACTIVITY'
}

export type SwapOrderDetails = {
  __typename?: 'SwapOrderDetails';
  expiry: Scalars['Int'];
  hash: Scalars['String'];
  id: Scalars['ID'];
  inputToken: Token;
  inputTokenQuantity: Scalars['String'];
  offerer: Scalars['String'];
  outputToken: Token;
  outputTokenQuantity: Scalars['String'];
  /** @deprecated use swapOrderStatus to disambiguate from transactionStatus */
  status: SwapOrderStatus;
  swapOrderStatus: SwapOrderStatus;
};

export enum SwapOrderStatus {
  Error = 'ERROR',
  Expired = 'EXPIRED',
  InsufficientFunds = 'INSUFFICIENT_FUNDS',
  Open = 'OPEN'
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

export type TokenAmount = {
  __typename?: 'TokenAmount';
  currency: Currency;
  id: Scalars['ID'];
  value: Scalars['String'];
};

export type TokenAmountInput = {
  amount: Scalars['String'];
  token: TokenInput;
};

export type TokenApproval = {
  __typename?: 'TokenApproval';
  approvedAddress: Scalars['String'];
  /**   can be erc20 or native */
  asset: Token;
  id: Scalars['ID'];
  quantity: Scalars['String'];
  tokenStandard: TokenStandard;
};

export type TokenApprovalInput = {
  approvedAddress: Scalars['String'];
  asset: TokenAssetInput;
  quantity: Scalars['String'];
  tokenStandard: TokenStandard;
};

export type TokenAssetInput = {
  address?: InputMaybe<Scalars['String']>;
  chain: Chain;
  decimals?: InputMaybe<Scalars['Int']>;
  name?: InputMaybe<Scalars['String']>;
  standard?: InputMaybe<TokenStandard>;
  symbol?: InputMaybe<Scalars['String']>;
};

export type TokenBalance = {
  __typename?: 'TokenBalance';
  blockNumber?: Maybe<Scalars['Int']>;
  blockTimestamp?: Maybe<Scalars['Int']>;
  denominatedValue?: Maybe<Amount>;
  id: Scalars['ID'];
  isHidden?: Maybe<Scalars['Boolean']>;
  ownerAddress: Scalars['String'];
  quantity?: Maybe<Scalars['Float']>;
  token?: Maybe<Token>;
  tokenProjectMarket?: Maybe<TokenProjectMarket>;
};

export type TokenInput = {
  address: Scalars['String'];
  chainId: Scalars['Int'];
  decimals: Scalars['Int'];
  isNative: Scalars['Boolean'];
};

export type TokenMarket = {
  __typename?: 'TokenMarket';
  fullyDilutedValuation?: Maybe<Amount>;
  id: Scalars['ID'];
  price?: Maybe<Amount>;
  priceHighLow?: Maybe<Amount>;
  priceHistory?: Maybe<Array<Maybe<TimestampedAmount>>>;
  pricePercentChange?: Maybe<Amount>;
  priceSource: PriceSource;
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
  descriptionTranslations?: Maybe<DescriptionTranslations>;
  homepageUrl?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  isSpam?: Maybe<Scalars['Boolean']>;
  logo?: Maybe<Image>;
  /** @deprecated use logo */
  logoUrl?: Maybe<Scalars['String']>;
  markets?: Maybe<Array<Maybe<TokenProjectMarket>>>;
  name?: Maybe<Scalars['String']>;
  safetyLevel?: Maybe<SafetyLevel>;
  /** @deprecated use logo */
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
  fullyDilutedValuation?: Maybe<Amount>;
  id: Scalars['ID'];
  marketCap?: Maybe<Amount>;
  price?: Maybe<Amount>;
  priceHigh52w?: Maybe<Amount>;
  priceHighLow?: Maybe<Amount>;
  priceHistory?: Maybe<Array<Maybe<TimestampedAmount>>>;
  priceLow52w?: Maybe<Amount>;
  pricePercentChange?: Maybe<Amount>;
  pricePercentChange24h?: Maybe<Amount>;
  tokenProject: TokenProject;
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

export enum TokenSortableField {
  MarketCap = 'MARKET_CAP',
  Popularity = 'POPULARITY',
  TotalValueLocked = 'TOTAL_VALUE_LOCKED',
  Volume = 'VOLUME'
}

export enum TokenStandard {
  Erc20 = 'ERC20',
  Native = 'NATIVE'
}

export type TokenTradeInput = {
  permit?: InputMaybe<PermitInput>;
  routes?: InputMaybe<TokenTradeRoutesInput>;
  slippageToleranceBasisPoints?: InputMaybe<Scalars['Int']>;
  tokenAmount: TokenAmountInput;
};

export type TokenTradeRouteInput = {
  inputAmount: TokenAmountInput;
  outputAmount: TokenAmountInput;
  pools: Array<TradePoolInput>;
};

export type TokenTradeRoutesInput = {
  mixedRoutes?: InputMaybe<Array<TokenTradeRouteInput>>;
  tradeType: TokenTradeType;
  v2Routes?: InputMaybe<Array<TokenTradeRouteInput>>;
  v3Routes?: InputMaybe<Array<TokenTradeRouteInput>>;
};

export enum TokenTradeType {
  ExactInput = 'EXACT_INPUT',
  ExactOutput = 'EXACT_OUTPUT'
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

export type TokenTransferInput = {
  asset: TokenAssetInput;
  direction: TransactionDirection;
  quantity: Scalars['String'];
  recipient: Scalars['String'];
  sender: Scalars['String'];
  tokenStandard: TokenStandard;
  transactedValue?: InputMaybe<AmountInput>;
};

export type TradePoolInput = {
  pair?: InputMaybe<PairInput>;
  pool?: InputMaybe<PoolInput>;
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

export type TransactionDetails = {
  __typename?: 'TransactionDetails';
  application?: Maybe<ApplicationContract>;
  assetChanges: Array<Maybe<AssetChange>>;
  from: Scalars['String'];
  hash: Scalars['String'];
  id: Scalars['ID'];
  nonce: Scalars['Int'];
  /** @deprecated use transactionStatus to disambiguate from swapOrderStatus */
  status: TransactionStatus;
  to: Scalars['String'];
  transactionStatus: TransactionStatus;
  type: TransactionType;
};

export type TransactionDetailsInput = {
  application?: InputMaybe<ApplicationContractInput>;
  assetChanges: Array<InputMaybe<AssetChangeInput>>;
  from: Scalars['String'];
  hash: Scalars['String'];
  nonce: Scalars['Int'];
  status?: InputMaybe<TransactionStatus>;
  to: Scalars['String'];
  transactionStatus: TransactionStatus;
  type: TransactionType;
};

export enum TransactionDirection {
  In = 'IN',
  Out = 'OUT',
  Self = 'SELF'
}

export type TransactionNotification = {
  __typename?: 'TransactionNotification';
  hash: Scalars['String'];
  id: Scalars['ID'];
  push: Array<PushNotification>;
};

export enum TransactionStatus {
  Confirmed = 'CONFIRMED',
  Failed = 'FAILED',
  Pending = 'PENDING'
}

export enum TransactionType {
  Approve = 'APPROVE',
  Borrow = 'BORROW',
  Cancel = 'CANCEL',
  Claim = 'CLAIM',
  Deployment = 'DEPLOYMENT',
  Lend = 'LEND',
  Mint = 'MINT',
  Receive = 'RECEIVE',
  Repay = 'REPAY',
  Send = 'SEND',
  Stake = 'STAKE',
  Swap = 'SWAP',
  SwapOrder = 'SWAP_ORDER',
  Unknown = 'UNKNOWN',
  Unstake = 'UNSTAKE',
  Withdraw = 'WITHDRAW'
}

export type V2Pair = {
  __typename?: 'V2Pair';
  address: Scalars['String'];
  chain: Chain;
  createdAtTimestamp?: Maybe<Scalars['Int']>;
  cumulativeVolume?: Maybe<Amount>;
  id: Scalars['ID'];
  protocolVersion: ProtocolVersion;
  token0?: Maybe<Token>;
  token0Supply?: Maybe<Scalars['Float']>;
  token1?: Maybe<Token>;
  token1Supply?: Maybe<Scalars['Float']>;
  totalLiquidity?: Maybe<Amount>;
  txCount?: Maybe<Scalars['Int']>;
};


export type V2PairCumulativeVolumeArgs = {
  duration?: InputMaybe<HistoryDuration>;
};

export type V3Pool = {
  __typename?: 'V3Pool';
  address: Scalars['String'];
  chain: Chain;
  createdAtTimestamp?: Maybe<Scalars['Int']>;
  cumulativeVolume?: Maybe<Amount>;
  feeTier?: Maybe<Scalars['Float']>;
  id: Scalars['ID'];
  protocolVersion: ProtocolVersion;
  token0?: Maybe<Token>;
  token0Supply?: Maybe<Scalars['Float']>;
  token1?: Maybe<Token>;
  token1Supply?: Maybe<Scalars['Float']>;
  totalLiquidity?: Maybe<Amount>;
  txCount?: Maybe<Scalars['Int']>;
};


export type V3PoolCumulativeVolumeArgs = {
  duration?: InputMaybe<HistoryDuration>;
};

export type TokenPriceHistoryQueryVariables = Exact<{
  contract: ContractInput;
  duration?: InputMaybe<HistoryDuration>;
}>;


export type TokenPriceHistoryQuery = { __typename?: 'Query', tokenProjects?: Array<{ __typename?: 'TokenProject', id: string, name?: string | null, markets?: Array<{ __typename?: 'TokenProjectMarket', id: string, price?: { __typename?: 'Amount', value: number } | null, pricePercentChange24h?: { __typename?: 'Amount', value: number } | null, priceHistory?: Array<{ __typename?: 'TimestampedAmount', timestamp: number, value: number } | null> | null } | null> | null, tokens: Array<{ __typename?: 'Token', id: string, chain: Chain, address?: string | null, symbol?: string | null, decimals?: number | null, market?: { __typename?: 'TokenMarket', id: string, price?: { __typename?: 'Amount', value: number } | null, pricePercentChange24h?: { __typename?: 'Amount', value: number } | null, priceHistory?: Array<{ __typename?: 'TimestampedAmount', timestamp: number, value: number } | null> | null } | null }> } | null> | null };

export type AccountListQueryVariables = Exact<{
  addresses: Array<Scalars['String']> | Scalars['String'];
  valueModifiers?: InputMaybe<Array<PortfolioValueModifier> | PortfolioValueModifier>;
}>;


export type AccountListQuery = { __typename?: 'Query', portfolios?: Array<{ __typename?: 'Portfolio', id: string, ownerAddress: string, tokensTotalDenominatedValue?: { __typename?: 'Amount', value: number } | null } | null> | null };

export type SearchPopularNftCollectionsQueryVariables = Exact<{ [key: string]: never; }>;


export type SearchPopularNftCollectionsQuery = { __typename?: 'Query', topCollections?: { __typename?: 'NftCollectionConnection', edges: Array<{ __typename?: 'NftCollectionEdge', node: { __typename?: 'NftCollection', id: string, name?: string | null, collectionId: string, isVerified?: boolean | null, nftContracts?: Array<{ __typename?: 'NftContract', id: string, chain: Chain, address: string }> | null, image?: { __typename?: 'Image', id: string, url: string } | null } }> } | null };

export type SearchPopularTokensQueryVariables = Exact<{ [key: string]: never; }>;


export type SearchPopularTokensQuery = { __typename?: 'Query', topTokens?: Array<{ __typename?: 'Token', id: string, address?: string | null, chain: Chain, symbol?: string | null, decimals?: number | null, project?: { __typename?: 'TokenProject', id: string, name?: string | null, logoUrl?: string | null, safetyLevel?: SafetyLevel | null } | null } | null> | null, eth?: Array<{ __typename?: 'Token', id: string, address?: string | null, chain: Chain, symbol?: string | null, decimals?: number | null, project?: { __typename?: 'TokenProject', id: string, name?: string | null, logoUrl?: string | null, safetyLevel?: SafetyLevel | null } | null } | null> | null };

export type NftsQueryVariables = Exact<{
  ownerAddress: Scalars['String'];
}>;


export type NftsQuery = { __typename?: 'Query', portfolios?: Array<{ __typename?: 'Portfolio', id: string, nftBalances?: Array<{ __typename?: 'NftBalance', id: string, ownedAsset?: { __typename?: 'NftAsset', id: string, description?: string | null, name?: string | null, tokenId: string, collection?: { __typename?: 'NftCollection', id: string, collectionId: string, description?: string | null, isVerified?: boolean | null, name?: string | null, numAssets?: number | null, image?: { __typename?: 'Image', id: string, url: string } | null, markets?: Array<{ __typename?: 'NftCollectionMarket', id: string, owners?: number | null, floorPrice?: { __typename?: 'TimestampedAmount', value: number } | null, volume24h?: { __typename?: 'Amount', value: number } | null, totalVolume?: { __typename?: 'TimestampedAmount', value: number } | null }> | null } | null, image?: { __typename?: 'Image', id: string, url: string } | null, nftContract?: { __typename?: 'NftContract', id: string, address: string, chain: Chain, standard?: NftStandard | null } | null, thumbnail?: { __typename?: 'Image', id: string, url: string } | null, creator?: { __typename?: 'NftProfile', id: string, address: string, username?: string | null } | null } | null } | null> | null } | null> | null };

export type NftItemScreenQueryVariables = Exact<{
  contractAddress: Scalars['String'];
  filter?: InputMaybe<NftAssetsFilterInput>;
  activityFilter?: InputMaybe<NftActivityFilterInput>;
}>;


export type NftItemScreenQuery = { __typename?: 'Query', nftAssets?: { __typename?: 'NftAssetConnection', edges: Array<{ __typename?: 'NftAssetEdge', node: { __typename?: 'NftAsset', id: string, ownerAddress?: string | null, description?: string | null, name?: string | null, tokenId: string, collection?: { __typename?: 'NftCollection', id: string, collectionId: string, description?: string | null, isVerified?: boolean | null, name?: string | null, numAssets?: number | null, image?: { __typename?: 'Image', id: string, url: string } | null, markets?: Array<{ __typename?: 'NftCollectionMarket', id: string, owners?: number | null, floorPrice?: { __typename?: 'TimestampedAmount', value: number } | null, totalVolume?: { __typename?: 'TimestampedAmount', value: number } | null }> | null, nftContracts?: Array<{ __typename?: 'NftContract', id: string, address: string }> | null } | null, image?: { __typename?: 'Image', id: string, url: string, dimensions?: { __typename?: 'Dimensions', width?: number | null, height?: number | null } | null } | null, nftContract?: { __typename?: 'NftContract', id: string, address: string, chain: Chain, standard?: NftStandard | null } | null, creator?: { __typename?: 'NftProfile', id: string, address: string, username?: string | null } | null, traits?: Array<{ __typename?: 'NftAssetTrait', id: string, name?: string | null, rarity?: number | null, value?: string | null }> | null, listings?: { __typename?: 'NftOrderConnection', edges: Array<{ __typename?: 'NftOrderEdge', node: { __typename?: 'NftOrder', id: string, price: { __typename?: 'Amount', currency?: Currency | null, value: number } } }> } | null } }> } | null, nftActivity?: { __typename?: 'NftActivityConnection', edges: Array<{ __typename?: 'NftActivityEdge', node: { __typename?: 'NftActivity', id: string, quantity?: number | null, price?: { __typename?: 'Amount', currency?: Currency | null, value: number } | null } }> } | null };

export type NftCollectionScreenQueryVariables = Exact<{
  contractAddress: Scalars['String'];
  first?: InputMaybe<Scalars['Int']>;
  after?: InputMaybe<Scalars['String']>;
}>;


export type NftCollectionScreenQuery = { __typename?: 'Query', nftCollections?: { __typename?: 'NftCollectionConnection', edges: Array<{ __typename?: 'NftCollectionEdge', node: { __typename?: 'NftCollection', id: string, isVerified?: boolean | null, numAssets?: number | null, description?: string | null, homepageUrl?: string | null, twitterName?: string | null, name?: string | null, bannerImage?: { __typename?: 'Image', id: string, url: string } | null, image?: { __typename?: 'Image', id: string, url: string } | null, markets?: Array<{ __typename?: 'NftCollectionMarket', id: string, owners?: number | null, floorPrice?: { __typename?: 'TimestampedAmount', value: number } | null, volume24h?: { __typename?: 'Amount', value: number } | null, totalVolume?: { __typename?: 'TimestampedAmount', value: number } | null }> | null } }> } | null, nftAssets?: { __typename?: 'NftAssetConnection', edges: Array<{ __typename?: 'NftAssetEdge', node: { __typename?: 'NftAsset', ownerAddress?: string | null, id: string, name?: string | null, tokenId: string, nftContract?: { __typename?: 'NftContract', id: string, address: string } | null, collection?: { __typename?: 'NftCollection', id: string, collectionId: string, name?: string | null } | null, image?: { __typename?: 'Image', id: string, url: string, dimensions?: { __typename?: 'Dimensions', width?: number | null, height?: number | null } | null } | null, listings?: { __typename?: 'NftOrderConnection', edges: Array<{ __typename?: 'NftOrderEdge', node: { __typename?: 'NftOrder', id: string, price: { __typename?: 'Amount', currency?: Currency | null, value: number } } }> } | null } }>, pageInfo: { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage?: boolean | null, hasPreviousPage?: boolean | null, startCursor?: string | null } } | null };

export type NftsTabQueryVariables = Exact<{
  ownerAddress: Scalars['String'];
  first?: InputMaybe<Scalars['Int']>;
  after?: InputMaybe<Scalars['String']>;
  filter?: InputMaybe<NftBalancesFilterInput>;
}>;


export type NftsTabQuery = { __typename?: 'Query', nftBalances?: { __typename?: 'NftBalanceConnection', edges: Array<{ __typename?: 'NftBalanceEdge', node: { __typename?: 'NftBalance', ownedAsset?: { __typename?: 'NftAsset', id: string, name?: string | null, tokenId: string, description?: string | null, isSpam?: boolean | null, collection?: { __typename?: 'NftCollection', id: string, name?: string | null, isVerified?: boolean | null, markets?: Array<{ __typename?: 'NftCollectionMarket', id: string, floorPrice?: { __typename?: 'TimestampedAmount', value: number } | null }> | null } | null, image?: { __typename?: 'Image', id: string, url: string, dimensions?: { __typename?: 'Dimensions', width?: number | null, height?: number | null } | null } | null, nftContract?: { __typename?: 'NftContract', id: string, address: string } | null } | null } }>, pageInfo: { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage?: boolean | null, hasPreviousPage?: boolean | null, startCursor?: string | null } } | null };

export type PortfolioBalancesQueryVariables = Exact<{
  ownerAddress: Scalars['String'];
  valueModifiers?: InputMaybe<Array<PortfolioValueModifier> | PortfolioValueModifier>;
}>;


export type PortfolioBalancesQuery = { __typename?: 'Query', portfolios?: Array<{ __typename?: 'Portfolio', id: string, tokensTotalDenominatedValue?: { __typename?: 'Amount', value: number } | null, tokensTotalDenominatedValueChange?: { __typename?: 'AmountChange', absolute?: { __typename?: 'Amount', value: number } | null, percentage?: { __typename?: 'Amount', value: number } | null } | null, tokenBalances?: Array<{ __typename?: 'TokenBalance', id: string, quantity?: number | null, isHidden?: boolean | null, denominatedValue?: { __typename?: 'Amount', currency?: Currency | null, value: number } | null, token?: { __typename?: 'Token', chain: Chain, address?: string | null, symbol?: string | null, decimals?: number | null, project?: { __typename?: 'TokenProject', id: string, name?: string | null, logoUrl?: string | null, safetyLevel?: SafetyLevel | null, isSpam?: boolean | null } | null } | null, tokenProjectMarket?: { __typename?: 'TokenProjectMarket', relativeChange24?: { __typename?: 'Amount', value: number } | null } | null } | null> | null } | null> | null };

export type MultiplePortfolioBalancesQueryVariables = Exact<{
  ownerAddresses: Array<Scalars['String']> | Scalars['String'];
  valueModifiers?: InputMaybe<Array<PortfolioValueModifier> | PortfolioValueModifier>;
}>;


export type MultiplePortfolioBalancesQuery = { __typename?: 'Query', portfolios?: Array<{ __typename?: 'Portfolio', id: string, tokensTotalDenominatedValue?: { __typename?: 'Amount', value: number } | null, tokensTotalDenominatedValueChange?: { __typename?: 'AmountChange', absolute?: { __typename?: 'Amount', value: number } | null, percentage?: { __typename?: 'Amount', value: number } | null } | null, tokenBalances?: Array<{ __typename?: 'TokenBalance', id: string, quantity?: number | null, isHidden?: boolean | null, denominatedValue?: { __typename?: 'Amount', currency?: Currency | null, value: number } | null, token?: { __typename?: 'Token', chain: Chain, address?: string | null, symbol?: string | null, decimals?: number | null, project?: { __typename?: 'TokenProject', id: string, name?: string | null, logoUrl?: string | null, safetyLevel?: SafetyLevel | null, isSpam?: boolean | null } | null } | null, tokenProjectMarket?: { __typename?: 'TokenProjectMarket', relativeChange24?: { __typename?: 'Amount', value: number } | null } | null } | null> | null } | null> | null };

export type SelectWalletScreenQueryVariables = Exact<{
  ownerAddresses: Array<Scalars['String']> | Scalars['String'];
}>;


export type SelectWalletScreenQuery = { __typename?: 'Query', portfolios?: Array<{ __typename?: 'Portfolio', id: string, ownerAddress: string, tokensTotalDenominatedValue?: { __typename?: 'Amount', value: number } | null } | null> | null };

export type TransactionHistoryUpdaterQueryVariables = Exact<{
  addresses: Array<Scalars['String']> | Scalars['String'];
}>;


export type TransactionHistoryUpdaterQuery = { __typename?: 'Query', portfolios?: Array<{ __typename?: 'Portfolio', id: string, ownerAddress: string, assetActivities?: Array<{ __typename?: 'AssetActivity', id: string, timestamp: number, details: { __typename?: 'SwapOrderDetails' } | { __typename?: 'TransactionDetails', id: string, hash: string } } | null> | null } | null> | null };

export type TokenQueryVariables = Exact<{
  chain: Chain;
  address?: InputMaybe<Scalars['String']>;
}>;


export type TokenQuery = { __typename?: 'Query', token?: { __typename?: 'Token', symbol?: string | null, decimals?: number | null, chain: Chain, address?: string | null, project?: { __typename?: 'TokenProject', id: string, name?: string | null, logoUrl?: string | null, safetyLevel?: SafetyLevel | null, isSpam?: boolean | null } | null } | null };

export type TokenDetailsScreenQueryVariables = Exact<{
  chain: Chain;
  address?: InputMaybe<Scalars['String']>;
  includeSpanish?: InputMaybe<Scalars['Boolean']>;
  includeFrench?: InputMaybe<Scalars['Boolean']>;
  includeJapanese?: InputMaybe<Scalars['Boolean']>;
  includePortuguese?: InputMaybe<Scalars['Boolean']>;
  includeChineseSimplified?: InputMaybe<Scalars['Boolean']>;
  includeChineseTraditional?: InputMaybe<Scalars['Boolean']>;
}>;


export type TokenDetailsScreenQuery = { __typename?: 'Query', token?: { __typename?: 'Token', address?: string | null, chain: Chain, symbol?: string | null, name?: string | null, market?: { __typename?: 'TokenMarket', id: string, volume?: { __typename?: 'Amount', value: number } | null, price?: { __typename?: 'Amount', value: number } | null, priceHigh52W?: { __typename?: 'Amount', value: number } | null, priceLow52W?: { __typename?: 'Amount', value: number } | null } | null, project?: { __typename?: 'TokenProject', id: string, name?: string | null, description?: string | null, homepageUrl?: string | null, twitterName?: string | null, safetyLevel?: SafetyLevel | null, logoUrl?: string | null, descriptionTranslations?: { __typename?: 'DescriptionTranslations', descriptionEsEs?: string | null, descriptionFrFr?: string | null, descriptionJaJp?: string | null, descriptionPtPt?: string | null, descriptionZhHans?: string | null, descriptionZhHant?: string | null } | null, markets?: Array<{ __typename?: 'TokenProjectMarket', id: string, price?: { __typename?: 'Amount', value: number } | null, marketCap?: { __typename?: 'Amount', value: number } | null, fullyDilutedValuation?: { __typename?: 'Amount', value: number } | null, priceHigh52W?: { __typename?: 'Amount', value: number } | null, priceLow52W?: { __typename?: 'Amount', value: number } | null } | null> | null, tokens: Array<{ __typename?: 'Token', chain: Chain, address?: string | null }> } | null } | null };

export type TokenProjectsQueryVariables = Exact<{
  contracts: Array<ContractInput> | ContractInput;
}>;


export type TokenProjectsQuery = { __typename?: 'Query', tokenProjects?: Array<{ __typename?: 'TokenProject', id: string, name?: string | null, logoUrl?: string | null, safetyLevel?: SafetyLevel | null, tokens: Array<{ __typename?: 'Token', chain: Chain, address?: string | null, decimals?: number | null, symbol?: string | null }> } | null> | null };

export type TransactionListQueryVariables = Exact<{
  address: Scalars['String'];
}>;


export type TransactionListQuery = { __typename?: 'Query', portfolios?: Array<{ __typename?: 'Portfolio', id: string, assetActivities?: Array<{ __typename?: 'AssetActivity', id: string, timestamp: number, chain: Chain, details: { __typename?: 'SwapOrderDetails' } | { __typename?: 'TransactionDetails', id: string, to: string, type: TransactionType, hash: string, from: string, status: TransactionStatus, assetChanges: Array<{ __typename: 'NftApproval' } | { __typename: 'NftApproveForAll' } | { __typename: 'NftTransfer', id: string, nftStandard: NftStandard, sender: string, recipient: string, direction: TransactionDirection, asset: { __typename?: 'NftAsset', id: string, name?: string | null, isSpam?: boolean | null, tokenId: string, nftContract?: { __typename?: 'NftContract', id: string, chain: Chain, address: string } | null, image?: { __typename?: 'Image', id: string, url: string } | null, collection?: { __typename?: 'NftCollection', id: string, name?: string | null } | null } } | { __typename: 'TokenApproval', id: string, tokenStandard: TokenStandard, approvedAddress: string, quantity: string, asset: { __typename?: 'Token', id: string, symbol?: string | null, decimals?: number | null, address?: string | null, chain: Chain } } | { __typename: 'TokenTransfer', id: string, tokenStandard: TokenStandard, quantity: string, sender: string, recipient: string, direction: TransactionDirection, asset: { __typename?: 'Token', id: string, symbol?: string | null, address?: string | null, decimals?: number | null, chain: Chain, project?: { __typename?: 'TokenProject', id: string, isSpam?: boolean | null, spamCode?: number | null } | null }, transactedValue?: { __typename?: 'Amount', id: string, currency?: Currency | null, value: number } | null } | null> } } | null> | null } | null> | null };

export type FeedTransactionListQueryVariables = Exact<{
  addresses: Array<Scalars['String']> | Scalars['String'];
}>;


export type FeedTransactionListQuery = { __typename?: 'Query', portfolios?: Array<{ __typename?: 'Portfolio', id: string, ownerAddress: string, assetActivities?: Array<{ __typename?: 'AssetActivity', id: string, timestamp: number, chain: Chain, details: { __typename?: 'SwapOrderDetails' } | { __typename?: 'TransactionDetails', id: string, to: string, type: TransactionType, hash: string, from: string, status: TransactionStatus, assetChanges: Array<{ __typename: 'NftApproval' } | { __typename: 'NftApproveForAll' } | { __typename: 'NftTransfer', id: string, nftStandard: NftStandard, sender: string, recipient: string, direction: TransactionDirection, asset: { __typename?: 'NftAsset', id: string, name?: string | null, isSpam?: boolean | null, tokenId: string, nftContract?: { __typename?: 'NftContract', id: string, chain: Chain, address: string } | null, image?: { __typename?: 'Image', id: string, url: string } | null, collection?: { __typename?: 'NftCollection', id: string, name?: string | null } | null } } | { __typename: 'TokenApproval', id: string, tokenStandard: TokenStandard, approvedAddress: string, quantity: string, asset: { __typename?: 'Token', id: string, symbol?: string | null, decimals?: number | null, address?: string | null, chain: Chain } } | { __typename: 'TokenTransfer', id: string, tokenStandard: TokenStandard, quantity: string, sender: string, recipient: string, direction: TransactionDirection, asset: { __typename?: 'Token', id: string, symbol?: string | null, address?: string | null, decimals?: number | null, chain: Chain, project?: { __typename?: 'TokenProject', id: string, isSpam?: boolean | null, spamCode?: number | null } | null }, transactedValue?: { __typename?: 'Amount', currency?: Currency | null, value: number } | null } | null> } } | null> | null } | null> | null };

export type TopTokensQueryVariables = Exact<{
  chain?: InputMaybe<Chain>;
  page?: InputMaybe<Scalars['Int']>;
  pageSize?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<TokenSortableField>;
}>;


export type TopTokensQuery = { __typename?: 'Query', topTokens?: Array<{ __typename?: 'Token', address?: string | null, chain: Chain, decimals?: number | null, symbol?: string | null, project?: { __typename?: 'TokenProject', id: string, name?: string | null, isSpam?: boolean | null, logoUrl?: string | null, safetyLevel?: SafetyLevel | null } | null } | null> | null };

export type SearchTokensQueryVariables = Exact<{
  searchQuery: Scalars['String'];
  chains?: InputMaybe<Array<Chain> | Chain>;
}>;


export type SearchTokensQuery = { __typename?: 'Query', searchTokens?: Array<{ __typename?: 'Token', id: string, chain: Chain, address?: string | null, decimals?: number | null, symbol?: string | null, project?: { __typename?: 'TokenProject', id: string, name?: string | null, logoUrl?: string | null, safetyLevel?: SafetyLevel | null } | null } | null> | null };

export type ExploreSearchQueryVariables = Exact<{
  searchQuery: Scalars['String'];
  nftCollectionsFilter: NftCollectionsFilterInput;
}>;


export type ExploreSearchQuery = { __typename?: 'Query', searchTokens?: Array<{ __typename?: 'Token', chain: Chain, address?: string | null, decimals?: number | null, symbol?: string | null, market?: { __typename?: 'TokenMarket', volume?: { __typename?: 'Amount', value: number } | null } | null, project?: { __typename?: 'TokenProject', id: string, name?: string | null, logoUrl?: string | null, safetyLevel?: SafetyLevel | null } | null } | null> | null, nftCollections?: { __typename?: 'NftCollectionConnection', edges: Array<{ __typename?: 'NftCollectionEdge', node: { __typename?: 'NftCollection', id: string, name?: string | null, collectionId: string, isVerified?: boolean | null, nftContracts?: Array<{ __typename?: 'NftContract', id: string, chain: Chain, address: string }> | null, image?: { __typename?: 'Image', id: string, url: string } | null } }> } | null };

export type TopTokenPartsFragment = { __typename?: 'Token', symbol?: string | null, chain: Chain, address?: string | null, market?: { __typename?: 'TokenMarket', id: string, totalValueLocked?: { __typename?: 'Amount', value: number } | null, volume?: { __typename?: 'Amount', value: number } | null } | null, project?: { __typename?: 'TokenProject', id: string, name?: string | null, logoUrl?: string | null, markets?: Array<{ __typename?: 'TokenProjectMarket', id: string, price?: { __typename?: 'Amount', value: number } | null, pricePercentChange24h?: { __typename?: 'Amount', value: number } | null, marketCap?: { __typename?: 'Amount', value: number } | null } | null> | null } | null };

export type ExploreTokensTabQueryVariables = Exact<{
  topTokensOrderBy: TokenSortableField;
}>;


export type ExploreTokensTabQuery = { __typename?: 'Query', topTokens?: Array<{ __typename?: 'Token', symbol?: string | null, chain: Chain, address?: string | null, market?: { __typename?: 'TokenMarket', id: string, totalValueLocked?: { __typename?: 'Amount', value: number } | null, volume?: { __typename?: 'Amount', value: number } | null } | null, project?: { __typename?: 'TokenProject', id: string, name?: string | null, logoUrl?: string | null, markets?: Array<{ __typename?: 'TokenProjectMarket', id: string, price?: { __typename?: 'Amount', value: number } | null, pricePercentChange24h?: { __typename?: 'Amount', value: number } | null, marketCap?: { __typename?: 'Amount', value: number } | null } | null> | null } | null } | null> | null, eth?: { __typename?: 'Token', symbol?: string | null, chain: Chain, address?: string | null, market?: { __typename?: 'TokenMarket', id: string, totalValueLocked?: { __typename?: 'Amount', value: number } | null, volume?: { __typename?: 'Amount', value: number } | null } | null, project?: { __typename?: 'TokenProject', id: string, name?: string | null, logoUrl?: string | null, markets?: Array<{ __typename?: 'TokenProjectMarket', id: string, price?: { __typename?: 'Amount', value: number } | null, pricePercentChange24h?: { __typename?: 'Amount', value: number } | null, marketCap?: { __typename?: 'Amount', value: number } | null } | null> | null } | null } | null };

export type FavoriteTokenCardQueryVariables = Exact<{
  chain: Chain;
  address?: InputMaybe<Scalars['String']>;
}>;


export type FavoriteTokenCardQuery = { __typename?: 'Query', token?: { __typename?: 'Token', symbol?: string | null, chain: Chain, address?: string | null, project?: { __typename?: 'TokenProject', id: string, name?: string | null, logoUrl?: string | null, markets?: Array<{ __typename?: 'TokenProjectMarket', id: string, price?: { __typename?: 'Amount', value: number } | null, pricePercentChange24h?: { __typename?: 'Amount', value: number } | null } | null> | null } | null } | null };

export type TokensQueryVariables = Exact<{
  contracts: Array<ContractInput> | ContractInput;
}>;


export type TokensQuery = { __typename?: 'Query', tokens?: Array<{ __typename?: 'Token', symbol?: string | null, chain: Chain, address?: string | null, project?: { __typename?: 'TokenProject', name?: string | null } | null } | null> | null };

export type ConvertQueryVariables = Exact<{
  fromCurrency: Currency;
  toCurrency: Currency;
}>;


export type ConvertQuery = { __typename?: 'Query', convert?: { __typename?: 'Amount', value: number, currency?: Currency | null } | null };

export type PortfolioBalanceQueryVariables = Exact<{
  owner: Scalars['String'];
  valueModifiers?: InputMaybe<Array<PortfolioValueModifier> | PortfolioValueModifier>;
}>;


export type PortfolioBalanceQuery = { __typename?: 'Query', portfolios?: Array<{ __typename?: 'Portfolio', id: string, tokensTotalDenominatedValue?: { __typename?: 'Amount', value: number } | null, tokensTotalDenominatedValueChange?: { __typename?: 'AmountChange', absolute?: { __typename?: 'Amount', value: number } | null, percentage?: { __typename?: 'Amount', value: number } | null } | null } | null> | null };

export type PortfolioTokenBalancesQueryVariables = Exact<{
  ownerAddress: Scalars['String'];
}>;


export type PortfolioTokenBalancesQuery = { __typename?: 'Query', portfolios?: Array<{ __typename?: 'Portfolio', id: string, tokenBalances?: Array<{ __typename?: 'TokenBalance', id: string, quantity?: number | null, denominatedValue?: { __typename?: 'Amount', currency?: Currency | null, value: number } | null, token?: { __typename?: 'Token', id: string, chain: Chain, address?: string | null, symbol?: string | null, decimals?: number | null, project?: { __typename?: 'TokenProject', id: string, name?: string | null, logoUrl?: string | null, safetyLevel?: SafetyLevel | null, isSpam?: boolean | null } | null } | null, tokenProjectMarket?: { __typename?: 'TokenProjectMarket', relativeChange24?: { __typename?: 'Amount', value: number } | null } | null } | null> | null } | null> | null };

export const TopTokenPartsFragmentDoc = gql`
    fragment TopTokenParts on Token {
  symbol
  chain
  address
  market {
    id
    totalValueLocked {
      value
    }
    volume(duration: DAY) {
      value
    }
  }
  project {
    id
    name
    logoUrl
    markets(currencies: [USD]) {
      id
      price {
        value
      }
      pricePercentChange24h {
        value
      }
      marketCap {
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
        value
      }
      pricePercentChange24h {
        value
      }
      priceHistory(duration: $duration) {
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
      market(currency: USD) {
        id
        price {
          value
        }
        pricePercentChange24h: pricePercentChange(duration: DAY) {
          value
        }
        priceHistory(duration: $duration) {
          timestamp
          value
        }
      }
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
    query AccountList($addresses: [String!]!, $valueModifiers: [PortfolioValueModifier!]) {
  portfolios(
    ownerAddresses: $addresses
    chains: [ETHEREUM, POLYGON, ARBITRUM, OPTIMISM, BASE, BNB]
    valueModifiers: $valueModifiers
  ) {
    id
    ownerAddress
    tokensTotalDenominatedValue {
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
 *      valueModifiers: // value for 'valueModifiers'
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
export const SearchPopularNftCollectionsDocument = gql`
    query SearchPopularNFTCollections {
  topCollections(chains: [ETHEREUM], orderBy: VOLUME, duration: DAY, first: 2) {
    edges {
      node {
        id
        name
        collectionId
        isVerified
        nftContracts {
          id
          chain
          address
        }
        image {
          id
          url
        }
      }
    }
  }
}
    `;

/**
 * __useSearchPopularNftCollectionsQuery__
 *
 * To run a query within a React component, call `useSearchPopularNftCollectionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchPopularNftCollectionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchPopularNftCollectionsQuery({
 *   variables: {
 *   },
 * });
 */
export function useSearchPopularNftCollectionsQuery(baseOptions?: Apollo.QueryHookOptions<SearchPopularNftCollectionsQuery, SearchPopularNftCollectionsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SearchPopularNftCollectionsQuery, SearchPopularNftCollectionsQueryVariables>(SearchPopularNftCollectionsDocument, options);
      }
export function useSearchPopularNftCollectionsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SearchPopularNftCollectionsQuery, SearchPopularNftCollectionsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SearchPopularNftCollectionsQuery, SearchPopularNftCollectionsQueryVariables>(SearchPopularNftCollectionsDocument, options);
        }
export type SearchPopularNftCollectionsQueryHookResult = ReturnType<typeof useSearchPopularNftCollectionsQuery>;
export type SearchPopularNftCollectionsLazyQueryHookResult = ReturnType<typeof useSearchPopularNftCollectionsLazyQuery>;
export type SearchPopularNftCollectionsQueryResult = Apollo.QueryResult<SearchPopularNftCollectionsQuery, SearchPopularNftCollectionsQueryVariables>;
export const SearchPopularTokensDocument = gql`
    query SearchPopularTokens {
  topTokens(chain: ETHEREUM, orderBy: VOLUME, page: 1, pageSize: 2) {
    id
    address
    chain
    symbol
    decimals
    project {
      id
      name
      logoUrl
      safetyLevel
    }
  }
  eth: tokens(contracts: [{address: null, chain: ETHEREUM}]) {
    id
    address
    chain
    symbol
    decimals
    project {
      id
      name
      logoUrl
      safetyLevel
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
    query NFTItemScreen($contractAddress: String!, $filter: NftAssetsFilterInput, $activityFilter: NftActivityFilterInput) {
  nftAssets(address: $contractAddress, filter: $filter) {
    edges {
      node {
        id
        ownerAddress
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
              value
            }
            owners
            totalVolume {
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
          dimensions {
            width
            height
          }
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
        traits {
          id
          name
          rarity
          value
        }
        listings(first: 1) {
          edges {
            node {
              id
              price {
                currency
                value
              }
            }
          }
        }
      }
    }
  }
  nftActivity(filter: $activityFilter) {
    edges {
      node {
        id
        quantity
        price {
          currency
          value
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
 *      activityFilter: // value for 'activityFilter'
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
export const NftCollectionScreenDocument = gql`
    query NftCollectionScreen($contractAddress: String!, $first: Int, $after: String) {
  nftCollections(filter: {addresses: [$contractAddress]}) {
    edges {
      node {
        id
        bannerImage {
          id
          url
        }
        isVerified
        numAssets
        description
        homepageUrl
        twitterName
        image {
          id
          url
        }
        name
        markets(currencies: [USD]) {
          id
          floorPrice {
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
    }
  }
  nftAssets(
    address: $contractAddress
    first: $first
    after: $after
    orderBy: PRICE
    asc: true
  ) {
    edges {
      node {
        ownerAddress
        id
        name
        tokenId
        nftContract {
          id
          address
        }
        collection {
          id
          collectionId
          name
        }
        image {
          id
          url
          dimensions {
            width
            height
          }
        }
        listings(first: 1) {
          edges {
            node {
              id
              price {
                currency
                value
              }
            }
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
 * __useNftCollectionScreenQuery__
 *
 * To run a query within a React component, call `useNftCollectionScreenQuery` and pass it any options that fit your needs.
 * When your component renders, `useNftCollectionScreenQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useNftCollectionScreenQuery({
 *   variables: {
 *      contractAddress: // value for 'contractAddress'
 *      first: // value for 'first'
 *      after: // value for 'after'
 *   },
 * });
 */
export function useNftCollectionScreenQuery(baseOptions: Apollo.QueryHookOptions<NftCollectionScreenQuery, NftCollectionScreenQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<NftCollectionScreenQuery, NftCollectionScreenQueryVariables>(NftCollectionScreenDocument, options);
      }
export function useNftCollectionScreenLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<NftCollectionScreenQuery, NftCollectionScreenQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<NftCollectionScreenQuery, NftCollectionScreenQueryVariables>(NftCollectionScreenDocument, options);
        }
export type NftCollectionScreenQueryHookResult = ReturnType<typeof useNftCollectionScreenQuery>;
export type NftCollectionScreenLazyQueryHookResult = ReturnType<typeof useNftCollectionScreenLazyQuery>;
export type NftCollectionScreenQueryResult = Apollo.QueryResult<NftCollectionScreenQuery, NftCollectionScreenQueryVariables>;
export const NftsTabDocument = gql`
    query NftsTab($ownerAddress: String!, $first: Int, $after: String, $filter: NftBalancesFilterInput) {
  nftBalances(
    ownerAddress: $ownerAddress
    first: $first
    after: $after
    filter: $filter
  ) {
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
            dimensions {
              width
              height
            }
          }
          name
          tokenId
          description
          nftContract {
            id
            address
          }
          isSpam
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
 *      filter: // value for 'filter'
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
    query PortfolioBalances($ownerAddress: String!, $valueModifiers: [PortfolioValueModifier!]) {
  portfolios(
    ownerAddresses: [$ownerAddress]
    chains: [ETHEREUM, POLYGON, ARBITRUM, OPTIMISM, BASE, BNB]
    valueModifiers: $valueModifiers
  ) {
    id
    tokensTotalDenominatedValue {
      value
    }
    tokensTotalDenominatedValueChange(duration: DAY) {
      absolute {
        value
      }
      percentage {
        value
      }
    }
    tokenBalances {
      id
      quantity
      isHidden
      denominatedValue {
        currency
        value
      }
      token {
        chain
        address
        symbol
        decimals
        project {
          id
          name
          logoUrl
          safetyLevel
          isSpam
        }
      }
      tokenProjectMarket {
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
 *      valueModifiers: // value for 'valueModifiers'
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
export const MultiplePortfolioBalancesDocument = gql`
    query MultiplePortfolioBalances($ownerAddresses: [String!]!, $valueModifiers: [PortfolioValueModifier!]) {
  portfolios(
    ownerAddresses: $ownerAddresses
    chains: [ETHEREUM, POLYGON, ARBITRUM, OPTIMISM, BASE, BNB]
    valueModifiers: $valueModifiers
  ) {
    id
    tokensTotalDenominatedValue {
      value
    }
    tokensTotalDenominatedValueChange(duration: DAY) {
      absolute {
        value
      }
      percentage {
        value
      }
    }
    tokenBalances {
      id
      quantity
      isHidden
      denominatedValue {
        currency
        value
      }
      token {
        chain
        address
        symbol
        decimals
        project {
          id
          name
          logoUrl
          safetyLevel
          isSpam
        }
      }
      tokenProjectMarket {
        relativeChange24: pricePercentChange(duration: DAY) {
          value
        }
      }
    }
  }
}
    `;

/**
 * __useMultiplePortfolioBalancesQuery__
 *
 * To run a query within a React component, call `useMultiplePortfolioBalancesQuery` and pass it any options that fit your needs.
 * When your component renders, `useMultiplePortfolioBalancesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMultiplePortfolioBalancesQuery({
 *   variables: {
 *      ownerAddresses: // value for 'ownerAddresses'
 *      valueModifiers: // value for 'valueModifiers'
 *   },
 * });
 */
export function useMultiplePortfolioBalancesQuery(baseOptions: Apollo.QueryHookOptions<MultiplePortfolioBalancesQuery, MultiplePortfolioBalancesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MultiplePortfolioBalancesQuery, MultiplePortfolioBalancesQueryVariables>(MultiplePortfolioBalancesDocument, options);
      }
export function useMultiplePortfolioBalancesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MultiplePortfolioBalancesQuery, MultiplePortfolioBalancesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MultiplePortfolioBalancesQuery, MultiplePortfolioBalancesQueryVariables>(MultiplePortfolioBalancesDocument, options);
        }
export type MultiplePortfolioBalancesQueryHookResult = ReturnType<typeof useMultiplePortfolioBalancesQuery>;
export type MultiplePortfolioBalancesLazyQueryHookResult = ReturnType<typeof useMultiplePortfolioBalancesLazyQuery>;
export type MultiplePortfolioBalancesQueryResult = Apollo.QueryResult<MultiplePortfolioBalancesQuery, MultiplePortfolioBalancesQueryVariables>;
export const SelectWalletScreenDocument = gql`
    query SelectWalletScreen($ownerAddresses: [String!]!) {
  portfolios(
    ownerAddresses: $ownerAddresses
    chains: [ETHEREUM, POLYGON, ARBITRUM, OPTIMISM, BASE, BNB]
  ) {
    id
    ownerAddress
    tokensTotalDenominatedValue {
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
  portfolios(
    ownerAddresses: $addresses
    chains: [ETHEREUM, POLYGON, ARBITRUM, OPTIMISM, BASE, BNB]
  ) {
    id
    ownerAddress
    assetActivities(pageSize: 1, page: 1) {
      id
      timestamp
      details {
        ... on TransactionDetails {
          id
          hash
        }
      }
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
    symbol
    decimals
    chain
    address
    project {
      id
      name
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
    query TokenDetailsScreen($chain: Chain!, $address: String, $includeSpanish: Boolean = false, $includeFrench: Boolean = false, $includeJapanese: Boolean = false, $includePortuguese: Boolean = false, $includeChineseSimplified: Boolean = false, $includeChineseTraditional: Boolean = false) {
  token(chain: $chain, address: $address) {
    address
    chain
    symbol
    name
    market(currency: USD) {
      id
      volume(duration: DAY) {
        value
      }
      price {
        value
      }
      priceHigh52W: priceHighLow(duration: YEAR, highLow: HIGH) {
        value
      }
      priceLow52W: priceHighLow(duration: YEAR, highLow: LOW) {
        value
      }
    }
    project {
      id
      name
      description
      descriptionTranslations {
        descriptionEsEs @include(if: $includeSpanish)
        descriptionFrFr @include(if: $includeFrench)
        descriptionJaJp @include(if: $includeJapanese)
        descriptionPtPt @include(if: $includePortuguese)
        descriptionZhHans @include(if: $includeChineseSimplified)
        descriptionZhHant @include(if: $includeChineseTraditional)
      }
      homepageUrl
      twitterName
      safetyLevel
      logoUrl
      markets(currencies: [USD]) {
        id
        price {
          value
        }
        marketCap {
          value
        }
        fullyDilutedValuation {
          value
        }
        priceHigh52W: priceHighLow(duration: YEAR, highLow: HIGH) {
          value
        }
        priceLow52W: priceHighLow(duration: YEAR, highLow: LOW) {
          value
        }
      }
      tokens {
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
 *      includeSpanish: // value for 'includeSpanish'
 *      includeFrench: // value for 'includeFrench'
 *      includeJapanese: // value for 'includeJapanese'
 *      includePortuguese: // value for 'includePortuguese'
 *      includeChineseSimplified: // value for 'includeChineseSimplified'
 *      includeChineseTraditional: // value for 'includeChineseTraditional'
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
    name
    logoUrl
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
  portfolios(
    ownerAddresses: [$address]
    chains: [ETHEREUM, POLYGON, ARBITRUM, OPTIMISM, BASE, BNB]
  ) {
    id
    assetActivities(
      pageSize: 100
      page: 1
      chains: [ETHEREUM, POLYGON, ARBITRUM, OPTIMISM, BASE, BNB]
    ) {
      id
      timestamp
      chain
      details {
        ... on TransactionDetails {
          id
          to
          type
          hash
          from
          status
          assetChanges {
            __typename
            ... on TokenTransfer {
              id
              asset {
                id
                symbol
                address
                decimals
                chain
                project {
                  id
                  isSpam
                  spamCode
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
                isSpam
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
export const FeedTransactionListDocument = gql`
    query FeedTransactionList($addresses: [String!]!) {
  portfolios(
    ownerAddresses: $addresses
    chains: [ETHEREUM, POLYGON, ARBITRUM, OPTIMISM, BASE, BNB]
  ) {
    id
    ownerAddress
    assetActivities(
      pageSize: 30
      page: 1
      chains: [ETHEREUM, POLYGON, ARBITRUM, OPTIMISM, BASE, BNB]
    ) {
      id
      timestamp
      chain
      details {
        ... on TransactionDetails {
          id
          to
          type
          hash
          from
          status
          assetChanges {
            __typename
            ... on TokenTransfer {
              id
              asset {
                id
                symbol
                address
                decimals
                chain
                project {
                  id
                  isSpam
                  spamCode
                }
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
              id
              asset {
                id
                name
                isSpam
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
  }
}
    `;

/**
 * __useFeedTransactionListQuery__
 *
 * To run a query within a React component, call `useFeedTransactionListQuery` and pass it any options that fit your needs.
 * When your component renders, `useFeedTransactionListQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFeedTransactionListQuery({
 *   variables: {
 *      addresses: // value for 'addresses'
 *   },
 * });
 */
export function useFeedTransactionListQuery(baseOptions: Apollo.QueryHookOptions<FeedTransactionListQuery, FeedTransactionListQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<FeedTransactionListQuery, FeedTransactionListQueryVariables>(FeedTransactionListDocument, options);
      }
export function useFeedTransactionListLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<FeedTransactionListQuery, FeedTransactionListQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<FeedTransactionListQuery, FeedTransactionListQueryVariables>(FeedTransactionListDocument, options);
        }
export type FeedTransactionListQueryHookResult = ReturnType<typeof useFeedTransactionListQuery>;
export type FeedTransactionListLazyQueryHookResult = ReturnType<typeof useFeedTransactionListLazyQuery>;
export type FeedTransactionListQueryResult = Apollo.QueryResult<FeedTransactionListQuery, FeedTransactionListQueryVariables>;
export const TopTokensDocument = gql`
    query TopTokens($chain: Chain, $page: Int = 1, $pageSize: Int = 100, $orderBy: TokenSortableField = POPULARITY) {
  topTokens(chain: $chain, page: $page, pageSize: $pageSize, orderBy: $orderBy) {
    address
    chain
    decimals
    symbol
    project {
      id
      name
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
    query SearchTokens($searchQuery: String!, $chains: [Chain!]) {
  searchTokens(searchQuery: $searchQuery, chains: $chains) {
    id
    chain
    address
    decimals
    symbol
    project {
      id
      name
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
 *      chains: // value for 'chains'
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
export const ExploreSearchDocument = gql`
    query ExploreSearch($searchQuery: String!, $nftCollectionsFilter: NftCollectionsFilterInput!) {
  searchTokens(searchQuery: $searchQuery) {
    chain
    address
    decimals
    symbol
    market {
      volume(duration: DAY) {
        value
      }
    }
    project {
      id
      name
      logoUrl
      safetyLevel
    }
  }
  nftCollections(filter: $nftCollectionsFilter, first: 4) {
    edges {
      node {
        id
        name
        collectionId
        isVerified
        nftContracts {
          id
          chain
          address
        }
        image {
          id
          url
        }
      }
    }
  }
}
    `;

/**
 * __useExploreSearchQuery__
 *
 * To run a query within a React component, call `useExploreSearchQuery` and pass it any options that fit your needs.
 * When your component renders, `useExploreSearchQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useExploreSearchQuery({
 *   variables: {
 *      searchQuery: // value for 'searchQuery'
 *      nftCollectionsFilter: // value for 'nftCollectionsFilter'
 *   },
 * });
 */
export function useExploreSearchQuery(baseOptions: Apollo.QueryHookOptions<ExploreSearchQuery, ExploreSearchQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ExploreSearchQuery, ExploreSearchQueryVariables>(ExploreSearchDocument, options);
      }
export function useExploreSearchLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ExploreSearchQuery, ExploreSearchQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ExploreSearchQuery, ExploreSearchQueryVariables>(ExploreSearchDocument, options);
        }
export type ExploreSearchQueryHookResult = ReturnType<typeof useExploreSearchQuery>;
export type ExploreSearchLazyQueryHookResult = ReturnType<typeof useExploreSearchLazyQuery>;
export type ExploreSearchQueryResult = Apollo.QueryResult<ExploreSearchQuery, ExploreSearchQueryVariables>;
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
    symbol
    chain
    address
    project {
      id
      name
      logoUrl
      markets(currencies: [USD]) {
        id
        price {
          value
        }
        pricePercentChange24h {
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
export const TokensDocument = gql`
    query Tokens($contracts: [ContractInput!]!) {
  tokens(contracts: $contracts) {
    symbol
    chain
    address
    project {
      name
    }
  }
}
    `;

/**
 * __useTokensQuery__
 *
 * To run a query within a React component, call `useTokensQuery` and pass it any options that fit your needs.
 * When your component renders, `useTokensQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTokensQuery({
 *   variables: {
 *      contracts: // value for 'contracts'
 *   },
 * });
 */
export function useTokensQuery(baseOptions: Apollo.QueryHookOptions<TokensQuery, TokensQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<TokensQuery, TokensQueryVariables>(TokensDocument, options);
      }
export function useTokensLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<TokensQuery, TokensQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<TokensQuery, TokensQueryVariables>(TokensDocument, options);
        }
export type TokensQueryHookResult = ReturnType<typeof useTokensQuery>;
export type TokensLazyQueryHookResult = ReturnType<typeof useTokensLazyQuery>;
export type TokensQueryResult = Apollo.QueryResult<TokensQuery, TokensQueryVariables>;
export const ConvertDocument = gql`
    query Convert($fromCurrency: Currency!, $toCurrency: Currency!) {
  convert(
    fromAmount: {currency: $fromCurrency, value: 1.0}
    toCurrency: $toCurrency
  ) {
    value
    currency
  }
}
    `;

/**
 * __useConvertQuery__
 *
 * To run a query within a React component, call `useConvertQuery` and pass it any options that fit your needs.
 * When your component renders, `useConvertQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useConvertQuery({
 *   variables: {
 *      fromCurrency: // value for 'fromCurrency'
 *      toCurrency: // value for 'toCurrency'
 *   },
 * });
 */
export function useConvertQuery(baseOptions: Apollo.QueryHookOptions<ConvertQuery, ConvertQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ConvertQuery, ConvertQueryVariables>(ConvertDocument, options);
      }
export function useConvertLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ConvertQuery, ConvertQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ConvertQuery, ConvertQueryVariables>(ConvertDocument, options);
        }
export type ConvertQueryHookResult = ReturnType<typeof useConvertQuery>;
export type ConvertLazyQueryHookResult = ReturnType<typeof useConvertLazyQuery>;
export type ConvertQueryResult = Apollo.QueryResult<ConvertQuery, ConvertQueryVariables>;
export const PortfolioBalanceDocument = gql`
    query PortfolioBalance($owner: String!, $valueModifiers: [PortfolioValueModifier!]) {
  portfolios(
    ownerAddresses: [$owner]
    chains: [ETHEREUM, POLYGON, ARBITRUM, OPTIMISM, BASE, BNB]
    valueModifiers: $valueModifiers
  ) {
    id
    tokensTotalDenominatedValue {
      value
    }
    tokensTotalDenominatedValueChange(duration: DAY) {
      absolute {
        value
      }
      percentage {
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
 *      valueModifiers: // value for 'valueModifiers'
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
export const PortfolioTokenBalancesDocument = gql`
    query PortfolioTokenBalances($ownerAddress: String!) {
  portfolios(
    ownerAddresses: [$ownerAddress]
    chains: [ETHEREUM, POLYGON, ARBITRUM, OPTIMISM, BASE, BNB]
  ) {
    id
    tokenBalances {
      id
      quantity
      denominatedValue {
        currency
        value
      }
      token {
        id
        chain
        address
        symbol
        decimals
        project {
          id
          name
          logoUrl
          safetyLevel
          isSpam
        }
      }
      tokenProjectMarket {
        relativeChange24: pricePercentChange(duration: DAY) {
          value
        }
      }
    }
  }
}
    `;

/**
 * __usePortfolioTokenBalancesQuery__
 *
 * To run a query within a React component, call `usePortfolioTokenBalancesQuery` and pass it any options that fit your needs.
 * When your component renders, `usePortfolioTokenBalancesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePortfolioTokenBalancesQuery({
 *   variables: {
 *      ownerAddress: // value for 'ownerAddress'
 *   },
 * });
 */
export function usePortfolioTokenBalancesQuery(baseOptions: Apollo.QueryHookOptions<PortfolioTokenBalancesQuery, PortfolioTokenBalancesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<PortfolioTokenBalancesQuery, PortfolioTokenBalancesQueryVariables>(PortfolioTokenBalancesDocument, options);
      }
export function usePortfolioTokenBalancesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<PortfolioTokenBalancesQuery, PortfolioTokenBalancesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<PortfolioTokenBalancesQuery, PortfolioTokenBalancesQueryVariables>(PortfolioTokenBalancesDocument, options);
        }
export type PortfolioTokenBalancesQueryHookResult = ReturnType<typeof usePortfolioTokenBalancesQuery>;
export type PortfolioTokenBalancesLazyQueryHookResult = ReturnType<typeof usePortfolioTokenBalancesLazyQuery>;
export type PortfolioTokenBalancesQueryResult = Apollo.QueryResult<PortfolioTokenBalancesQuery, PortfolioTokenBalancesQueryVariables>;


export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping of union types */
export type ResolversUnionTypes = {
  ActivityDetails: ( SwapOrderDetails ) | ( Omit<TransactionDetails, 'assetChanges'> & { assetChanges: Array<Maybe<ResolversTypes['AssetChange']>> } );
  AssetChange: ( NftApproval ) | ( NftApproveForAll ) | ( NftTransfer ) | ( TokenApproval ) | ( TokenTransfer );
};

/** Mapping of union parent types */
export type ResolversUnionParentTypes = {
  ActivityDetails: ( SwapOrderDetails ) | ( Omit<TransactionDetails, 'assetChanges'> & { assetChanges: Array<Maybe<ResolversParentTypes['AssetChange']>> } );
  AssetChange: ( NftApproval ) | ( NftApproveForAll ) | ( NftTransfer ) | ( TokenApproval ) | ( TokenTransfer );
};

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  AWSJSON: ResolverTypeWrapper<Scalars['AWSJSON']>;
  ActivityDetails: ResolverTypeWrapper<ResolversUnionTypes['ActivityDetails']>;
  ActivityDetailsInput: ActivityDetailsInput;
  ActivityType: ActivityType;
  Amount: ResolverTypeWrapper<Amount>;
  AmountChange: ResolverTypeWrapper<AmountChange>;
  AmountInput: AmountInput;
  ApplicationContract: ResolverTypeWrapper<ApplicationContract>;
  ApplicationContractInput: ApplicationContractInput;
  AssetActivity: ResolverTypeWrapper<Omit<AssetActivity, 'assetChanges' | 'details'> & { assetChanges: Array<Maybe<ResolversTypes['AssetChange']>>, details: ResolversTypes['ActivityDetails'] }>;
  AssetActivityInput: AssetActivityInput;
  AssetActivitySwitch: AssetActivitySwitch;
  AssetChange: ResolverTypeWrapper<ResolversUnionTypes['AssetChange']>;
  AssetChangeInput: AssetChangeInput;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  Chain: Chain;
  CollectionSortableField: CollectionSortableField;
  ContractInput: ContractInput;
  Currency: Currency;
  CurrencyAmountInput: CurrencyAmountInput;
  DescriptionTranslations: ResolverTypeWrapper<DescriptionTranslations>;
  Dimensions: ResolverTypeWrapper<Dimensions>;
  DimensionsInput: DimensionsInput;
  Float: ResolverTypeWrapper<Scalars['Float']>;
  HighLow: HighLow;
  HistoryDuration: HistoryDuration;
  IAmount: ResolversTypes['Amount'] | ResolversTypes['TimestampedAmount'];
  IContract: ResolversTypes['ApplicationContract'] | ResolversTypes['NftContract'] | ResolversTypes['Token'];
  ID: ResolverTypeWrapper<Scalars['ID']>;
  Image: ResolverTypeWrapper<Image>;
  ImageInput: ImageInput;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  MediaType: MediaType;
  Mutation: ResolverTypeWrapper<{}>;
  NftActivity: ResolverTypeWrapper<NftActivity>;
  NftActivityConnection: ResolverTypeWrapper<NftActivityConnection>;
  NftActivityEdge: ResolverTypeWrapper<NftActivityEdge>;
  NftActivityFilterInput: NftActivityFilterInput;
  NftActivityType: NftActivityType;
  NftApproval: ResolverTypeWrapper<NftApproval>;
  NftApprovalInput: NftApprovalInput;
  NftApproveForAll: ResolverTypeWrapper<NftApproveForAll>;
  NftApproveForAllInput: NftApproveForAllInput;
  NftAsset: ResolverTypeWrapper<NftAsset>;
  NftAssetConnection: ResolverTypeWrapper<NftAssetConnection>;
  NftAssetEdge: ResolverTypeWrapper<NftAssetEdge>;
  NftAssetInput: NftAssetInput;
  NftAssetRarity: ResolverTypeWrapper<NftAssetRarity>;
  NftAssetSortableField: NftAssetSortableField;
  NftAssetTrait: ResolverTypeWrapper<NftAssetTrait>;
  NftAssetTraitInput: NftAssetTraitInput;
  NftAssetsFilterInput: NftAssetsFilterInput;
  NftBalance: ResolverTypeWrapper<NftBalance>;
  NftBalanceAssetInput: NftBalanceAssetInput;
  NftBalanceConnection: ResolverTypeWrapper<NftBalanceConnection>;
  NftBalanceEdge: ResolverTypeWrapper<NftBalanceEdge>;
  NftBalancesFilterInput: NftBalancesFilterInput;
  NftCollection: ResolverTypeWrapper<NftCollection>;
  NftCollectionBalance: ResolverTypeWrapper<NftCollectionBalance>;
  NftCollectionBalanceConnection: ResolverTypeWrapper<NftCollectionBalanceConnection>;
  NftCollectionBalanceEdge: ResolverTypeWrapper<NftCollectionBalanceEdge>;
  NftCollectionConnection: ResolverTypeWrapper<NftCollectionConnection>;
  NftCollectionEdge: ResolverTypeWrapper<NftCollectionEdge>;
  NftCollectionInput: NftCollectionInput;
  NftCollectionMarket: ResolverTypeWrapper<NftCollectionMarket>;
  NftCollectionMarketplace: ResolverTypeWrapper<NftCollectionMarketplace>;
  NftCollectionTrait: ResolverTypeWrapper<NftCollectionTrait>;
  NftCollectionTraitStats: ResolverTypeWrapper<NftCollectionTraitStats>;
  NftCollectionsFilterInput: NftCollectionsFilterInput;
  NftContract: ResolverTypeWrapper<NftContract>;
  NftContractInput: NftContractInput;
  NftFee: ResolverTypeWrapper<NftFee>;
  NftMarketplace: NftMarketplace;
  NftOrder: ResolverTypeWrapper<NftOrder>;
  NftOrderConnection: ResolverTypeWrapper<NftOrderConnection>;
  NftOrderEdge: ResolverTypeWrapper<NftOrderEdge>;
  NftProfile: ResolverTypeWrapper<NftProfile>;
  NftRarityProvider: NftRarityProvider;
  NftRouteResponse: ResolverTypeWrapper<NftRouteResponse>;
  NftStandard: NftStandard;
  NftTrade: ResolverTypeWrapper<NftTrade>;
  NftTradeInput: NftTradeInput;
  NftTransfer: ResolverTypeWrapper<NftTransfer>;
  NftTransferInput: NftTransferInput;
  OrderStatus: OrderStatus;
  OrderType: OrderType;
  PageInfo: ResolverTypeWrapper<PageInfo>;
  PairInput: PairInput;
  PermitDetailsInput: PermitDetailsInput;
  PermitInput: PermitInput;
  PoolInput: PoolInput;
  Portfolio: ResolverTypeWrapper<Portfolio>;
  PortfolioValueModifier: PortfolioValueModifier;
  PriceSource: PriceSource;
  ProtocolVersion: ProtocolVersion;
  PushNotification: ResolverTypeWrapper<PushNotification>;
  Query: ResolverTypeWrapper<{}>;
  SafetyLevel: SafetyLevel;
  Status: ResolverTypeWrapper<Status>;
  String: ResolverTypeWrapper<Scalars['String']>;
  Subscription: ResolverTypeWrapper<{}>;
  SubscriptionType: SubscriptionType;
  SwapOrderDetails: ResolverTypeWrapper<SwapOrderDetails>;
  SwapOrderStatus: SwapOrderStatus;
  TimestampedAmount: ResolverTypeWrapper<TimestampedAmount>;
  Token: ResolverTypeWrapper<Token>;
  TokenAmount: ResolverTypeWrapper<TokenAmount>;
  TokenAmountInput: TokenAmountInput;
  TokenApproval: ResolverTypeWrapper<TokenApproval>;
  TokenApprovalInput: TokenApprovalInput;
  TokenAssetInput: TokenAssetInput;
  TokenBalance: ResolverTypeWrapper<TokenBalance>;
  TokenInput: TokenInput;
  TokenMarket: ResolverTypeWrapper<TokenMarket>;
  TokenProject: ResolverTypeWrapper<TokenProject>;
  TokenProjectMarket: ResolverTypeWrapper<TokenProjectMarket>;
  TokenSortableField: TokenSortableField;
  TokenStandard: TokenStandard;
  TokenTradeInput: TokenTradeInput;
  TokenTradeRouteInput: TokenTradeRouteInput;
  TokenTradeRoutesInput: TokenTradeRoutesInput;
  TokenTradeType: TokenTradeType;
  TokenTransfer: ResolverTypeWrapper<TokenTransfer>;
  TokenTransferInput: TokenTransferInput;
  TradePoolInput: TradePoolInput;
  Transaction: ResolverTypeWrapper<Transaction>;
  TransactionDetails: ResolverTypeWrapper<Omit<TransactionDetails, 'assetChanges'> & { assetChanges: Array<Maybe<ResolversTypes['AssetChange']>> }>;
  TransactionDetailsInput: TransactionDetailsInput;
  TransactionDirection: TransactionDirection;
  TransactionNotification: ResolverTypeWrapper<TransactionNotification>;
  TransactionStatus: TransactionStatus;
  TransactionType: TransactionType;
  V2Pair: ResolverTypeWrapper<V2Pair>;
  V3Pool: ResolverTypeWrapper<V3Pool>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  AWSJSON: Scalars['AWSJSON'];
  ActivityDetails: ResolversUnionParentTypes['ActivityDetails'];
  ActivityDetailsInput: ActivityDetailsInput;
  Amount: Amount;
  AmountChange: AmountChange;
  AmountInput: AmountInput;
  ApplicationContract: ApplicationContract;
  ApplicationContractInput: ApplicationContractInput;
  AssetActivity: Omit<AssetActivity, 'assetChanges' | 'details'> & { assetChanges: Array<Maybe<ResolversParentTypes['AssetChange']>>, details: ResolversParentTypes['ActivityDetails'] };
  AssetActivityInput: AssetActivityInput;
  AssetChange: ResolversUnionParentTypes['AssetChange'];
  AssetChangeInput: AssetChangeInput;
  Boolean: Scalars['Boolean'];
  ContractInput: ContractInput;
  CurrencyAmountInput: CurrencyAmountInput;
  DescriptionTranslations: DescriptionTranslations;
  Dimensions: Dimensions;
  DimensionsInput: DimensionsInput;
  Float: Scalars['Float'];
  IAmount: ResolversParentTypes['Amount'] | ResolversParentTypes['TimestampedAmount'];
  IContract: ResolversParentTypes['ApplicationContract'] | ResolversParentTypes['NftContract'] | ResolversParentTypes['Token'];
  ID: Scalars['ID'];
  Image: Image;
  ImageInput: ImageInput;
  Int: Scalars['Int'];
  Mutation: {};
  NftActivity: NftActivity;
  NftActivityConnection: NftActivityConnection;
  NftActivityEdge: NftActivityEdge;
  NftActivityFilterInput: NftActivityFilterInput;
  NftApproval: NftApproval;
  NftApprovalInput: NftApprovalInput;
  NftApproveForAll: NftApproveForAll;
  NftApproveForAllInput: NftApproveForAllInput;
  NftAsset: NftAsset;
  NftAssetConnection: NftAssetConnection;
  NftAssetEdge: NftAssetEdge;
  NftAssetInput: NftAssetInput;
  NftAssetRarity: NftAssetRarity;
  NftAssetTrait: NftAssetTrait;
  NftAssetTraitInput: NftAssetTraitInput;
  NftAssetsFilterInput: NftAssetsFilterInput;
  NftBalance: NftBalance;
  NftBalanceAssetInput: NftBalanceAssetInput;
  NftBalanceConnection: NftBalanceConnection;
  NftBalanceEdge: NftBalanceEdge;
  NftBalancesFilterInput: NftBalancesFilterInput;
  NftCollection: NftCollection;
  NftCollectionBalance: NftCollectionBalance;
  NftCollectionBalanceConnection: NftCollectionBalanceConnection;
  NftCollectionBalanceEdge: NftCollectionBalanceEdge;
  NftCollectionConnection: NftCollectionConnection;
  NftCollectionEdge: NftCollectionEdge;
  NftCollectionInput: NftCollectionInput;
  NftCollectionMarket: NftCollectionMarket;
  NftCollectionMarketplace: NftCollectionMarketplace;
  NftCollectionTrait: NftCollectionTrait;
  NftCollectionTraitStats: NftCollectionTraitStats;
  NftCollectionsFilterInput: NftCollectionsFilterInput;
  NftContract: NftContract;
  NftContractInput: NftContractInput;
  NftFee: NftFee;
  NftOrder: NftOrder;
  NftOrderConnection: NftOrderConnection;
  NftOrderEdge: NftOrderEdge;
  NftProfile: NftProfile;
  NftRouteResponse: NftRouteResponse;
  NftTrade: NftTrade;
  NftTradeInput: NftTradeInput;
  NftTransfer: NftTransfer;
  NftTransferInput: NftTransferInput;
  PageInfo: PageInfo;
  PairInput: PairInput;
  PermitDetailsInput: PermitDetailsInput;
  PermitInput: PermitInput;
  PoolInput: PoolInput;
  Portfolio: Portfolio;
  PortfolioValueModifier: PortfolioValueModifier;
  PushNotification: PushNotification;
  Query: {};
  Status: Status;
  String: Scalars['String'];
  Subscription: {};
  SwapOrderDetails: SwapOrderDetails;
  TimestampedAmount: TimestampedAmount;
  Token: Token;
  TokenAmount: TokenAmount;
  TokenAmountInput: TokenAmountInput;
  TokenApproval: TokenApproval;
  TokenApprovalInput: TokenApprovalInput;
  TokenAssetInput: TokenAssetInput;
  TokenBalance: TokenBalance;
  TokenInput: TokenInput;
  TokenMarket: TokenMarket;
  TokenProject: TokenProject;
  TokenProjectMarket: TokenProjectMarket;
  TokenTradeInput: TokenTradeInput;
  TokenTradeRouteInput: TokenTradeRouteInput;
  TokenTradeRoutesInput: TokenTradeRoutesInput;
  TokenTransfer: TokenTransfer;
  TokenTransferInput: TokenTransferInput;
  TradePoolInput: TradePoolInput;
  Transaction: Transaction;
  TransactionDetails: Omit<TransactionDetails, 'assetChanges'> & { assetChanges: Array<Maybe<ResolversParentTypes['AssetChange']>> };
  TransactionDetailsInput: TransactionDetailsInput;
  TransactionNotification: TransactionNotification;
  V2Pair: V2Pair;
  V3Pool: V3Pool;
};

export type Aws_Api_KeyDirectiveArgs = { };

export type Aws_Api_KeyDirectiveResolver<Result, Parent, ContextType = any, Args = Aws_Api_KeyDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type Aws_AuthDirectiveArgs = {
  cognito_groups?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type Aws_AuthDirectiveResolver<Result, Parent, ContextType = any, Args = Aws_AuthDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type Aws_Cognito_User_PoolsDirectiveArgs = {
  cognito_groups?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type Aws_Cognito_User_PoolsDirectiveResolver<Result, Parent, ContextType = any, Args = Aws_Cognito_User_PoolsDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type Aws_IamDirectiveArgs = { };

export type Aws_IamDirectiveResolver<Result, Parent, ContextType = any, Args = Aws_IamDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type Aws_LambdaDirectiveArgs = { };

export type Aws_LambdaDirectiveResolver<Result, Parent, ContextType = any, Args = Aws_LambdaDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type Aws_OidcDirectiveArgs = { };

export type Aws_OidcDirectiveResolver<Result, Parent, ContextType = any, Args = Aws_OidcDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type Aws_PublishDirectiveArgs = {
  subscriptions?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type Aws_PublishDirectiveResolver<Result, Parent, ContextType = any, Args = Aws_PublishDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type Aws_SubscribeDirectiveArgs = {
  mutations?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type Aws_SubscribeDirectiveResolver<Result, Parent, ContextType = any, Args = Aws_SubscribeDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type DeferDirectiveArgs = { };

export type DeferDirectiveResolver<Result, Parent, ContextType = any, Args = DeferDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export interface AwsjsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['AWSJSON'], any> {
  name: 'AWSJSON';
}

export type ActivityDetailsResolvers<ContextType = any, ParentType extends ResolversParentTypes['ActivityDetails'] = ResolversParentTypes['ActivityDetails']> = {
  __resolveType: TypeResolveFn<'SwapOrderDetails' | 'TransactionDetails', ParentType, ContextType>;
};

export type AmountResolvers<ContextType = any, ParentType extends ResolversParentTypes['Amount'] = ResolversParentTypes['Amount']> = {
  currency?: Resolver<Maybe<ResolversTypes['Currency']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AmountChangeResolvers<ContextType = any, ParentType extends ResolversParentTypes['AmountChange'] = ResolversParentTypes['AmountChange']> = {
  absolute?: Resolver<Maybe<ResolversTypes['Amount']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  percentage?: Resolver<Maybe<ResolversTypes['Amount']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ApplicationContractResolvers<ContextType = any, ParentType extends ResolversParentTypes['ApplicationContract'] = ResolversParentTypes['ApplicationContract']> = {
  address?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  chain?: Resolver<ResolversTypes['Chain'], ParentType, ContextType>;
  icon?: Resolver<Maybe<ResolversTypes['Image']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AssetActivityResolvers<ContextType = any, ParentType extends ResolversParentTypes['AssetActivity'] = ResolversParentTypes['AssetActivity']> = {
  addresses?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  assetChanges?: Resolver<Array<Maybe<ResolversTypes['AssetChange']>>, ParentType, ContextType>;
  chain?: Resolver<ResolversTypes['Chain'], ParentType, ContextType>;
  details?: Resolver<ResolversTypes['ActivityDetails'], ParentType, ContextType>;
  gasUsed?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  timestamp?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  transaction?: Resolver<ResolversTypes['Transaction'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['ActivityType'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AssetChangeResolvers<ContextType = any, ParentType extends ResolversParentTypes['AssetChange'] = ResolversParentTypes['AssetChange']> = {
  __resolveType: TypeResolveFn<'NftApproval' | 'NftApproveForAll' | 'NftTransfer' | 'TokenApproval' | 'TokenTransfer', ParentType, ContextType>;
};

export type DescriptionTranslationsResolvers<ContextType = any, ParentType extends ResolversParentTypes['DescriptionTranslations'] = ResolversParentTypes['DescriptionTranslations']> = {
  descriptionEnUs?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  descriptionEs419?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  descriptionEsEs?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  descriptionEsUs?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  descriptionFrFr?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  descriptionHiIn?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  descriptionIdId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  descriptionJaJp?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  descriptionMsMy?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  descriptionNlNl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  descriptionPtPt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  descriptionRuRu?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  descriptionThTh?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  descriptionTrTr?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  descriptionUkUa?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  descriptionUrPk?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  descriptionViVn?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  descriptionZhHans?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  descriptionZhHant?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DimensionsResolvers<ContextType = any, ParentType extends ResolversParentTypes['Dimensions'] = ResolversParentTypes['Dimensions']> = {
  height?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  width?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type IAmountResolvers<ContextType = any, ParentType extends ResolversParentTypes['IAmount'] = ResolversParentTypes['IAmount']> = {
  __resolveType: TypeResolveFn<'Amount' | 'TimestampedAmount', ParentType, ContextType>;
  currency?: Resolver<Maybe<ResolversTypes['Currency']>, ParentType, ContextType>;
  value?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
};

export type IContractResolvers<ContextType = any, ParentType extends ResolversParentTypes['IContract'] = ResolversParentTypes['IContract']> = {
  __resolveType: TypeResolveFn<'ApplicationContract' | 'NftContract' | 'Token', ParentType, ContextType>;
  address?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  chain?: Resolver<ResolversTypes['Chain'], ParentType, ContextType>;
};

export type ImageResolvers<ContextType = any, ParentType extends ResolversParentTypes['Image'] = ResolversParentTypes['Image']> = {
  dimensions?: Resolver<Maybe<ResolversTypes['Dimensions']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  assetActivity?: Resolver<ResolversTypes['AssetActivity'], ParentType, ContextType, RequireFields<MutationAssetActivityArgs, 'input'>>;
  heartbeat?: Resolver<ResolversTypes['Status'], ParentType, ContextType, RequireFields<MutationHeartbeatArgs, 'subscriptionId' | 'type'>>;
  unsubscribe?: Resolver<ResolversTypes['Status'], ParentType, ContextType, RequireFields<MutationUnsubscribeArgs, 'subscriptionId' | 'type'>>;
};

export type NftActivityResolvers<ContextType = any, ParentType extends ResolversParentTypes['NftActivity'] = ResolversParentTypes['NftActivity']> = {
  address?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  asset?: Resolver<Maybe<ResolversTypes['NftAsset']>, ParentType, ContextType>;
  fromAddress?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  marketplace?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  orderStatus?: Resolver<Maybe<ResolversTypes['OrderStatus']>, ParentType, ContextType>;
  price?: Resolver<Maybe<ResolversTypes['Amount']>, ParentType, ContextType>;
  quantity?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  timestamp?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  toAddress?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  tokenId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  transactionHash?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['NftActivityType'], ParentType, ContextType>;
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NftActivityConnectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['NftActivityConnection'] = ResolversParentTypes['NftActivityConnection']> = {
  edges?: Resolver<Array<ResolversTypes['NftActivityEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NftActivityEdgeResolvers<ContextType = any, ParentType extends ResolversParentTypes['NftActivityEdge'] = ResolversParentTypes['NftActivityEdge']> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['NftActivity'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NftApprovalResolvers<ContextType = any, ParentType extends ResolversParentTypes['NftApproval'] = ResolversParentTypes['NftApproval']> = {
  approvedAddress?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  asset?: Resolver<ResolversTypes['NftAsset'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  nftStandard?: Resolver<ResolversTypes['NftStandard'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NftApproveForAllResolvers<ContextType = any, ParentType extends ResolversParentTypes['NftApproveForAll'] = ResolversParentTypes['NftApproveForAll']> = {
  approved?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  asset?: Resolver<ResolversTypes['NftAsset'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  nftStandard?: Resolver<ResolversTypes['NftStandard'], ParentType, ContextType>;
  operatorAddress?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NftAssetResolvers<ContextType = any, ParentType extends ResolversParentTypes['NftAsset'] = ResolversParentTypes['NftAsset']> = {
  animationUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  collection?: Resolver<Maybe<ResolversTypes['NftCollection']>, ParentType, ContextType>;
  creator?: Resolver<Maybe<ResolversTypes['NftProfile']>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  flaggedBy?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  image?: Resolver<Maybe<ResolversTypes['Image']>, ParentType, ContextType>;
  imageUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  isSpam?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  listings?: Resolver<Maybe<ResolversTypes['NftOrderConnection']>, ParentType, ContextType, Partial<NftAssetListingsArgs>>;
  mediaType?: Resolver<Maybe<ResolversTypes['MediaType']>, ParentType, ContextType>;
  metadataUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  nftContract?: Resolver<Maybe<ResolversTypes['NftContract']>, ParentType, ContextType>;
  originalImage?: Resolver<Maybe<ResolversTypes['Image']>, ParentType, ContextType>;
  ownerAddress?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  rarities?: Resolver<Maybe<Array<ResolversTypes['NftAssetRarity']>>, ParentType, ContextType>;
  smallImage?: Resolver<Maybe<ResolversTypes['Image']>, ParentType, ContextType>;
  smallImageUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  suspiciousFlag?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  thumbnail?: Resolver<Maybe<ResolversTypes['Image']>, ParentType, ContextType>;
  thumbnailUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  tokenId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  traits?: Resolver<Maybe<Array<ResolversTypes['NftAssetTrait']>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NftAssetConnectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['NftAssetConnection'] = ResolversParentTypes['NftAssetConnection']> = {
  edges?: Resolver<Array<ResolversTypes['NftAssetEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  totalCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NftAssetEdgeResolvers<ContextType = any, ParentType extends ResolversParentTypes['NftAssetEdge'] = ResolversParentTypes['NftAssetEdge']> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['NftAsset'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NftAssetRarityResolvers<ContextType = any, ParentType extends ResolversParentTypes['NftAssetRarity'] = ResolversParentTypes['NftAssetRarity']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  provider?: Resolver<Maybe<ResolversTypes['NftRarityProvider']>, ParentType, ContextType>;
  rank?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  score?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NftAssetTraitResolvers<ContextType = any, ParentType extends ResolversParentTypes['NftAssetTrait'] = ResolversParentTypes['NftAssetTrait']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  rarity?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  value?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NftBalanceResolvers<ContextType = any, ParentType extends ResolversParentTypes['NftBalance'] = ResolversParentTypes['NftBalance']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lastPrice?: Resolver<Maybe<ResolversTypes['TimestampedAmount']>, ParentType, ContextType>;
  listedMarketplaces?: Resolver<Maybe<Array<ResolversTypes['NftMarketplace']>>, ParentType, ContextType>;
  listingFees?: Resolver<Maybe<Array<Maybe<ResolversTypes['NftFee']>>>, ParentType, ContextType>;
  ownedAsset?: Resolver<Maybe<ResolversTypes['NftAsset']>, ParentType, ContextType>;
  quantity?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NftBalanceConnectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['NftBalanceConnection'] = ResolversParentTypes['NftBalanceConnection']> = {
  edges?: Resolver<Array<ResolversTypes['NftBalanceEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NftBalanceEdgeResolvers<ContextType = any, ParentType extends ResolversParentTypes['NftBalanceEdge'] = ResolversParentTypes['NftBalanceEdge']> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['NftBalance'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NftCollectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['NftCollection'] = ResolversParentTypes['NftCollection']> = {
  bannerImage?: Resolver<Maybe<ResolversTypes['Image']>, ParentType, ContextType>;
  bannerImageUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  collectionId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  creator?: Resolver<Maybe<ResolversTypes['NftProfile']>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  discordUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  homepageUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  image?: Resolver<Maybe<ResolversTypes['Image']>, ParentType, ContextType>;
  imageUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  instagramName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  isVerified?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  markets?: Resolver<Maybe<Array<ResolversTypes['NftCollectionMarket']>>, ParentType, ContextType, RequireFields<NftCollectionMarketsArgs, 'currencies'>>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  nftContracts?: Resolver<Maybe<Array<ResolversTypes['NftContract']>>, ParentType, ContextType>;
  numAssets?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  openseaUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  traits?: Resolver<Maybe<Array<ResolversTypes['NftCollectionTrait']>>, ParentType, ContextType>;
  twitterName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NftCollectionBalanceResolvers<ContextType = any, ParentType extends ResolversParentTypes['NftCollectionBalance'] = ResolversParentTypes['NftCollectionBalance']> = {
  address?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  balance?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  logoImage?: Resolver<Maybe<ResolversTypes['Image']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NftCollectionBalanceConnectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['NftCollectionBalanceConnection'] = ResolversParentTypes['NftCollectionBalanceConnection']> = {
  edges?: Resolver<Array<ResolversTypes['NftCollectionBalanceEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NftCollectionBalanceEdgeResolvers<ContextType = any, ParentType extends ResolversParentTypes['NftCollectionBalanceEdge'] = ResolversParentTypes['NftCollectionBalanceEdge']> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['NftCollectionBalance'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NftCollectionConnectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['NftCollectionConnection'] = ResolversParentTypes['NftCollectionConnection']> = {
  edges?: Resolver<Array<ResolversTypes['NftCollectionEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NftCollectionEdgeResolvers<ContextType = any, ParentType extends ResolversParentTypes['NftCollectionEdge'] = ResolversParentTypes['NftCollectionEdge']> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['NftCollection'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NftCollectionMarketResolvers<ContextType = any, ParentType extends ResolversParentTypes['NftCollectionMarket'] = ResolversParentTypes['NftCollectionMarket']> = {
  floorPrice?: Resolver<Maybe<ResolversTypes['TimestampedAmount']>, ParentType, ContextType>;
  floorPricePercentChange?: Resolver<Maybe<ResolversTypes['TimestampedAmount']>, ParentType, ContextType, Partial<NftCollectionMarketFloorPricePercentChangeArgs>>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  listings?: Resolver<Maybe<ResolversTypes['TimestampedAmount']>, ParentType, ContextType>;
  marketplaces?: Resolver<Maybe<Array<ResolversTypes['NftCollectionMarketplace']>>, ParentType, ContextType, Partial<NftCollectionMarketMarketplacesArgs>>;
  nftContracts?: Resolver<Maybe<Array<ResolversTypes['NftContract']>>, ParentType, ContextType>;
  owners?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  percentListed?: Resolver<Maybe<ResolversTypes['TimestampedAmount']>, ParentType, ContextType>;
  percentUniqueOwners?: Resolver<Maybe<ResolversTypes['TimestampedAmount']>, ParentType, ContextType>;
  sales?: Resolver<Maybe<ResolversTypes['TimestampedAmount']>, ParentType, ContextType, Partial<NftCollectionMarketSalesArgs>>;
  totalVolume?: Resolver<Maybe<ResolversTypes['TimestampedAmount']>, ParentType, ContextType>;
  volume?: Resolver<Maybe<ResolversTypes['TimestampedAmount']>, ParentType, ContextType, Partial<NftCollectionMarketVolumeArgs>>;
  volume24h?: Resolver<Maybe<ResolversTypes['Amount']>, ParentType, ContextType>;
  volumePercentChange?: Resolver<Maybe<ResolversTypes['TimestampedAmount']>, ParentType, ContextType, Partial<NftCollectionMarketVolumePercentChangeArgs>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NftCollectionMarketplaceResolvers<ContextType = any, ParentType extends ResolversParentTypes['NftCollectionMarketplace'] = ResolversParentTypes['NftCollectionMarketplace']> = {
  floorPrice?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  listings?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  marketplace?: Resolver<Maybe<ResolversTypes['NftMarketplace']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NftCollectionTraitResolvers<ContextType = any, ParentType extends ResolversParentTypes['NftCollectionTrait'] = ResolversParentTypes['NftCollectionTrait']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  stats?: Resolver<Maybe<Array<ResolversTypes['NftCollectionTraitStats']>>, ParentType, ContextType>;
  values?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NftCollectionTraitStatsResolvers<ContextType = any, ParentType extends ResolversParentTypes['NftCollectionTraitStats'] = ResolversParentTypes['NftCollectionTraitStats']> = {
  assets?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  listings?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  value?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NftContractResolvers<ContextType = any, ParentType extends ResolversParentTypes['NftContract'] = ResolversParentTypes['NftContract']> = {
  address?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  chain?: Resolver<ResolversTypes['Chain'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  standard?: Resolver<Maybe<ResolversTypes['NftStandard']>, ParentType, ContextType>;
  symbol?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  totalSupply?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NftFeeResolvers<ContextType = any, ParentType extends ResolversParentTypes['NftFee'] = ResolversParentTypes['NftFee']> = {
  basisPoints?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  payoutAddress?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NftOrderResolvers<ContextType = any, ParentType extends ResolversParentTypes['NftOrder'] = ResolversParentTypes['NftOrder']> = {
  address?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  auctionType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  endAt?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  maker?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  marketplace?: Resolver<ResolversTypes['NftMarketplace'], ParentType, ContextType>;
  marketplaceUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  orderHash?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  poolPrices?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  price?: Resolver<ResolversTypes['Amount'], ParentType, ContextType>;
  protocolParameters?: Resolver<Maybe<ResolversTypes['AWSJSON']>, ParentType, ContextType>;
  quantity?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  startAt?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['OrderStatus'], ParentType, ContextType>;
  taker?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  tokenId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['OrderType'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NftOrderConnectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['NftOrderConnection'] = ResolversParentTypes['NftOrderConnection']> = {
  edges?: Resolver<Array<ResolversTypes['NftOrderEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NftOrderEdgeResolvers<ContextType = any, ParentType extends ResolversParentTypes['NftOrderEdge'] = ResolversParentTypes['NftOrderEdge']> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['NftOrder'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NftProfileResolvers<ContextType = any, ParentType extends ResolversParentTypes['NftProfile'] = ResolversParentTypes['NftProfile']> = {
  address?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isVerified?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  profileImage?: Resolver<Maybe<ResolversTypes['Image']>, ParentType, ContextType>;
  username?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NftRouteResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['NftRouteResponse'] = ResolversParentTypes['NftRouteResponse']> = {
  calldata?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  route?: Resolver<Maybe<Array<ResolversTypes['NftTrade']>>, ParentType, ContextType>;
  sendAmount?: Resolver<ResolversTypes['TokenAmount'], ParentType, ContextType>;
  toAddress?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NftTradeResolvers<ContextType = any, ParentType extends ResolversParentTypes['NftTrade'] = ResolversParentTypes['NftTrade']> = {
  amount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  contractAddress?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  marketplace?: Resolver<ResolversTypes['NftMarketplace'], ParentType, ContextType>;
  price?: Resolver<ResolversTypes['TokenAmount'], ParentType, ContextType>;
  quotePrice?: Resolver<Maybe<ResolversTypes['TokenAmount']>, ParentType, ContextType>;
  tokenId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  tokenType?: Resolver<Maybe<ResolversTypes['NftStandard']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NftTransferResolvers<ContextType = any, ParentType extends ResolversParentTypes['NftTransfer'] = ResolversParentTypes['NftTransfer']> = {
  asset?: Resolver<ResolversTypes['NftAsset'], ParentType, ContextType>;
  direction?: Resolver<ResolversTypes['TransactionDirection'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  nftStandard?: Resolver<ResolversTypes['NftStandard'], ParentType, ContextType>;
  recipient?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  sender?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PageInfoResolvers<ContextType = any, ParentType extends ResolversParentTypes['PageInfo'] = ResolversParentTypes['PageInfo']> = {
  endCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  hasNextPage?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  hasPreviousPage?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  startCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PortfolioResolvers<ContextType = any, ParentType extends ResolversParentTypes['Portfolio'] = ResolversParentTypes['Portfolio']> = {
  assetActivities?: Resolver<Maybe<Array<Maybe<ResolversTypes['AssetActivity']>>>, ParentType, ContextType, Partial<PortfolioAssetActivitiesArgs>>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  nftBalances?: Resolver<Maybe<Array<Maybe<ResolversTypes['NftBalance']>>>, ParentType, ContextType>;
  ownerAddress?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  tokenBalances?: Resolver<Maybe<Array<Maybe<ResolversTypes['TokenBalance']>>>, ParentType, ContextType>;
  tokensTotalDenominatedValue?: Resolver<Maybe<ResolversTypes['Amount']>, ParentType, ContextType>;
  tokensTotalDenominatedValueChange?: Resolver<Maybe<ResolversTypes['AmountChange']>, ParentType, ContextType, Partial<PortfolioTokensTotalDenominatedValueChangeArgs>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PushNotificationResolvers<ContextType = any, ParentType extends ResolversParentTypes['PushNotification'] = ResolversParentTypes['PushNotification']> = {
  contents?: Resolver<ResolversTypes['AWSJSON'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  notifyAddress?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  signerHeader?: Resolver<ResolversTypes['AWSJSON'], ParentType, ContextType>;
  viewerHeader?: Resolver<ResolversTypes['AWSJSON'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  convert?: Resolver<Maybe<ResolversTypes['Amount']>, ParentType, ContextType, RequireFields<QueryConvertArgs, 'fromAmount' | 'toCurrency'>>;
  nftActivity?: Resolver<Maybe<ResolversTypes['NftActivityConnection']>, ParentType, ContextType, Partial<QueryNftActivityArgs>>;
  nftAssets?: Resolver<Maybe<ResolversTypes['NftAssetConnection']>, ParentType, ContextType, RequireFields<QueryNftAssetsArgs, 'address'>>;
  nftBalances?: Resolver<Maybe<ResolversTypes['NftBalanceConnection']>, ParentType, ContextType, RequireFields<QueryNftBalancesArgs, 'ownerAddress'>>;
  nftCollectionBalances?: Resolver<Maybe<ResolversTypes['NftCollectionBalanceConnection']>, ParentType, ContextType, RequireFields<QueryNftCollectionBalancesArgs, 'ownerAddress'>>;
  nftCollections?: Resolver<Maybe<ResolversTypes['NftCollectionConnection']>, ParentType, ContextType, Partial<QueryNftCollectionsArgs>>;
  nftRoute?: Resolver<Maybe<ResolversTypes['NftRouteResponse']>, ParentType, ContextType, RequireFields<QueryNftRouteArgs, 'nftTrades' | 'senderAddress'>>;
  portfolios?: Resolver<Maybe<Array<Maybe<ResolversTypes['Portfolio']>>>, ParentType, ContextType, RequireFields<QueryPortfoliosArgs, 'ownerAddresses'>>;
  searchTokens?: Resolver<Maybe<Array<Maybe<ResolversTypes['Token']>>>, ParentType, ContextType, RequireFields<QuerySearchTokensArgs, 'searchQuery'>>;
  token?: Resolver<Maybe<ResolversTypes['Token']>, ParentType, ContextType, RequireFields<QueryTokenArgs, 'chain'>>;
  tokenProjects?: Resolver<Maybe<Array<Maybe<ResolversTypes['TokenProject']>>>, ParentType, ContextType, RequireFields<QueryTokenProjectsArgs, 'contracts'>>;
  tokens?: Resolver<Maybe<Array<Maybe<ResolversTypes['Token']>>>, ParentType, ContextType, RequireFields<QueryTokensArgs, 'contracts'>>;
  topCollections?: Resolver<Maybe<ResolversTypes['NftCollectionConnection']>, ParentType, ContextType, Partial<QueryTopCollectionsArgs>>;
  topTokens?: Resolver<Maybe<Array<Maybe<ResolversTypes['Token']>>>, ParentType, ContextType, Partial<QueryTopTokensArgs>>;
  topV2Pairs?: Resolver<Maybe<Array<ResolversTypes['V2Pair']>>, ParentType, ContextType, RequireFields<QueryTopV2PairsArgs, 'chain' | 'first'>>;
  topV3Pools?: Resolver<Maybe<Array<ResolversTypes['V3Pool']>>, ParentType, ContextType, RequireFields<QueryTopV3PoolsArgs, 'chain' | 'first'>>;
  transactionNotification?: Resolver<Maybe<ResolversTypes['TransactionNotification']>, ParentType, ContextType, RequireFields<QueryTransactionNotificationArgs, 'address' | 'chain' | 'transactionHash'>>;
};

export type StatusResolvers<ContextType = any, ParentType extends ResolversParentTypes['Status'] = ResolversParentTypes['Status']> = {
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SubscriptionResolvers<ContextType = any, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = {
  onAssetActivity?: SubscriptionResolver<Maybe<ResolversTypes['AssetActivity']>, "onAssetActivity", ParentType, ContextType, RequireFields<SubscriptionOnAssetActivityArgs, 'addresses' | 'subscriptionId'>>;
};

export type SwapOrderDetailsResolvers<ContextType = any, ParentType extends ResolversParentTypes['SwapOrderDetails'] = ResolversParentTypes['SwapOrderDetails']> = {
  expiry?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  hash?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  inputToken?: Resolver<ResolversTypes['Token'], ParentType, ContextType>;
  inputTokenQuantity?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  offerer?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  outputToken?: Resolver<ResolversTypes['Token'], ParentType, ContextType>;
  outputTokenQuantity?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['SwapOrderStatus'], ParentType, ContextType>;
  swapOrderStatus?: Resolver<ResolversTypes['SwapOrderStatus'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TimestampedAmountResolvers<ContextType = any, ParentType extends ResolversParentTypes['TimestampedAmount'] = ResolversParentTypes['TimestampedAmount']> = {
  currency?: Resolver<Maybe<ResolversTypes['Currency']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  timestamp?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TokenResolvers<ContextType = any, ParentType extends ResolversParentTypes['Token'] = ResolversParentTypes['Token']> = {
  address?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  chain?: Resolver<ResolversTypes['Chain'], ParentType, ContextType>;
  decimals?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  market?: Resolver<Maybe<ResolversTypes['TokenMarket']>, ParentType, ContextType, Partial<TokenMarketArgs>>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  project?: Resolver<Maybe<ResolversTypes['TokenProject']>, ParentType, ContextType>;
  standard?: Resolver<Maybe<ResolversTypes['TokenStandard']>, ParentType, ContextType>;
  symbol?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TokenAmountResolvers<ContextType = any, ParentType extends ResolversParentTypes['TokenAmount'] = ResolversParentTypes['TokenAmount']> = {
  currency?: Resolver<ResolversTypes['Currency'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TokenApprovalResolvers<ContextType = any, ParentType extends ResolversParentTypes['TokenApproval'] = ResolversParentTypes['TokenApproval']> = {
  approvedAddress?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  asset?: Resolver<ResolversTypes['Token'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  quantity?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  tokenStandard?: Resolver<ResolversTypes['TokenStandard'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TokenBalanceResolvers<ContextType = any, ParentType extends ResolversParentTypes['TokenBalance'] = ResolversParentTypes['TokenBalance']> = {
  blockNumber?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  blockTimestamp?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  denominatedValue?: Resolver<Maybe<ResolversTypes['Amount']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isHidden?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  ownerAddress?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  quantity?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  token?: Resolver<Maybe<ResolversTypes['Token']>, ParentType, ContextType>;
  tokenProjectMarket?: Resolver<Maybe<ResolversTypes['TokenProjectMarket']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TokenMarketResolvers<ContextType = any, ParentType extends ResolversParentTypes['TokenMarket'] = ResolversParentTypes['TokenMarket']> = {
  fullyDilutedValuation?: Resolver<Maybe<ResolversTypes['Amount']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  price?: Resolver<Maybe<ResolversTypes['Amount']>, ParentType, ContextType>;
  priceHighLow?: Resolver<Maybe<ResolversTypes['Amount']>, ParentType, ContextType, RequireFields<TokenMarketPriceHighLowArgs, 'duration' | 'highLow'>>;
  priceHistory?: Resolver<Maybe<Array<Maybe<ResolversTypes['TimestampedAmount']>>>, ParentType, ContextType, RequireFields<TokenMarketPriceHistoryArgs, 'duration'>>;
  pricePercentChange?: Resolver<Maybe<ResolversTypes['Amount']>, ParentType, ContextType, RequireFields<TokenMarketPricePercentChangeArgs, 'duration'>>;
  priceSource?: Resolver<ResolversTypes['PriceSource'], ParentType, ContextType>;
  token?: Resolver<ResolversTypes['Token'], ParentType, ContextType>;
  totalValueLocked?: Resolver<Maybe<ResolversTypes['Amount']>, ParentType, ContextType>;
  volume?: Resolver<Maybe<ResolversTypes['Amount']>, ParentType, ContextType, RequireFields<TokenMarketVolumeArgs, 'duration'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TokenProjectResolvers<ContextType = any, ParentType extends ResolversParentTypes['TokenProject'] = ResolversParentTypes['TokenProject']> = {
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  descriptionTranslations?: Resolver<Maybe<ResolversTypes['DescriptionTranslations']>, ParentType, ContextType>;
  homepageUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isSpam?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  logo?: Resolver<Maybe<ResolversTypes['Image']>, ParentType, ContextType>;
  logoUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  markets?: Resolver<Maybe<Array<Maybe<ResolversTypes['TokenProjectMarket']>>>, ParentType, ContextType, RequireFields<TokenProjectMarketsArgs, 'currencies'>>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  safetyLevel?: Resolver<Maybe<ResolversTypes['SafetyLevel']>, ParentType, ContextType>;
  smallLogo?: Resolver<Maybe<ResolversTypes['Image']>, ParentType, ContextType>;
  spamCode?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  tokens?: Resolver<Array<ResolversTypes['Token']>, ParentType, ContextType>;
  twitterName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TokenProjectMarketResolvers<ContextType = any, ParentType extends ResolversParentTypes['TokenProjectMarket'] = ResolversParentTypes['TokenProjectMarket']> = {
  currency?: Resolver<ResolversTypes['Currency'], ParentType, ContextType>;
  fullyDilutedValuation?: Resolver<Maybe<ResolversTypes['Amount']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  marketCap?: Resolver<Maybe<ResolversTypes['Amount']>, ParentType, ContextType>;
  price?: Resolver<Maybe<ResolversTypes['Amount']>, ParentType, ContextType>;
  priceHigh52w?: Resolver<Maybe<ResolversTypes['Amount']>, ParentType, ContextType>;
  priceHighLow?: Resolver<Maybe<ResolversTypes['Amount']>, ParentType, ContextType, RequireFields<TokenProjectMarketPriceHighLowArgs, 'duration' | 'highLow'>>;
  priceHistory?: Resolver<Maybe<Array<Maybe<ResolversTypes['TimestampedAmount']>>>, ParentType, ContextType, RequireFields<TokenProjectMarketPriceHistoryArgs, 'duration'>>;
  priceLow52w?: Resolver<Maybe<ResolversTypes['Amount']>, ParentType, ContextType>;
  pricePercentChange?: Resolver<Maybe<ResolversTypes['Amount']>, ParentType, ContextType, RequireFields<TokenProjectMarketPricePercentChangeArgs, 'duration'>>;
  pricePercentChange24h?: Resolver<Maybe<ResolversTypes['Amount']>, ParentType, ContextType>;
  tokenProject?: Resolver<ResolversTypes['TokenProject'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TokenTransferResolvers<ContextType = any, ParentType extends ResolversParentTypes['TokenTransfer'] = ResolversParentTypes['TokenTransfer']> = {
  asset?: Resolver<ResolversTypes['Token'], ParentType, ContextType>;
  direction?: Resolver<ResolversTypes['TransactionDirection'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  quantity?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  recipient?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  sender?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  tokenStandard?: Resolver<ResolversTypes['TokenStandard'], ParentType, ContextType>;
  transactedValue?: Resolver<Maybe<ResolversTypes['Amount']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TransactionResolvers<ContextType = any, ParentType extends ResolversParentTypes['Transaction'] = ResolversParentTypes['Transaction']> = {
  blockNumber?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  from?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  gasLimit?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  hash?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  maxFeePerGas?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  nonce?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['TransactionStatus'], ParentType, ContextType>;
  to?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TransactionDetailsResolvers<ContextType = any, ParentType extends ResolversParentTypes['TransactionDetails'] = ResolversParentTypes['TransactionDetails']> = {
  application?: Resolver<Maybe<ResolversTypes['ApplicationContract']>, ParentType, ContextType>;
  assetChanges?: Resolver<Array<Maybe<ResolversTypes['AssetChange']>>, ParentType, ContextType>;
  from?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  hash?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  nonce?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['TransactionStatus'], ParentType, ContextType>;
  to?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  transactionStatus?: Resolver<ResolversTypes['TransactionStatus'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['TransactionType'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TransactionNotificationResolvers<ContextType = any, ParentType extends ResolversParentTypes['TransactionNotification'] = ResolversParentTypes['TransactionNotification']> = {
  hash?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  push?: Resolver<Array<ResolversTypes['PushNotification']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type V2PairResolvers<ContextType = any, ParentType extends ResolversParentTypes['V2Pair'] = ResolversParentTypes['V2Pair']> = {
  address?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  chain?: Resolver<ResolversTypes['Chain'], ParentType, ContextType>;
  createdAtTimestamp?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  cumulativeVolume?: Resolver<Maybe<ResolversTypes['Amount']>, ParentType, ContextType, Partial<V2PairCumulativeVolumeArgs>>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  protocolVersion?: Resolver<ResolversTypes['ProtocolVersion'], ParentType, ContextType>;
  token0?: Resolver<Maybe<ResolversTypes['Token']>, ParentType, ContextType>;
  token0Supply?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  token1?: Resolver<Maybe<ResolversTypes['Token']>, ParentType, ContextType>;
  token1Supply?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  totalLiquidity?: Resolver<Maybe<ResolversTypes['Amount']>, ParentType, ContextType>;
  txCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type V3PoolResolvers<ContextType = any, ParentType extends ResolversParentTypes['V3Pool'] = ResolversParentTypes['V3Pool']> = {
  address?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  chain?: Resolver<ResolversTypes['Chain'], ParentType, ContextType>;
  createdAtTimestamp?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  cumulativeVolume?: Resolver<Maybe<ResolversTypes['Amount']>, ParentType, ContextType, Partial<V3PoolCumulativeVolumeArgs>>;
  feeTier?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  protocolVersion?: Resolver<ResolversTypes['ProtocolVersion'], ParentType, ContextType>;
  token0?: Resolver<Maybe<ResolversTypes['Token']>, ParentType, ContextType>;
  token0Supply?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  token1?: Resolver<Maybe<ResolversTypes['Token']>, ParentType, ContextType>;
  token1Supply?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  totalLiquidity?: Resolver<Maybe<ResolversTypes['Amount']>, ParentType, ContextType>;
  txCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = any> = {
  AWSJSON?: GraphQLScalarType;
  ActivityDetails?: ActivityDetailsResolvers<ContextType>;
  Amount?: AmountResolvers<ContextType>;
  AmountChange?: AmountChangeResolvers<ContextType>;
  ApplicationContract?: ApplicationContractResolvers<ContextType>;
  AssetActivity?: AssetActivityResolvers<ContextType>;
  AssetChange?: AssetChangeResolvers<ContextType>;
  DescriptionTranslations?: DescriptionTranslationsResolvers<ContextType>;
  Dimensions?: DimensionsResolvers<ContextType>;
  IAmount?: IAmountResolvers<ContextType>;
  IContract?: IContractResolvers<ContextType>;
  Image?: ImageResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  NftActivity?: NftActivityResolvers<ContextType>;
  NftActivityConnection?: NftActivityConnectionResolvers<ContextType>;
  NftActivityEdge?: NftActivityEdgeResolvers<ContextType>;
  NftApproval?: NftApprovalResolvers<ContextType>;
  NftApproveForAll?: NftApproveForAllResolvers<ContextType>;
  NftAsset?: NftAssetResolvers<ContextType>;
  NftAssetConnection?: NftAssetConnectionResolvers<ContextType>;
  NftAssetEdge?: NftAssetEdgeResolvers<ContextType>;
  NftAssetRarity?: NftAssetRarityResolvers<ContextType>;
  NftAssetTrait?: NftAssetTraitResolvers<ContextType>;
  NftBalance?: NftBalanceResolvers<ContextType>;
  NftBalanceConnection?: NftBalanceConnectionResolvers<ContextType>;
  NftBalanceEdge?: NftBalanceEdgeResolvers<ContextType>;
  NftCollection?: NftCollectionResolvers<ContextType>;
  NftCollectionBalance?: NftCollectionBalanceResolvers<ContextType>;
  NftCollectionBalanceConnection?: NftCollectionBalanceConnectionResolvers<ContextType>;
  NftCollectionBalanceEdge?: NftCollectionBalanceEdgeResolvers<ContextType>;
  NftCollectionConnection?: NftCollectionConnectionResolvers<ContextType>;
  NftCollectionEdge?: NftCollectionEdgeResolvers<ContextType>;
  NftCollectionMarket?: NftCollectionMarketResolvers<ContextType>;
  NftCollectionMarketplace?: NftCollectionMarketplaceResolvers<ContextType>;
  NftCollectionTrait?: NftCollectionTraitResolvers<ContextType>;
  NftCollectionTraitStats?: NftCollectionTraitStatsResolvers<ContextType>;
  NftContract?: NftContractResolvers<ContextType>;
  NftFee?: NftFeeResolvers<ContextType>;
  NftOrder?: NftOrderResolvers<ContextType>;
  NftOrderConnection?: NftOrderConnectionResolvers<ContextType>;
  NftOrderEdge?: NftOrderEdgeResolvers<ContextType>;
  NftProfile?: NftProfileResolvers<ContextType>;
  NftRouteResponse?: NftRouteResponseResolvers<ContextType>;
  NftTrade?: NftTradeResolvers<ContextType>;
  NftTransfer?: NftTransferResolvers<ContextType>;
  PageInfo?: PageInfoResolvers<ContextType>;
  Portfolio?: PortfolioResolvers<ContextType>;
  PushNotification?: PushNotificationResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Status?: StatusResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  SwapOrderDetails?: SwapOrderDetailsResolvers<ContextType>;
  TimestampedAmount?: TimestampedAmountResolvers<ContextType>;
  Token?: TokenResolvers<ContextType>;
  TokenAmount?: TokenAmountResolvers<ContextType>;
  TokenApproval?: TokenApprovalResolvers<ContextType>;
  TokenBalance?: TokenBalanceResolvers<ContextType>;
  TokenMarket?: TokenMarketResolvers<ContextType>;
  TokenProject?: TokenProjectResolvers<ContextType>;
  TokenProjectMarket?: TokenProjectMarketResolvers<ContextType>;
  TokenTransfer?: TokenTransferResolvers<ContextType>;
  Transaction?: TransactionResolvers<ContextType>;
  TransactionDetails?: TransactionDetailsResolvers<ContextType>;
  TransactionNotification?: TransactionNotificationResolvers<ContextType>;
  V2Pair?: V2PairResolvers<ContextType>;
  V3Pool?: V3PoolResolvers<ContextType>;
};

export type DirectiveResolvers<ContextType = any> = {
  aws_api_key?: Aws_Api_KeyDirectiveResolver<any, any, ContextType>;
  aws_auth?: Aws_AuthDirectiveResolver<any, any, ContextType>;
  aws_cognito_user_pools?: Aws_Cognito_User_PoolsDirectiveResolver<any, any, ContextType>;
  aws_iam?: Aws_IamDirectiveResolver<any, any, ContextType>;
  aws_lambda?: Aws_LambdaDirectiveResolver<any, any, ContextType>;
  aws_oidc?: Aws_OidcDirectiveResolver<any, any, ContextType>;
  aws_publish?: Aws_PublishDirectiveResolver<any, any, ContextType>;
  aws_subscribe?: Aws_SubscribeDirectiveResolver<any, any, ContextType>;
  defer?: DeferDirectiveResolver<any, any, ContextType>;
};
