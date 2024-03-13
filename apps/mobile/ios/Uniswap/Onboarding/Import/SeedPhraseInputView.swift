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
    
    NSLayoutConstraint.activate([
      vc.view.topAnchor.constraint(equalTo: self.topAnchor),
      vc.view.bottomAnchor.constraint(equalTo: self.bottomAnchor),
      vc.view.leadingAnchor.constraint(equalTo: self.leadingAnchor),
      vc.view.trailingAnchor.constraint(equalTo: self.trailingAnchor)
    ])
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
  var strings: Dictionary<String, String> {
    get { vc.rootView.viewModel.rawRNStrings }
    set { vc.rootView.viewModel.rawRNStrings = newValue }
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
  private var buttonFont = Font(UIFont(name: "Basel-Medium", size: 15)!)
  
  var body: some View {
    VStack(spacing: 16) {
      VStack {
        ZStack {
          if #available(iOS 16.0, *) {
            TextEditor(text: $viewModel.input)
              .focused($focused)
              .autocorrectionDisabled()
              .textInputAutocapitalization(.never)
              .multilineTextAlignment(.center)
              .scrollContentBackground(.hidden)
          } else {
            TextEditor(text: $viewModel.input)
              .focused($focused)
              .autocorrectionDisabled()
              .textInputAutocapitalization(.never)
              .multilineTextAlignment(.center)
              .onAppear() {
                UITextView.appearance().backgroundColor = .clear
              }
          }
          
          if (viewModel.input.isEmpty) {
            HStack(spacing: 8) {
              Text(viewModel.strings.inputPlaceholder)
                .foregroundColor(Colors.neutral2)
              
              Button(action: handlePastePress, label: {
                HStack(spacing: 4) {
                  PasteIcon()
                    .fill(Colors.neutral2)
                    .frame(width: 16, height: 16)
                  
                  Text(viewModel.strings.pasteButton)
                    .foregroundColor(Colors.neutral2)
                    .font(buttonFont)
                    .fontWeight(.medium)
                }
              })
              .padding([.top, .bottom, .trailing], 8)
              .padding([.leading], 4)
              .background(Colors.surface3)
              .clipShape(RoundedRectangle(cornerRadius: 12))
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
      }.padding(.bottom, 8)
      
      if (errorMessage() != nil) {
        HStack(spacing: 4) {
          AlertTriangeIcon()
            .frame(width: 24, height: 24)
            .foregroundColor(Colors.statusCritical)
          Text(errorMessage() ?? "")
            .foregroundColor(Colors.statusCritical)
        }
        .frame(alignment: .center)
      }
      
      Text(viewModel.strings.helpText)
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
    case .invalidPhrase:
      return viewModel.strings.errorInvalidPhrase
    case .invalidWord(let word):
      return "\(viewModel.strings.errorInvalidWord) \(word)"
    case .tooManyWords, .notEnoughWords:
      return viewModel.strings.errorPhraseLength
    case .wrongRecoveryPhrase:
      return viewModel.strings.errorWrongPhrase
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

