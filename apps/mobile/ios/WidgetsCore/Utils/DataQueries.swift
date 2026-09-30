//
//  DataQueries.swift
//  WidgetsCore
//
//  Created by Eric Huang on 7/6/23.
//

import Foundation
import OSLog

/// Resolves between the widget's chain-name strings (GraphQL-style, e.g. `ETHEREUM`, stored in favorites,
/// intents and deeplinks) and the numeric chain ids + native-token addresses the v2 data API expects.
/// Backed by the chains the app syncs (see `setChainsUserDefaults`); Ethereum is always present so a
/// widget rendered before any sync (snapshots, placeholders) still resolves.
struct WidgetChainRegistry {
  private static let ethereum = WidgetChain(
    chainId: 1, name: WidgetConstants.ethereumChain, nativeAddress: WidgetConstants.zeroAddress)

  let chains: [WidgetChain]

  init(chains: [WidgetChain] = UniswapUserDefaults.readChains().chains) {
    self.chains = chains.contains { $0.chainId == Self.ethereum.chainId } ? chains : chains + [Self.ethereum]
  }

  var chainIds: [Int] { chains.map { $0.chainId } }

  func chain(named name: String) -> WidgetChain? {
    return chains.first { $0.name == name }
  }

  func chain(id chainId: Int) -> WidgetChain? {
    return chains.first { $0.chainId == chainId }
  }

  /// v2 `TokenIdentifier` for a widget token; a nil address means the chain's native token.
  func tokenIdentifier(chain chainName: String, address: String?) -> [String: Any]? {
    return chain(named: chainName).map { tokenIdentifier(chain: $0, address: address) }
  }

  func tokenIdentifier(chain: WidgetChain, address: String?) -> [String: Any] {
    return ["chainId": chain.chainId, "address": address ?? nativeAddress(for: chain)]
  }

  /// Maps a v2 response address back to the widget convention: nil for the chain's native token.
  /// The backend serves natives under several placeholders, so all of them collapse to nil.
  func displayAddress(chainId: Int, address: String?) -> String? {
    guard let address = address, !address.isEmpty else {
      return nil
    }
    let native = chain(id: chainId).map { nativeAddress(for: $0) }
    let nativePlaceholders = [native, WidgetConstants.zeroAddress, WidgetConstants.legacyNativeAddress, "ETH"]
    return nativePlaceholders.contains { $0?.lowercased() == address.lowercased() } ? nil : address
  }

  private func nativeAddress(for chain: WidgetChain) -> String {
    return chain.nativeAddress ?? WidgetConstants.zeroAddress
  }
}

public class DataQueries {

  /// Mirrors mobile Explore's default ListTokens request: every enabled chain, sorted by 1d volume descending.
  static let listTokensOrderBy = "TOKENS_ORDER_BY_VOLUME_1D"
  static let listTokensPageSize = 100
  static let dayDuration = "HISTORY_DURATION_DAY"

  public static func fetchTokensData(tokenInputs: [TokenInput]) async throws -> [TokenResponse] {
    let registry = WidgetChainRegistry()
    let requests = tokenInputs.compactMap { input -> (key: String, identifier: [String: Any])? in
      guard let chain = registry.chain(named: input.chain) else {
        return nil
      }
      return (
        tokenKey(chainId: chain.chainId, address: registry.displayAddress(chainId: chain.chainId, address: input.address)),
        registry.tokenIdentifier(chain: chain, address: input.address))
    }
    guard !requests.isEmpty else {
      return []
    }

    let response: GetTokensResponse = try await DataApi.post(
      method: "GetTokens", body: ["tokens": requests.map { $0.identifier }])
    // GetTokens is best-effort and unordered, so match results back to the inputs to keep the favorites order.
    // Both sides are keyed on the widget's display address so a native echoed under a different placeholder
    // than the one requested (0xeeee…, ETH, …) still matches.
    let tokensByKey = Dictionary(
      (response.tokens ?? []).compactMap { token -> (String, DataApiToken)? in
        guard let chainId = token.chainId else {
          return nil
        }
        return (tokenKey(chainId: chainId, address: registry.displayAddress(chainId: chainId, address: token.address)), token)
      },
      uniquingKeysWith: { first, _ in first })

    return requests.compactMap { request in
      tokensByKey[request.key].flatMap { tokenResponse(from: $0, registry: registry) }
    }
  }

  public static func fetchTopTokensData() async throws -> [TokenResponse] {
    let registry = WidgetChainRegistry()
    let body: [String: Any] = [
      "chainIds": registry.chainIds,
      "sort": ["orderBy": listTokensOrderBy, "ascending": false],
      "page": ["pageSize": listTokensPageSize],
      "sparklineDuration": dayDuration,
    ]
    let response: ListTokensResponse = try await DataApi.post(method: "ListTokens", body: body)

    return (response.multichainTokens ?? []).compactMap { ranked -> TokenResponse? in
      guard let token = ranked.multichainToken,
            let deployment = primaryDeployment(of: ranked, registry: registry),
            let chain = registry.chain(id: deployment.chainId) else {
        return nil
      }
      return TokenResponse(
        chain: chain.name,
        address: registry.displayAddress(chainId: deployment.chainId, address: deployment.address),
        symbol: token.symbol ?? "",
        name: token.name ?? "")
    }
  }

