//
//  ScrollExtension.swift
//  Uniswap
//
//  Created by Gary Ye on 8/31/23.
//

import SwiftUI

extension View {
    func fadeOutBottom(fadeLength:CGFloat=32) -> some View {
        return mask(
            VStack(spacing: 0) {

              Rectangle().fill(Color.black)

              LinearGradient(gradient:
                 Gradient(
                     colors: [Color.black, Color.black.opacity(0)]),
                     startPoint: .top, endPoint: .bottom
                 )
                 .frame(height: fadeLength)
            }
        )
    }
}
