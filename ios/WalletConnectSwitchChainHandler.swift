//
//  WalletConnectSwitchChainHandler.swift
//  Uniswap
//
//  Created by Spencer Yen on 4/26/22.
//

import Foundation
import WalletConnectSwift

class WalletConnectSwitchChainHandler: RequestHandler {
  var accountServer: WalletConnectAccountServer!
  var eventEmitter: RCTEventEmitter!
  
  private var account: String!
  
  init(eventEmitter: RCTEventEmitter, accountServer: WalletConnectAccountServer, account: String) {
    self.eventEmitter = eventEmitter
    self.accountServer = accountServer
    self.account = account
  }
  
  func canHandle(request: Request) -> Bool {
    return request.method == EthMethod.switchChain.rawValue
  }
  
  func handle(request: Request) {
    do {
      let chainIdRequest = try request.parameter(of: WalletSwitchEthereumChainObject.self, at: 0)
      let chainIdInt = try chainIdRequest.toInt()
      self.accountServer.requestSwitchChainId(request: request, chainId: chainIdInt)
    } catch {
      self.accountServer.server.send(.invalid(request))
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
