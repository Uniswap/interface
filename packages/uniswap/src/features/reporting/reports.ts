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
  Other = 'other',
}

export function submitTokenIssueReport({
  source,
  chainId,
  tokenAddress,
  tokenName,
  isMarkedSpam,
  reportOptions,
  reportText,
}: {
  source: 'portfolio' | 'token-details'
  chainId: UniverseChainId
  tokenAddress?: string
  tokenName?: string
  isMarkedSpam?: Maybe<boolean>
  reportOptions: TokenReportOption[]
  reportText: string
}): void {
  sendAnalyticsEvent(UniswapEventName.SpamReportSubmitted, {
    type: 'token',
    source,
    token_name: tokenName,
    token_contract_address: tokenAddress ?? NATIVE_ANALYTICS_ADDRESS_VALUE,
    chain_id: chainId,
    is_marked_spam: isMarkedSpam,
    spam_token: reportOptions.includes(TokenReportOption.Spam),
    imposter_token: reportOptions.includes(TokenReportOption.Imposter),
    hidden_fees: reportOptions.includes(TokenReportOption.HiddenFees),
    something_else: reportOptions.includes(TokenReportOption.Other),
    text: reportOptions.includes(TokenReportOption.Other) ? reportText : undefined,
  })
}

export function submitTokenDataReport({
  chainId,
  tokenAddress,
  tokenName,
  isMarkedSpam,
  reportOptions,
  reportText,
}: {
  chainId: UniverseChainId
  tokenAddress?: string
  tokenName?: string
  isMarkedSpam?: Maybe<boolean>
  reportOptions: TokenDataReportOption[]
  reportText: string
}): void {
  sendAnalyticsEvent(UniswapEventName.DataReportSubmitted, {
    type: 'data',
    token_name: tokenName,
    token_contract_address: tokenAddress ?? NATIVE_ANALYTICS_ADDRESS_VALUE,
    chain_id: chainId,
    is_marked_spam: isMarkedSpam,
    price: reportOptions.includes(TokenDataReportOption.Price),
    volume: reportOptions.includes(TokenDataReportOption.Volume),
    price_chart: reportOptions.includes(TokenDataReportOption.PriceChart),
    token_details: reportOptions.includes(TokenDataReportOption.TokenDetails),
    something_else: reportOptions.includes(TokenDataReportOption.Other),
    text: reportOptions.includes(TokenDataReportOption.Other) ? reportText : undefined,
  })
}

export function submitTokenWarningDataReport({
  chainId,
  tokenAddress,
  tokenName,
  isMarkedSpam,
  reportText,
}: {
  chainId: UniverseChainId
  tokenAddress?: string
  tokenName?: string
  isMarkedSpam?: Maybe<boolean>
  reportText: string
}): void {
  sendAnalyticsEvent(UniswapEventName.DataReportSubmitted, {
    type: 'token_warning',
    token_name: tokenName,
    token_contract_address: tokenAddress ?? NATIVE_ANALYTICS_ADDRESS_VALUE,
    chain_id: chainId,
    text: reportText,
    is_marked_spam: isMarkedSpam,
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
