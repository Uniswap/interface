//
//  MnemonicConfirmationView.swift
//  Uniswap
//
//  Created by Thomas Thachil on 8/1/22.
//

import React
import SwiftUI

@objcMembers class MnemonicConfirmationView: NSObject {
  private var vc = UIHostingController(rootView: MnemonicConfirmation())
  
  static let storage = NSMutableDictionary()
  
  var mnemonicId: String {
    set { vc.rootView.setMnemonicId(mnemonicId: newValue) }
    get { return vc.rootView.props.mnemonicId }
  }
  
  var selectedWordPlaceholder: String {
    set { vc.rootView.props.selectedWordPlaceholder = newValue}
    get { return vc.rootView.props.selectedWordPlaceholder }
  }
  
  var shouldShowSmallText: Bool {
    set { vc.rootView.props.shouldShowSmallText = newValue}
    get { return vc.rootView.props.shouldShowSmallText }
  }
  
  var onConfirmComplete: RCTDirectEventBlock {
    set { vc.rootView.props.onConfirmComplete = newValue }
    get { return vc.rootView.props.onConfirmComplete }
  }
  
  var view: UIView {
    vc.view.backgroundColor = .clear
    return vc.view
  }
}

class MnemonicConfirmationProps : ObservableObject {
  @Published var mnemonicId: String = ""
  @Published var selectedWordPlaceholder: String = ""
  @Published var shouldShowSmallText: Bool = false
  @Published var onConfirmComplete: RCTDirectEventBlock = { _ in }
  @Published var mnemonicWords: [String] = Array(repeating: "", count: 12)
  @Published var scrambledWords: [String] = Array(repeating: "", count: 12)
  @Published var typedWordIndexes: [Int] = Array(repeating: -1, count: 12)
  @Published var selectedIndex: Int = 0
}

struct MnemonicConfirmation: View {
  
  @ObservedObject var props = MnemonicConfirmationProps()
  
  let rnEthersRS = RNEthersRS()
  
  func setMnemonicId(mnemonicId: String) {
    props.mnemonicId = mnemonicId
    if let mnemonic = rnEthersRS.retrieveMnemonic(mnemonicId: mnemonicId) {
      props.mnemonicWords = mnemonic.components(separatedBy: " ")
      props.scrambledWords = mnemonic.components(separatedBy: " ").shuffled()
    }
  }
  
  func onSuggestionTapped(tappedIndex: Int) {
    props.typedWordIndexes[props.selectedIndex] = tappedIndex

    // Check if typed words match mnemonic words only if all fields are filled
    if (props.selectedIndex == props.mnemonicWords.count - 1) {
      if (isMnemonicMatch()) {
        props.onConfirmComplete([:])
      }
    } else if (props.mnemonicWords[props.selectedIndex] == props.scrambledWords[tappedIndex] && props.selectedIndex < props.mnemonicWords.count - 1) {
      props.selectedIndex += 1
    }
  }
  
  func isMnemonicMatch() -> Bool {
    for i in 0..<props.typedWordIndexes.count {
      if (getTypedWord(index: i) != props.mnemonicWords[i]) {
        return false
      }
    }
    
    return true
  }
  
  func getTypedWord(index: Int) -> String {
    guard index >= 0 && index < props.typedWordIndexes.count else {
      return ""
    }
    
    let scrambledWordIndex = props.typedWordIndexes[index]
    if scrambledWordIndex == -1 {
      return ""
    }
    
    return props.scrambledWords[scrambledWordIndex]
  }
  
  func getFieldText(index: Int) -> String {
    let typedWord = getTypedWord(index: index)
    return typedWord.isEmpty ? props.selectedWordPlaceholder : typedWord
  }

  func getFieldStatus(index: Int) -> MnemonicInputStatus {
    let typedWord = getTypedWord(index: index)
    
    if (typedWord.isEmpty) {
      return MnemonicInputStatus.noInput
    } else if (props.mnemonicWords[index] != typedWord) {
      return MnemonicInputStatus.wrongInput
    }
    return MnemonicInputStatus.correctInput
  }
  
  var body: some View {
    let end = props.mnemonicWords.count - 1
    let middle = end / 2
    
    VStack(alignment: .leading, spacing: 0) {
      HStack(alignment: .center, spacing: 24) {
        VStack(alignment: .leading, spacing: 8) {
          ForEach((0...middle), id: \.self) {index in
            MnemonicTextField(index: index + 1,
                              word: getFieldText(index: index),
                              status: getFieldStatus(index: index),
                              shouldShowSmallText: props.shouldShowSmallText
            )
            .frame(maxWidth: .infinity, alignment: .leading)
          }
        }.frame(maxWidth: .infinity)
        VStack(alignment: .leading, spacing: 8) {
          ForEach((middle + 1...end), id: \.self) {index in
            MnemonicTextField(index: index + 1,
                              word: getFieldText(index: index),
                              status: getFieldStatus(index: index),
                              shouldShowSmallText: props.shouldShowSmallText
            )
            .frame(maxWidth: .infinity, alignment: .leading)
          }
        }.frame(maxWidth: .infinity)
      }.frame(maxWidth: .infinity)
        .padding(EdgeInsets(top: 24, leading: 32, bottom: 24, trailing: 32))
        .background(Colors.surface2)
        .cornerRadius(20)
        .overlay(
          RoundedRectangle(cornerRadius: 20)
            .stroke(Colors.surface3, lineWidth: 1)
        )
      
      MnemonicConfirmationWordBankView(
        words: props.scrambledWords,
        usedWordIndexes: props.typedWordIndexes,
        labelCallback: onSuggestionTapped,
        shouldShowSmallText: props.shouldShowSmallText
      )
      .frame(maxWidth: .infinity)
      .padding(.top, 24)

    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
  }
}
