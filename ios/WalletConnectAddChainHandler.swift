//
//  WalletConnectAddChainHandler.swift
//  Uniswap
//
//  Created by Spencer Yen on 5/6/22.
//

import Foundation
import WalletConnectSwift

class WalletConnectAddChainHandler: RequestHandler {
  var accountServer: WalletConnectAccountServer!
  var eventEmitter: RCTEventEmitter!
  
  private var account: String!
  
  init(eventEmitter: RCTEventEmitter, accountServer: WalletConnectAccountServer, account: String) {
    self.eventEmitter = eventEmitter
    self.accountServer = accountServer
    self.account = account
  }
  
  func canHandle(request: Request) -> Bool {
    return request.method == EthMethod.addChain.rawValue
  }
  
  func handle(request: Request) {
    do {
      // Can use WalletSwitchEthereumChainObject because chainId is the first param of wallet_addEthereumChain, and we handle add by attempting to switch chain
      let chainIdRequest = try request.parameter(of: WalletSwitchEthereumChainObject.self, at: 0)
      let chainIdInt = try chainIdRequest.toInt()
      self.accountServer.requestSwitchChainId(request: request, chainId: chainIdInt)
    } catch {
      self.accountServer.server.send(.invalid(request))
    }
  }
}
