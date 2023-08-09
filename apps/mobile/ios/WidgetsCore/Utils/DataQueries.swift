//
//  Network.swift
//  WidgetsCore
//
//  Created by Eric Huang on 7/6/23.
//

import Foundation
import Apollo
import OSLog

public class DataQueries {
  
  static let cachePolicy: CachePolicy = CachePolicy.fetchIgnoringCacheData
  
  public static func fetchTokenData(chain: String, address: String?) async throws -> TokenResponse {
    return try await withCheckedThrowingContinuation { continuation in
      Network.shared.apollo.fetch(query: MobileSchema.TokenQuery(chain: GraphQLEnum(rawValue: chain), address: address == nil ? GraphQLNullable.null : GraphQLNullable(stringLiteral: address!)), cachePolicy: cachePolicy) { result in
        switch result {
        case .success(let graphQLResult):
          let symbol = graphQLResult.data?.token?.symbol
          let name = graphQLResult.data?.token?.project?.name
          let token = TokenResponse(chain: chain, address: address, symbol: symbol ?? "", name: name ?? "")
          continuation.resume(returning: token)
        case .failure(let error):
          continuation.resume(throwing: error)
        }
      }
    }
  }
  
  public static func fetchTopTokensData() async throws -> [TokenResponse] {
    return try await withCheckedThrowingContinuation { continuation in
      Network.shared.apollo.fetch(query: MobileSchema.TopTokensQuery(chain: GraphQLNullable(MobileSchema.Chain.ethereum)), cachePolicy: cachePolicy) { result in
        switch result {
        case .success(let graphQLResult):
          let topTokens = graphQLResult.data?.topTokens ?? []
          let tokenResponses = topTokens.map { (tokenData) -> TokenResponse in
            let symbol = tokenData?.symbol
            let name = tokenData?.project?.name
            let chain = tokenData?.chain
            let address = tokenData?.address
            return TokenResponse(chain: chain?.rawValue ?? "", address: address, symbol: symbol ?? "", name: name ?? "")
          }
          continuation.resume(returning: tokenResponses)
        case .failure(let error):
          continuation.resume(throwing: error)
        }
      }
    }
  }
  
  public static func fetchTokenPriceData(chain: String, address: String?) async throws -> TokenPriceResponse {
    return try await withCheckedThrowingContinuation { continuation in
      Network.shared.apollo.fetch(query: MobileSchema.FavoriteTokenCardQuery(chain: GraphQLEnum(rawValue: chain), address: address == nil ? GraphQLNullable.null : GraphQLNullable(stringLiteral: address!)), cachePolicy: cachePolicy) { result in
        switch result {
        case .success(let graphQLResult):
          let token = graphQLResult.data?.token
          let symbol = token?.symbol
          let name = token?.project?.name
          let logoUrl = token?.project?.logoUrl ?? nil
          let markets = token?.project?.markets
          let spotPrice = (markets != nil) && !markets!.isEmpty ? markets?[0]?.price?.value : nil
          let pricePercentChange = (markets != nil) && !markets!.isEmpty ? markets?[0]?.pricePercentChange24h?.value : nil
          let tokenPriceResponse = TokenPriceResponse(chain: chain, address: address, symbol: symbol ?? "", name: name ?? "", logoUrl: logoUrl ?? "", spotPrice: spotPrice, pricePercentChange: pricePercentChange)
          continuation.resume(returning: tokenPriceResponse)
        case .failure(let error):
          continuation.resume(throwing: error)
        }
      }
    }
  }
  
  public static func fetchTokenPriceHistoryData(chain: String, address: String?) async throws -> TokenPriceHistoryResponse {
    return try await withCheckedThrowingContinuation { continuation in
      Network.shared.apollo.fetch(query: MobileSchema.TokenPriceHistoryQuery(contract: MobileSchema.ContractInput(chain: GraphQLEnum(rawValue: chain), address: address == nil ? GraphQLNullable.null: GraphQLNullable(stringLiteral: address!))), cachePolicy: cachePolicy) { result in
        switch result {
        case .success(let graphQLResult):
          let tokenProject = graphQLResult.data?.tokenProjects?[0]
          let markets = tokenProject?.markets
          let priceHistory = (markets != nil) && !markets!.isEmpty ?
          tokenProject?.markets?[0]?.priceHistory?.map { (result) -> PriceHistory in
            return PriceHistory(timestamp: result?.timestamp ?? 0  * 1000, price: result?.value ?? 0)
          } : []
          let priceHistoryResponse = TokenPriceHistoryResponse(priceHistory: priceHistory ?? [])
          continuation.resume(returning: priceHistoryResponse)
        case .failure(let error):
          continuation.resume(throwing: error)
        }
      }
    }
  }
}


