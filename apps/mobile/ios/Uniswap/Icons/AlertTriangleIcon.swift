//
//  AlertTriangleIcon.swift
//  Uniswap
//
//  Created by Gary Ye on 9/16/23.
//

import SwiftUI

struct AlertTriangeIcon: Shape {
  func path(in rect: CGRect) -> Path {
    var path = Path()
    let width = rect.size.width
    let height = rect.size.height
    path.move(to: CGPoint(x: 0.90031*width, y: 0.71468*height))
    path.addLine(to: CGPoint(x: 0.62502*width, y: 0.19983*height))
    path.addCurve(to: CGPoint(x: 0.37502*width, y: 0.19983*height), control1: CGPoint(x: 0.57168*width, y: 0.10008*height), control2: CGPoint(x: 0.42839*width, y: 0.10008*height))
    path.addLine(to: CGPoint(x: 0.09973*width, y: 0.71468*height))
    path.addCurve(to: CGPoint(x: 0.22119*width, y: 0.91667*height), control1: CGPoint(x: 0.05081*width, y: 0.80617*height), control2: CGPoint(x: 0.11723*width, y: 0.91667*height))
    path.addLine(to: CGPoint(x: 0.77885*width, y: 0.91667*height))
    path.addCurve(to: CGPoint(x: 0.90031*width, y: 0.71468*height), control1: CGPoint(x: 0.88276*width, y: 0.91667*height), control2: CGPoint(x: 0.94923*width, y: 0.80613*height))
    path.closeSubpath()
    path.move(to: CGPoint(x: 0.46877*width, y: 0.41667*height))
    path.addCurve(to: CGPoint(x: 0.50002*width, y: 0.38542*height), control1: CGPoint(x: 0.46877*width, y: 0.39942*height), control2: CGPoint(x: 0.48277*width, y: 0.38542*height))
    path.addCurve(to: CGPoint(x: 0.53127*width, y: 0.41667*height), control1: CGPoint(x: 0.51727*width, y: 0.38542*height), control2: CGPoint(x: 0.53127*width, y: 0.39942*height))
    path.addLine(to: CGPoint(x: 0.53127*width, y: 0.58334*height))
    path.addCurve(to: CGPoint(x: 0.50002*width, y: 0.61459*height), control1: CGPoint(x: 0.53127*width, y: 0.60059*height), control2: CGPoint(x: 0.51727*width, y: 0.61459*height))
    path.addCurve(to: CGPoint(x: 0.46877*width, y: 0.58334*height), control1: CGPoint(x: 0.48277*width, y: 0.61459*height), control2: CGPoint(x: 0.46877*width, y: 0.60059*height))
    path.addLine(to: CGPoint(x: 0.46877*width, y: 0.41667*height))
    path.closeSubpath()
    path.move(to: CGPoint(x: 0.50085*width, y: 0.75*height))
    path.addCurve(to: CGPoint(x: 0.45897*width, y: 0.70834*height), control1: CGPoint(x: 0.47785*width, y: 0.75*height), control2: CGPoint(x: 0.45897*width, y: 0.73134*height))
    path.addCurve(to: CGPoint(x: 0.50043*width, y: 0.66667*height), control1: CGPoint(x: 0.45897*width, y: 0.68534*height), control2: CGPoint(x: 0.47743*width, y: 0.66667*height))
    path.addLine(to: CGPoint(x: 0.50085*width, y: 0.66667*height))
    path.addCurve(to: CGPoint(x: 0.54252*width, y: 0.70834*height), control1: CGPoint(x: 0.52389*width, y: 0.66667*height), control2: CGPoint(x: 0.54252*width, y: 0.68534*height))
    path.addCurve(to: CGPoint(x: 0.50085*width, y: 0.75*height), control1: CGPoint(x: 0.54252*width, y: 0.73134*height), control2: CGPoint(x: 0.52385*width, y: 0.75*height))
    path.closeSubpath()
    return path
  }
}
