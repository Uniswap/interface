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
    pricePercentChange24h = nil
    price = nil
  }
  
  public init(priceHistory: [PriceHistory], price: Double?, pricePercentChange24h: Double?) {
    self.priceHistory = priceHistory
    self.pricePercentChange24h = pricePercentChange24h
    self.price = price
  }
  
  public let priceHistory: [PriceHistory]
  public let pricePercentChange24h: Double?
  public let price: Double?
}

public struct PriceHistory {
  public init(timestamp: Int, price: Double) {
    self.timestamp = timestamp
    self.price = price
  }
  public let timestamp: Int
  public let price: Double
}

public struct CurrencyConversionResponse {
  public let conversionRate: Double
  public let currency: String
}
