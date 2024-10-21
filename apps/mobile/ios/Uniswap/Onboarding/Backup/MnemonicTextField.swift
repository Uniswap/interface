//
//  MnemonicTextField.swift
//  Uniswap
//
//  Created by Thomas Thachil on 8/8/22.
//

import SwiftUI

enum MnemonicInputStatus {
  case noInput
  case correctInput
  case wrongInput
}

struct MnemonicTextField: View {
  let smallFont = UIFont(name: "BaselGrotesk-Book", size: 14)
  let mediumFont = UIFont(name: "BaselGrotesk-Book", size: 16)
  
  var index: Int
  var word = ""
  var shouldShowSmallText: Bool
  var status: MnemonicInputStatus
  
  init(index: Int,
       word: String,
       status: MnemonicInputStatus = .correctInput,
       shouldShowSmallText: Bool = false
  ) {
    self.index = index
    self.word = word
    self.status = status
    self.shouldShowSmallText = shouldShowSmallText
  }
  
  func getLabelColor() -> Color {
    switch (status) {
    case .noInput:
      return Colors.neutral3
    case .correctInput:
      return Colors.neutral1
    case .wrongInput:
      return Colors.statusCritical
    }
  }

  var body: some View {
    HStack(alignment: VerticalAlignment.center, spacing: 18) {
      Text(String(index))
        .font(Font((shouldShowSmallText ? smallFont : mediumFont)!))
        .foregroundColor(Colors.neutral2)
        .frame(width: shouldShowSmallText ? 14 : 16, alignment: Alignment.leading)
      
      Text(word)
        .font(Font((shouldShowSmallText ? smallFont : mediumFont)!))
        .foregroundColor(getLabelColor())
        .multilineTextAlignment(.leading)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }
}
