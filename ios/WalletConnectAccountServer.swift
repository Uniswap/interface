//
//  RNWalletConnect.swift
//  Uniswap
//
//  Created by Spencer Yen on 4/26/22.
//

import Foundation
import WalletConnectSwift

class WalletConnectAccountServer {
  var eventEmitter: RCTEventEmitter!
  var account: String!
  var server: Server!
  var supportedChainIds: [Int]!
  
  var topicToSession: [String: Session]! = [:]
  
  // mapping of internal id (uuid) => request
  private var pendingRequests: [String: Request]! = [:]
  
  init(eventEmitter: RCTEventEmitter, account: String, supportedChainIds: [Int]) {
    self.server = Server(delegate: self)
    self.eventEmitter = eventEmitter
    self.account = account
    self.supportedChainIds = supportedChainIds
    
    self.server.register(handler: WalletConnectSignRequestHandler(eventEmitter: eventEmitter, accountServer: self, account: account))
    self.server.register(handler: WalletConnectSignTransactionHandler(eventEmitter: eventEmitter, accountServer: self, account: account))
    self.server.register(handler: WalletConnectSwitchChainHandler(eventEmitter: eventEmitter, accountServer: self, account: account))
    self.server.register(handler: WalletConnectAddChainHandler(eventEmitter: eventEmitter, accountServer: self, account: account))
  }
  
  func disconnect(_ topic: String) {
    guard let session = self.topicToSession[topic] else { return }
    
    do {
      try self.server.disconnect(from: session)
    } catch {
      self.eventEmitter.sendEvent(withName: EventType.error.rawValue, body: ["type": ErrorType.wcDisconnectError.rawValue, "message": error.localizedDescription, "account": self.account])
    }
  }
  
  func connect(to: WCURL) {
    do {
      try self.server.connect(to: to)
    } catch {
      self.eventEmitter.sendEvent(withName: EventType.error.rawValue, body: ["type": ErrorType.wcConnectError.rawValue, "message": error.localizedDescription, "account": self.account])
    }
  }
  
  func sendSignature(requestInternalId: String, signature: String) {
    guard let request = self.pendingRequests[requestInternalId] else {
      return self.eventEmitter.sendEvent(
        withName: EventType.error.rawValue,
        body: [
          "type": ErrorType.invalidRequestId.rawValue,
          "message": "Are you sure you are using request_internal_id and not request.id?",
          "account": self.account
        ]
      )
    }
    
    do {
      try self.server.send(Response(url: request.url, value: signature, id: request.id!))
    } catch {
      self.eventEmitter.sendEvent(
        withName: EventType.error.rawValue,
        body: [
          "type": ErrorType.wcSendSignatureError.rawValue,
          "account": self.account
        ]
      )
    }
    
    self.pendingRequests.removeValue(forKey: requestInternalId)
  }
  
  func requestSwitchChainId(request: Request, chainId: Int) {
    guard let session: Session = self.topicToSession[request.url.topic] else { return }
    
    guard supportedChainIds.contains(chainId) else {
      do {
        try self.server.send(Response(request: request, error: .requestRejected))
        
        let icons = session.dAppInfo.peerMeta.icons
        self.eventEmitter.sendEvent(withName: EventType.error.rawValue, body: [
          "type": ErrorType.wcUnsupportedChainError.rawValue,
          "account": self.account,
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
            "account": self.account
          ]
        )
      }
      
      return
    }
    
    switchChainId(session: session, chainId: chainId)
  }
  
  func switchChainId(session: Session, chainId: Int) {
    let w = session.walletInfo!
    let newWalletInfo = Session.WalletInfo(
      approved: w.approved, accounts: w.accounts, chainId: chainId, peerId: w.peerId, peerMeta: w.peerMeta)
    
    do {
      try self.server.updateSession(session, with: newWalletInfo)
      
      let icons = session.dAppInfo.peerMeta.icons
      
      self.eventEmitter.sendEvent(withName: EventType.sessionUpdated.rawValue, body: [
        "session_name": session.dAppInfo.peerMeta.name,
        "session_id": session.url.topic,
        "account": self.account!,
        "dapp": [
          "name": session.dAppInfo.peerMeta.name,
          "url": session.dAppInfo.peerMeta.url.absoluteString,
          "icon": icons.isEmpty ? "" : icons[0].absoluteString,
          "chain_id": chainId
        ]
      ])
      
      // update session with updated chain ID in our local store
      var newSession = session
      newSession.walletInfo = newWalletInfo
      self.topicToSession.updateValue(newSession, forKey: session.url.topic)
      
    } catch {
      self.eventEmitter.sendEvent(
        withName: EventType.error.rawValue,
        body: [
          "type": ErrorType.wcSwitchChainError.rawValue,
          "account": self.account
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
          "account": self.account,
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
          "type": ErrorType.wcRejectRequestError.rawValue,
          "account": self.account
        ]
      )
    }
    
    self.pendingRequests.removeValue(forKey: requestInternalId)
  }
  
