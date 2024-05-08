//
//  RNWidgets.swift
//  Uniswap
//
//  Created by Eric Huang on 8/2/23.
//

import Foundation
import WidgetKit

@objc(RNWidgets)
class RNWidgets: NSObject {
  
  @objc
  func hasWidgetsInstalled(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    WidgetCenter.shared.getCurrentConfigurations() { result in
      if case .success(let config) = result {
        resolve(config.count > 0)
      } else {
        resolve(false)
      }
    }
  }
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
