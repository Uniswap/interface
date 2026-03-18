//
//  CopyIcon.swift
//  Uniswap
//
//  Created by Mateusz Łopaciński on 27/05/2024.
//

import SwiftUI

struct CopyIconOutline: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        let width = rect.size.width
        let height = rect.size.height
        path.move(to: CGPoint(x: 0.75298*width, y: 0.26042*height))
        path.addLine(to: CGPoint(x: 0.40575*width, y: 0.26042*height))
        path.addCurve(to: CGPoint(x: 0.27183*width, y: 0.40104*height), control1: CGPoint(x: 0.31937*width, y: 0.26042*height), control2: CGPoint(x: 0.27183*width, y: 0.31033*height))
        path.addLine(to: CGPoint(x: 0.27183*width, y: 0.76563*height))
        path.addCurve(to: CGPoint(x: 0.40575*width, y: 0.90625*height), control1: CGPoint(x: 0.27183*width, y: 0.85633*height), control2: CGPoint(x: 0.31937*width, y: 0.90625*height))
        path.addLine(to: CGPoint(x: 0.75298*width, y: 0.90625*height))
        path.addCurve(to: CGPoint(x: 0.8869*width, y: 0.76563*height), control1: CGPoint(x: 0.83937*width, y: 0.90625*height), control2: CGPoint(x: 0.8869*width, y: 0.85633*height))
        path.addLine(to: CGPoint(x: 0.8869*width, y: 0.40104*height))
        path.addCurve(to: CGPoint(x: 0.75298*width, y: 0.26042*height), control1: CGPoint(x: 0.8869*width, y: 0.31033*height), control2: CGPoint(x: 0.83937*width, y: 0.26042*height))
        path.closeSubpath()
        path.move(to: CGPoint(x: 0.82738*width, y: 0.76563*height))
        path.addCurve(to: CGPoint(x: 0.75298*width, y: 0.84375*height), control1: CGPoint(x: 0.82738*width, y: 0.82112*height), control2: CGPoint(x: 0.80583*width, y: 0.84375*height))
        path.addLine(to: CGPoint(x: 0.40575*width, y: 0.84375*height))
        path.addCurve(to: CGPoint(x: 0.33135*width, y: 0.76563*height), control1: CGPoint(x: 0.3529*width, y: 0.84375*height), control2: CGPoint(x: 0.33135*width, y: 0.82112*height))
        path.addLine(to: CGPoint(x: 0.33135*width, y: 0.40104*height))
        path.addCurve(to: CGPoint(x: 0.40575*width, y: 0.32292*height), control1: CGPoint(x: 0.33135*width, y: 0.34554*height), control2: CGPoint(x: 0.3529*width, y: 0.32292*height))
        path.addLine(to: CGPoint(x: 0.75298*width, y: 0.32292*height))
        path.addCurve(to: CGPoint(x: 0.82738*width, y: 0.40104*height), control1: CGPoint(x: 0.80583*width, y: 0.32292*height), control2: CGPoint(x: 0.82738*width, y: 0.34554*height))
        path.addLine(to: CGPoint(x: 0.82738*width, y: 0.76563*height))
        path.closeSubpath()
        path.move(to: CGPoint(x: 0.17262*width, y: 0.23417*height))
        path.addLine(to: CGPoint(x: 0.17262*width, y: 0.59916*height))
        path.addCurve(to: CGPoint(x: 0.1981*width, y: 0.66546*height), control1: CGPoint(x: 0.17262*width, y: 0.64909*height), control2: CGPoint(x: 0.19179*width, y: 0.66137*height))
        path.addCurve(to: CGPoint(x: 0.20793*width, y: 0.70842*height), control1: CGPoint(x: 0.21215*width, y: 0.67446*height), control2: CGPoint(x: 0.2165*width, y: 0.69371*height))
        path.addCurve(to: CGPoint(x: 0.1825*width, y: 0.72333*height), control1: CGPoint(x: 0.2023*width, y: 0.71804*height), control2: CGPoint(x: 0.19254*width, y: 0.72333*height))
        path.addCurve(to: CGPoint(x: 0.16698*width, y: 0.71875*height), control1: CGPoint(x: 0.17722*width, y: 0.72333*height), control2: CGPoint(x: 0.17182*width, y: 0.72184*height))
        path.addCurve(to: CGPoint(x: 0.1131*width, y: 0.59916*height), control1: CGPoint(x: 0.13123*width, y: 0.69575*height), control2: CGPoint(x: 0.1131*width, y: 0.65554*height))
        path.addLine(to: CGPoint(x: 0.1131*width, y: 0.23417*height))
        path.addCurve(to: CGPoint(x: 0.24683*width, y: 0.09375*height), control1: CGPoint(x: 0.1131*width, y: 0.14492*height), control2: CGPoint(x: 0.16187*width, y: 0.09375*height))
        path.addLine(to: CGPoint(x: 0.59444*width, y: 0.09375*height))
        path.addCurve(to: CGPoint(x: 0.70833*width, y: 0.15033*height), control1: CGPoint(x: 0.6613*width, y: 0.09375*height), control2: CGPoint(x: 0.69325*width, y: 0.12454*height))
        path.addCurve(to: CGPoint(x: 0.69849*width, y: 0.19329*height), control1: CGPoint(x: 0.7169*width, y: 0.16504*height), control2: CGPoint(x: 0.7125*width, y: 0.18429*height))
        path.addCurve(to: CGPoint(x: 0.65758*width, y: 0.18296*height), control1: CGPoint(x: 0.68444*width, y: 0.20233*height), control2: CGPoint(x: 0.66619*width, y: 0.19767*height))
        path.addCurve(to: CGPoint(x: 0.59444*width, y: 0.15621*height), control1: CGPoint(x: 0.65373*width, y: 0.17633*height), control2: CGPoint(x: 0.64198*width, y: 0.15621*height))
        path.addLine(to: CGPoint(x: 0.24683*width, y: 0.15621*height))
        path.addCurve(to: CGPoint(x: 0.17262*width, y: 0.23417*height), control1: CGPoint(x: 0.19413*width, y: 0.15625*height), control2: CGPoint(x: 0.17262*width, y: 0.17883*height))
        path.closeSubpath()
        return path
    }
}
