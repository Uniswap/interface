//
//  SeedPhraseInputView.swift
//  Uniswap
//
//  Created by Gary Ye on 9/7/23.
//

import React
import SwiftUI

class SeedPhraseInputView: UIView {
  private let vc = UIHostingController(rootView: SeedPhraseInput())
  
  override init(frame: CGRect) {
    super.init(frame: frame)
    
    vc.view.translatesAutoresizingMaskIntoConstraints = false
    vc.view.backgroundColor = .clear
    
    self.addSubview(vc.view)
  }
  
  required init?(coder aDecoder: NSCoder) {
    // Used to load view into storyboarder
    fatalError("init(coder:) has not been implemented")
  }
  
  override func reactSetFrame(_ frame: CGRect) {
    super.reactSetFrame(frame);
    vc.view.frame = frame
  }
  
  @objc
  var targetMnemonicId: String? {
    get { vc.rootView.viewModel.targetMnemonicId }
    set { vc.rootView.viewModel.targetMnemonicId = newValue }
  }
  
  @objc
  var helpText: String {
    get { vc.rootView.viewModel.helpText }
    set { vc.rootView.viewModel.helpText = newValue }
  }
  
  @objc
  var onHelpTextPress: RCTDirectEventBlock {
    set { vc.rootView.viewModel.onHelpTextPress = newValue }
    get { return vc.rootView.viewModel.onHelpTextPress }
  }
  
  @objc
  var onInputValidated: RCTDirectEventBlock {
    get { vc.rootView.viewModel.onInputValidated }
    set { vc.rootView.viewModel.onInputValidated = newValue }
  }
  
  @objc
  var onMnemonicStored: RCTDirectEventBlock {
    set { vc.rootView.viewModel.onMnemonicStored = newValue }
    get { return vc.rootView.viewModel.onMnemonicStored }
  }
  
  @objc
  var onPasteStart: RCTDirectEventBlock {
    set { vc.rootView.viewModel.onPasteStart = newValue }
    get { return vc.rootView.viewModel.onPasteStart }
  }
  
  @objc
  var onPasteEnd: RCTDirectEventBlock {
    set { vc.rootView.viewModel.onPasteEnd = newValue }
    get { return vc.rootView.viewModel.onPasteEnd }
  }
  
  @objc
  var handleSubmit: () -> Void {
    get { return vc.rootView.viewModel.handleSubmit }
  }
}

struct SeedPhraseInput: View {
  
  @ObservedObject var viewModel = SeedPhraseInputViewModel()
  @FocusState private var focused: Bool
  
  private var font = Font(UIFont(name: "Basel-Book", size: 17)!)
  private var subtitleFont = Font(UIFont(name: "Basel-Book", size: 17)!)
  
  var body: some View {
    VStack(spacing: 16) {
      ZStack {
        
        if #available(iOS 16.0, *) {
          TextEditor(text: $viewModel.input)
            .focused($focused)
            .multilineTextAlignment(.center)
            .scrollContentBackground(.hidden)
            .allowsHitTesting(false)
        } else {
          TextEditor(text: $viewModel.input)
            .focused($focused)
            .multilineTextAlignment(.center)
            .allowsHitTesting(false)
            .onAppear() {
              UITextView.appearance().backgroundColor = .clear
            }
        }
        
        if (viewModel.input.isEmpty) {
          HStack(spacing: 4) {
            Text("Enter your recovery phrase")
              .foregroundColor(Colors.neutral2)
            
            Button(action: handlePastePress, label: {
              PasteIcon()
                .stroke(Colors.neutral2, lineWidth: 1)
                .frame(width: 16, height: 16)
              
              Text("Paste")
                .foregroundColor(Colors.neutral2)
            })
            .padding(8)
            .overlay(
              RoundedRectangle(cornerRadius: 12)
                .inset(by: 1)
                .stroke(Colors.neutral3, lineWidth: 1)
            )
          }
          .frame(alignment: .center)
        }
      }
      .fixedSize(horizontal: false, vertical: true)
      .padding(8) // Adds to default TextEditor padding 8
      .frame(minHeight: 120, alignment: .center)
      .background(Colors.surface2)
      .cornerRadius(20)
      .overlay(
        RoundedRectangle(cornerRadius: 20)
          .inset(by: 1)
          .stroke(mapStatusToColor(status: viewModel.status), lineWidth: 1)
      )
      .onTapGesture {
        focused = true
      }
      .onAppear() {
        DispatchQueue.main.async {
          focused = true
        }
      }
      
      if (errorMessage() != nil) {
        HStack(spacing: 4) {
          AlertTriangeIcon()
            .frame(width: 24, height: 24)
            .foregroundColor(Colors.statusCritical)
          Text(errorMessage() ?? "")
            .foregroundColor(Colors.statusCritical)
        }.frame(alignment: .center)
      }
      
      Text(viewModel.helpText)
        .font(subtitleFont)
        .foregroundColor(Colors.accent1)
        .minimumScaleFactor(0.8)
        .onTapGesture {
          viewModel.onHelpTextPress([:])
        }
    }
    .frame(maxWidth:.infinity, maxHeight: .infinity, alignment: .top)
    .padding(.bottom, 16)
    .font(font)
  }

  private func mapStatusToColor(status: SeedPhraseInputViewModel.Status) -> Color {
    switch viewModel.status {
    case .none:
      return Color.clear
    case .valid:
      return Colors.statusSuccess
    case .error:
      return Colors.statusCritical
    }
  }
               
  private func errorMessage() -> String? {
    switch viewModel.error {
    case .tooManyWords, .notEnoughWords:
      return "Recovery phrase must be 12-24 words"
    case .invalidWord(let word):
      return "Invalid word: \(word)"
    case .wrongRecoveryPhrase:
      return "Wrong recovery phrase"
    default:
      return nil
    }
  }
  
  private func handlePastePress() {
    // Arbitrary time necessary for callbacks to trigger while permission modal is opened
    let debounceTime = 0.1
    
    viewModel.onPasteStart([:])
    DispatchQueue.main.asyncAfter(deadline: .now() + debounceTime) {
      let pb = UIPasteboard.general
      viewModel.input = pb.string ?? ""
      
      DispatchQueue.main.asyncAfter(deadline: .now() + debounceTime) {
        viewModel.onPasteEnd([:])
      }
    }
  }
}

