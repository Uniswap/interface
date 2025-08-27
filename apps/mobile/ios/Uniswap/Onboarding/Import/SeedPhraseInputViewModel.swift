//
//  SeedPhraseInputViewModel.swift
//  Uniswap
//
//  Created by Gary Ye on 9/10/23.
//

import Foundation

class SeedPhraseInputViewModel: ObservableObject {

  enum Status: String {
    case none
    case valid
    case error
  }

  enum MnemonicError {
    case invalidPhrase
    case invalidWord(String)
    case notEnoughWords
    case tooManyWords
    case wrongRecoveryPhrase
    case wordIsAddress
  }

  struct ReactNativeStrings {
    var inputPlaceholder: String
    var pasteButton: String
    var errorInvalidWord: String
    var errorPhraseLength: String
    var errorWrongPhrase: String
    var errorInvalidPhrase: String
    var errorWordIsAddress: String
  }

  let rnEthersRS = RNEthersRS()

  // Following block of variables will come from RN
  @Published var targetMnemonicId: String? = nil

  @Published var testID: String? = nil

  @Published var rawRNStrings: Dictionary<String, String> = Dictionary<String, String>() {
    didSet {
      strings = ReactNativeStrings(
        inputPlaceholder: rawRNStrings["inputPlaceholder"] ?? "",
        pasteButton: rawRNStrings["pasteButton"] ?? "",
        errorInvalidWord: rawRNStrings["errorInvalidWord"] ?? "",
        errorPhraseLength: rawRNStrings["errorPhraseLength"] ?? "",
        errorWrongPhrase: rawRNStrings["errorWrongPhrase"] ?? "",
        errorInvalidPhrase: rawRNStrings["errorInvalidPhrase"] ?? "",
        errorWordIsAddress: rawRNStrings["errorWordIsAddress"] ?? ""
      )
    }
  }
  @Published var strings: ReactNativeStrings = ReactNativeStrings(
    inputPlaceholder: "",
    pasteButton: "",
    errorInvalidWord: "",
    errorPhraseLength: "",
    errorWrongPhrase: "",
    errorInvalidPhrase: "",
    errorWordIsAddress: ""
  )
  @Published var onInputValidated: RCTDirectEventBlock = { _ in }
  @Published var onMnemonicStored: RCTDirectEventBlock = { _ in }
  @Published var onPasteStart: RCTDirectEventBlock = { _ in }
  @Published var onPasteEnd: RCTDirectEventBlock = { _ in }
  @Published var onSubmitError: RCTDirectEventBlock = { _ in }
  @Published var onHeightMeasured: RCTDirectEventBlock = { _ in }

  private var lastWordValidationTimer: Timer?
  private let lastWordValidationTimeout: TimeInterval = 1.0

  @Published var input = "" {
    didSet {
      handleInputChange()
    }
  }

  @Published var isFocused = false

  @Published var skipLastWord = true
  @Published var status: Status = .none
  @Published var error: MnemonicError? = nil

  private let minCount = 12
  private let maxCount = 24

  func handleSubmit() {
    lastWordValidationTimer?.invalidate()
    
    let normalized = normalizeInput(value: input)
    let mnemonic = trimInput(value: normalized)
    let words = mnemonic.components(separatedBy: " ")
    let valid = rnEthersRS.validateMnemonic(mnemonic: mnemonic)
      
    error = nil
    if (words.count < minCount || minCount + 1 ..< maxCount ~= words.count) {
      status = .error
      error = .notEnoughWords
    } else if (words.count > maxCount) {
      status = .error
      error = .tooManyWords
    } else if (!valid) {
      status = .error
      error = .invalidPhrase
    } else {
      submitMnemonic(mnemonic: mnemonic)
    }
    
    if (error != nil) {
      onSubmitError([:])
    }
  }

  private func submitMnemonic(mnemonic: String) {
    if (targetMnemonicId != nil) {
      rnEthersRS.generateAddressForMnemonic(
        mnemonic: mnemonic,
        derivationIndex: 0,
        resolve: { mnemonicId in
          if (targetMnemonicId == String(describing: mnemonicId ?? "")) {
            storeMnemonic(mnemonic: mnemonic)
          } else {
            status = .error
            error = .wrongRecoveryPhrase
            onSubmitError([:])
          }
        }, reject: { code, message, error in
          onSubmitError([:])
          print("SeedPhraseInputView model error while generating address: \(message ?? "")")
        })
    } else {
      storeMnemonic(mnemonic: mnemonic)
    }
  }

  private func storeMnemonic(mnemonic: String) {
    rnEthersRS.importMnemonic(
      mnemonic: mnemonic,
      resolve: { mnemonicId in
        onMnemonicStored(["mnemonicId": String(describing: mnemonicId ?? "")])
      },
      reject: { code, message, error in
        onSubmitError([:])
        print("SeedPhraseInputView model error while storing mnemonic: \(message ?? "")")
      }
    )
  }

  private func normalizeInput(value: String) -> String {
    return value.replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression).lowercased()
  }
  
  private func isAddress(value: String) -> Bool {
    return value.starts(with: "0x") && value.count == 42
  }

  private func trimInput(value: String) -> String {
    return value.trimmingCharacters(in: .whitespacesAndNewlines)
  }

  private func handleInputChange() {
    let normalized = normalizeInput(value: input)
    let skipLastWord = normalized.last != " "
    let skipInvalidWord = skipLastWord && !isAddress(value: normalized)
    validateInput(normalizedInput: normalized, skipInvalidWord: skipInvalidWord)

    lastWordValidationTimer?.invalidate()

    if (skipLastWord) {
      lastWordValidationTimer = Timer.scheduledTimer(
        withTimeInterval: lastWordValidationTimeout,
        repeats: false) { _ in
            DispatchQueue.global(qos: .background).async {
                self.validateInput(normalizedInput: normalized, skipInvalidWord: false)
            }
        }
    }
  }

  private func validateInput(normalizedInput: String, skipInvalidWord: Bool) {
    let mnemonic = trimInput(value: normalizedInput)
    
    let words = mnemonic.components(separatedBy: " ")

    let isValidLength = words.count >= minCount && words.count <= maxCount
    let firstInvalidWord = rnEthersRS.findInvalidWord(mnemonic: mnemonic)
    
    let isAddress = mnemonic.starts(with: "0x") && mnemonic.count == 42

    if (firstInvalidWord == words.last && skipInvalidWord) {
      status = .none
    } else if (firstInvalidWord == "" && isValidLength) {
      status = .valid
    } else if (isAddress) {
      status = .error
      error = .wordIsAddress
    } else if (firstInvalidWord != "") {
      status = .error
      error = .invalidWord(firstInvalidWord)
    } else {
      status = .none
    }

    if (status != .error) {
      error = nil
    }

    let canSubmit = error == nil && mnemonic != "" && firstInvalidWord == "" && isValidLength
    onInputValidated(["canSubmit": canSubmit])
  }
}
