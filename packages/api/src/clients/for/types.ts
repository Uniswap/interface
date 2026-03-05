/**
 * FOR (Fiat On-Ramp) API Client Types
 *
 * This file creates PlainMessage type aliases for protobuf types.
 * PlainMessage converts protobuf classes to plain object types for REST API usage.
 */

import { PlainMessage } from '@bufbuild/protobuf'
import {
  FiatCurrency,
  Quote,
  QuoteResponse,
  ServiceProvider,
  ServiceProviderLogo,
  SupportedCountry,
  SupportedToken,
  Transaction,
} from '@uniswap/client-for/dist/for/v1/api_pb'

// Plain object type aliases for protobuf types

export type FORCountry = PlainMessage<SupportedCountry> & {
  /** State code for US addresses (app-specific extension) */
  state?: string
}

export type FORQuote = PlainMessage<Quote>

export type FORQuoteResponse = PlainMessage<QuoteResponse>

export type FORLogo = PlainMessage<ServiceProviderLogo>

export type FORServiceProvider = PlainMessage<ServiceProvider>

export type FORSupportedToken = PlainMessage<SupportedToken>

export type FORSupportedFiatCurrency = PlainMessage<FiatCurrency>

export type FORTransaction = PlainMessage<Transaction>
