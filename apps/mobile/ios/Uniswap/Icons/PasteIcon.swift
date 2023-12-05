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
    path.move(to: CGPoint(x: 0.83332*width, y: 0.33333*height))
    path.addLine(to: CGPoint(x: 0.83332*width, y: 0.75*height))
    path.addCurve(to: CGPoint(x: 0.70832*width, y: 0.875*height), control1: CGPoint(x: 0.83332*width, y: 0.83333*height), control2: CGPoint(x: 0.79166*width, y: 0.875*height))
    path.addLine(to: CGPoint(x: 0.29166*width, y: 0.875*height))
    path.addCurve(to: CGPoint(x: 0.16666*width, y: 0.75*height), control1: CGPoint(x: 0.20832*width, y: 0.875*height), control2: CGPoint(x: 0.16666*width, y: 0.83333*height))
    path.addLine(to: CGPoint(x: 0.16666*width, y: 0.33333*height))
    path.addCurve(to: CGPoint(x: 0.26103*width, y: 0.21071*height), control1: CGPoint(x: 0.16666*width, y: 0.26075*height), control2: CGPoint(x: 0.19799*width, y: 0.21987*height))
    path.addCurve(to: CGPoint(x: 0.27082*width, y: 0.21921*height), control1: CGPoint(x: 0.26607*width, y: 0.20996*height), control2: CGPoint(x: 0.27082*width, y: 0.21412*height))
    path.addLine(to: CGPoint(x: 0.27082*width, y: 0.22913*height))
    path.addCurve(to: CGPoint(x: 0.39582*width, y: 0.35413*height), control1: CGPoint(x: 0.27082*width, y: 0.30496*height), control2: CGPoint(x: 0.31999*width, y: 0.35413*height))
    path.addLine(to: CGPoint(x: 0.60416*width, y: 0.35413*height))
    path.addCurve(to: CGPoint(x: 0.72916*width, y: 0.22913*height), control1: CGPoint(x: 0.67999*width, y: 0.35413*height), control2: CGPoint(x: 0.72916*width, y: 0.30496*height))
    path.addLine(to: CGPoint(x: 0.72916*width, y: 0.21921*height))
    path.addCurve(to: CGPoint(x: 0.73895*width, y: 0.21071*height), control1: CGPoint(x: 0.72916*width, y: 0.21412*height), control2: CGPoint(x: 0.73395*width, y: 0.20996*height))
    path.addCurve(to: CGPoint(x: 0.83332*width, y: 0.33333*height), control1: CGPoint(x: 0.80199*width, y: 0.21987*height), control2: CGPoint(x: 0.83332*width, y: 0.26075*height))
    path.closeSubpath()
    path.move(to: CGPoint(x: 0.39582*width, y: 0.29167*height))
    path.addLine(to: CGPoint(x: 0.60416*width, y: 0.29167*height))
    path.addCurve(to: CGPoint(x: 0.66666*width, y: 0.22917*height), control1: CGPoint(x: 0.64582*width, y: 0.29167*height), control2: CGPoint(x: 0.66666*width, y: 0.27083*height))
    path.addLine(to: CGPoint(x: 0.66666*width, y: 0.1875*height))
    path.addCurve(to: CGPoint(x: 0.60416*width, y: 0.125*height), control1: CGPoint(x: 0.66666*width, y: 0.14583*height), control2: CGPoint(x: 0.64582*width, y: 0.125*height))
    path.addLine(to: CGPoint(x: 0.39582*width, y: 0.125*height))
    path.addCurve(to: CGPoint(x: 0.33332*width, y: 0.1875*height), control1: CGPoint(x: 0.35416*width, y: 0.125*height), control2: CGPoint(x: 0.33332*width, y: 0.14583*height))
    path.addLine(to: CGPoint(x: 0.33332*width, y: 0.22917*height))
    path.addCurve(to: CGPoint(x: 0.39582*width, y: 0.29167*height), control1: CGPoint(x: 0.33332*width, y: 0.27083*height), control2: CGPoint(x: 0.35416*width, y: 0.29167*height))
    path.closeSubpath()
    return path
  }
}
