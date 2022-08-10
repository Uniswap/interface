//
//  MnemonicTextField.swift
//  Uniswap
//
//  Created by Thomas Thachil on 8/8/22.
//

import SwiftUI

enum InputFocusState {
  case notFocused
  case focusedNoInput
  case focusedWrongInput
}

struct MnemonicTextField: View {
  
  @Environment(\.colorScheme) var colorScheme
  
  var index: Int
  var initialText = ""
  var onFieldTapped: ((Int) -> Void)?
  var focusState: InputFocusState = InputFocusState.notFocused
  
  
  init(index: Int,
       initialText: String,
       focusState: InputFocusState,
       onFieldTapped: @escaping (Int) -> Void
  ) {
    self.index = index
    self.initialText = initialText
    self.focusState = focusState
    self.onFieldTapped = onFieldTapped
  }
  
  func getLabelBackground(focusState: InputFocusState) -> some View {
    switch (focusState) {
    case .focusedNoInput:
      return AnyView(RoundedRectangle(cornerRadius: 20)
        .strokeBorder(Colors.accentActive, lineWidth: 1)
        .background(Colors.backgroundAction)
        .cornerRadius(20)
      )
      
    case .focusedWrongInput:
      return AnyView(RoundedRectangle(cornerRadius: 20)
        .strokeBorder(Colors.accentCritical, lineWidth: 2)
        .background(Colors.backgroundAction)
        .cornerRadius(20)
      )
      
    case .notFocused:
      return AnyView(
        RoundedRectangle(cornerRadius: 20, style: .continuous)
          .fill(Colors.backgroundSurface)
      )
    }
  }
  
  
  var body: some View {
    HStack(alignment: VerticalAlignment.center, spacing: 0) {
      
      Text(String(index)).cornerRadius(16)
        .foregroundColor(Colors.textTertiary)
        .padding(EdgeInsets(top: 12, leading: 16, bottom: 12, trailing: 16))
        .frame(alignment: Alignment.leading)
      
      Text(initialText)
        .autocapitalization(.none)
        .multilineTextAlignment(TextAlignment.leading)
        .foregroundColor(Colors.textPrimary)
        .padding(EdgeInsets(top: 12, leading: 0, bottom: 12, trailing: 16))
        .frame(maxWidth: .infinity, alignment: Alignment.leading)
    }
    .background(getLabelBackground(focusState: focusState))
    .frame(maxWidth: .infinity, alignment: .leading)
    .onTapGesture {
      onFieldTapped?(index)
    }
  }
}
