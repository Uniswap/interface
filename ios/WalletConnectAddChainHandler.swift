//
//  WalletConnectAddChainHandler.swift
//  Uniswap
//
//  Created by Spencer Yen on 5/6/22.
//

import Foundation
import WalletConnectSwift

class WalletConnectAddChainHandler: RequestHandler {
  var serverWrapper: WalletConnectServerWrapper!
  var eventEmitter: RCTEventEmitter!
  
  init(eventEmitter: RCTEventEmitter, serverWrapper: WalletConnectServerWrapper) {
    self.eventEmitter = eventEmitter
    self.serverWrapper = serverWrapper
  }
  
  func canHandle(request: Request) -> Bool {
    return request.method == EthMethod.addChain.rawValue
  }
  
  func handle(request: Request) {
    do {
      // Can use WalletSwitchEthereumChainObject because chainId is the first param of wallet_addEthereumChain, and we handle add by attempting to switch chain
      let chainIdRequest = try request.parameter(of: WalletSwitchEthereumChainObject.self, at: 0)
      let chainIdInt = try chainIdRequest.toInt()
      self.serverWrapper.requestSwitchChainId(request: request, chainId: chainIdInt)
    } catch {
      self.serverWrapper.server.send(.invalid(request))
    }
  }
}
