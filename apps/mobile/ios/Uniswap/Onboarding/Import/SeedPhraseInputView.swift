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
  var onSubmitError: RCTDirectEventBlock {
    set { vc.rootView.viewModel.onSubmitError = newValue }
    get { return vc.rootView.viewModel.onSubmitError }
  }

  @objc
  func focus() {
    vc.rootView.focusInput()
  }

  @objc
  func blur() {
    vc.rootView.blurInput()
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

// We use UIKit and UIViewRepresentable instead of SwiftUI to have better control of focus state here
// At the time of updating this, there were limitations of @FocusState in SwiftUI, particularly in relation to dynamic updates + interactions from outside the view
// So, we use this approach to maintain the focus state
struct SeedPhraseTextView: UIViewRepresentable {
    @Binding var text: String
    @Binding var isFocused: Bool

    class Coordinator: NSObject, UITextViewDelegate {
        var parent: SeedPhraseTextView

        init(_ parent: SeedPhraseTextView) {
            self.parent = parent
        }

        func textViewDidChange(_ textView: UITextView) {
            parent.text = textView.text
        }

        func textViewDidBeginEditing(_ textView: UITextView) {
            // Sync isFocused binding when user focuses the input
            DispatchQueue.main.async {
                self.parent.isFocused = true
            }
        }

        func textViewDidEndEditing(_ textView: UITextView) {
            // Sync isFocused binding when user blurs the input
            DispatchQueue.main.async {
                self.parent.isFocused = false
            }
        }
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    func makeUIView(context: Context) -> UITextView {
        let textView = UITextView()

        textView.delegate = context.coordinator
        textView.font = UIFont(name: "BaselGrotesk-Book", size: 17)
        textView.autocorrectionType = .no
        textView.autocapitalizationType = .none
        textView.backgroundColor = UIColor.clear

        return textView
    }

    func updateUIView(_ uiView: UITextView, context: Context) {
        uiView.text = text

        if isFocused {
            if !uiView.isFirstResponder, uiView.window != nil {
                uiView.becomeFirstResponder()
            }
        } else {
            if uiView.isFirstResponder {
                uiView.resignFirstResponder()
            }
        }
    }
}

struct SeedPhraseInput: View {
  @ObservedObject var viewModel = SeedPhraseInputViewModel()

  private var font = Font(UIFont(name: "BaselGrotesk-Book", size: 17)!)
  private var subtitleFont = Font(UIFont(name: "BaselGrotesk-Book", size: 17)!)
  private var labelFont = Font(UIFont(name: "BaselGrotesk-Book", size: 15)!)
  private var buttonFont = Font(UIFont(name: "BaselGrotesk-Medium", size: 15)!)

  func focusInput() {
    viewModel.isFocused = true
  }

  func blurInput() {
    viewModel.isFocused = false
  }

  var body: some View {
    VStack(spacing: 12) {
      VStack {
        VStack {
          ZStack(alignment: .topLeading) {
            SeedPhraseTextView(text: $viewModel.input, isFocused: $viewModel.isFocused)
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
            self.focusInput()
          }
          .overlay(
            Group {
              if viewModel.input.isEmpty {
                HStack {
                  Spacer()
                  RelativeOffsetView(y: 0.5) {
                    PasteButton(
                      pasteButtonText:  viewModel.strings.pasteButton,
                      onPaste: handlePaste,
                      onPasteStart: {
                        viewModel.onPasteStart([:])
                      },
                      onPasteEnd: {
                        viewModel.onPasteEnd([:])
                      }
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
    case .wordIsAddress:
      return viewModel.strings.errorWordIsAddress
    default:
      return nil
    }
  }

  private func handlePaste(pastedText: String) {
    viewModel.input = pastedText
  }
}
