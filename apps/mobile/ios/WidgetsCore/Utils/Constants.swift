//
//
// Constants.swift
//  WidgetsCore
//
//  Created by Eric Huang on 8/9/23.
//

import Foundation

public struct WidgetConstants {
  public static let ethereumChainId = 1
  public static let WETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
  public static let ethereumSymbol = "ETH"
  public static let currencyUsd = "USD"
  /// v2 data API placeholder for most chains' native token
  public static let zeroAddress = "0x0000000000000000000000000000000000000000"
  /// Older native-token placeholder still returned by some data API responses
  public static let legacyNativeAddress = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
}

/// Legacy chain-name strings (e.g. `ETHEREUM`) that app versions before chain ids wrote to widget
/// favorites and that already-configured widgets still carry in their saved `IntentToken.chain`.
/// Both outlive an app update until the app is next opened (favorites) or the widget is reconfigured
/// (intents), so this table is read-only and frozen: never add chains to it.
public enum LegacyChainNames {
  private static let chainIdByName: [String: Int] = [
    "ARBITRUM": 42161,
    "ARC": 5042,
    "ASTROCHAIN_SEPOLIA": 1301,
    "AVALANCHE": 43114,
    "BASE": 8453,
    "BNB": 56,
    "CELO": 42220,
    "ETHEREUM": 1,
    "ETHEREUM_SEPOLIA": 11155111,
    "INK": 57073,
    "LINEA": 59144,
    "MEGAETH": 4326,
    "MONAD": 143,
    "OPTIMISM": 10,
    "POLYGON": 137,
    "ROBINHOOD": 4663,
    "SOLANA": 501000101,
    "SONEIUM": 1868,
    "TEMPO": 4217,
    "UNICHAIN": 130,
    "WORLDCHAIN": 480,
    "XLAYER": 196,
    "ZKSYNC": 324,
    "ZORA": 7777777,
  ]

  public static func chainId(forName name: String?) -> Int? {
    return name.flatMap { chainIdByName[$0] }
  }

  static func name(forChainId chainId: Int) -> String? {
    return chainIdByName.first { $0.value == chainId }?.key
  }
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
