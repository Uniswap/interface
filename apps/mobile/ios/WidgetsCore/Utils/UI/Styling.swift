//
//  Styling.swift
//  UniswapWidgetsCore
//
//  Created by Eric Huang on 7/17/23.
//

import Foundation
import SwiftUI

public extension Text {
  func withHeading1Style() -> some View {
    self.font(.custom("Basel-Book", size: 28))
      .foregroundColor(.white)
  }
  
  func withHeading2Style() -> some View {
    self.font(.custom("Basel-Book", size: 20))
      .foregroundColor(.widgetLightGrey)
  }
  
  func withHeading3Style() -> some View {
    self.font(.custom("Basel", size: 12))
      .fontWeight(.medium)
      .foregroundColor(.widgetGrey)
  }
}

public extension Image {
  func withIconStyle(background: Color, border: Color) -> some View {
    self.resizable()
      .frame(width: 40, height: 40)
      .background(background)
      .clipShape(Circle())
         .overlay(
          Circle().stroke(border, lineWidth: 0.5))
      .shadow(color: .widgetTokenShadow, radius: 5, x: 0, y: 2)
  }
}

public extension View {
  func withMaxFrame() -> some View {
    self.frame(
      maxWidth: .infinity,
      maxHeight: .infinity,
      alignment: .topLeading
    )
  }
}
