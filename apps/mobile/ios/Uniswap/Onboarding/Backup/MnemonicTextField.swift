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
  case notFocusedWrongInput
}

struct MnemonicTextField: View {
  
  @Environment(\.colorScheme) var colorScheme

  let smallFont = UIFont(name: "Basel-Book", size: 14)
  let mediumFont = UIFont(name: "Basel-Book", size: 16)
  
  var index: Int
  var initialText = ""
  var shouldShowSmallText: Bool
  var onFieldTapped: ((Int) -> Void)?
  var focusState: InputFocusState
  
  
  init(index: Int,
       initialText: String,
       shouldShowSmallText: Bool = false,
       focusState: InputFocusState = InputFocusState.notFocused,
       onFieldTapped: ((Int) -> Void)? = nil
  ) {
    self.index = index
    self.initialText = initialText
    self.shouldShowSmallText = shouldShowSmallText
    self.focusState = focusState
    self.onFieldTapped = onFieldTapped
  }
  
  func getLabelBackground(focusState: InputFocusState) -> some View {
    switch (focusState) {
    case .focusedNoInput:
      return AnyView(RoundedRectangle(cornerRadius: 100)
        .strokeBorder(Colors.accent1, lineWidth: 2)
        .background(Colors.surface2)
        .cornerRadius(100)
      )
      
    case .focusedWrongInput:
      return AnyView(RoundedRectangle(cornerRadius: 100)
        .strokeBorder(Colors.statusCritical, lineWidth: 2)
        .background(Colors.surface2)
        .cornerRadius(100)
      )
      
    case .notFocusedWrongInput:
      return AnyView(RoundedRectangle(cornerRadius: 100)
        .strokeBorder(Colors.statusCritical, lineWidth: 2)
        .background(Colors.surface2)
        .cornerRadius(100)
      )
      
    case .notFocused:
      return AnyView(
        RoundedRectangle(cornerRadius: 100, style: .continuous)
          .fill(Colors.surface2)
      )
    }
  }
  
  
  var body: some View {
    HStack(alignment: VerticalAlignment.center, spacing: 0) {
      
      Text(String(index)).cornerRadius(16)
        .font(Font((shouldShowSmallText ? smallFont : mediumFont)!))
        .foregroundColor(Colors.neutral3)
        .padding(shouldShowSmallText ? EdgeInsets(top: 6, leading: 16, bottom: 6, trailing: 12) : EdgeInsets(top: 12, leading: 16, bottom: 12, trailing: 12))
        .frame(alignment: Alignment.leading)
      
      Text(initialText)
        .font(Font((shouldShowSmallText ? smallFont : mediumFont)!))
        .multilineTextAlignment(TextAlignment.leading)
        .foregroundColor(Colors.neutral1)
        .padding(shouldShowSmallText ? EdgeInsets(top: 6, leading: 0, bottom: 6, trailing: 16) : EdgeInsets(top: 12, leading: 0, bottom: 12, trailing: 16))
        .frame(maxWidth: .infinity, alignment: Alignment.leading)
    }
    .background(getLabelBackground(focusState: focusState))
    .frame(maxWidth: .infinity, alignment: .leading)
    .onTapGesture {
      onFieldTapped?(index)
    }
  }
}
