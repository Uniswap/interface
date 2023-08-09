//
//  Colors.swift
//  WidgetsCore
//
//  Created by Eric Huang on 7/17/23.
//

import Foundation
import SwiftUI
import UIImageColors

public extension Color {
  static let widgetGrey = Color(red: 0.96, green: 0.96, blue: 0.99).opacity(0.5)
  static let widgetLightGrey = Color(red: 0.96, green: 0.96, blue: 0.99).opacity(0.72)
  static let widgetTokenShadow = Color(red: 0.13, green: 0.13, blue: 0.13).opacity(0.08)
  
  static let WBTC = Color(red: 0.94, green: 0.57, blue: 0.25)
  static let DAI = Color(red: 0.98, green: 0.69, blue: 0.11)
  static let BUSD = Color(red: 0.94, green: 0.73, blue: 0.04)
  static let X = Color(red: 0.16, green: 0.63, blue: 0.94)
  static let ETH = Color(red: 0.29, green: 0.42, blue: 0.83)
  static let HARRYPOTTERBITCOIN = Color(red: 0.86, green: 0.19, blue: 0.04)
  static let PEPE = Color(red: 0.24, green: 0.68, blue: 0.08)
  static let UNI = Color(red: 0.90, green: 0.21, blue: 0.55)
  static let UNIBOT = Color(red: 0.29, green: 0.05, blue: 0.31)
  static let USDT = Color(red: 0.31, green: 0.7, blue: 0.59)
  static let USDC = Color(red: 0, green: 0.4, blue: 0.85)
  static let HEX = Color(red: 0.97, green: 0.25, blue: 0.55)
  static let MONG = Color(red: 0.64, green: 0.34, blue: 1)
  static let ARB = Color(red: 0.16, green: 0.63, blue: 0.94)
  static let SHIB = Color(red: 0.86, green: 0.19, blue: 0.04)
  static let QNT = Color.black
  static let XEN = Color.black
  static let PSYOP = Color(red: 0.91, green: 0.57, blue: 0)
  static let MATIC = Color(red: 0.64, green: 0.34, blue: 1)
  static let POOH = Color(red: 0.21, green: 0.45, blue: 0.26)
  static let TURBO = Color(red: 0.74, green: 0.43, blue: 0.16)
  static let AIDOGE = Color(red: 0.16, green: 0.63, blue: 0.94)
  static let SIMPSON = Color(red: 0.91, green: 0.57, blue: 0)
  static let RENQ = Color(red: 0.18, green: 0.52, blue: 1)
  static let APE = Color(red: 0.01, green: 0.29, blue: 0.84)
  
  static let magentaVibrant = Color(red: 0.99, green: 0.45, blue: 1.00)
  static let backgroundGray = Color.gray
  static let surface1 = Color(red: 0.075, green: 0.075, blue: 0.075)
}

extension UIColor {
  // Calculates contrast between two colors
  // https://www.w3.org/TR/WCAG20-TECHS/G18.html#G18-tests
  static func contrastRatio(between color1: UIColor, and color2: UIColor) -> CGFloat {
    let luminance1 = color1.luminance()
    let luminance2 = color2.luminance()
    let luminanceDarker = min(luminance1, luminance2)
    let luminanceLighter = max(luminance1, luminance2)
    return (luminanceLighter + 0.05) / (luminanceDarker + 0.05)
  }
  // Calculates color luminance
  // https://www.w3.org/TR/WCAG20-TECHS/G18.html#G18-tests
  func luminance() -> CGFloat {
    let ciColor = CIColor(color: self)
    func adjust(colorComponent: CGFloat) -> CGFloat {
      return (colorComponent < 0.04045) ? (colorComponent / 12.92) : pow((colorComponent + 0.055) / 1.055, 2.4)
    }
    return 0.2126 * adjust(colorComponent: ciColor.red) + 0.7152 * adjust(colorComponent: ciColor.green) + 0.0722 * adjust(colorComponent: ciColor.blue)
  }
  