  public static func fetchTokenPriceData(chain: String, address: String?) async throws -> TokenPriceResponse {
    let registry = WidgetChainRegistry()
    guard let identifier = registry.tokenIdentifier(chain: chain, address: address) else {
      throw URLError(.badURL)
    }
    let response: GetTokenResponse = try await DataApi.post(method: "GetToken", body: identifier)
    let token = response.token
    return TokenPriceResponse(
      chain: chain,
      address: address,
      symbol: token?.symbol ?? "",
      name: token?.name ?? "",
      logoUrl: token?.project?.logoUrl,
      spotPrice: token?.price?.spotUsd,
      pricePercentChange: token?.price?.percentChange1d)
  }

  public static func fetchTokenPriceHistoryData(chain: String, address: String?) async throws -> TokenPriceHistoryResponse {
    let registry = WidgetChainRegistry()
    guard let identifier = registry.tokenIdentifier(chain: chain, address: address) else {
      throw URLError(.badURL)
    }
    // `singleChain` is a oneof member, which proto3 JSON flattens onto the message rather than nesting under `target`.
    let body: [String: Any] = ["singleChain": identifier, "duration": dayDuration]
    let response: GetTokenHistoryPriceResponse = try await DataApi.post(method: "GetTokenHistoryPrice", body: body)
    let priceHistory = (response.points ?? []).compactMap { point -> PriceHistory? in
      guard let timestamp = point.timestamp, let price = point.priceUsd else {
        return nil
      }
      return PriceHistory(timestamp: timestamp, price: price)
    }
    return TokenPriceHistoryResponse(priceHistory: priceHistory)
  }

  public static func fetchActiveAccountTokensData(address: String?, maxLength: Int = 25) async throws -> [TokenResponse] {
    guard let address = address else {
      return []
    }

    let registry = WidgetChainRegistry()
    let body: [String: Any] = [
      "walletAccount": ["platformAddresses": [["platform": "EVM", "address": address]]],
      "chainIds": registry.chainIds,
      "multichain": false,
    ]
    let response: GetPortfolioResponse = try await DataApi.post(
      service: DataApi.v1Service, method: "GetPortfolio", body: body)
    let ranked = (response.portfolio?.balances ?? [])
      .filter { !isSpam($0.token?.metadata?.spamCode) }
      .sorted { ($0.valueUsd ?? 0) > ($1.valueUsd ?? 0) }
      .compactMap { tokenResponse(from: $0, registry: registry) }
    return Array(ranked.prefix(maxLength))
  }

  public static func fetchCurrencyConversion(toCurrency: String) async throws -> CurrencyConversionResponse {
    let usdResponse = CurrencyConversionResponse(convertedAmount: ConvertedAmount(currency: fiatCurrencyIntByCode["USD"] ?? 0, value: 1.0))

    // If USD, don't convert
    if (toCurrency == "USD") {
      return usdResponse
    }

    let body: [String: Any] = [
      "fromAmount": [ "currency": fiatCurrencyIntByCode["USD"], "value": 1 ],
      "toCurrency": fiatCurrencyIntByCode[toCurrency] ?? fiatCurrencyIntByCode["USD"]
    ]
    return try await DataApi.post(method: "ConvertFiat", body: body)
  }

  /// Keyed on the widget's display address, so every native placeholder collapses to the same key.
  private static func tokenKey(chainId: Int, address: String?) -> String {
    return "\(chainId):\(address?.lowercased() ?? "native")"
  }

  private static func tokenResponse(from token: DataApiToken, registry: WidgetChainRegistry) -> TokenResponse? {
    guard let chainId = token.chainId, let chain = registry.chain(id: chainId) else {
      return nil
    }
    return TokenResponse(
      chain: chain.name,
      address: registry.displayAddress(chainId: chainId, address: token.address),
      symbol: token.symbol ?? "",
      name: token.name ?? "")
  }

  /// Mirrors mobile's `pickPrimaryDeployment` with no network selected: the highest-1d-volume deployment,
  /// falling back to Ethereum and then the lowest chain id (Swift dictionaries have no insertion order to
  /// take "the first entry" from). Only chains the widget can name are considered.
  private static func primaryDeployment(
    of ranked: RankedMultichainToken, registry: WidgetChainRegistry
  ) -> (chainId: Int, address: String)? {
    let deployments = (ranked.multichainToken?.addresses ?? [:]).compactMap { key, address -> (chainId: Int, address: String)? in
      guard let chainId = Int(key), registry.chain(id: chainId) != nil else {
        return nil
      }
      return (chainId, address)
    }
    guard !deployments.isEmpty else {
      return nil
    }

    let volumeByChainId = Dictionary(
      (ranked.chainStats ?? []).compactMap { stat -> (Int, Double)? in
        guard let chainId = stat.chainId, let volume = stat.stats?.volume1d else {
          return nil
        }
        return (chainId, volume)
      },
      uniquingKeysWith: { first, _ in first })
    if let byVolume = deployments.filter({ volumeByChainId[$0.chainId] != nil })
      .max(by: { volumeByChainId[$0.chainId]! < volumeByChainId[$1.chainId]! }) {
      return byVolume
    }
    return deployments.first { $0.chainId == 1 } ?? deployments.min { $0.chainId < $1.chainId }
  }

  private static func isSpam(_ spamCode: String?) -> Bool {
    return spamCode == "SPAM_CODE_SPAM" || spamCode == "SPAM_CODE_SPAM_URL"
  }

  private static func tokenResponse(from balance: PortfolioBalance, registry: WidgetChainRegistry) -> TokenResponse? {
    guard let token = balance.token, let chainId = token.chainId, let chain = registry.chain(id: chainId) else {
      return nil
    }
    return TokenResponse(
      chain: chain.name,
      address: registry.displayAddress(chainId: chainId, address: token.address),
      symbol: token.symbol ?? "",
      name: token.name ?? "")
  }
}
