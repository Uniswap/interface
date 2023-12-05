//
//  IntentHandler.swift
//  WidgetIntentExtension
//
//  Created by Eric Huang on 7/5/23.
//

import Intents
import WidgetsCore
import OSLog


class IntentHandler: INExtension, TokenPriceConfigurationIntentHandling {
  
  enum Section: String {
    case top = ".top"
    case favorite =  ".favorite"
    case owned = ".owned"
  }
  
  lazy var ETHTokenResponse = TokenResponse(chain: WidgetConstants.ethereumChain, symbol: WidgetConstants.ethereumSymbol, name: "Ethereum")
  
  func tokenResponseToIntentToken(_ result: TokenResponse, section: Section) -> IntentToken {
    let intentToken: IntentToken = IntentToken(identifier: result.name + section.rawValue, display: "\(result.name)", subtitle: "\(result.symbol)", image: nil)
    intentToken.name = result.name
    intentToken.symbol = result.symbol
    intentToken.address = result.address
    intentToken.chain = result.chain
    return intentToken
  }
  
  // Dedupes the tokens list and keeps the first instance of the token in the list.
  // If there are two of the same tokens and 1 is mainnet, use the mainet token
  func dedupeTokens(_ intentTokens: [IntentToken]) -> [IntentToken] {
    var dedupedTokens: [IntentToken] = []
    for intentToken in intentTokens {
      if let index = dedupedTokens.firstIndex(where: {$0.name == intentToken.name && $0.symbol == intentToken.symbol}) {
        if intentToken.chain == WidgetConstants.ethereumChain {
          dedupedTokens[index] = intentToken
        }
      } else {
        dedupedTokens.append(intentToken)
      }
    }
    return dedupedTokens
  }
  
  func provideSelectedTokenOptionsCollection(for intent: TokenPriceConfigurationIntent) async throws -> INObjectCollection<IntentToken> {
    let favorites = UniswapUserDefaults.readFavorites()
    let addresses = UniswapUserDefaults.readAccounts().accounts.filter{$0.isSigner}.map{$0.address}
    
    async let pendingOwnedTokensResponses = try DataQueries.fetchWalletsTokensData(addresses: addresses)
    async let pendingFavoriteTokenReponses = try DataQueries.fetchTokensData(tokenInputs: favorites.favorites)
    async let pendingTopTokensResponse = try DataQueries.fetchTopTokensData()
    let (ownedTokenResponses ,favoriteTokenReponses, topTokensResponse) = await (try pendingOwnedTokensResponses, try pendingFavoriteTokenReponses, try pendingTopTokensResponse)
    
    let ownedTokens = dedupeTokens(ownedTokenResponses.map {tokenResponseToIntentToken($0, section: Section.owned)})
    let favoriteTokens = favoriteTokenReponses.map {tokenResponseToIntentToken($0, section: Section.favorite)}
    let topTokens = topTokensResponse.map { (result) -> IntentToken in
      // replace wETH with ETH in the configuration
      if (result.address == WidgetConstants.WETHAddress && result.chain == WidgetConstants.ethereumChain) {
        return tokenResponseToIntentToken(ETHTokenResponse, section: Section.top)
      }
      return tokenResponseToIntentToken(result, section: Section.top)
    }
    
    let ownedSection = INObjectSection<IntentToken>(title: "Your Tokens", items: ownedTokens)
    let favoriteSection = INObjectSection<IntentToken>(title: "Favorite Tokens", items: favoriteTokens)
    let topTokensSection = INObjectSection<IntentToken>(title: "Top Tokens", items: topTokens)
    
    return INObjectCollection<IntentToken>(sections: [ownedSection, favoriteSection, topTokensSection])
  }
  
  func defaultSelectedToken(for intent: TokenPriceConfigurationIntent) -> IntentToken? {
    return tokenResponseToIntentToken(ETHTokenResponse, section: Section.top)
  }
  
  override func handler(for intent: INIntent) -> Any {
    return self
  }
  
}
