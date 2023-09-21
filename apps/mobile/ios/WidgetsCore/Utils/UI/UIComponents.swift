//
//  UIComponents.swift
//  WidgetsCore
//
//  Created by Eric Huang on 7/14/23.
//

import Foundation
import UIKit
import SwiftUI

public extension UIImage {
  // Constructor for creating UIImages from a URL
  convenience init?(url: URL?) {
    guard let url = url else { return nil }
    
    do {
      self.init(data: try Data(contentsOf: url))
    } catch {
      return nil
    }
  }
}

public struct PricePercentChangeTextWithIcon: View {
  public var pricePercentChange: Double?
  
  public init(pricePercentChange: Double?) {
    self.pricePercentChange = pricePercentChange
  }
  
  public var body: some View {
    HStack(alignment: .center) {
      if let pricePercentChange = pricePercentChange {
        if (pricePercentChange >= 0) {
          Image("caret-up")
          Text("\(pricePercentChange, specifier: "%.2f")%")
            .withHeading2Style()
        } else {
          Image("caret-up").rotationEffect(.degrees(-180))
          Text("\(-pricePercentChange, specifier: "%.2f")%")
            .withHeading2Style()
        }
      } else {
        Text("--")
          .withHeading2Style()
      }
    }
  }
}

public struct Placeholder {
  static let placeholderGradient = LinearGradient(
    stops: [
      Gradient.Stop(color: .widgetLightGrey.opacity(0.12), location: 0.00),
      Gradient.Stop(color: .widgetLightGrey.opacity(0.05), location: 1.00),
    ],
    startPoint: UnitPoint(x: 0.13, y: 0.5),
    endPoint: UnitPoint(x: 0.94, y: 0.5)
  )
  
  public static func Circle(width: Double, height: Double) -> some View {
    return SwiftUI.Circle()
      .frame(width: width, height: height)
      .foregroundStyle(placeholderGradient)
  }
  
  public static func Rectangle(width: Double, height: Double) -> some View {
    return SwiftUI.Rectangle()
      .frame(width: width, height: height)
      .foregroundStyle(placeholderGradient)
      .cornerRadius(6)
  }
}


