//
//  WalletConnectSignRequestHandler.swift
//  Uniswap
//
//  Created by Spencer Yen on 4/26/22.
//

import Foundation
import WalletConnectSwift

let EthSignMethods = [EthMethod.personalSign.rawValue, EthMethod.signTypedData.rawValue]

class WalletConnectSignRequestHandler: RequestHandler {
  var accountServer: WalletConnectAccountServer!
  var eventEmitter: RCTEventEmitter!
  
  private var account: String!
  
  init(eventEmitter: RCTEventEmitter, accountServer: WalletConnectAccountServer, account: String) {
    self.eventEmitter = eventEmitter
    self.accountServer = accountServer
    self.account = account
  }
  
  func canHandle(request: Request) -> Bool {
    return EthSignMethods.contains(request.method)
  }
  
  func handle(request: Request) {
    // use our own UUID to index requests beacuse request.id may not always be defined, and is not
    // guaranteed to be a string
    let internalId = UUID().uuidString
    self.accountServer.setPendingRequest(request: request, internalId: internalId)
    
    do {
      let session = try self.accountServer.getSessionFromTopic(request.url.topic)
      let icons = session.dAppInfo.peerMeta.icons
      
      let message: String
      // request is a wrapped array and WalletConnect changes the position of the message
      // based on the eth method
      // https://docs.walletconnect.com/json-rpc-api-methods/ethereum
      if (request.method == EthMethod.personalSign.rawValue) {
        let rawMessage = try request.parameter(of: String.self, at: 0)
        message = String(data: Data(hex: rawMessage), encoding: .utf8) ?? rawMessage
      } else {
        message = try request.parameter(of: String.self, at: 1)
      }
      
      self.eventEmitter.sendEvent(
        withName: EventType.signRequest.rawValue, body: [
          "type": request.method,
          "request": request.jsonString,
          "message": message,
          "request_internal_id": internalId,
          "account": self.account!,
          "dapp": [
            "name": session.dAppInfo.peerMeta.name,
            "url": session.dAppInfo.peerMeta.url.absoluteString,
            "icon": icons.isEmpty ? "" : icons[0].absoluteString
          ]
        ]
      )
    } catch {
      self.accountServer.server.send(.invalid(request))
    }
  }
}


