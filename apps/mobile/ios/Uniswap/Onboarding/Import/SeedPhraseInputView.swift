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
  var onHeightMeasured: RCTDirectEventBlock {
    set { vc.rootView.viewModel.onHeightMeasured = newValue }
    get { return vc.rootView.viewModel.onHeightMeasured }
  }

  @objc
  var testID: String? {
    get { vc.rootView.viewModel.testID }
    set { vc.rootView.viewModel.testID = newValue }
  }
  
  @objc
  var handleSubmit: () -> Void {
    get { return vc.rootView.viewModel.handleSubmit }
  }
}

struct TextEditModifier: ViewModifier {
  func body(content: Content) -> some View {
    if #available(iOS 16.0, *) {
      content
        .scrollContentBackground(.hidden)
    } else {
      content
        .onAppear {
          UITextView.appearance().backgroundColor = .clear
        }
    }
  }
}

struct SeedPhraseInput: View {
  @ObservedObject var viewModel = SeedPhraseInputViewModel()
  @FocusState private var focused: Bool
  
  private var font = Font(UIFont(name: "Basel-Book", size: 17)!)
  private var subtitleFont = Font(UIFont(name: "Basel-Book", size: 17)!)
  private var labelFont = Font(UIFont(name: "Basel-Book", size: 15)!)
  private var buttonFont = Font(UIFont(name: "Basel-Medium", size: 15)!)
  
  var body: some View {
    VStack(spacing: 12) {
      VStack {
        VStack {
          ZStack(alignment: .topLeading) {
            TextEditor(text: $viewModel.input)
              .focused($focused)
              .autocorrectionDisabled()
              .textInputAutocapitalization(.never)
              .modifier(TextEditModifier())
              .frame(minHeight: 96) // 120 - 2 * 12 for padding
              .accessibility(identifier: viewModel.testID ?? "import-account-input")
            
            if (viewModel.input.isEmpty) {
              Text(viewModel.strings.inputPlaceholder)
                .font(subtitleFont)
                .padding(.horizontal, 6)
                .padding(.vertical, 8)
                .foregroundColor(Colors.neutral3)
                .allowsHitTesting(false) // Prevents capturing touch events by the placeholder instead of input
            }
          }
          .fixedSize(horizontal: false, vertical: true)
          .background(Colors.surface1)
          .padding(12) // Adds to default TextEditor padding 8
          .cornerRadius(16)
          .overlay(
            RoundedRectangle(cornerRadius: 16)
              .inset(by: 1)
              .stroke(mapStatusToColor(status: viewModel.status), lineWidth: 1)
          )
          .onTapGesture {
            focused = true
          }
          .onAppear {
            DispatchQueue.main.async {
              focused = true
            }
          }
          .overlay(
            Group {
              if viewModel.input.isEmpty {
                HStack {
                  Spacer()
                  RelativeOffsetView(y: 0.5) {
                    PasteButton(
                      pasteButtonText: viewModel.strings.pasteButton,
                      onPaste: handlePastePress
                    )
                  }
                  Spacer()
                }
              }
            },
            alignment: .bottom
          )
        }.padding(.bottom, 12)
        
        if (errorMessage() != nil) {
          HStack(spacing: 4) {
            AlertTriangleIcon()
              .frame(width: 14, height: 14)
              .foregroundColor(Colors.statusCritical)
            Text(errorMessage() ?? "")
              .font(labelFont)
              .foregroundColor(Colors.statusCritical)
          }
          .frame(alignment: .center)
        }
      }
      .overlay(
        GeometryReader { geometry in
          Color.clear
            .onAppear {
              viewModel.onHeightMeasured(["height": geometry.size.height])
            }
            .onChange(of: geometry.size.height) { newValue in
              viewModel.onHeightMeasured(["height": newValue])
            }
        }
      )
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
    .font(font)
  }

  private func mapStatusToColor(status: SeedPhraseInputViewModel.Status) -> Color {
    switch viewModel.status {
    case .none:
      return Colors.surface3
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
  
  private func handlePastePress(pastedText: String) {
    // Arbitrary time necessary for callbacks to trigger while permission modal is opened
    let debounceTime = 0.1
    
    viewModel.onPasteStart([:])
    DispatchQueue.main.asyncAfter(deadline: .now() + debounceTime) {
      viewModel.input = pastedText
      
      DispatchQueue.main.asyncAfter(deadline: .now() + debounceTime) {
        viewModel.onPasteEnd([:])
      }
    }
  }
}
