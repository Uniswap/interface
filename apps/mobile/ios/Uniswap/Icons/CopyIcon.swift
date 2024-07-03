//
//  CopyIcon.swift
//  Uniswap
//
//  Created by Mateusz Łopaciński on 27/05/2024.
//

import SwiftUI

struct CopyIcon: Shape {
  func path(in rect: CGRect) -> Path {
    var path = Path()
    let width = rect.size.width
    let height = rect.size.height
    
    path.move(to: CGPoint(x: 0.875 * width, y: 0.40104167 * height))
    path.addLine(to: CGPoint(x: 0.875 * width, y: 0.765625 * height))
    path.addCurve(to: CGPoint(x: 0.765625 * width, y: 0.875 * height), control1: CGPoint(x: 0.875 * width, y: 0.828125 * height), control2: CGPoint(x: 0.828125 * width, y: 0.875 * height))
    path.addLine(to: CGPoint(x: 0.40104167 * width, y: 0.875 * height))
    path.addCurve(to: CGPoint(x: 0.29166667 * width, y: 0.765625 * height), control1: CGPoint(x: 0.33854167 * width, y: 0.875 * height), control2: CGPoint(x: 0.29166667 * width, y: 0.828125 * height))
    path.addLine(to: CGPoint(x: 0.29166667 * width, y: 0.40104167 * height))
    path.addCurve(to: CGPoint(x: 0.40104167 * width, y: 0.29166667 * height), control1: CGPoint(x: 0.29166667 * width, y: 0.33854167 * height), control2: CGPoint(x: 0.33854167 * width, y: 0.29166667 * height))
    path.addLine(to: CGPoint(x: 0.765625 * width, y: 0.29166667 * height))
    path.addCurve(to: CGPoint(x: 0.875 * width, y: 0.40104167 * height), control1: CGPoint(x: 0.828125 * width, y: 0.29166667 * height), control2: CGPoint(x: 0.875 * width, y: 0.33854167 * height))
    path.closeSubpath()
    
    path.move(to: CGPoint(x: 0.65625 * width, y: 0.125 * height))
    path.addCurve(to: CGPoint(x: 0.625 * width, y: 0.09375 * height), control1: CGPoint(x: 0.65625 * width, y: 0.109375 * height), control2: CGPoint(x: 0.640625 * width, y: 0.09375 * height))
    path.addLine(to: CGPoint(x: 0.234375 * width, y: 0.09375 * height))
    path.addCurve(to: CGPoint(x: 0.09375 * width, y: 0.234375 * height), control1: CGPoint(x: 0.14583333 * width, y: 0.09375 * height), control2: CGPoint(x: 0.09375 * width, y: 0.14583333 * height))
    path.addLine(to: CGPoint(x: 0.09375 * width, y: 0.625 * height))
    path.addCurve(to: CGPoint(x: 0.125 * width, y: 0.65625 * height), control1: CGPoint(x: 0.09375 * width, y: 0.640625 * height), control2: CGPoint(x: 0.109375 * width, y: 0.65625 * height))
    path.addCurve(to: CGPoint(x: 0.15625 * width, y: 0.625 * height), control1: CGPoint(x: 0.140625 * width, y: 0.65625 * height), control2: CGPoint(x: 0.15625 * width, y: 0.640625 * height))
    path.addLine(to: CGPoint(x: 0.15625 * width, y: 0.234375 * height))
    path.addCurve(to: CGPoint(x: 0.234375 * width, y: 0.15625 * height), control1: CGPoint(x: 0.15625 * width, y: 0.19270833 * height), control2: CGPoint(x: 0.19270833 * width, y: 0.15625 * height))
    path.addLine(to: CGPoint(x: 0.625 * width, y: 0.15625 * height))
    path.addCurve(to: CGPoint(x: 0.65625 * width, y: 0.125 * height), control1: CGPoint(x: 0.640625 * width, y: 0.15625 * height), control2: CGPoint(x: 0.65625 * width, y: 0.140625 * height))
    path.closeSubpath()
    
    return path
  }
}
