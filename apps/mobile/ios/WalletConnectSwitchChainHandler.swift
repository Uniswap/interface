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
  var supportedChainIds: [Int]!
  
  init(eventEmitter: RCTEventEmitter, serverWrapper: WalletConnectServerWrapper, supportedChainIds: [Int]) {
    self.eventEmitter = eventEmitter
    self.serverWrapper = serverWrapper
    self.supportedChainIds = supportedChainIds
  }
  
  func canHandle(request: Request) -> Bool {
    // Handle both wallet_switchEthereumChain and wallet_addEthereumChain by prompting network switch request if the network is supported. Can use WalletSwitchEthereumChainObject because chainId is the first param of wallet_addEthereumChain.
    return request.method == EthMethod.switchChain.rawValue || request.method == EthMethod.addChain.rawValue
  }
  
  func handle(request: Request) {
    do {
      let session = try self.serverWrapper.getSessionFromTopic(request.url.topic)
      let icons = session.dAppInfo.peerMeta.icons
      let chainIdRequest = try request.parameter(of: WalletSwitchEthereumChainObject.self, at: 0)
      let chainId = try chainIdRequest.toInt()
      
      // Reject requests to switch to unsupported chains
      guard supportedChainIds.contains(chainId) else {
        do {
          try self.serverWrapper.server.send(Response(request: request, error: .requestRejected))
          
          let icons = session.dAppInfo.peerMeta.icons
          self.eventEmitter.sendEvent(withName: EventType.error.rawValue, body: [
            "type": ErrorType.wcUnsupportedChainError.rawValue,
            "account": session.getAccount(),
            "dapp": [
              "name": session.dAppInfo.peerMeta.name,
              "url": session.dAppInfo.peerMeta.url.absoluteString,
              "icon": icons.isEmpty ? "" : icons[0].absoluteString,
              "chain_id": chainId,
            ]
          ])
        } catch {
          self.eventEmitter.sendEvent(
            withName: EventType.error.rawValue,
            body: [
              "type": ErrorType.wcRejectRequestError.rawValue,
              "account": session.getAccount()
            ]
          )
        }
        
        return
      }
      
      // Send switch chain request event to JS
      let internalId = UUID().uuidString
      self.serverWrapper.setPendingRequest(request: request, internalId: internalId)
      
      self.eventEmitter.sendEvent(
        withName: EventType.switchChainRequest.rawValue, body: [
          "type": request.method,
          "account": session.getAccount(),
          "dapp": [
            "name": session.dAppInfo.peerMeta.name,
            "url": session.dAppInfo.peerMeta.url.absoluteString,
            "icon": icons.isEmpty ? "" : icons[0].absoluteString,
            // use walletInfo's chainId because .dappInfo does not update on network change
            "chain_id": session.walletInfo?.chainId ?? 1,
          ],
          "session_id": session.url.topic,
          "request_internal_id": internalId,
          "new_chain_id": chainId
        ]
      )
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
