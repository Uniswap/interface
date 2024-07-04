//
//  RelativeOffsetView.swift
//  Uniswap
//
//  Created by Mateusz Łopaciński on 18/06/2024.
//

import SwiftUI

struct RelativeOffsetView<Content: View>: View {
  var x: CGFloat
  var y: CGFloat
  var onOffsetCalculated: (CGFloat, CGFloat) -> Void
  var content: Content
  
  @State private var contentSize: CGSize = .zero
  
  init(x: CGFloat = 0, y: CGFloat = 0, onOffsetCalculated: @escaping (CGFloat, CGFloat) -> Void = { _, _ in }, @ViewBuilder content: () -> Content) {
    self.x = x
    self.y = y
    self.onOffsetCalculated = onOffsetCalculated
    self.content = content()
  }
  
  var body: some View {
    content
      .background(
        GeometryReader { geometry in
          Color.clear
            .onAppear {
              let offsetX = x * geometry.size.width
              let offsetY = y * geometry.size.height
              contentSize = geometry.size
              onOffsetCalculated(offsetX, offsetY)
            }
            .onChange(of: geometry.size) { newSize in
              let offsetX = x * newSize.width
              let offsetY = y * newSize.height
              contentSize = newSize
              onOffsetCalculated(offsetX, offsetY)
            }
        }
      )
      .offset(x: x * contentSize.width, y: y * contentSize.height)
  }
}
