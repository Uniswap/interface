//
//  CopyButton.swift
//  Uniswap
//
//  Created by Mateusz Łopaciński on 14/05/2024.
//

import SwiftUI

struct CopyButton: View {
    // Time after which the button reverts to the copy state
  private let copyTimeout: TimeInterval = 2.0
  
  @State private var isCopied = false
  @State private var copyTimer: Timer?
  
  var action: () -> Void
  var copyText: String
  var copiedText: String
  
  var body: some View {
    Button(action: {
      action()
      isCopied = true
      
      // Invalidate the previous timer if it exists
      copyTimer?.invalidate()
      
      // Start a new timer
      copyTimer = Timer.scheduledTimer(withTimeInterval: copyTimeout, repeats: false) { _ in
        isCopied = false
      }
    }) {
      HStack(alignment: .center, spacing: 4) {
        CopyIcon()
          .fill(isCopied ? Colors.statusSuccess : Colors.neutral2)
          .frame(width: 20, height: 20)
        
        Text(isCopied ? copiedText : copyText)
          .foregroundColor(isCopied ? Colors.statusSuccess : Colors.neutral1)
          .font(Font(UIFont(name: "Basel-Book", size: 16)!))
      }
    }
    .padding(EdgeInsets(top: 8, leading: 10, bottom: 8, trailing: 16))
    .background(Colors.surface1)
    .cornerRadius(50)
    .overlay(
      RoundedRectangle(cornerRadius: 50)
        .stroke(Colors.surface3, lineWidth: 1)
    )
    .shadow(color: Color.black.opacity(0.04), radius: 10)
  }
}
