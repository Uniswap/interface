//
//  PrivateKeyDisplayManager.swift
//  Uniswap
//
//  Created by Chris Lee on 5/9/2025.
//
@objc(PrivateKeyDisplayManager)
class PrivateKeyDisplayManager: RCTViewManager {

  override func view() -> UIView! {
    return PrivateKeyDisplayView()
  }

  override class func requiresMainQueueSetup() -> Bool {
    true
  }
}
