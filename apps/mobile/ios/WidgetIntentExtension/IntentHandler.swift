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
  }
  
  lazy var ETHTokenResponse = TokenResponse(chain: WidgetConstants.ethereumChain, symbol: WidgetConstants.ethereumSymbol, name: "Ethereum")
  
  func tokenResponseToIntentToken(_ result: TokenResponse, section: Section) -> IntentToken {
    let intentToken: IntentToken = IntentToken(identifier: result.name + section.rawValue, display: "\(result.name) (\(result.symbol))")
    intentToken.name = result.name
    intentToken.symbol = result.symbol
    intentToken.address = result.address
    intentToken.chain = result.chain
    return intentToken
  }
  
  func provideSelectedTokenOptionsCollection(for intent: TokenPriceConfigurationIntent) async throws -> INObjectCollection<IntentToken> {
    let favorites = UniswapUserDefaults.readFavorites()
    async let pendingFavoriteTokenReponses = try DataQueries.fetchTokensData(tokenInputs: favorites.favorites)
    async let pendingTopTokensResponse = try DataQueries.fetchTopTokensData()
    let (favoriteTokenReponses, topTokensResponse) = await (try pendingFavoriteTokenReponses, try pendingTopTokensResponse)
    
    let favoriteTokens = favoriteTokenReponses.map {tokenResponseToIntentToken($0, section: Section.favorite)}
    let topTokens = topTokensResponse.map { (result) -> IntentToken in
      // replace wETH with ETH in the configuration
      if (result.address == WidgetConstants.WETHAddress && result.chain == WidgetConstants.ethereumSymbol) {
        return tokenResponseToIntentToken(ETHTokenResponse, section: Section.top)
      }
      return tokenResponseToIntentToken(result, section: Section.top)
    }
    
    let favoriteSection = INObjectSection<IntentToken>(title: "Favorite Tokens", items: favoriteTokens)
    let topTokensSection = INObjectSection<IntentToken>(title: "Top Tokens", items: topTokens)
    
    return INObjectCollection<IntentToken>(sections: [favoriteSection, topTokensSection])
  }
  
  func defaultSelectedToken(for intent: TokenPriceConfigurationIntent) -> IntentToken? {
    return tokenResponseToIntentToken(ETHTokenResponse, section: Section.top)
  }
  
  override func handler(for intent: INIntent) -> Any {
    return self
  }
  
}
