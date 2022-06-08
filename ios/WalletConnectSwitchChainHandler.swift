//
//  WalletConnectSwitchChainHandler.swift
//  Uniswap
//
//  Created by Spencer Yen on 4/26/22.
//

import Foundation
import WalletConnectSwift

class WalletConnectSwitchChainHandler: RequestHandler {
  var serverWrapper: WalletConnectServerWrapper!
  var eventEmitter: RCTEventEmitter!
  
  init(eventEmitter: RCTEventEmitter, serverWrapper: WalletConnectServerWrapper) {
    self.eventEmitter = eventEmitter
    self.serverWrapper = serverWrapper
  }
  
  func canHandle(request: Request) -> Bool {
    return request.method == EthMethod.switchChain.rawValue
  }
  
  func handle(request: Request) {
    do {
      let chainIdRequest = try request.parameter(of: WalletSwitchEthereumChainObject.self, at: 0)
      let chainIdInt = try chainIdRequest.toInt()
      self.serverWrapper.requestSwitchChainId(request: request, chainId: chainIdInt)
    } catch {
      self.serverWrapper.server.send(.invalid(request))
    }
  }
}

struct WalletSwitchEthereumChainObject: Decodable {
  let chainId: String
  
  // chainIds should be hex strings prefixed with 0x: https://docs.metamask.io/guide/rpc-api.html#wallet-switchethereumchain
  public func toInt() throws -> Int {
    guard chainId.hasPrefix("0x"), let chainIdInt = Int(chainId.dropFirst(2), radix: 16) else {
      throw WCSwiftError.invalidChainId
    }
    
    return chainIdInt
  }
}
