//
//  Structs.swift
//  WidgetsCore
//
//  Created by Eric Huang on 7/7/23.
//

import Foundation

public struct TokenResponse: Hashable {
  public init(chain: String, address: String? = nil, symbol: String, name: String) {
    self.chain = chain
    self.address = address
    self.symbol = symbol
    self.name = name
  }
  
  public let chain: String
  public let address: String?
  public let symbol: String
  public let name: String
}

public struct TokenPriceResponse {
  public let chain: String
  public let address: String?
  public let symbol: String
  public let name: String
  public let logoUrl: String?
  public let spotPrice: Double?
  public let pricePercentChange: Double?
}

public struct TokenPriceHistoryResponse {
  public init() {
    priceHistory = []
  }

  public init(priceHistory: [PriceHistory]) {
    self.priceHistory = priceHistory
  }

  public let priceHistory: [PriceHistory]
}

public struct PriceHistory {
  public init(timestamp: Int, price: Double) {
    self.timestamp = timestamp
    self.price = price
  }
  /// Unix seconds
  public let timestamp: Int
  public let price: Double
}

// MARK: - data.v2 response shapes (proto3 JSON: absent fields are omitted, int64 arrives as a string)

struct GetTokenResponse: Decodable {
  let token: DataApiToken?
}

struct GetTokensResponse: Decodable {
  let tokens: [DataApiToken]?
}

struct DataApiToken: Decodable {
  let chainId: Int?
  let address: String?
  let symbol: String?
  let name: String?
  let price: DataApiTokenPrice?
  let project: DataApiTokenProject?
}

struct DataApiTokenPrice: Decodable {
  let spotUsd: Double?
  let percentChange1d: Double?
}

struct DataApiTokenProject: Decodable {
  let logoUrl: String?
}

struct ListTokensResponse: Decodable {
  let multichainTokens: [RankedMultichainToken]?
}

struct RankedMultichainToken: Decodable {
  let multichainToken: MultichainToken?
  let chainStats: [ChainTokenRankStats]?
}

struct MultichainToken: Decodable {
  /// Keyed by chain id (as a string) → deployment address
  let addresses: [String: String]?
  let symbol: String?
  let name: String?
}

struct ChainTokenRankStats: Decodable {
  let chainId: Int?
  let stats: TokenRankStats?
}

struct TokenRankStats: Decodable {
  let volume1d: Double?
}

struct GetTokenHistoryPriceResponse: Decodable {
  let points: [PricePoint]?
}

struct PricePoint: Decodable {
  /// Unix seconds
  let timestamp: Int?
  let priceUsd: Double?

  private enum CodingKeys: String, CodingKey {
    case timestamp, priceUsd
  }

  init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)
    priceUsd = try container.decodeIfPresent(Double.self, forKey: .priceUsd)
    if let seconds = try? container.decodeIfPresent(Int.self, forKey: .timestamp) {
      timestamp = seconds
    } else {
      timestamp = try container.decodeIfPresent(String.self, forKey: .timestamp).flatMap { Int($0) }
    }
  }
}

/// Maps protobuf FiatCurrency enum ints to ISO currency codes.
public let fiatCurrencyCodeByInt: [Int: String] = [
  0: "UNSPECIFIED",
  1: "ARS",
  2: "AUD",
  3: "BRL",
  4: "CAD",
  5: "CNY",
  6: "COP",
  7: "EUR",
  8: "GBP",
  9: "HKD",
  10: "IDR",
  11: "INR",
  12: "JPY",
  13: "KRW",
  14: "MXN",
  15: "NGN",
  16: "NZD",
  17: "PKR",
  18: "RUB",
  19: "SGD",
  20: "THB",
  21: "TRY",
  22: "UAH",
  23: "USD",
  24: "VND",
  25: "SEK",
]

/// Maps ISO currency codes to protobuf FiatCurrency enum ints.
public let fiatCurrencyIntByCode: [String: Int] = [
  "UNSPECIFIED": 0,
  "ARS": 1,
  "AUD": 2,
  "BRL": 3,
  "CAD": 4,
  "CNY": 5,
  "COP": 6,
  "EUR": 7,
  "GBP": 8,
  "HKD": 9,
  "IDR": 10,
  "INR": 11,
  "JPY": 12,
  "KRW": 13,
  "MXN": 14,
  "NGN": 15,
  "NZD": 16,
  "PKR": 17,
  "RUB": 18,
  "SGD": 19,
  "THB": 20,
  "TRY": 21,
  "UAH": 22,
  "USD": 23,
  "VND": 24,
  "SEK": 25,
]

public struct CurrencyConversionResponse: Decodable {
  public init(convertedAmount: ConvertedAmount) {
    self.convertedAmount = convertedAmount
  }
  public let convertedAmount: ConvertedAmount
}

public struct ConvertedAmount: Decodable {
  public init(currency: Int, value: Double) {
    self.currency = currency
    self.value = value
  }
  public let currency: Int
  public let value: Double
}

struct GetPortfolioResponse: Decodable {
  let portfolio: Portfolio?
}

struct Portfolio: Decodable {
  let balances: [PortfolioBalance]?
}

struct PortfolioBalance: Decodable {
  let token: PortfolioToken?
  let valueUsd: Double?
}

struct PortfolioToken: Decodable {
  let chainId: Int?
  let address: String?
  let symbol: String?
  let name: String?
  let metadata: PortfolioTokenMetadata?
}

struct PortfolioTokenMetadata: Decodable {
  let spamCode: String?
}
