import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency } from '@uniswap/sdk-core'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { NATIVE_ANALYTICS_ADDRESS_VALUE } from 'uniswap/src/utils/currencyId'

export enum TokenReportOption {
  Spam = 'spam',
  Imposter = 'imposter',
  HiddenFees = 'hidden_fees',
  Other = 'other',
}

export enum TokenDataReportOption {
  Price = 'price',
  Volume = 'volume',
  PriceChart = 'price_chart',
  TokenDetails = 'token_details',
  Performance = 'performance',
  Other = 'other',
}

export enum PoolDataReportOption {
  Price = 'price',
  Volume = 'volume',
  PriceChart = 'price_chart',
  Liquidity = 'liquidity',
  Other = 'other',
}

export enum PortfolioDataReportOption {
  Performance = 'performance',
  Other = 'other',
}

export function submitTokenIssueReport({
  source,
  chainId,
  tokenAddress,
  tokenName,
  isMarkedSpam,
  isMultichainAsset = false,
  reportOptions,
  reportTexts,
}: {
  source: 'portfolio' | 'token-details'
  chainId: UniverseChainId
  tokenAddress?: string
  tokenName?: string
  isMarkedSpam?: Maybe<boolean>
  isMultichainAsset?: boolean
  reportOptions: TokenReportOption[]
  reportTexts: Map<TokenReportOption, string>
}): void {
  sendAnalyticsEvent(UniswapEventName.SpamReportSubmitted, {
    type: 'token',
    source,
    token_name: tokenName,
    token_contract_address: tokenAddress ?? NATIVE_ANALYTICS_ADDRESS_VALUE,
    chain_id: chainId,
    is_marked_spam: isMarkedSpam,
    is_multichain_asset: isMultichainAsset,
    spam_token: reportOptions.includes(TokenReportOption.Spam),
    imposter_token: reportOptions.includes(TokenReportOption.Imposter),
    hidden_fees: reportOptions.includes(TokenReportOption.HiddenFees),
    something_else: reportOptions.includes(TokenReportOption.Other),
    text: reportTexts.get(TokenReportOption.Other),
  })
}

export function submitTokenDataReport({
  chainId,
  tokenAddress,
  tokenName,
  isMarkedSpam,
  walletAddress,
  reportOptions,
  reportTexts,
  reportMultichainAsset = false,
}: {
  chainId: UniverseChainId
  tokenAddress?: string
  tokenName?: string
  isMarkedSpam?: Maybe<boolean>
  walletAddress?: string
  reportOptions: TokenDataReportOption[]
  reportTexts: Map<TokenDataReportOption, string>
  reportMultichainAsset?: boolean
}): void {
  sendAnalyticsEvent(UniswapEventName.DataReportSubmitted, {
    type: 'data',
    token_name: tokenName,
    token_contract_address: tokenAddress ?? NATIVE_ANALYTICS_ADDRESS_VALUE,
    chain_id: chainId,
    is_marked_spam: isMarkedSpam,
    wallet_address: walletAddress,
    price: reportOptions.includes(TokenDataReportOption.Price),
    volume: reportOptions.includes(TokenDataReportOption.Volume),
    price_chart: reportOptions.includes(TokenDataReportOption.PriceChart),
    token_details: reportOptions.includes(TokenDataReportOption.TokenDetails),
    performance: reportOptions.includes(TokenDataReportOption.Performance),
    performance_text: reportTexts.get(TokenDataReportOption.Performance),
    something_else: reportOptions.includes(TokenDataReportOption.Other),
    text: reportTexts.get(TokenDataReportOption.Other),
    report_multichain_asset: reportMultichainAsset,
  })
}

