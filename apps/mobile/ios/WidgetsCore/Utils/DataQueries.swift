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

  public static func fetchActiveAccountTokensData(address: String?, maxLength: Int = 25) async throws -> [TokenResponse] {
    guard let address = address else {
      return []
    }

    let chains = UniswapUserDefaults.readChains().chains
    let chainNamesById = Dictionary(chains.map { ($0.chainId, $0.name) }, uniquingKeysWith: { first, _ in first })
    guard !chainNamesById.isEmpty else {
      return []
    }

    var request = URLRequest(url: URL(string: "\(UniswapGateway.dataApiUrl)/data.v1.DataApiService/GetPortfolio")!)
    request.httpMethod = "POST"
    for (name, value) in UniswapGateway.authHeaders {
      request.setValue(value, forHTTPHeaderField: name)
    }
    request.setValue("1", forHTTPHeaderField: "Connect-Protocol-Version")
    request.setValue("uniswap-ios", forHTTPHeaderField: "x-request-source")

    let body: [String: Any] = [
      "walletAccount": ["platformAddresses": [["platform": "EVM", "address": address]]],
      "chainIds": Array(chainNamesById.keys),
      "multichain": false,
    ]
    request.httpBody = try JSONSerialization.data(withJSONObject: body)

    return try await withCheckedThrowingContinuation { continuation in
      let task = URLSession.shared.dataTask(with: request) { data, response, error in
        if let error = error {
          continuation.resume(throwing: error)
          return
        }
        guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode),
              let data = data else {
          continuation.resume(throwing: URLError(.badServerResponse))
          return
        }
        do {
          let response = try JSONDecoder().decode(GetPortfolioResponse.self, from: data)
          let ranked = (response.portfolio?.balances ?? [])
            .filter { !isSpam($0.token?.metadata?.spamCode) }
            .sorted { ($0.valueUsd ?? 0) > ($1.valueUsd ?? 0) }
            .compactMap { tokenResponse(from: $0, chainNamesById: chainNamesById) }
          continuation.resume(returning: Array(ranked.prefix(maxLength)))
        } catch {
          continuation.resume(throwing: error)
        }
      }
      task.resume()
    }
  }

  private static func isSpam(_ spamCode: String?) -> Bool {
    return spamCode == "SPAM_CODE_SPAM" || spamCode == "SPAM_CODE_SPAM_URL"
  }

  private static func tokenResponse(from balance: PortfolioBalance, chainNamesById: [Int: String]) -> TokenResponse? {
    guard let token = balance.token, let chainId = token.chainId, let chain = chainNamesById[chainId] else {
      return nil
    }
    return TokenResponse(chain: chain, address: token.address, symbol: token.symbol ?? "", name: token.name ?? "")
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


