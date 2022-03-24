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
}

class WalletConnectAccountServer: ServerDelegate {
    var eventEmitter: RCTEventEmitter!
    var account: String!
    var server: Server!
    
    private var topicToSession: [String: Session]! = [:]

    init(eventEmitter: RCTEventEmitter, account: String) {
      self.server = Server(delegate: self)
      self.eventEmitter = eventEmitter
      self.account = account
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

enum EventType: String, CaseIterable {
  case error = "error"
  case sessionConnected = "session_connected"
  case sessionDisconnected = "session_disconnected"
}

enum ErrorType: String {
  case wcInvalidUrl = "wc_invalid_url"
  case wcDisconnectError = "wc_disconnect_error"
  case wcConnectError = "wc_connect_error"
}
