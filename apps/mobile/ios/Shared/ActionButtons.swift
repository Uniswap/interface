//
//  ActionButtons.swift
//  Uniswap
//
//  Created by Mateusz Łopaciński on 05/06/2024.
//

import SwiftUI

enum ActionButtonStatus {
    case success, neutral
}

struct ActionButton<Icon: Shape>: View {
  var action: () -> Void
  var text: String
  var icon: Icon?
  var status: ActionButtonStatus = .neutral
  
  var body: some View {
    var iconColor: Color
    var textColor: Color
    
    switch status {
    case .success:
      iconColor = Colors.statusSuccess
      textColor = Colors.statusSuccess
    case .neutral:
      iconColor = Colors.neutral2
      textColor = Colors.neutral1
    }
    
    return Button(action: action) {
      HStack(alignment: .center, spacing: 4) {
        if let icon = icon {
          icon
            .fill(iconColor)
            .frame(width: 20, height: 20)
        }
        Text(text)
          .foregroundColor(textColor)
          .font(Font(UIFont(name: "BaselGrotesk-Book", size: 16)!))
      }
    }
    .padding(EdgeInsets(top: 8, leading: icon != nil ? 12 : 16, bottom: 8, trailing: 16))
    .background(Colors.surface1)
    .cornerRadius(16)
    .overlay(
      RoundedRectangle(cornerRadius: 16)
        .stroke(Colors.surface3, lineWidth: 1)
    )
    .shadow(color: Colors.surface3.opacity(0.04), radius: 10)
  }
}

struct CopyButton: View {
  // Time after which the button reverts to the copy state
  private let copyTimeout: TimeInterval = 2.0
  
  @State private var isCopied = false
  @State private var copyTimer: Timer?

  var copyButtonText: String
  var copiedButtonText: String
  var textToCopy: String

  var body: some View {
    ActionButton(
      action: {
        UIPasteboard.general.string = textToCopy
        isCopied = true
        
        // Invalidate the previous timer if it exists
        copyTimer?.invalidate()
        
        // Start a new timer
        copyTimer = Timer.scheduledTimer(withTimeInterval: copyTimeout, repeats: false) { _ in
          isCopied = false
        }
      },
      text: isCopied ? copiedButtonText : copyButtonText,
      icon: CopyIcon(),
      status: isCopied ? .success : .neutral
    )
  }
}

struct PasteButton: View {
  var pasteButtonText: String
  var onPaste: (String) -> Void
  
  var body: some View {
    ActionButton(
      action: {
        if let pastedText = UIPasteboard.general.string {
          onPaste(pastedText)
        }
      },
      text: pasteButtonText,
      icon: PasteIcon()
    )
  }
}
