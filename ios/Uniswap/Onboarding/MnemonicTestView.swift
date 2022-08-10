//
//  MnemonicTestView.swift
//  Uniswap
//
//  Created by Thomas Thachil on 8/1/22.
//

import React
import SwiftUI

@objcMembers class MnemonicTestView: NSObject {
  private var vc = UIHostingController(rootView: MnemonicTest())
  
  static let storage = NSMutableDictionary()
  
  var mnemonicId: String {
    set { vc.rootView.setMnemonicId(mnemonicId: newValue) }
    get { return vc.rootView.props.mnemonicId }
  }
  
  var onTestComplete: RCTDirectEventBlock {
    set { vc.rootView.props.onTestComplete = newValue }
    get { return vc.rootView.props.onTestComplete }
  }
  
  var view: UIView {
    return vc.view
  }
}

class MnemonicTestProps : ObservableObject {
  @Published var mnemonicId: String = ""
  @Published var onTestComplete: RCTDirectEventBlock = { _ in }
  @Published var mnemonicWords: [String] = Array(repeating: "", count: 12)
  @Published var scrambledWords: [String] = Array(repeating: "", count: 12)
  @Published var typedWords: [String] = Array(repeating: "", count: 12)
  @Published var selectedIndex: Int = 0
  @Published var shouldEnableContinueButton = false
}

struct MnemonicTest: View {
  
  @ObservedObject var props = MnemonicTestProps()
  
  let rnEthersRS = RNEthersRS()
  let interFont = UIFont(name: "Inter-SemiBold", size: 20)
  
  func setMnemonicId(mnemonicId: String) {
    props.mnemonicId = mnemonicId
    if let mnemonic = rnEthersRS.retrieveMnemonic(mnemonicId: mnemonicId) {
      props.mnemonicWords = mnemonic.components(separatedBy: " ")
      props.scrambledWords = mnemonic.components(separatedBy: " ").shuffled()
    }
  }
  
  func onSuggestionTapped(word: String) {
    props.typedWords[props.selectedIndex] = word
    
    if (props.selectedIndex == props.mnemonicWords.count - 1) {
      props.shouldEnableContinueButton = true
    }
    
    // Advance if word is correct
    if (props.mnemonicWords[props.selectedIndex] == props.typedWords[props.selectedIndex]) {
      props.selectedIndex += 1
    }
  }
  
  func onFieldTapped(fieldNumber: Int) {
    props.selectedIndex = fieldNumber - 1
  }
  
  
  func getLabelFocusState(index: Int) -> InputFocusState{
    let isTextFieldFocused = index == props.selectedIndex
    let isTextFieldValid = props.mnemonicWords[index] == props.typedWords[index]
    let isTextFieldEmpty = props.typedWords[index].count == 0
    
    if (isTextFieldFocused && !isTextFieldEmpty && !isTextFieldValid) {
      return InputFocusState.focusedWrongInput
    } else if (isTextFieldFocused) {
      return InputFocusState.focusedNoInput
    }
    return InputFocusState.notFocused
  }
  
  var body: some View {
    VStack(alignment: HorizontalAlignment.leading, spacing: 0) {
      HStack(alignment: VerticalAlignment.center, spacing: 12) {
        VStack(alignment: .leading, spacing: 12) {
          ForEach((0...5), id: \.self) {index in
            MnemonicTextField(index: index + 1,
                              initialText: props.typedWords[index],
                              focusState: getLabelFocusState(index: index),
                              onFieldTapped: onFieldTapped
            )
            .frame(maxWidth: .infinity, alignment: .leading)
          }
        }.frame(maxWidth: .infinity)
        VStack(alignment: .leading, spacing: 12) {
          ForEach((6...11), id: \.self) {index in
            MnemonicTextField(index: index + 1,
                              initialText: props.typedWords[index],
                              focusState: getLabelFocusState(index: index),
                              onFieldTapped: onFieldTapped
            )
            .frame(maxWidth: .infinity, alignment: .leading)
            
          }
        }.frame(maxWidth: .infinity)
      }.frame(maxWidth: .infinity)
        .padding([.top, .leading, .trailing], 24)
      
      MnemonicTestWordBankView(words: props.scrambledWords,
                               usedWords: props.typedWords,
                               labelCallback: onSuggestionTapped)
      .frame(maxWidth: .infinity)
      .padding([.top, .leading, .trailing], 24)
      
      Spacer()
      
      Button("Continue") {
        props.shouldEnableContinueButton ? self.props.onTestComplete([:]) : ()
      }
      .font(Font(interFont!))
      .foregroundColor(Colors.textPrimary)
      .padding(16)
      .frame(maxWidth: .infinity, alignment: .center)
      .background(Colors.backgroundAction)
      .opacity(props.shouldEnableContinueButton ? 1.0 : 0.4)
      .cornerRadius(16.0)
      .padding(24)
      
    }.frame(maxWidth: .infinity, maxHeight: .infinity)
      .padding(24)
  }
}
