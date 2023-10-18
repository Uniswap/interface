//
//  PasteIcon.swift
//  Uniswap
//
//  Created by Gary Ye on 9/19/23.
//

import SwiftUI

struct PasteIcon: Shape {
  func path(in rect: CGRect) -> Path {
    var path = Path()
    let width = rect.size.width
    let height = rect.size.height
    path.move(to: CGPoint(x: 0.5389*width, y: 0.08329*height))
    path.addLine(to: CGPoint(x: 0.26668*width, y: 0.08329*height))
    path.addCurve(to: CGPoint(x: 0.21168*width, y: 0.10769*height), control1: CGPoint(x: 0.24605*width, y: 0.08329*height), control2: CGPoint(x: 0.22627*width, y: 0.09207*height))
    path.addCurve(to: CGPoint(x: 0.1889*width, y: 0.16662*height), control1: CGPoint(x: 0.19709*width, y: 0.12332*height), control2: CGPoint(x: 0.1889*width, y: 0.14452*height))
    path.addLine(to: CGPoint(x: 0.1889*width, y: 0.83329*height))
    path.addCurve(to: CGPoint(x: 0.21168*width, y: 0.89221*height), control1: CGPoint(x: 0.1889*width, y: 0.85539*height), control2: CGPoint(x: 0.19709*width, y: 0.87659*height))
    path.addCurve(to: CGPoint(x: 0.26668*width, y: 0.91662*height), control1: CGPoint(x: 0.22627*width, y: 0.90784*height), control2: CGPoint(x: 0.24605*width, y: 0.91662*height))
    path.addLine(to: CGPoint(x: 0.73335*width, y: 0.91662*height))
    path.addCurve(to: CGPoint(x: 0.78834*width, y: 0.89221*height), control1: CGPoint(x: 0.75397*width, y: 0.91662*height), control2: CGPoint(x: 0.77375*width, y: 0.90784*height))
    path.addCurve(to: CGPoint(x: 0.81112*width, y: 0.83329*height), control1: CGPoint(x: 0.80293*width, y: 0.87659*height), control2: CGPoint(x: 0.81112*width, y: 0.85539*height))
    path.addLine(to: CGPoint(x: 0.81112*width, y: 0.37495*height))
    path.addLine(to: CGPoint(x: 0.5389*width, y: 0.08329*height))
    path.closeSubpath()
    path.move(to: CGPoint(x: 0.5389*width, y: 0.08329*height))
    path.addLine(to: CGPoint(x: 0.5389*width, y: 0.37495*height))
    path.addLine(to: CGPoint(x: 0.81112*width, y: 0.37495*height))
    return path
  }
}
