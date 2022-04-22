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
  var supportedChainIds: [Int] = []
  
  @objc
  func initialize(_ supportedChainIds: [Int]) {
    self.supportedChainIds = supportedChainIds
  }
 
  func getServer(_ account: String) -> WalletConnectAccountServer {
    guard self.accountToWcServer[account] == nil else { return self.accountToWcServer[account]! }
    
    let accountServer = WalletConnectAccountServer(eventEmitter: self, account: account, supportedChainIds: supportedChainIds)
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
  
  @objc override static func requiresMainQueueSetup() -> Bool {
    return false
  }
}

class WalletConnectAccountServer: ServerDelegate {
  var eventEmitter: RCTEventEmitter!
  var account: String!
  var server: Server!
  var supportedChainIds: [Int]!
  
  private var topicToSession: [String: Session]! = [:]

  // mapping of internal id (uuid) => request
  private var pendingRequests: [String: Request]! = [:]

  init(eventEmitter: RCTEventEmitter, account: String, supportedChainIds: [Int]) {
    self.server = Server(delegate: self)
    self.eventEmitter = eventEmitter
    self.account = account
    self.supportedChainIds = supportedChainIds
    
    self.server.register(handler: WalletConnectSignRequestHandler(eventEmitter: eventEmitter, accountServer: self, account: account))
    self.server.register(handler: WalletConnectSwitchChainHandler(eventEmitter: eventEmitter, accountServer: self, account: account))
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
  
  func switchChainId(request: Request, chainId: Int) {
    guard let session: Session = self.topicToSession[request.url.topic] else { return }
    
    guard supportedChainIds.contains(chainId) else {
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
      
      return
    }
    
    let w = session.walletInfo!
    let newWalletInfo = Session.WalletInfo(
      approved: w.approved, accounts: w.accounts, chainId: chainId, peerId: w.peerId, peerMeta: w.peerMeta)
    
    do {
      try self.server.updateSession(session, with: newWalletInfo)
    } catch {
      self.eventEmitter.sendEvent(
        withName: EventType.error.rawValue,
        body: [
          "type": ErrorType.wcSwitchChainError.rawValue
        ]
      )
    }
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
                                        chainId: session.dAppInfo.chainId!,
                                        peerId: UUID().uuidString,
                                        peerMeta: walletMeta)
    
    let icons = session.dAppInfo.peerMeta.icons

    self.eventEmitter.sendEvent(withName: EventType.sessionConnected.rawValue, body: [
      "session_name": session.dAppInfo.peerMeta.name,
      "session_id": session.url.topic,
      "account": self.account!,
      "dapp": [
        "name": session.dAppInfo.peerMeta.name,
        "url": session.dAppInfo.peerMeta.url.absoluteString,
        "icon": icons.isEmpty ? "" : icons[0].absoluteString,
        "chain_id": session.dAppInfo.chainId!
      ]
    ])
    
    completion(walletInfo)
  }
  
  func server(_ server: Server, didConnect session: Session) {
    self.topicToSession.updateValue(session, forKey: session.url.topic)
  }
  
  func server(_ server: Server, didDisconnect session: Session) {
    self.topicToSession.removeValue(forKey: session.url.topic)
    
    self.eventEmitter.sendEvent(withName: EventType.sessionDisconnected.rawValue, body: [
      "session_id": session.url.topic,
      "session_name": session.url.topic,
      "account": self.account
    ])
  }
  
  func server(_ server: Server, didUpdate session: Session) {
    self.topicToSession.updateValue(session, forKey: session.url.topic)
  }
  
  func getSessionFromTopic(_ topic: String) throws -> Session {
    guard let session = self.topicToSession[topic] else {
      throw WCSwiftError.invalidSessionTopic
    }
    
    return session
  }
}

enum EthMethod: String {
  case personalSign = "personal_sign"
  case switchChain = "wallet_switchEthereumChain"
  case signTypedData = "eth_signTypedData"
}

let EthSignMethods = [EthMethod.personalSign.rawValue, EthMethod.signTypedData.rawValue]

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
  case wcSwitchChainError = "wc_switch_chain_error"
  case invalidRequestId = "invalid_request_id"
  case invalidAccount = "invalid_account"
}

enum WCSwiftError: Error {
  case invalidChainId
  case invalidSessionTopic
}

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
      self.accountServer.switchChainId(request: request, chainId: chainIdInt)
    } catch {
      self.accountServer.server.send(.invalid(request))
    }
  }
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
