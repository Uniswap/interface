//
//  RNWalletConnect.swift
//  Uniswap
//
//  Created by Tina Zheng on 3/4/22.
//

import Foundation
import WalletConnectSwift

enum EthMethod: String {
  case personalSign = "personal_sign"
  case ethSign = "eth_sign"
  case signTransaction = "eth_signTransaction"
  case sendTransaction = "eth_sendTransaction"
  case switchChain = "wallet_switchEthereumChain"
  case addChain = "wallet_addEthereumChain"
  case signTypedData = "eth_signTypedData"
  case signTypedData_v4 = "eth_signTypedData_v4"
}

enum EventType: String, CaseIterable {
  case error = "error"
  case signRequest = "sign_request" // personal_sign, eth_sign, eth_signTypedData requests
  case transactionRequest = "transaction_request" // eth_signTransaction and eth_sendTransaction requests
  case sessionConnected = "session_connected"
  case networkChanged = "network_changed"
  case sessionDisconnected = "session_disconnected"
  case sessionPending = "session_pending"
  case switchChainRequest = "switch_chain_request"
}

enum ErrorType: String {
  case wcInvalidUrl = "wc_invalid_url"
  case wcDisconnectError = "wc_disconnect_error"
  case wcConnectError = "wc_connect_error"
  case wcRejectRequestError = "wc_reject_request_error"
  case wcSendSignatureError = "wc_send_signature_error"
  case wcSwitchChainError = "wc_switch_chain_error"
  case wcUnsupportedChainError = "wc_unsupported_chain_error"
  case invalidRequestId = "invalid_request_id"
  case invalidAccount = "invalid_account"
  case pendingSessionNotFound = "pending_session_not_found"
}

enum WCSwiftError: Error {
  case invalidChainId
  case invalidSessionTopic
  case pendingSessionNotFound
  case missingSessionAccount
}

let WALLET_CONNECT_SESSION_STORAGE_KEY = "wallet_connect"

// Used to return to previously opened app (wallet to dapp in mobile browser)
@objc private protocol PrivateSelectors: NSObjectProtocol {
    var destinations: [NSNumber] { get }
    func sendResponseForDestination(_ destination: NSNumber)
}

@objc(RNWalletConnect)
class RNWalletConnect: RCTEventEmitter {
  var serverWrapper: WalletConnectServerWrapper!
  var supportedChainIds: [Int] = []
  
  @objc
  func initialize(_ supportedChainIds: [Int]) {
    self.supportedChainIds = supportedChainIds
    self.serverWrapper = WalletConnectServerWrapper(eventEmitter: self, supportedChainIds: supportedChainIds)
  }
  
  @objc
  func reconnectAccountSessions() {
    if let sessionObjects = UserDefaults.standard.object(forKey: WALLET_CONNECT_SESSION_STORAGE_KEY) as? [String: Data] {
      
      // Copy sessions to remove failed reconnections from UserDefaults
      var updatedSessions = sessionObjects
      
      // Attempt to reconnect to all cached sessions
      for (_, sessionObject) in sessionObjects {
        if let session = try? JSONDecoder().decode(Session.self, from: sessionObject) {
          do {
            try self.serverWrapper.server.reconnect(to: session)
          } catch {
            // Remove session from UserDefaults cache
            updatedSessions.removeValue(forKey: session.url.topic)
          }
        }
      }
      
      UserDefaults.standard.set(updatedSessions, forKey: WALLET_CONNECT_SESSION_STORAGE_KEY)
    }
  }
  
  @objc
  func disconnectAllForAccount(_ account: String) {
    if let sessionObjects = UserDefaults.standard.object(forKey: WALLET_CONNECT_SESSION_STORAGE_KEY) as? [String: Data] {
      
      var updatedSessions = sessionObjects
      
      for (_, sessionObject) in sessionObjects {
        if let session = try? JSONDecoder().decode(Session.self, from: sessionObject) {
          if (session.getAccount() == account) {
            self.serverWrapper.disconnect(session.url.topic)
            updatedSessions.removeValue(forKey: session.url.topic)
          }
        }
      }
      
      UserDefaults.standard.set(updatedSessions, forKey: WALLET_CONNECT_SESSION_STORAGE_KEY)
    }
  }
  
  @objc
  func connect(_ url: String) {
    guard let wcUrl = WCURL(url) else {
      return sendEvent(withName: EventType.error.rawValue, body: ["type": ErrorType.wcInvalidUrl ])
    }
    
    self.serverWrapper.connect(to: wcUrl)
  }
  
  @objc
  func settlePendingSession(_ chainId: Int, account: String, approved: Bool) {
    do {
      try self.serverWrapper.settlePendingSession(chainId: chainId, account: account, approved: approved)
    } catch {
      return sendEvent(withName: EventType.error.rawValue, body: ["type": ErrorType.pendingSessionNotFound.rawValue, "account": account])
    }
  }
  
  @objc
  func isValidWCUrl(_ url: String, resolver resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    guard let wcUrl = WCURL(url) else {
      return resolve(false)
    }
    return resolve(true)
  }
  
  override func supportedEvents() -> [String]! {
    return EventType.allCases.map { $0.rawValue }
  }
  
  @objc
  func disconnect(_ topic: String) {
    self.serverWrapper.disconnect(topic)
  }
  
  @objc
  func sendSignature(_ requestInternalId: String, signature: String) {
    self.serverWrapper.sendSignature(requestInternalId: requestInternalId, signature: signature)
  }
  
  @objc
  func changeChainId(_ topic: String, chainId: Int) {
    guard let session: Session = self.serverWrapper.topicToSession[topic] else { return }
    
    self.serverWrapper.switchChainId(session: session, chainId: chainId)
  }
  
  @objc
  func confirmSwitchChainRequest(_ requestInternalId: String) {
    self.serverWrapper.confirmSwitchChainRequest(requestInternalId: requestInternalId)
  }
  
  @objc
  func rejectRequest(_ requestInternalId: String) {
    self.serverWrapper.rejectRequest(requestInternalId: requestInternalId)
  }
  
  /*
   * Open the previously opened app that deep linked to Uniswap app
   * (eg. Dapp website in Safari -> Wallet -> Dapp website in Safari).
   * Returns false and does nothing if there is no previous opened app to link back to.
   * Returns true if successfully opened previous app
   */
  @objc
  func returnToPreviousApp() -> Bool {
    let sys = "_system"
    let nav = "Navigation"
    let action = "Action"
    guard
      let sysNavIvar = class_getInstanceVariable(UIApplication.self, sys + nav + action),
      let action = object_getIvar(UIApplication.shared, sysNavIvar) as? NSObject,
      let destinations = action.perform(#selector(getter: PrivateSelectors.destinations)).takeUnretainedValue() as? [NSNumber],
      let firstDestination = destinations.first
    else {
      return false
    }
    
    action.perform(#selector(PrivateSelectors.sendResponseForDestination), with: firstDestination)
    return true
  }
  
  @objc override static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
