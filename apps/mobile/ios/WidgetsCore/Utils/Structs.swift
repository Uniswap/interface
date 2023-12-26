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
  public let timestamp: Int
  public let price: Double
}
