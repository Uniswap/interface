//
//  UserDefaults.swift
//  WidgetsCore
//
//  Created by Eric Huang on 7/6/23.
//

import Foundation
import OSLog
import WidgetKit

let APP_GROUP = "group.com.uniswap.widgets"

public struct WidgetDataFavorites: Decodable {
  
  public init(_ favorites: [TokenInput]) {
    self.favorites = favorites
  }
  
  public var favorites: [TokenInput]
}

public struct TokenInput: Decodable {
  public var address: String?
  public var chain: String
}

public struct WidgetDataAccounts: Decodable {
  
  public init(_ accounts: [Account]) {
    self.accounts = accounts
  }
  
  public var accounts: [Account]
}

public struct WidgetDataI18n: Decodable {
  
  public init() {
    self.locale = "en"
    self.currency = WidgetConstants.currencyUsd
  }
  
  public var locale: String
  public var currency: String
}

public struct Account: Decodable {
  public var address: String
  public var name: String?
  public var isSigner: Bool
}

public struct WidgetDataConfiguration: Codable {
  
  public init(_ widgetInfos: [WidgetInfo]) {
    configuration = widgetInfos.map { WidgetInfoDecodable($0) }
  }
  
  public var configuration: [WidgetInfoDecodable]
}

public struct WidgetInfoDecodable: Hashable, Codable {
  
  public init(_ widgetInfo: WidgetInfo) {
    family = widgetInfo.family.description
    kind = widgetInfo.kind
  }
  
  public let family: String
  public let kind: String
  
  static public func == (lhs: WidgetInfoDecodable, rhs: WidgetInfoDecodable) -> Bool {
    
    return lhs.family == rhs.family && lhs.kind == rhs.kind
  }
}

public struct WidgetEvents: Codable {
  public var events: [WidgetEvent]
}

public struct WidgetEvent: Codable {
  public let family: String
  public let kind: String
  public let change: Change
}

public enum Change: String, Codable {
  case added = "added"
  case removed = "removed"
}

public struct UniswapUserDefaults {
  private static var buildString = getBuildVariantString(bundleId: Bundle.main.bundleIdentifier!)
  
  static let keyEvents = buildString + ".widgets.configuration.events"
  static let keyCache = buildString + ".widgets.configuration.cache"
  static let keyFavorites = buildString + ".widgets.favorites"
  static let keyAccounts = buildString + ".widgets.accounts"
  static let keyI18n = buildString + ".widgets.i18n"
  
  static let userDefaults = UserDefaults.init(suiteName: APP_GROUP)
  
  static func readData(key: String) -> Data? {
    // parses data from user defaults
    guard let userDefaults = userDefaults else {
      return nil
    }
    guard let savedData = userDefaults.string(forKey: key) else {
      return nil
    }
    let data = savedData.data(using: .utf8)
    return data
  }
  
  public static func readAccounts() -> WidgetDataAccounts {
    let data = readData(key: keyAccounts)
    guard let data = data else {
      return WidgetDataAccounts([])
    }
    let decoder = JSONDecoder()
    guard let parsedData = try? decoder.decode(WidgetDataAccounts.self, from: data) else {
      // case when failing to parse
      return WidgetDataAccounts([])
    }
    return parsedData
  }
  
  public static func readFavorites() -> WidgetDataFavorites {
    let data = readData(key: keyFavorites)
    guard let data = data else {
      return WidgetDataFavorites([])
    }
    let decoder = JSONDecoder()
    guard let parsedData = try? decoder.decode(WidgetDataFavorites.self, from: data) else {
      // case when failing to parse
      return WidgetDataFavorites([])
    }
    return parsedData
  }
  
  public static func readI18n() -> WidgetDataI18n {
    let data = readData(key: keyI18n)
    guard let data = data else {
      return WidgetDataI18n()
    }
    let decoder = JSONDecoder()
    guard let parsedData = try? decoder.decode(WidgetDataI18n.self, from: data) else {
      return WidgetDataI18n()
    }
    return parsedData
  }
  
  public static func readConfiguration() -> WidgetDataConfiguration {
    let data = readData(key: keyCache)
    guard let data = data else {
      return WidgetDataConfiguration([])
    }
    let decoder = JSONDecoder()
    guard let parsedData = try? decoder.decode(WidgetDataConfiguration.self, from: data) else {
      // case when failing to parse
      return WidgetDataConfiguration([])
    }
    return parsedData
  }
  
  public static func writeConfiguration(data: WidgetDataConfiguration) {
    if userDefaults != nil {
      let encoder = JSONEncoder()
      let JSONdata = try! encoder.encode(data)
      let json = String(data: JSONdata, encoding: String.Encoding.utf8)
      userDefaults!.set(json, forKey: keyCache)
    }
  }
  
  public static func readEventChanges() -> WidgetEvents {
    let data = readData(key: keyEvents)
    guard let data = data else {
      return WidgetEvents(events: [])
    }
    let decoder = JSONDecoder()
    guard let parsedData = try? decoder.decode(WidgetEvents.self, from: data) else {
      // case when failing to parse
      return WidgetEvents(events: [])
    }
    return parsedData
  }
  
  public static func writeEventsChanges(data: WidgetEvents) {
    if userDefaults != nil {
      let encoder = JSONEncoder()
      let JSONdata = try! encoder.encode(data)
      let json = String(data: JSONdata, encoding: String.Encoding.utf8)
      userDefaults!.set(json, forKey: keyEvents)
    }
  }
}