export function submitTokenWarningDataReport({
  chainId,
  tokenAddress,
  tokenName,
  isMarkedSpam,
  reportText,
  reportMultichainAsset = false,
}: {
  chainId: UniverseChainId
  tokenAddress?: string
  tokenName?: string
  isMarkedSpam?: Maybe<boolean>
  reportText: string
  reportMultichainAsset?: boolean
}): void {
  sendAnalyticsEvent(UniswapEventName.DataReportSubmitted, {
    type: 'token_warning',
    token_name: tokenName,
    token_contract_address: tokenAddress ?? NATIVE_ANALYTICS_ADDRESS_VALUE,
    chain_id: chainId,
    text: reportText,
    is_marked_spam: isMarkedSpam,
    report_multichain_asset: reportMultichainAsset,
  })
}

export function submitNFTSpamReport({
  chainId,
  contractAddress,
}: {
  chainId: UniverseChainId
  contractAddress?: string
}): void {
  sendAnalyticsEvent(UniswapEventName.SpamReportSubmitted, {
    type: 'nft',
    chain_id: chainId,
    contract_address: contractAddress,
  })
}

export function submitActivitySpamReport({ transactionDetails }: { transactionDetails: TransactionDetails }): void {
  sendAnalyticsEvent(UniswapEventName.SpamReportSubmitted, {
    type: 'activity',
    address: transactionDetails.ownerAddress,
    transaction_id: transactionDetails.id,
    chain_id: transactionDetails.chainId,
    hash: transactionDetails.hash,
    transaction_type: transactionDetails.typeInfo.type,
  })
}

export function submitPoolSpamReport({
  poolId,
  chainId,
  version,
  token0,
  token1,
}: {
  poolId: string
  chainId: UniverseChainId
  version: ProtocolVersion
  token0: Currency
  token1: Currency
}): void {
  sendAnalyticsEvent(UniswapEventName.SpamReportSubmitted, {
    type: 'pool',
    pool_id: poolId,
    chain_id: chainId,
    version,
    token0: token0.isNative ? NATIVE_ANALYTICS_ADDRESS_VALUE : token0.address,
    token1: token1.isNative ? NATIVE_ANALYTICS_ADDRESS_VALUE : token1.address,
  })
}

export function submitPoolDataReport({
  poolId,
  chainId,
  version,
  token0,
  token1,
  reportOptions,
  reportTexts,
}: {
  poolId: string
  chainId: UniverseChainId
  version: ProtocolVersion
  token0: Currency
  token1: Currency
  reportOptions: PoolDataReportOption[]
  reportTexts: Map<PoolDataReportOption, string>
}): void {
  sendAnalyticsEvent(UniswapEventName.DataReportSubmitted, {
    type: 'pool',
    pool_id: poolId,
    chain_id: chainId,
    version,
    token0: token0.isNative ? NATIVE_ANALYTICS_ADDRESS_VALUE : token0.address,
    token1: token1.isNative ? NATIVE_ANALYTICS_ADDRESS_VALUE : token1.address,
    price: reportOptions.includes(PoolDataReportOption.Price),
    price_chart: reportOptions.includes(PoolDataReportOption.PriceChart),
    volume: reportOptions.includes(PoolDataReportOption.Volume),
    liquidity: reportOptions.includes(PoolDataReportOption.Liquidity),
    something_else: reportOptions.includes(PoolDataReportOption.Other),
    text: reportTexts.get(PoolDataReportOption.Other),
  })
}

export function submitPortfolioDataReport({
  walletAddress,
  reportOptions,
  reportTexts,
}: {
  walletAddress?: string
  reportOptions: PortfolioDataReportOption[]
  reportTexts: Map<PortfolioDataReportOption, string>
}): void {
  sendAnalyticsEvent(UniswapEventName.DataReportSubmitted, {
    type: 'portfolio',
    wallet_address: walletAddress,
    performance: reportOptions.includes(PortfolioDataReportOption.Performance),
    performance_text: reportTexts.get(PortfolioDataReportOption.Performance),
    something_else: reportOptions.includes(PortfolioDataReportOption.Other),
    text: reportTexts.get(PortfolioDataReportOption.Other),
  })
}
