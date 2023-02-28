//
//  WalletConnectSignRequestHandler.swift
//  Uniswap
//
//  Created by Spencer Yen on 4/26/22.
//

import Foundation
import WalletConnectSwift

let EthSignMethods = [EthMethod.personalSign.rawValue, EthMethod.signTypedData.rawValue, EthMethod.ethSign.rawValue, EthMethod.signTypedData_v4.rawValue]

class WalletConnectSignRequestHandler: RequestHandler {
  var serverWrapper: WalletConnectServerWrapper!
  var eventEmitter: RCTEventEmitter!
  
  init(eventEmitter: RCTEventEmitter, serverWrapper: WalletConnectServerWrapper) {
    self.eventEmitter = eventEmitter
    self.serverWrapper = serverWrapper
  }
  
  func canHandle(request: Request) -> Bool {
    return EthSignMethods.contains(request.method)
  }
  
  // request is a wrapped array and WalletConnect changes the position of the message
  // based on the eth method
  // https://docs.walletconnect.com/json-rpc-api-methods/ethereum
  // returns [raw message, maybe decoded message]
  func getMessage(_ request: Request) throws -> (String, String?) {
    if (request.method == EthMethod.personalSign.rawValue) {
      let rawMessage = try request.parameter(of: String.self, at: 0)
      return (rawMessage, String(data: Data(hex: rawMessage), encoding: .utf8) ?? nil)
    }
    
    if (request.method == EthMethod.ethSign.rawValue) {
      let rawMessage = try request.parameter(of: String.self, at: 1)
      return (rawMessage, String(data: Data(hex: rawMessage), encoding: .utf8) ?? nil)
    }
    
    // signTypedData case
    return try (request.parameter(of: String.self, at: 1), nil)
  }
  
  func handle(request: Request) {
    // use our own UUID to index requests beacuse request.id may not always be defined, and is not
    // guaranteed to be a string
    let internalId = UUID().uuidString
    self.serverWrapper.setPendingRequest(request: request, internalId: internalId)
    
    do {
      let session = try self.serverWrapper.getSessionFromTopic(request.url.topic)
      let icons = session.dAppInfo.peerMeta.icons
      
      let (rawMessage, decodedMessage) = try getMessage(request)
      self.eventEmitter.sendEvent(
        withName: EventType.signRequest.rawValue, body: [
          "type": request.method,
          "request": request.jsonString,
          "raw_message": rawMessage,
          "message": decodedMessage ?? nil,
          "request_internal_id": internalId,
          "session_id": session.url.topic,
          "account": session.getAccount(),
          "dapp": [
            "name": session.dAppInfo.peerMeta.name,
            "url": session.dAppInfo.peerMeta.url.absoluteString,
            "icon": icons.isEmpty ? "" : icons[0].absoluteString,
            // use walletInfo's chainId because .dappInfo does not update on network change
            "chain_id": session.walletInfo?.chainId ?? 1,
          ]
        ]
      )
    } catch {
      self.serverWrapper.server.send(.invalid(request))
    }
  }
}