  func setPendingRequest(request: Request, internalId: String) {
    self.pendingRequests.updateValue(request, forKey: internalId)
  }
  
  func getSessionFromTopic(_ topic: String) throws -> Session {
    guard let session = self.topicToSession[topic] else {
      throw WCSwiftError.invalidSessionTopic
    }
    
    return session
  }
}

extension WalletConnectAccountServer: ServerDelegate {
  func server(_ server: Server, didFailToConnect url: WCURL) {
    self.eventEmitter.sendEvent(withName: EventType.error.rawValue, body: ["type": ErrorType.wcConnectError.rawValue, "account": self.account ])
  }
  
  func server(_ server: Server, shouldStart session: Session, completion: @escaping (Session.WalletInfo) -> Void) {
    // Default to chain 1 if dapp chainId is unsupported
    let chainId = supportedChainIds.contains(session.dAppInfo.chainId ?? -1) ? session.dAppInfo.chainId! : 1

    // TODO: pass in client info on initialization, also update these values when link is ready
    let walletMeta = Session.ClientMeta(name: "Uniswap Wallet",
                                        description: "A very cool wallet!",
                                        icons: [],
                                        url: URL(string: "https://uniswap.org")!)
    let walletInfo = Session.WalletInfo(approved: true,
                                        accounts: [self.account],
                                        chainId: chainId,
                                        peerId: UUID().uuidString,
                                        peerMeta: walletMeta)
    
    completion(walletInfo)
  }
  
  func server(_ server: Server, didConnect session: Session) {
    var sessionDatas = UserDefaults.standard.object(forKey: account) as? [String: Data] ?? [:]
    var showNotification = false

    // Add new session to UserDefaults cache if it doesn't already exist (ignores reconnections)
    if (sessionDatas[session.url.topic] == nil) {
      let sessionData = try! JSONEncoder().encode(session) as Data
      sessionDatas.updateValue(sessionData, forKey: session.url.topic)
      UserDefaults.standard.set(sessionDatas, forKey: account)
    
      showNotification = true
    }
    
    // Send connected event back to React Native (no notification if reconnection)
    let icons = session.dAppInfo.peerMeta.icons
    self.eventEmitter.sendEvent(withName: EventType.sessionConnected.rawValue, body: [
      "session_name": session.dAppInfo.peerMeta.name,
      "session_id": session.url.topic,
      "account": self.account!,
      "show_notification": showNotification,
      "dapp": [
        "name": session.dAppInfo.peerMeta.name,
        "url": session.dAppInfo.peerMeta.url.absoluteString,
        "icon": icons.isEmpty ? "" : icons[0].absoluteString,
        "chain_id": session.walletInfo?.chainId ?? 1, 
      ]
    ])

    self.topicToSession.updateValue(session, forKey: session.url.topic)
  }
  
  func server(_ server: Server, didDisconnect session: Session) {
    // Remove session from UserDefaults cache
    var newSessionDatas = UserDefaults.standard.object(forKey: account) as? [String: Data]
    newSessionDatas?.removeValue(forKey: session.url.topic)
    UserDefaults.standard.set(newSessionDatas, forKey: account)
    
    self.topicToSession.removeValue(forKey: session.url.topic)
    
    // Send disconnected event back to React Native
    let icons = session.dAppInfo.peerMeta.icons
    self.eventEmitter.sendEvent(withName: EventType.sessionDisconnected.rawValue, body: [
      "session_id": session.url.topic,
      "session_name": session.url.topic,
      "account": self.account!,
      "dapp": [
        "name": session.dAppInfo.peerMeta.name,
        "url": session.dAppInfo.peerMeta.url.absoluteString,
        "icon": icons.isEmpty ? "" : icons[0].absoluteString,
        "chain_id": session.walletInfo?.chainId ?? 1
      ]
    ])
  }
  
  // TODO: figure out why this update function is never called on network change
  func server(_ server: Server, didUpdate session: Session) {
    self.topicToSession.updateValue(session, forKey: session.url.topic)
  }
}