  // Color comparators
  // https://stackoverflow.com/a/44246991
  static func == (l: UIColor, r: UIColor) -> Bool {
    var r1: CGFloat = 0
    var g1: CGFloat = 0
    var b1: CGFloat = 0
    var a1: CGFloat = 0
    l.getRed(&r1, green: &g1, blue: &b1, alpha: &a1)
    var r2: CGFloat = 0
    var g2: CGFloat = 0
    var b2: CGFloat = 0
    var a2: CGFloat = 0
    r.getRed(&r2, green: &g2, blue: &b2, alpha: &a2)
    return r1 == r2 && g1 == g2 && b1 == b2 && a1 == a2
  }
}

public struct ColorExtraction {
  
  static let contrastThresh = 1.95
  static let defaultColor = Color.magentaVibrant
  
  static let specialCaseTokenColors: [String: UIColor] = [
    // old WBTC
    "https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png":
      UIColor(Color.WBTC),
    // new WBTC
    "https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png?1548822744":
      UIColor(Color.WBTC),
    // DAI
    "https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png":
      UIColor(Color.DAI),
    // UNI
    "https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png":
      UIColor(Color.UNI),
    // BUSD
    "https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x4Fabb145d64652a948d72533023f6E7A623C7C53/logo.png":
      UIColor(Color.BUSD),
    // AI-X
    "https://s2.coinmarketcap.com/static/img/coins/64x64/26984.png":
      UIColor(Color.X),
    // ETH
    "https://token-icons.s3.amazonaws.com/eth.png":
      UIColor(Color.ETH),
    // HARRYPOTTERSHIBAINUBITCOIN
    "https://assets.coingecko.com/coins/images/30323/large/hpos10i_logo_casino_night-dexview.png?1684117567":
      UIColor(Color.HARRYPOTTERBITCOIN),
    // PEPE
    "https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x6982508145454Ce325dDbE47a25d4ec3d2311933/logo.png":
      UIColor(Color.PEPE),
    // APE
    "https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x4d224452801ACEd8B2F0aebE155379bb5D594381/logo.png":
      UIColor(Color.APE),
    // UNIBOT v2
    "https://s2.coinmarketcap.com/static/img/coins/64x64/25436.png":
      UIColor(Color.UNIBOT),
    // UNIBOT v1
    "https://assets.coingecko.com/coins/images/30462/small/logonoline_%281%29.png?1687510315":
      UIColor(Color.UNIBOT),
    // USDT
    "https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png":
      UIColor(Color.USDT),
    // USDC
    "https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png":
      UIColor(Color.USDC),
    // HEX
    "https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39/logo.png":
      UIColor(Color.HEX),
    // MONG
    "https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x1ce270557C1f68Cfb577b856766310Bf8B47FD9C/logo.png":
      UIColor(Color.MONG),
    // ARB
    "https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xB50721BCf8d664c30412Cfbc6cf7a15145234ad1/logo.png":
      UIColor(Color.ARB),
    
  ]
  
  static func passesContrast(
    color: UIColor,
    backgroundColor: UIColor,
    contrastThreshold: Double
  ) -> Bool {
    // sometimes the extracted colors come back as white or black, discard those
    if (color == UIColor.white || color == UIColor.black) {
      return false
    }
    
    let contrast = UIColor.contrastRatio(between: color, and: backgroundColor)
    return contrast >= contrastThreshold
  }
  
  static func pickContrastPassingColor(colors: [UIColor?]) -> UIColor {
    for color in colors {
      if let value = color {
        if passesContrast(color: value, backgroundColor: UIColor.white, contrastThreshold: contrastThresh) {
          return value
        }
      }
    }
    return UIColor(defaultColor)
  }
  
  public static func extractImageColor(imageURL: String) -> UIColor {
    let image = UIImage(url: URL(string: imageURL)) ?? UIImage()
    let colors = image.getColors()
    let colorsArray = [colors?.background, colors?.primary, colors?.detail, colors?.secondary]
    return pickContrastPassingColor(colors: colorsArray)
  }
  
  public static func extractImageColorWithSpecialCase(imageURL: String) -> UIColor {
    if let color = specialCaseTokenColors[imageURL] {
      return color
    }
    return extractImageColor(imageURL: imageURL)
  }
  
}
