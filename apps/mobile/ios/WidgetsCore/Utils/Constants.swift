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
