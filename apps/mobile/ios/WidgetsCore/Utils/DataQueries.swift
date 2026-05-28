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

  public static func fetchTokensData(tokenInputs: [TokenInput]) async throws -> [TokenResponse] {
    return try await withCheckedThrowingContinuation { continuation in
      let contractInputs = tokenInputs.map {MobileSchema.ContractInput(chain: GraphQLEnum(rawValue: $0.chain), address: $0.address == nil ? GraphQLNullable.null: GraphQLNullable(stringLiteral: $0.address!))}
      Network.shared.apollo.fetch(query: MobileSchema.WidgetTokensQuery(contracts: contractInputs)) { result in
        switch result {
        case .success(let graphQLResult):
          let tokens = graphQLResult.data?.tokens ?? []
          let tokenResponses = tokens.map {
            let symbol = $0?.symbol
            let name = $0?.name
            let chain = $0?.chain
            let address = $0?.address
            return TokenResponse(chain: chain?.rawValue ?? "", address: address, symbol: symbol ?? "", name: name ?? "")
          }
          continuation.resume(returning: tokenResponses)
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
            let name = tokenData?.name
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
          let name = token?.name
          let logoUrl = token?.project?.logoUrl ?? nil
          let market = token?.market
          let spotPrice = market?.price?.value
          let pricePercentChange = market?.pricePercentChange?.value
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
          let price = tokenProject?.markets?[0]?.price?.value
          let pricePercentChange24h = tokenProject?.markets?[0]?.pricePercentChange24h?.value
          let priceHistory = (markets != nil) && !markets!.isEmpty ?
          tokenProject?.markets?[0]?.priceHistory?.map { (result) -> PriceHistory in
            return PriceHistory(timestamp: result?.timestamp ?? 0  * 1000, price: result?.value ?? 0)
          } : []
          let priceHistoryResponse = TokenPriceHistoryResponse(priceHistory: priceHistory ?? [], price: price, pricePercentChange24h: pricePercentChange24h)
          continuation.resume(returning: priceHistoryResponse)
        case .failure(let error):
          continuation.resume(throwing: error)
        }
      }
    }
  }

  public static func fetchWalletsTokensData(addresses: [String], chains: [String], maxLength: Int = 25) async throws -> [TokenResponse] {
    let gqlChains = chains.map { GraphQLEnum(MobileSchema.Chain(rawValue: $0)!) }
    return try await withCheckedThrowingContinuation { continuation in
      Network.shared.apollo.fetch(query: MobileSchema.MultiplePortfolioBalancesQuery(ownerAddresses: addresses, valueModifiers: GraphQLNullable.null, chains: gqlChains)){ result in
        switch result {
        case .success(let graphQLResult):
          // Takes all the signer accounts and sums up the balances of the tokens, then sorts them by descending order, ignoring spam
          var tokens: [TokenResponse: Double] = [:]
          let portfolios = graphQLResult.data?.portfolios
          portfolios?.forEach {
            $0?.tokenBalances?.forEach { tokenBalance in
              let value = tokenBalance?.denominatedValue?.value
              let token = tokenBalance?.token
              let tokenResponse = TokenResponse(chain: token?.chain.rawValue ?? "", address: token?.address, symbol: token?.symbol ?? "", name: token?.name ?? "")
              let isSpam = token?.project?.isSpam ?? false
              if (!isSpam) {
                tokens[tokenResponse] = (tokens[tokenResponse] ?? 0) + (value ?? 0)
              }
            }
          }
          let tokenResponses = tokens.keys.sorted { tokens[$0]! > tokens[$1]!}
          continuation.resume(returning: Array(tokenResponses.prefix(maxLength)))
        case .failure(let error):
          continuation.resume(throwing: error)
        }
      }
    }
  }

  public static func fetchCurrencyConversion(toCurrency: String) async throws -> CurrencyConversionResponse {
    return try await withCheckedThrowingContinuation { continuation in
      let usdResponse = CurrencyConversionResponse(conversionRate: 1, currency: WidgetConstants.currencyUsd)

      // Assuming all server currency amounts are in USD
      if (toCurrency == WidgetConstants.currencyUsd) {
        return continuation.resume(returning: usdResponse)
      }

      Network.shared.apollo.fetch(
        query: MobileSchema.ConvertQuery(
          fromCurrency: GraphQLEnum(MobileSchema.Currency.usd),
          toCurrency: GraphQLEnum(rawValue: toCurrency)
        )
      ) { result in
        switch result {
        case .success(let graphQLResult):
          let conversionRate = graphQLResult.data?.convert?.value
          let currency = graphQLResult.data?.convert?.currency?.rawValue

          continuation.resume(
            returning: conversionRate == nil || currency == nil ? usdResponse :
              CurrencyConversionResponse(
                conversionRate: conversionRate!,
                currency: currency!
              )
          )
        case .failure:
          continuation.resume(returning: usdResponse)
        }
      }
    }
  }
}


