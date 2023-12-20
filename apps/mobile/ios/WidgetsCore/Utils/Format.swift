//
//  Format.swift
//  WidgetsCore
//
//  Created by Eric Huang on 7/24/23.
//
import Foundation

extension NumberFormatter {
  
  // Based on https://www.notion.so/uniswaplabs/Number-standards-fbb9f533f10e4e22820722c2f66d23c0
  // React native code: https://github.com/Uniswap/universe/blob/main/packages/wallet/src/utils/format.ts
  public static func SHORTHAND_USD_TWO_DECIMALS(price: Double) -> String {
    let formatter = NumberFormatter()
    formatter.numberStyle = .currency
    formatter.maximumFractionDigits = 2
    formatter.minimumFractionDigits = 2
    formatter.currencyCode = "USD"
    
    if (price < 1000000){
      return TWO_DECIMALS_USD.string(for: price)!
    }
    else if (price < 1000000000){
      return "\(formatter.string(for: price/1000000)!)M"
    }
    else if (price < 1000000000000){
      return "\(formatter.string(for: price/1000000000)!)B"
    }
    else if (price < 1000000000000000){
      return "\(formatter.string(for: price/1000000000000)!)T"
    }
    else {
      return "$>999T"
    }
  }
  
  public static var TWO_DECIMALS_USD: NumberFormatter = {
    let formatter = NumberFormatter()
    formatter.numberStyle = .currency
    formatter.maximumFractionDigits = 2
    formatter.minimumFractionDigits = 2
    formatter.currencyCode = "USD"
    return formatter
  }()
  
  public static var THREE_SIG_FIGS_USD: NumberFormatter = {
    let formatter = NumberFormatter()
    formatter.numberStyle = .currency
    formatter.maximumSignificantDigits = 3
    formatter.minimumSignificantDigits = 3
    formatter.currencyCode = "USD"
    return formatter
  }()
  
  public static var THREE_DECIMALS_USD: NumberFormatter = {
    let formatter = NumberFormatter()
    formatter.numberStyle = .currency
    formatter.maximumFractionDigits = 3
    formatter.minimumFractionDigits = 3
    formatter.currencyCode = "USD"
    return formatter
  }()
  
  public static func fiatTokenDetailsFormatter(price: Double?) -> String {
    guard let price = price else {
      return "--.--"
    }
    if (price < 0.00000001) {
      return "<$0.00000001"
    }
    else if (price < 0.01) {
      return THREE_SIG_FIGS_USD.string(for: price)!
    }
    else if (price < 1.05) {
      return THREE_DECIMALS_USD.string(for: price)!
    }
    else if (price < 1e6) {
      return TWO_DECIMALS_USD.string(for: price)!
    }
    else {
      return SHORTHAND_USD_TWO_DECIMALS(price: price)
    }
    
  }
}
