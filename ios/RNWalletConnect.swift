//
//  RNWalletConnect.swift
//  Uniswap
//
//  Created by Tina Zheng on 3/4/22.
//

import Foundation
import WalletConnectSwift

@objc(RNWalletConnect)
class RNWalletConnect: RCTEventEmitter {
  private var accountToWcServer: [String: WalletConnectAccountServer]! = [:]
  
  @objc override static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  func getServer(_ account: String) -> WalletConnectAccountServer {
    guard self.accountToWcServer[account] == nil else { return self.accountToWcServer[account]! }
    
    let accountServer = WalletConnectAccountServer(eventEmitter: self, account: account)
    self.accountToWcServer.updateValue(accountServer, forKey: account)
    
    return accountServer
  }

  @objc
  func connect(_ url: String, account: String) {
    guard let wcUrl = WCURL(url) else {
      return sendEvent(withName: EventType.error.rawValue, body: ["type": ErrorType.wcInvalidUrl ])
    }
    
    let server = self.getServer(account)
    server.connect(to: wcUrl)
  }
  
  override func supportedEvents() -> [String]! {
    return EventType.allCases.map { $0.rawValue }
  }
  
  @objc
  func disconnect(_ topic: String, account: String) {
    guard let server = self.accountToWcServer[account] else { return }
    server.disconnect(topic)
  }
  
  @objc
    func sendSignature(_ requestInternalId: String, signature: String, account: String) {
      guard let accountServer = self.accountToWcServer[account] else {
        return sendEvent(withName: EventType.error.rawValue, body: ["type": ErrorType.invalidAccount.rawValue])
      }
      
      accountServer.sendSignature(requestInternalId: requestInternalId, signature: signature)
    }


  @objc
  func rejectRequest(_ requestInternalId: String, account: String) {
    guard let accountServer = self.accountToWcServer[account] else {
      return sendEvent(withName: EventType.error.rawValue, body: ["type": ErrorType.invalidAccount.rawValue])
    }

    accountServer.rejectRequest(requestInternalId: requestInternalId)
  }
}

class WalletConnectAccountServer: ServerDelegate {
  var eventEmitter: RCTEventEmitter!
  var account: String!
  var server: Server!
  
  private var topicToSession: [String: Session]! = [:]

  // mapping of internal id (uuid) => request
  private var pendingRequests: [String: Request]! = [:]

  init(eventEmitter: RCTEventEmitter, account: String) {
    self.server = Server(delegate: self)
    self.eventEmitter = eventEmitter
    self.account = account
    
    self.server.register(handler: WalletConnectSignRequestHandler(eventEmitter: eventEmitter, accountServer: self, account: account))
  }
  
  func disconnect(_ topic: String) {
    guard let session = self.topicToSession[topic] else { return }
    
    do {
      try self.server.disconnect(from: session)
    } catch {
      self.eventEmitter.sendEvent(withName: EventType.error.rawValue, body: ["type": ErrorType.wcDisconnectError.rawValue, "message": error.localizedDescription])
    }
  }
  
  func connect(to: WCURL) {
    do {
     try self.server.connect(to: to)
    } catch {
      self.eventEmitter.sendEvent(withName: EventType.error.rawValue, body: ["type": ErrorType.wcConnectError.rawValue, "message": error.localizedDescription ])
    }
  }
  
  func sendSignature(requestInternalId: String, signature: String) {
    guard let request = self.pendingRequests[requestInternalId] else {
      return self.eventEmitter.sendEvent(
        withName: EventType.error.rawValue,
        body: [
          "type": ErrorType.invalidRequestId.rawValue,
          "message": "Are you sure you are using request_internal_id and not request.id?"
        ]
      )
    }
    
    do {
      try self.server.send(Response(url: request.url, value: signature, id: request.id!))
    } catch {
      self.eventEmitter.sendEvent(
        withName: EventType.error.rawValue,
        body: [
          "type": ErrorType.wcSendSignatureError.rawValue
        ]
      )
    }
    
    self.pendingRequests.removeValue(forKey: requestInternalId)
  }
  
