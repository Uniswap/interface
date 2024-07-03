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
    path.move(to: CGPoint(x: 0.875*width, y: 0.26542*height))
    path.addLine(to: CGPoint(x: 0.875*width, y: 0.53541*height))
    path.addCurve(to: CGPoint(x: 0.87208*width, y: 0.5625*height), control1: CGPoint(x: 0.875*width, y: 0.54458*height), control2: CGPoint(x: 0.87416*width, y: 0.55375*height))
    path.addLine(to: CGPoint(x: 0.70333*width, y: 0.5625*height))
    path.addCurve(to: CGPoint(x: 0.5625*width, y: 0.70334*height), control1: CGPoint(x: 0.62541*width, y: 0.5625*height), control2: CGPoint(x: 0.5625*width, y: 0.62542*height))
    path.addLine(to: CGPoint(x: 0.5625*width, y: 0.87208*height))
    path.addCurve(to: CGPoint(x: 0.53542*width, y: 0.875*height), control1: CGPoint(x: 0.55375*width, y: 0.87417*height), control2: CGPoint(x: 0.54458*width, y: 0.875*height))
    path.addLine(to: CGPoint(x: 0.26583*width, y: 0.875*height))
    path.addCurve(to: CGPoint(x: 0.125*width, y: 0.73416*height), control1: CGPoint(x: 0.17166*width, y: 0.875*height), control2: CGPoint(x: 0.125*width, y: 0.82791*height))
    path.addLine(to: CGPoint(x: 0.125*width, y: 0.26542*height))
    path.addCurve(to: CGPoint(x: 0.26583*width, y: 0.125*height), control1: CGPoint(x: 0.125*width, y: 0.17167*height), control2: CGPoint(x: 0.17166*width, y: 0.125*height))
    path.addLine(to: CGPoint(x: 0.73417*width, y: 0.125*height))
    path.addCurve(to: CGPoint(x: 0.875*width, y: 0.26542*height), control1: CGPoint(x: 0.82834*width, y: 0.125*height), control2: CGPoint(x: 0.875*width, y: 0.17167*height))
    path.closeSubpath()
    path.move(to: CGPoint(x: 0.625*width, y: 0.70334*height))
    path.addLine(to: CGPoint(x: 0.625*width, y: 0.8425*height))
    path.addCurve(to: CGPoint(x: 0.635*width, y: 0.83375*height), control1: CGPoint(x: 0.62875*width, y: 0.84*height), control2: CGPoint(x: 0.63167*width, y: 0.83709*height))
    path.addLine(to: CGPoint(x: 0.83375*width, y: 0.635*height))
    path.addCurve(to: CGPoint(x: 0.8425*width, y: 0.625*height), control1: CGPoint(x: 0.83709*width, y: 0.63167*height), control2: CGPoint(x: 0.84*width, y: 0.62875*height))
    path.addLine(to: CGPoint(x: 0.70333*width, y: 0.625*height))
    path.addCurve(to: CGPoint(x: 0.625*width, y: 0.70334*height), control1: CGPoint(x: 0.65999*width, y: 0.625*height), control2: CGPoint(x: 0.625*width, y: 0.66*height))
    path.closeSubpath()
    return path
  }
}
