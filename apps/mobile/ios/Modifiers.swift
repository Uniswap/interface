//
//  Modifiers.swift
//  Uniswap
//
//  Created by Mateusz Łopaciński on 05/06/2024.
//

import SwiftUI

struct RelativeOffsetModifier: ViewModifier {
  var x: CGFloat
  var y: CGFloat
  var onOffsetCalculated: (CGFloat, CGFloat) -> Void
  
  @State private var contentSize: CGSize = .zero
  
  func body(content: Content) -> some View {
    content
      .background(
        GeometryReader { geometry -> Color in
          DispatchQueue.main.async {
            // Calculate the offsets based on the size of the content
            let offsetX = x * geometry.size.width
            let offsetY = y * geometry.size.height
            // Update the content size state
            contentSize = geometry.size
            // Invoke the callback with the calculated offsets
            onOffsetCalculated(offsetX, offsetY)
          }
          return Color.clear
        }
      )
      .offset(x: x * contentSize.width, y: y * contentSize.height)
  }
}

extension View {
  func relativeOffset(x: CGFloat = 0, y: CGFloat = 0, onOffsetCalculated: @escaping (CGFloat, CGFloat) -> Void = { _, _ in }) -> some View {
    self.modifier(RelativeOffsetModifier(x: x, y: y, onOffsetCalculated: onOffsetCalculated))
  }
}
