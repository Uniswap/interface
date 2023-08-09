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
  
  let ethereumChain = "ETHEREUM"
  let WETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
  lazy var ETHTokenResponse = TokenResponse(chain: ethereumChain, symbol: "ETH", name: "Ethereum")
  
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
    // TODO: MOB-967 fix to run a single query
    let favoriteTokens = try await withThrowingTaskGroup(of: TokenResponse.self, returning: [IntentToken].self) { taskGroup in
      for favorite in favorites.favorites {
        taskGroup.addTask { try await DataQueries.fetchTokenData(chain: favorite.chain, address: favorite.address) }
      }
      
      var tokens = [IntentToken]()
      for try await result in taskGroup {
        tokens.append(tokenResponseToIntentToken(result, section: Section.favorite))
      }
      return tokens
      
    }
    
    let topTokensResponse = try await DataQueries.fetchTopTokensData()
    
    let topTokens = topTokensResponse.map { (result) -> IntentToken in
      // replace wETH with ETH in the configuration
      if (result.address == WETHAddress && result.chain == ethereumChain) {
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
