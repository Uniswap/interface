//
//  Logging.swift
//  WidgetsCore
//
//  Created by Eric Huang on 6/22/23.
//

import Foundation
import os.log
import WidgetKit

public extension Logger {
  private static var subsystem = Bundle.main.bundleIdentifier!
  
  /// Logs the view cycles like viewDidLoad.
  static let viewCycle = Logger(subsystem: subsystem, category: "viewcycle")
}

public struct Differences {
  var added: [WidgetInfoDecodable]
  var removed: [WidgetInfoDecodable]
}

public struct Metrics {
  // finds the difference between the 2 widgetInfoDecodable arrays, with duplicate elements
  static func findMultiDifferenceFromCache(current: [WidgetInfoDecodable], fromCached: [WidgetInfoDecodable]) -> Differences {
    var output = Differences(added: [], removed: [])
    var cachedElementCounts = [WidgetInfoDecodable:Int]()
    for cached in fromCached {
      cachedElementCounts[cached] = (cachedElementCounts[cached] ?? 0) + 1
    }
    for element in current {
      if (cachedElementCounts[element] == nil) {
        cachedElementCounts[element] = 0
      }
      cachedElementCounts[element]! -= 1
    }
    for (key, value) in cachedElementCounts {
      if (value > 0) {
        for _ in 1 ... value { output.removed.append(key) }
      }
      else if (value < 0) {
        for _ in 1 ... -value { output.added.append(key) }
      }
    }
    
    return output
  }
  
  public static func logWidgetConfigurationChange() {
    WidgetCenter.shared.getCurrentConfigurations { result in
      if case .success(let config) = result {
        let currConfig = WidgetDataConfiguration(config)
        let cachedConfig = UniswapUserDefaults.readConfiguration()
        let diff = findMultiDifferenceFromCache(current: currConfig.configuration, fromCached: cachedConfig.configuration)
        
        var widgetEvents = UniswapUserDefaults.readEventChanges()
        var newEvents = diff.added.map {WidgetEvent(family: $0.family, kind: $0.kind, change: .added)}
        newEvents.append(contentsOf: diff.removed.map {WidgetEvent(family: $0.family, kind: $0.kind, change: .removed)})
        widgetEvents.events.append(contentsOf: newEvents)
        UniswapUserDefaults.writeEventsChanges(data: widgetEvents)
        UniswapUserDefaults.writeConfiguration(data: currConfig)
      }
    }
  }
}