  func rejectRequest(requestInternalId: String) {
    guard let request = self.pendingRequests[requestInternalId] else {
      return self.eventEmitter.sendEvent(
        withName: EventType.error.rawValue,
        body: [
          "type": ErrorType.invalidRequestId.rawValue,
          "message": "Are you sure you are using request_internal_id and not request.id?"
        ]
      )
    }
    
    do {
      try self.server.send(Response(request: request, error: .requestRejected))
    } catch {
      self.eventEmitter.sendEvent(
        withName: EventType.error.rawValue,
        body: [
          "type": ErrorType.wcRejectRequestError.rawValue
        ]
      )
    }
    
    self.pendingRequests.removeValue(forKey: requestInternalId)
  }

  func setPendingRequest(request: Request, internalId: String) {
    self.pendingRequests.updateValue(request, forKey: internalId)
  }
  
  func server(_ server: Server, didFailToConnect url: WCURL) {
    self.eventEmitter.sendEvent(withName: EventType.error.rawValue, body: ["type": ErrorType.wcConnectError.rawValue ])
  }
  
  func server(_ server: Server, shouldStart session: Session, completion: @escaping (Session.WalletInfo) -> Void) {
    // TODO: pass in client info on initialization, also update these values when link is ready
    let walletMeta = Session.ClientMeta(name: "Uniswap Wallet",
                                                description: "A very cool wallet!",
                                                icons: [],
                                                url: URL(string: "https://uniswap.org")!)
    let walletInfo = Session.WalletInfo(approved: true,
                                        accounts: [self.account],
                                        chainId: 1,
                                        peerId: UUID().uuidString,
                                        peerMeta: walletMeta)
    
    completion(walletInfo)
    
    self.eventEmitter.sendEvent(withName: EventType.sessionConnected.rawValue, body: ["session_name": session.dAppInfo.peerMeta.name, "session_id": session.url.topic, "account": self.account ])
  }
  
  func server(_ server: Server, didConnect session: Session) {
    self.topicToSession.updateValue(session, forKey: session.url.topic)
  }
  
  func server(_ server: Server, didDisconnect session: Session) {
    self.topicToSession.removeValue(forKey: session.url.topic)
    
    self.eventEmitter.sendEvent(withName: EventType.sessionDisconnected.rawValue, body: ["session_id": session.url.topic, "session_name": session.url.topic, "account": self.account])
  }
  
  func server(_ server: Server, didUpdate session: Session) {
    self.topicToSession.updateValue(session, forKey: session.url.topic)
  }
}

enum EthMethod: String {
  case personalSign = "personal_sign"
}

enum EventType: String, CaseIterable {
  case error = "error"
  case signRequest = "sign_request"
  case sessionConnected = "session_connected"
  case sessionDisconnected = "session_disconnected"
}

enum ErrorType: String {
  case wcInvalidUrl = "wc_invalid_url"
  case wcDisconnectError = "wc_disconnect_error"
  case wcConnectError = "wc_connect_error"
  case wcRejectRequestError = "wc_reject_request_error"
  case wcSendSignatureError = "wc_send_signature_error"
  case invalidRequestId = "invalid_request_id"
  case invalidAccount = "invalid_account"
}


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
      // TODO: handle eth_sign, eth_signTypedData
      return request.method == EthMethod.personalSign.rawValue
    }

    func handle(request: Request) {
      // use our own UUID to index requests beacuse request.id may not always be defined, and is not
      // guaranteed to be a string
      let internalId = UUID().uuidString
      self.accountServer.setPendingRequest(request: request, internalId: internalId)
      
      do {
        let messageBytes = try request.parameter(of: String.self, at: 0)
        self.eventEmitter.sendEvent(
          withName: EventType.signRequest.rawValue, body: [
            "type": request.method,
            "request": request.jsonString,
            "message": String(data: Data(hex: messageBytes), encoding: .utf8) ?? messageBytes,
            "request_internal_id": internalId,
            "account": self.account,
          ]
        )
      } catch {
        self.accountServer.server.send(.invalid(request))
      }
    }
}
