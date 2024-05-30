//
//  Format.swift
//  WidgetsCore
//
//  Created by Eric Huang on 7/24/23.
//
import Foundation

// Based on https://www.notion.so/uniswaplabs/Number-standards-fbb9f533f10e4e22820722c2f66d23c0
// React native code: https://github.com/Uniswap/universe/blob/main/packages/wallet/src/utils/format.ts
extension NumberFormatter {
  
  static func formatShorthandWithDecimals(number: Double, fractionDigits: Int, locale: Locale, currencyCode: String, placeholder: String) -> String {
    if (number < 1000000) {
      return formatWithDecimals(number: number, fractionDigits: fractionDigits, locale: locale, currencyCode: currencyCode)
    }
    let maxNumber = 1000000000000000.0
    let maxed = number >= maxNumber
    let limitedNumber = maxed ? maxNumber : number

    // Replace when Swift supports notation configuration for currency
    // https://developer.apple.com/documentation/foundation/currencyformatstyleconfiguration
    let compactFormatted =   limitedNumber.formatted(.number.locale(locale).precision(.fractionLength(fractionDigits)).notation(.compactName))
    let currencyFormatted = limitedNumber.formatted(.currency(code: currencyCode).locale(locale).precision(.fractionLength(fractionDigits)).grouping(.never))
    
    guard let numberRegex = try? NSRegularExpression(pattern: "(\\d+(\\\(locale.decimalSeparator!)\\d+)?)") else {
      return placeholder
    }
    let output = numberRegex.stringByReplacingMatches(in: currencyFormatted, range: NSMakeRange(0, currencyFormatted.count), withTemplate: compactFormatted)
    
    return maxed ? ">\(output)" : "\(output)"
  }
  
  static func formatWithDecimals(number: Double, fractionDigits: Int, locale: Locale, currencyCode: String) -> String {
    return number.formatted(.currency(code: currencyCode).locale(locale).precision(.fractionLength(fractionDigits)))
  }
  
  static func formatWithSigFigs(number: Double, sigFigsDigits: Int, locale: Locale, currencyCode: String) -> String {
    return number.formatted(.currency(code: currencyCode).locale(locale).precision(.significantDigits(sigFigsDigits)))
  }
  
  public static func fiatTokenDetailsFormatter(price: Double?, locale: Locale, currencyCode: String) -> String {
    let placeholder =  "--.--"
    
    guard let price = price else {
      return placeholder
    }
    
    if (price < 0.00000001) {
      let formattedPrice = formatWithDecimals(number: price, fractionDigits: 8, locale: locale, currencyCode: currencyCode)
      return "<\(formattedPrice)"
    }

    if (price < 0.01) {
      return formatWithSigFigs(number: price, sigFigsDigits: 3, locale: locale, currencyCode: currencyCode)
    } else if (price < 1.05) {
      return formatWithDecimals(number: price, fractionDigits: 3, locale: locale, currencyCode: currencyCode)
    } else if (price < 1e6) {
      return formatWithDecimals(number: price, fractionDigits: 2, locale: locale, currencyCode: currencyCode)
    } else {
      return formatShorthandWithDecimals(number: price, fractionDigits: 2, locale: locale, currencyCode: currencyCode, placeholder: placeholder)
    }
  }
}
