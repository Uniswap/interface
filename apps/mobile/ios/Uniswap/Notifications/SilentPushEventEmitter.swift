//
//  SilentPushEventEmitter.swift
//  Uniswap
//
//  Created by John Short on 9/29/25.
//

import React

@objc(SilentPushEventEmitter)
open class SilentPushEventEmitter: RCTEventEmitter {

  public static weak var emitter: RCTEventEmitter?

  override init() {
    super.init()
    SilentPushEventEmitter.emitter = self
  }

  open override func supportedEvents() -> [String] {
    ["SilentPushReceived"]
  }

  @objc(emitEventWithPayload:)
  public static func emitEvent(with payload: [String: Any]) {
    guard let emitter = emitter else {
      return
    }
    emitter.sendEvent(withName: "SilentPushReceived", body: payload)
  }
}
