//
//
// Constants.swift
//  WidgetsCore
//
//  Created by Eric Huang on 8/9/23.
//

import Foundation

public struct WidgetConstants {
  public static let ethereumChain = "ETHEREUM"
  public static let WETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
  public static let ethereumSymbol = "ETH"
  public static let currencyUsd = "USD"
  /// v2 data API placeholder for most chains' native token
  public static let zeroAddress = "0x0000000000000000000000000000000000000000"
  /// Older native-token placeholder still returned by some data API responses
  public static let legacyNativeAddress = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
}

// Needed to handle different bundle ids, cannot map directly but handles arbitrary bundle ids that conform to the existing convention
func getBuildVariantString(bundleId: String) -> String {
  let bundleComponents = bundleId.components(separatedBy: ".")
  if (bundleComponents.count > 3 && (bundleComponents[3] == "dev" || bundleComponents[3] == "beta")) {
    return bundleComponents[3]
  } else {
    return "prod"
  }
}
