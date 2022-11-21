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
  
  var shouldShowSmallText: Bool {
    set { vc.rootView.props.shouldShowSmallText = newValue}
    get { return vc.rootView.props.shouldShowSmallText }
  }
  
  var onTestComplete: RCTDirectEventBlock {
    set { vc.rootView.props.onTestComplete = newValue }
    get { return vc.rootView.props.onTestComplete }
  }
  
  var view: UIView {
    vc.view.backgroundColor = .clear
    return vc.view
  }
}

class MnemonicTestProps : ObservableObject {
  @Published var mnemonicId: String = ""
  @Published var shouldShowSmallText: Bool = false
  @Published var onTestComplete: RCTDirectEventBlock = { _ in }
  @Published var mnemonicWords: [String] = Array(repeating: "", count: 12)
  @Published var scrambledWords: [String] = Array(repeating: "", count: 12)
  @Published var typedWords: [String] = Array(repeating: "", count: 12)
  @Published var selectedIndex: Int = 0
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
    if (props.mnemonicWords.count > 12) {
      props.onTestComplete([:])
    }
  }
  
  func onSuggestionTapped(word: String) {
    props.typedWords[props.selectedIndex] = word
    
    if (props.typedWords == props.mnemonicWords) {
      props.onTestComplete([:])
    } else if (props.mnemonicWords[props.selectedIndex] == props.typedWords[props.selectedIndex] && props.selectedIndex < props.mnemonicWords.count - 1) {
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
    } else if (!isTextFieldEmpty && !isTextFieldValid) {
      return InputFocusState.notFocusedWrongInput
    }
    return InputFocusState.notFocused
  }
  
  var body: some View {
    VStack(alignment: HorizontalAlignment.leading, spacing: 0) {
      if (props.mnemonicWords.count > 12) {
        Text(props.mnemonicWords.joined(separator: " "))
          .font(Font(UIFont(name: "Inter-Regular", size: 16)!))
          .multilineTextAlignment(TextAlignment.center)
          .padding(EdgeInsets(top: 20, leading: 24, bottom: 20, trailing: 24))
          .foregroundColor(Colors.textPrimary)
          .background(AnyView(
            RoundedRectangle(cornerRadius: 100, style: .continuous)
              .fill(Colors.background1)
          ))
          .frame(alignment: Alignment.center)
          .padding(EdgeInsets(top: 0, leading: 16, bottom: 0, trailing: 16))
      } else {
        HStack(alignment: VerticalAlignment.center, spacing: 12) {
          VStack(alignment: .leading, spacing: 12) {
            ForEach((0...5), id: \.self) {index in
              MnemonicTextField(index: index + 1,
                                initialText: props.typedWords[index],
                                shouldShowSmallText: props.shouldShowSmallText,
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
                                shouldShowSmallText: props.shouldShowSmallText,
                                focusState: getLabelFocusState(index: index),
                                onFieldTapped: onFieldTapped
              )
              .frame(maxWidth: .infinity, alignment: .leading)
              
            }
          }.frame(maxWidth: .infinity)
        }.frame(maxWidth: .infinity)
          .padding([.leading, .trailing], 24)
        
        MnemonicTestWordBankView(words: props.scrambledWords,
                                 usedWords: props.typedWords,
                                 labelCallback: onSuggestionTapped,
                                 shouldShowSmallText: props.shouldShowSmallText)
        .frame(maxWidth: .infinity)
        .padding([.top, .leading, .trailing], 24)
      }
    }.frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
  }
}
