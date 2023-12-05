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

export type ActivityDetails = SwapOrderDetails | TransactionDetails;

export type ActivityDetailsInput = {
  transaction?: InputMaybe<TransactionDetailsInput>;
};

/**   deprecated and replaced with TransactionType, please do not use this */
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
  currency: Currency;
  value: Scalars['Float'];
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
  quantity?: Maybe<Scalars['Int']>;
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

export enum PriceSource {
  SubgraphV2 = 'SUBGRAPH_V2',
  SubgraphV3 = 'SUBGRAPH_V3'
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
  transactionNotification?: Maybe<TransactionNotification>;
};


export type QueryConvertArgs = {
  fromAmount: AmountInput;
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
  chain: Chain;
  subscriptionId: Scalars['ID'];
};

export enum SubscriptionType {
  AssetActivity = 'ASSET_ACTIVITY'
}

export type SwapOrderDetails = {
  __typename?: 'SwapOrderDetails';
  hash: Scalars['String'];
  id: Scalars['ID'];
  inputToken: Token;
  inputTokenQuantity: Scalars['String'];
  offerer: Scalars['String'];
  outputToken: Token;
  outputTokenQuantity: Scalars['String'];
  status: SwapOrderStatus;
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
};

export type TokenAssetInput = {
  address: Scalars['String'];
  chain: Chain;
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

export type TokenInput = {
  address: Scalars['String'];
  chainId: Scalars['Int'];
  decimals: Scalars['Int'];
  isNative: Scalars['Boolean'];
};

export type TokenMarket = {
  __typename?: 'TokenMarket';
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
  assetChanges: Array<Maybe<AssetChange>>;
  from: Scalars['String'];
  hash: Scalars['String'];
  id: Scalars['ID'];
  nonce: Scalars['Int'];
  status: TransactionStatus;
  to: Scalars['String'];
  type: TransactionType;
};

export type TransactionDetailsInput = {
  assetChanges: Array<AssetChangeInput>;
  from: Scalars['String'];
  hash: Scalars['String'];
  nonce: Scalars['Int'];
  status: TransactionStatus;
  to: Scalars['String'];
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

export type TokenPriceHistoryQueryVariables = Exact<{
  contract: ContractInput;
  duration?: InputMaybe<HistoryDuration>;
}>;


export type TokenPriceHistoryQuery = { __typename?: 'Query', tokenProjects?: Array<{ __typename?: 'TokenProject', id: string, name?: string | null, markets?: Array<{ __typename?: 'TokenProjectMarket', id: string, price?: { __typename?: 'Amount', value: number } | null, pricePercentChange24h?: { __typename?: 'Amount', value: number } | null, priceHistory?: Array<{ __typename?: 'TimestampedAmount', timestamp: number, value: number } | null> | null } | null> | null, tokens: Array<{ __typename?: 'Token', id: string, chain: Chain, address?: string | null, symbol?: string | null, decimals?: number | null, market?: { __typename?: 'TokenMarket', id: string, price?: { __typename?: 'Amount', value: number } | null, pricePercentChange24h?: { __typename?: 'Amount', value: number } | null, priceHistory?: Array<{ __typename?: 'TimestampedAmount', timestamp: number, value: number } | null> | null } | null }> } | null> | null };

export type AccountListQueryVariables = Exact<{
  addresses: Array<Scalars['String']> | Scalars['String'];
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
}>;


export type PortfolioBalancesQuery = { __typename?: 'Query', portfolios?: Array<{ __typename?: 'Portfolio', id: string, tokensTotalDenominatedValue?: { __typename?: 'Amount', value: number } | null, tokensTotalDenominatedValueChange?: { __typename?: 'AmountChange', absolute?: { __typename?: 'Amount', value: number } | null, percentage?: { __typename?: 'Amount', value: number } | null } | null, tokenBalances?: Array<{ __typename?: 'TokenBalance', id: string, quantity?: number | null, denominatedValue?: { __typename?: 'Amount', currency?: Currency | null, value: number } | null, token?: { __typename?: 'Token', chain: Chain, address?: string | null, symbol?: string | null, decimals?: number | null, project?: { __typename?: 'TokenProject', id: string, name?: string | null, logoUrl?: string | null, safetyLevel?: SafetyLevel | null, isSpam?: boolean | null } | null } | null, tokenProjectMarket?: { __typename?: 'TokenProjectMarket', relativeChange24?: { __typename?: 'Amount', value: number } | null } | null } | null> | null } | null> | null };

export type MultiplePortfolioBalancesQueryVariables = Exact<{
  ownerAddresses: Array<Scalars['String']> | Scalars['String'];
}>;


export type MultiplePortfolioBalancesQuery = { __typename?: 'Query', portfolios?: Array<{ __typename?: 'Portfolio', id: string, tokensTotalDenominatedValue?: { __typename?: 'Amount', value: number } | null, tokensTotalDenominatedValueChange?: { __typename?: 'AmountChange', absolute?: { __typename?: 'Amount', value: number } | null, percentage?: { __typename?: 'Amount', value: number } | null } | null, tokenBalances?: Array<{ __typename?: 'TokenBalance', id: string, quantity?: number | null, denominatedValue?: { __typename?: 'Amount', currency?: Currency | null, value: number } | null, token?: { __typename?: 'Token', chain: Chain, address?: string | null, symbol?: string | null, decimals?: number | null, project?: { __typename?: 'TokenProject', id: string, name?: string | null, logoUrl?: string | null, safetyLevel?: SafetyLevel | null, isSpam?: boolean | null } | null } | null, tokenProjectMarket?: { __typename?: 'TokenProjectMarket', relativeChange24?: { __typename?: 'Amount', value: number } | null } | null } | null> | null } | null> | null };

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


export type TokenDetailsScreenQuery = { __typename?: 'Query', token?: { __typename?: 'Token', address?: string | null, chain: Chain, symbol?: string | null, name?: string | null, market?: { __typename?: 'TokenMarket', id: string, volume?: { __typename?: 'Amount', value: number } | null, price?: { __typename?: 'Amount', value: number } | null, priceHigh52W?: { __typename?: 'Amount', value: number } | null, priceLow52W?: { __typename?: 'Amount', value: number } | null } | null, project?: { __typename?: 'TokenProject', id: string, name?: string | null, description?: string | null, homepageUrl?: string | null, twitterName?: string | null, safetyLevel?: SafetyLevel | null, logoUrl?: string | null, descriptionTranslations?: { __typename?: 'DescriptionTranslations', descriptionEsEs?: string | null, descriptionFrFr?: string | null, descriptionJaJp?: string | null, descriptionPtPt?: string | null, descriptionZhHans?: string | null, descriptionZhHant?: string | null } | null, markets?: Array<{ __typename?: 'TokenProjectMarket', id: string, price?: { __typename?: 'Amount', value: number } | null, marketCap?: { __typename?: 'Amount', value: number } | null, priceHigh52W?: { __typename?: 'Amount', value: number } | null, priceLow52W?: { __typename?: 'Amount', value: number } | null } | null> | null, tokens: Array<{ __typename?: 'Token', chain: Chain, address?: string | null }> } | null } | null };

export type TokenProjectsQueryVariables = Exact<{
  contracts: Array<ContractInput> | ContractInput;
}>;


export type TokenProjectsQuery = { __typename?: 'Query', tokenProjects?: Array<{ __typename?: 'TokenProject', id: string, name?: string | null, logoUrl?: string | null, safetyLevel?: SafetyLevel | null, tokens: Array<{ __typename?: 'Token', chain: Chain, address?: string | null, decimals?: number | null, symbol?: string | null }> } | null> | null };

export type TransactionListQueryVariables = Exact<{
  address: Scalars['String'];
}>;


export type TransactionListQuery = { __typename?: 'Query', portfolios?: Array<{ __typename?: 'Portfolio', id: string, assetActivities?: Array<{ __typename?: 'AssetActivity', id: string, timestamp: number, chain: Chain, details: { __typename?: 'SwapOrderDetails' } | { __typename?: 'TransactionDetails', to: string, type: TransactionType, hash: string, from: string, status: TransactionStatus, assetChanges: Array<{ __typename: 'NftApproval' } | { __typename: 'NftApproveForAll' } | { __typename: 'NftTransfer', id: string, nftStandard: NftStandard, sender: string, recipient: string, direction: TransactionDirection, asset: { __typename?: 'NftAsset', id: string, name?: string | null, isSpam?: boolean | null, tokenId: string, nftContract?: { __typename?: 'NftContract', id: string, chain: Chain, address: string } | null, image?: { __typename?: 'Image', id: string, url: string } | null, collection?: { __typename?: 'NftCollection', id: string, name?: string | null } | null } } | { __typename: 'TokenApproval', id: string, tokenStandard: TokenStandard, approvedAddress: string, quantity: string, asset: { __typename?: 'Token', id: string, symbol?: string | null, decimals?: number | null, address?: string | null, chain: Chain } } | { __typename: 'TokenTransfer', id: string, tokenStandard: TokenStandard, quantity: string, sender: string, recipient: string, direction: TransactionDirection, asset: { __typename?: 'Token', id: string, symbol?: string | null, address?: string | null, decimals?: number | null, chain: Chain, project?: { __typename?: 'TokenProject', id: string, isSpam?: boolean | null, spamCode?: number | null } | null }, transactedValue?: { __typename?: 'Amount', id: string, currency?: Currency | null, value: number } | null } | null> } } | null> | null } | null> | null };

export type FeedTransactionListQueryVariables = Exact<{
  addresses: Array<Scalars['String']> | Scalars['String'];
}>;


export type FeedTransactionListQuery = { __typename?: 'Query', portfolios?: Array<{ __typename?: 'Portfolio', id: string, ownerAddress: string, assetActivities?: Array<{ __typename?: 'AssetActivity', id: string, timestamp: number, chain: Chain, details: { __typename?: 'SwapOrderDetails' } | { __typename?: 'TransactionDetails', to: string, type: TransactionType, hash: string, from: string, status: TransactionStatus, assetChanges: Array<{ __typename: 'NftApproval' } | { __typename: 'NftApproveForAll' } | { __typename: 'NftTransfer', id: string, nftStandard: NftStandard, sender: string, recipient: string, direction: TransactionDirection, asset: { __typename?: 'NftAsset', id: string, name?: string | null, isSpam?: boolean | null, tokenId: string, nftContract?: { __typename?: 'NftContract', id: string, chain: Chain, address: string } | null, image?: { __typename?: 'Image', id: string, url: string } | null, collection?: { __typename?: 'NftCollection', id: string, name?: string | null } | null } } | { __typename: 'TokenApproval', id: string, tokenStandard: TokenStandard, approvedAddress: string, quantity: string, asset: { __typename?: 'Token', id: string, symbol?: string | null, decimals?: number | null, address?: string | null, chain: Chain } } | { __typename: 'TokenTransfer', id: string, tokenStandard: TokenStandard, quantity: string, sender: string, recipient: string, direction: TransactionDirection, asset: { __typename?: 'Token', id: string, symbol?: string | null, address?: string | null, decimals?: number | null, chain: Chain, project?: { __typename?: 'TokenProject', id: string, isSpam?: boolean | null, spamCode?: number | null } | null }, transactedValue?: { __typename?: 'Amount', currency?: Currency | null, value: number } | null } | null> } } | null> | null } | null> | null };

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
    query AccountList($addresses: [String!]!) {
  portfolios(
    ownerAddresses: $addresses
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
    query PortfolioBalances($ownerAddress: String!) {
  portfolios(
    ownerAddresses: [$ownerAddress]
    chains: [ETHEREUM, POLYGON, ARBITRUM, OPTIMISM, BASE, BNB]
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
    query MultiplePortfolioBalances($ownerAddresses: [String!]!) {
  portfolios(
    ownerAddresses: $ownerAddresses
    chains: [ETHEREUM, POLYGON, ARBITRUM, OPTIMISM, BASE, BNB]
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
    query PortfolioBalance($owner: String!) {
  portfolios(
    ownerAddresses: [$owner]
    chains: [ETHEREUM, POLYGON, ARBITRUM, OPTIMISM, BASE, BNB]
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