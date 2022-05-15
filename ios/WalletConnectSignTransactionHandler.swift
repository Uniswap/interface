//
//  WalletConnectSignTransactionHandler.swift
//  Uniswap
//
//  Created by Tina Zheng on 5/3/22.
//

import Foundation
import WalletConnectSwift

class WalletConnectSignTransactionHandler: RequestHandler {
  var accountServer: WalletConnectAccountServer!
  var eventEmitter: RCTEventEmitter!
  
  private var account: String!
  
  init(eventEmitter: RCTEventEmitter, accountServer: WalletConnectAccountServer, account: String) {
    self.eventEmitter = eventEmitter
    self.accountServer = accountServer
    self.account = account
  }
  
  func canHandle(request: Request) -> Bool {
    return request.method == EthMethod.signTransaction.rawValue || request.method == EthMethod.sendTransaction.rawValue
  }
  
  func handle(request: Request) {
    let internalId = UUID().uuidString
    self.accountServer.setPendingRequest(request: request, internalId: internalId)
    
    do {
      let session = try self.accountServer.getSessionFromTopic(request.url.topic)
      let icons = session.dAppInfo.peerMeta.icons
      let transaction = try request.parameter(of: EthereumTransaction.self, at: 0)

      self.eventEmitter.sendEvent(
        withName: EventType.transactionRequest.rawValue, body: [
          "type": request.method,
          "request_internal_id": internalId,
          "account": self.account!,
          "transaction": [
            "data": transaction.data,
            "from": transaction.from,
            "to": transaction.to,
            "gas": transaction.gas,
            "gas_price": transaction.gasPrice,
            "value": transaction.value,
            "nonce": transaction.nonce,
          ],
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
      self.accountServer.server.send(.invalid(request))
    }
  }
}

struct EthereumTransaction: Decodable {
  let data: String?
  let from: String?
  let to: String
  let gas: String?
  let gasPrice: String?
  let value: String?
  let nonce: String?
}

