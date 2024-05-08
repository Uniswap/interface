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
  }
  
  struct ReactNativeStrings {
    var helpText: String
    var inputPlaceholder: String
    var pasteButton: String
    var errorInvalidWord: String
    var errorPhraseLength: String
    var errorWrongPhrase: String
    var errorInvalidPhrase: String
  }
  
  let rnEthersRS = RNEthersRS()
  
  // Following block of variables will come from RN
  @Published var targetMnemonicId: String? = nil
  @Published var rawRNStrings: Dictionary<String, String> = Dictionary<String, String>() {
    didSet {
      strings = ReactNativeStrings(
        helpText: rawRNStrings["helpText"] ?? "",
        inputPlaceholder: rawRNStrings["inputPlaceholder"] ?? "",
        pasteButton: rawRNStrings["pasteButton"] ?? "", 
        errorInvalidWord: rawRNStrings["errorInvalidWord"] ?? "",
        errorPhraseLength: rawRNStrings["errorPhraseLength"] ?? "",
        errorWrongPhrase: rawRNStrings["errorWrongPhrase"] ?? "",
        errorInvalidPhrase: rawRNStrings["errorInvalidPhrase"] ?? ""
      )
    }
  }
  @Published var strings: ReactNativeStrings = ReactNativeStrings(
    helpText: "",
    inputPlaceholder: "",
    pasteButton: "",
    errorInvalidWord: "",
    errorPhraseLength: "",
    errorWrongPhrase: "", 
    errorInvalidPhrase: ""
  )
  @Published var onHelpTextPress: RCTDirectEventBlock = { _ in }
  @Published var onInputValidated: RCTDirectEventBlock = { _ in }
  @Published var onMnemonicStored: RCTDirectEventBlock = { _ in }
  @Published var onPasteStart: RCTDirectEventBlock = { _ in }
  @Published var onPasteEnd: RCTDirectEventBlock = { _ in }
  
  @Published var input = "" {
    didSet {
      validateInput()
    }
  }
  @Published var status: Status = .none
  @Published var error: MnemonicError? = nil
  
  private let minCount = 12
  private let maxCount = 24
  
  func handleSubmit() {
    let normalized = normalizeInput(value: input)
    let mnemonic = trimInput(value: normalized)
    let words = mnemonic.components(separatedBy: " ")
    let valid = rnEthersRS.validateMnemonic(mnemonic: mnemonic)
    
    if (words.count < minCount) {
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
          }
        }, reject: { code, message, error in
          // TODO gary update ethers library to catch exception or send in reject
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
        // TODO gary update ethers library to catch exception or send in reject
        print("SeedPhraseInputView model error while storing mnemonic: \(message ?? "")")
      }
    )
  }
  
  private func normalizeInput(value: String) -> String {
    return value.replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression).lowercased()
  }
  
  private func trimInput(value: String) -> String {
    return value.trimmingCharacters(in: .whitespacesAndNewlines)
  }
  
  private func validateInput() {
    let normalized = normalizeInput(value: input)
    let skipLastWord = normalized.last != " "
    let mnemonic = trimInput(value: normalized)

    let words = mnemonic.components(separatedBy: " ")
    
    let isValidLength = words.count >= minCount && words.count <= maxCount
    let firstInvalidWord = rnEthersRS.findInvalidWord(mnemonic: mnemonic)
    
    if (firstInvalidWord == words.last && skipLastWord) {
      status = .none
    } else if (firstInvalidWord == "" && isValidLength) {
      status = .valid
    } else if (firstInvalidWord != "") {
      status = .error
      error = .invalidWord(firstInvalidWord)
    } else {
      status = .none
    }
    
    if (status != .error) {
      error = nil
    }
    
    let canSubmit = error == nil && mnemonic != "" && firstInvalidWord == ""
    onInputValidated(["canSubmit": canSubmit])
  }
}
