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
}

enum EventType: String, CaseIterable {
  case error = "error"
  case signRequest = "sign_request" // personal_sign, eth_sign, eth_signTypedData requests
  case transactionRequest = "transaction_request" // eth_signTransaction and eth_sendTransaction requests
  case sessionConnected = "session_connected"
  case sessionUpdated = "session_updated"
  case sessionDisconnected = "session_disconnected"
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
}

enum WCSwiftError: Error {
  case invalidChainId
  case invalidSessionTopic
}

@objc(RNWalletConnect)
class RNWalletConnect: RCTEventEmitter {
  private var accountToWcServer: [String: WalletConnectAccountServer]! = [:]
  var supportedChainIds: [Int] = []
  
  @objc
  func initialize(_ supportedChainIds: [Int]) {
    self.supportedChainIds = supportedChainIds
  }
  
  @objc
  func reconnectAccountSessions(_ accounts: [String]) {
    // Load cache of all sessions for given account addresses
    for account in accounts {
      let accountServer = getServer(account)
      
      if let accountSessionObjects = UserDefaults.standard.object(forKey: account) as? [String: Data] {
      
        // Copy accountSessions to remove failed reconnections from UserDefaults
        var updatedAccountSessions = accountSessionObjects
       
        // Attempt to reconnect to all cached sessions for given account
        for (_, sessionObject) in accountSessionObjects {
          if let session = try? JSONDecoder().decode(Session.self, from: sessionObject) {
            do {
              try accountServer.server.reconnect(to: session)
            } catch {
              // Remove session from UserDefaults cache
              updatedAccountSessions.removeValue(forKey: session.url.topic)
            }
          }
        }
       
        UserDefaults.standard.set(updatedAccountSessions, forKey: account)
      }
    }
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
      return sendEvent(withName: EventType.error.rawValue, body: ["type": ErrorType.wcInvalidUrl, "account": account ])
    }
    
    let server = self.getServer(account)
    server.connect(to: wcUrl)
  }
  
  override func supportedEvents() -> [String]! {
    return EventType.allCases.map { $0.rawValue }
  }
  
  @objc
  func disconnect(_ topic: String, account: String) {
    guard let accountServer = self.accountToWcServer[account] else {
      return sendEvent(withName: EventType.error.rawValue, body: ["type": ErrorType.invalidAccount.rawValue, "account": account])
    }
    accountServer.disconnect(topic)
  }
  
  @objc
  func sendSignature(_ requestInternalId: String, signature: String, account: String) {
    guard let accountServer = self.accountToWcServer[account] else {
      return sendEvent(withName: EventType.error.rawValue, body: ["type": ErrorType.invalidAccount.rawValue, "account": account])
    }
    
    accountServer.sendSignature(requestInternalId: requestInternalId, signature: signature)
  }
  
  @objc
  func changeChainId(_ topic: String, chainId: Int, account: String) {
    guard let accountServer = self.accountToWcServer[account] else {
      return sendEvent(withName: EventType.error.rawValue, body: ["type": ErrorType.invalidAccount.rawValue, "account": account])
    }
    guard let session: Session = accountServer.topicToSession[topic] else { return }
    
    accountServer.switchChainId(session: session, chainId: chainId)
  }
  
  @objc
  func rejectRequest(_ requestInternalId: String, account: String) {
    guard let accountServer = self.accountToWcServer[account] else {
      return sendEvent(withName: EventType.error.rawValue, body: ["type": ErrorType.invalidAccount.rawValue, "account": account])
    }
    
    accountServer.rejectRequest(requestInternalId: requestInternalId)
  }
  
  @objc override static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
