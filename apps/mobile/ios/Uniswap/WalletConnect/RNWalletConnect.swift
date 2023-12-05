//
//  RNWalletConnect.swift
//  Uniswap
//
//  Created by Tina Zheng on 3/4/22.
//

import Foundation

// Used to return to previously opened app (wallet to dapp in mobile browser)
@objc private protocol PrivateSelectors: NSObjectProtocol {
    var destinations: [NSNumber] { get }
    func sendResponseForDestination(_ destination: NSNumber)
}

@objc(RNWalletConnect)
class RNWalletConnect: NSObject {
  
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
  
  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
}
